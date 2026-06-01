package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.exception.BusinessException;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.job.RemindJob;
import com.tempo.daycraft.job.SummaryJob;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * 开发调试端点，仅当 WX_MOCK_OPENID 非空时可用（生产环境不暴露真实功能）
 */
@Tag(name = "开发调试")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final String ACCESS_TOKEN_KEY = "wx:access_token";

    private final RemindJob remindJob;
    private final SummaryJob summaryJob;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${tempo.wx.mock-openid:}")
    private String mockOpenid;

    @Operation(summary = "手动触发提醒任务（仅 dev mock 模式）")
    @PostMapping("/trigger-remind")
    public R<String> triggerRemind() {
        requireDevMode();
        // dev 模式注入假 access_token，避免 job 因拉取失败而提前 return
        redisTemplate.opsForValue().set(ACCESS_TOKEN_KEY, "dev-mock-token", 600, TimeUnit.SECONDS);
        remindJob.execute();
        return R.ok("RemindJob executed");
    }

    @Operation(summary = "手动触发全员周汇总（仅 dev mock 模式）")
    @PostMapping("/trigger-weekly-summary")
    public R<String> triggerWeeklySummary() {
        requireDevMode();
        summaryJob.generateWeekly();
        return R.ok("Weekly summary job executed");
    }

    private void requireDevMode() {
        if (mockOpenid == null || mockOpenid.isBlank()) {
            throw new BusinessException(403, "此端点仅在 WX_MOCK_OPENID 模式下可用");
        }
    }
}
