package com.tempo.daycraft.job;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.tempo.daycraft.entity.Todo;
import com.tempo.daycraft.entity.User;
import com.tempo.daycraft.mapper.TodoMapper;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.util.WxApiUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RemindJob {

    private static final String ACCESS_TOKEN_KEY = "wx:access_token";
    private static final DateTimeFormatter REMIND_FMT = DateTimeFormatter.ofPattern("MM-dd HH:mm");

    private final TodoMapper todoMapper;
    private final UserMapper userMapper;
    private final WxApiUtil wxApiUtil;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${tempo.wx.appid}")
    private String appid;

    @Value("${tempo.wx.secret}")
    private String wxSecret;

    @Scheduled(cron = "0 * * * * *")
    public void execute() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextMinute = now.plusMinutes(1);

        List<Todo> todos = todoMapper.selectPendingReminders(now, nextMinute);
        if (todos.isEmpty()) return;

        // 获取 access_token（优先读缓存）
        String accessToken = (String) redisTemplate.opsForValue().get(ACCESS_TOKEN_KEY);
        if (accessToken == null) {
            accessToken = fetchAndCacheAccessToken();
            if (accessToken == null) {
                log.warn("获取微信 access_token 失败，本次跳过提醒推送");
                return;
            }
        }

        for (Todo todo : todos) {
            try {
                User user = userMapper.selectById(todo.getUserId());
                if (user == null || user.getOpenid() == null) continue;
                String remindMsg = todo.getRemindTime().format(REMIND_FMT) + " 提醒";
                wxApiUtil.sendSubscribeMessage(user.getOpenid(), todo.getTitle(), remindMsg, accessToken);
                todoMapper.markRemindSent(todo.getId());
            } catch (Exception e) {
                log.error("处理提醒任务失败: todoId={}", todo.getId(), e);
            }
        }
    }

    private String fetchAndCacheAccessToken() {
        try {
            String url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="
                    + appid + "&secret=" + wxSecret;
            String body = HttpUtil.get(url);
            JSONObject json = JSONUtil.parseObj(body);
            String token = json.getStr("access_token");
            Integer expiresIn = json.getInt("expires_in");
            if (token != null && expiresIn != null) {
                // 提前 300 秒过期，避免边界问题
                redisTemplate.opsForValue().set(ACCESS_TOKEN_KEY, token, expiresIn - 300, TimeUnit.SECONDS);
                return token;
            }
            log.warn("微信 access_token 接口返回异常: {}", body);
            return null;
        } catch (Exception e) {
            log.warn("获取 access_token 异常", e);
            return null;
        }
    }
}
