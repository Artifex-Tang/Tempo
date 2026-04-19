package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.UserContext;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.entity.Summary;
import com.tempo.daycraft.service.SummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "完成情况汇总")
@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final SummaryService summaryService;

    @Operation(summary = "本周汇总")
    @GetMapping("/weekly")
    public R<Summary> weekly() {
        return R.ok(summaryService.getWeekly(UserContext.get()));
    }

    @Operation(summary = "本月汇总")
    @GetMapping("/monthly")
    public R<Summary> monthly() {
        return R.ok(summaryService.getMonthly(UserContext.get()));
    }

    @Operation(summary = "手动触发汇总生成")
    @PostMapping("/generate")
    public R<Void> generate(@RequestParam int type) {
        Long userId = UserContext.get();
        if (type == 1) {
            summaryService.generateWeekly(userId);
        } else {
            summaryService.generateMonthly(userId);
        }
        return R.ok("汇总已生成", null);
    }
}
