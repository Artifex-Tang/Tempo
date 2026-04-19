package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.UserContext;
import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.dto.CategoryDTO;
import com.tempo.daycraft.entity.Category;
import com.tempo.daycraft.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "任务分类")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "分类列表")
    @GetMapping
    public R<List<Category>> list() {
        return R.ok(categoryService.listByUser(UserContext.get()));
    }

    @Operation(summary = "创建分类")
    @PostMapping
    public R<Category> create(@Valid @RequestBody CategoryDTO dto) {
        return R.ok(categoryService.create(UserContext.get(), dto));
    }

    @Operation(summary = "编辑分类")
    @PutMapping("/{id}")
    public R<Category> update(@PathVariable Long id, @Valid @RequestBody CategoryDTO dto) {
        return R.ok(categoryService.update(UserContext.get(), id, dto));
    }

    @Operation(summary = "删除分类")
    @DeleteMapping("/{id}")
    public R<Void> remove(@PathVariable Long id) {
        categoryService.remove(UserContext.get(), id);
        return R.ok();
    }
}
