package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.UserContext;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.dto.FocusStartDTO;
import com.tempo.daycraft.service.FocusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "专注记录")
@RestController
@RequestMapping("/api/focus")
@RequiredArgsConstructor
public class FocusController {

    private final FocusService focusService;

    @Operation(summary = "保存专注记录")
    @PostMapping("/record")
    public R<Void> record(@Valid @RequestBody FocusStartDTO dto) {
        focusService.record(UserContext.get(), dto);
        return R.ok();
    }

    @Operation(summary = "每日专注趋势")
    @GetMapping("/daily-stats")
    public R<List<Map<String, Object>>> dailyStats(
            @RequestParam(defaultValue = "7") int days) {
        return R.ok(focusService.dailyStats(UserContext.get(), days));
    }
}
