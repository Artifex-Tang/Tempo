package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.UserContext;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.dto.TodoDTO;
import com.tempo.daycraft.dto.TodoFinishDTO;
import com.tempo.daycraft.entity.Todo;
import com.tempo.daycraft.service.TodoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "待办任务")
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @Operation(summary = "今日待办列表")
    @GetMapping("/today")
    public R<List<Todo>> today() {
        return R.ok(todoService.todayList(UserContext.get()));
    }

    @Operation(summary = "待办列表（条件筛选）")
    @GetMapping
    public R<List<Todo>> list(@RequestParam(required = false) Integer status,
                               @RequestParam(required = false) Long categoryId) {
        return R.ok(todoService.list(UserContext.get(), status, categoryId));
    }

    @Operation(summary = "创建待办")
    @PostMapping
    public R<Todo> create(@Valid @RequestBody TodoDTO dto) {
        return R.ok(todoService.create(UserContext.get(), dto));
    }

    @Operation(summary = "编辑待办")
    @PutMapping("/{id}")
    public R<Todo> update(@PathVariable Long id, @Valid @RequestBody TodoDTO dto) {
        return R.ok(todoService.update(UserContext.get(), id, dto));
    }

    @Operation(summary = "完成/放弃待办")
    @PatchMapping("/{id}/finish")
    public R<Void> finish(@PathVariable Long id, @RequestBody TodoFinishDTO dto) {
        todoService.finish(UserContext.get(), id, dto);
        return R.ok();
    }

    @Operation(summary = "删除待办")
    @DeleteMapping("/{id}")
    public R<Void> remove(@PathVariable Long id) {
        todoService.remove(UserContext.get(), id);
        return R.ok();
    }

    @Operation(summary = "近N天待办统计")
    @GetMapping("/statistics")
    public R<Map<String, Object>> statistics(@RequestParam(defaultValue = "7") int days) {
        return R.ok(todoService.statistics(UserContext.get(), days));
    }
}
