package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.tempo.daycraft.common.exception.BusinessException;
import com.tempo.daycraft.common.result.ResultCode;
import com.tempo.daycraft.dto.CategoryDTO;
import com.tempo.daycraft.entity.Category;
import com.tempo.daycraft.mapper.CategoryMapper;
import com.tempo.daycraft.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {

    @Override
    public Category create(Long userId, CategoryDTO dto) {
        // 同用户下分类名不可重复
        long count = count(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .eq(Category::getName, dto.getName()));
        if (count > 0) {
            throw new BusinessException(ResultCode.CATEGORY_DUPLICATE);
        }
        Category category = new Category();
        category.setUserId(userId);
        category.setName(dto.getName());
        category.setColor(dto.getColor());
        category.setIcon(dto.getIcon());
        category.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        save(category);
        return category;
    }

    @Override
    public Category update(Long userId, Long id, CategoryDTO dto) {
        Category category = getAndCheckOwner(userId, id);
        // 检查同用户下同名（排除自身）
        long count = count(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .eq(Category::getName, dto.getName())
                .ne(Category::getId, id));
        if (count > 0) {
            throw new BusinessException(ResultCode.CATEGORY_DUPLICATE);
        }
        category.setName(dto.getName());
        if (dto.getColor() != null) category.setColor(dto.getColor());
        if (dto.getIcon() != null) category.setIcon(dto.getIcon());
        if (dto.getSortOrder() != null) category.setSortOrder(dto.getSortOrder());
        updateById(category);
        return category;
    }

    @Override
    public List<Category> listByUser(Long userId) {
        return list(new LambdaQueryWrapper<Category>()
                .eq(Category::getUserId, userId)
                .orderByAsc(Category::getSortOrder));
    }

    @Override
    public void remove(Long userId, Long id) {
        getAndCheckOwner(userId, id);
        removeById(id);
    }

    private Category getAndCheckOwner(Long userId, Long id) {
        Category category = getById(id);
        if (category == null || !category.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        return category;
    }
}
