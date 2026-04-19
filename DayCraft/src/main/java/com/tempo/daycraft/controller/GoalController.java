package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.UserContext;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.dto.GoalDTO;
import com.tempo.daycraft.entity.Goal;
import com.tempo.daycraft.service.GoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "目标计划")
@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @Operation(summary = "目标列表")
    @GetMapping
    public R<List<Goal>> list(@RequestParam(required = false) Integer type,
                               @RequestParam(required = false) Integer status) {
        return R.ok(goalService.list(UserContext.get(), type, status));
    }

    @Operation(summary = "创建目标")
    @PostMapping
    public R<Goal> create(@Valid @RequestBody GoalDTO dto) {
        return R.ok(goalService.create(UserContext.get(), dto));
    }

    @Operation(summary = "编辑目标")
    @PutMapping("/{id}")
    public R<Goal> update(@PathVariable Long id, @Valid @RequestBody GoalDTO dto) {
        return R.ok(goalService.update(UserContext.get(), id, dto));
    }

    @Operation(summary = "更新目标进度")
    @PatchMapping("/{id}/progress")
    public R<Void> updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        goalService.updateProgress(UserContext.get(), id, body.get("progress"));
        return R.ok();
    }

    @Operation(summary = "完成目标")
    @PatchMapping("/{id}/finish")
    public R<Void> finish(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Integer status = (Integer) body.get("status");
        String finishNote = (String) body.get("finishNote");
        goalService.finish(UserContext.get(), id, status, finishNote);
        return R.ok();
    }

    @Operation(summary = "删除目标")
    @DeleteMapping("/{id}")
    public R<Void> remove(@PathVariable Long id) {
        goalService.remove(UserContext.get(), id);
        return R.ok();
    }
}
