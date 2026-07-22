package com.tempo.daycraft.util;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.tempo.daycraft.common.exception.BusinessException;
import com.tempo.daycraft.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class WxApiUtil {

    @Value("${tempo.wx.appid}")
    private String appid;

    @Value("${tempo.wx.secret}")
    private String secret;

    @Value("${tempo.wx.jscode2session-url}")
    private String jscode2sessionUrl;

    @Value("${tempo.wx.web-oauth-url:https://api.weixin.qq.com/sns/oauth2/access_token}")
    private String webOauthUrl;

    @Value("${tempo.wx.subscribe-template-id:}")
    private String templateId;

    // dev 测试用：设置此值后 getOpenid 直接返回，跳过真实微信接口
    @Value("${tempo.wx.mock-openid:}")
    private String mockOpenid;

    /** 开发旁路是否启用（WX_MOCK_OPENID 非空） */
    public boolean isMockOpenidEnabled() {
        return mockOpenid != null && !mockOpenid.isEmpty();
    }

    /**
     * 微信网页 OAuth：用授权 code 换 openid（sns/oauth2/access_token）。
     * mock-openid 启用时直接返回，便于本地开发。失败抛 BusinessException(WX_LOGIN_FAIL)。
     */
    public String getOpenidByWebCode(String code) {
        if (mockOpenid != null && !mockOpenid.isEmpty()) {
            log.warn("[DEV] mock-openid 已启用，web OAuth 直接返回: {}", mockOpenid);
            return mockOpenid;
        }
        String url = webOauthUrl
                + "?appid=" + appid
                + "&secret=" + secret
                + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";
        try {
            String body = HttpUtil.get(url);
            JSONObject json = JSONUtil.parseObj(body);
            if (json.containsKey("errcode") && json.getInt("errcode") != 0) {
                log.warn("微信网页 oauth2 返回错误: {}", body);
                throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
            }
            String openid = json.getStr("openid");
            if (openid == null || openid.isEmpty()) {
                log.warn("微信网页 oauth2 未返回 openid: {}", body);
                throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
            }
            return openid;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用微信网页 oauth2 接口异常", e);
            throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
        }
    }

    /**
     * 通过 wx.login() 返回的 code 换取 openid
     * 失败时抛 BusinessException(WX_LOGIN_FAIL)
     */
    public String getOpenid(String code) {
        if (mockOpenid != null && !mockOpenid.isEmpty()) {
            log.warn("[DEV] mock-openid 已启用，返回固定 openid: {}", mockOpenid);
            return mockOpenid;
        }
        String url = jscode2sessionUrl
                + "?appid=" + appid
                + "&secret=" + secret
                + "&js_code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";
        try {
            String body = HttpUtil.get(url);
            JSONObject json = JSONUtil.parseObj(body);
            if (json.containsKey("errcode") && json.getInt("errcode") != 0) {
                log.warn("微信 jscode2session 返回错误: {}", body);
                throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
            }
            String openid = json.getStr("openid");
            if (openid == null || openid.isEmpty()) {
                log.warn("微信 jscode2session 未返回 openid: {}", body);
                throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
            }
            return openid;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用微信 jscode2session 接口异常", e);
            throw new BusinessException(ResultCode.WX_LOGIN_FAIL);
        }
    }

    /**
     * 发送微信订阅消息
     * 失败只记 warn 日志，不抛异常（避免影响提醒任务主流程）
     */
    public void sendSubscribeMessage(String openid, String title, String remindMsg, String accessToken) {
        if (templateId == null || templateId.isEmpty()) {
            log.warn("未配置 WX_TEMPLATE_ID，跳过消息推送");
            return;
        }
        try {
            String url = "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=" + accessToken;
            Map<String, Object> data = new HashMap<>();
            data.put("thing1", Map.of("value", title));
            data.put("time2", Map.of("value", remindMsg));
            Map<String, Object> body = new HashMap<>();
            body.put("touser", openid);
            body.put("template_id", templateId);
            body.put("data", data);
            String resp = HttpUtil.post(url, JSONUtil.toJsonStr(body));
            JSONObject json = JSONUtil.parseObj(resp);
            if (json.getInt("errcode", 0) != 0) {
                log.warn("微信订阅消息发送失败: openid={}, resp={}", openid, resp);
            }
        } catch (Exception e) {
            log.warn("发送微信订阅消息异常: openid={}", openid, e);
        }
    }
}
