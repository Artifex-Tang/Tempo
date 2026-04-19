package com.tempo.daycraft.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tempo.daycraft.dto.CategoryDTO;
import com.tempo.daycraft.entity.Category;

import java.util.List;

public interface CategoryService extends IService<Category> {
    Category create(Long userId, CategoryDTO dto);
    Category update(Long userId, Long id, CategoryDTO dto);
    List<Category> listByUser(Long userId);
    void remove(Long userId, Long id);
}
