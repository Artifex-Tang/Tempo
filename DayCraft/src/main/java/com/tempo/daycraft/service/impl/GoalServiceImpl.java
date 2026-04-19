package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.tempo.daycraft.common.exception.BusinessException;
import com.tempo.daycraft.common.result.ResultCode;
import com.tempo.daycraft.dto.GoalDTO;
import com.tempo.daycraft.entity.Goal;
import com.tempo.daycraft.mapper.GoalMapper;
import com.tempo.daycraft.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalServiceImpl extends ServiceImpl<GoalMapper, Goal> implements GoalService {

    @Override
    public Goal create(Long userId, GoalDTO dto) {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle(dto.getTitle());
        goal.setDescription(dto.getDescription());
        goal.setType(dto.getType());
        goal.setTargetDate(dto.getTargetDate());
        goal.setStatus(0);
        goal.setProgress(0);
        save(goal);
        return goal;
    }

    @Override
    public Goal update(Long userId, Long id, GoalDTO dto) {
        Goal goal = getAndCheckOwner(userId, id);
        goal.setTitle(dto.getTitle());
        if (dto.getDescription() != null) goal.setDescription(dto.getDescription());
        goal.setType(dto.getType());
        goal.setTargetDate(dto.getTargetDate());
        updateById(goal);
        return goal;
    }

    @Override
    public void updateProgress(Long userId, Long id, Integer progress) {
        Goal goal = getAndCheckOwner(userId, id);
        // 截断到 [0, 100]
        int clamped = Math.max(0, Math.min(100, progress));
        goal.setProgress(clamped);
        // 达到 100% 自动完成
        if (clamped == 100) goal.setStatus(1);
        updateById(goal);
    }

    @Override
    public void finish(Long userId, Long id, Integer status, String finishNote) {
        Goal goal = getAndCheckOwner(userId, id);
        goal.setStatus(status);
        goal.setFinishNote(finishNote);
        // 已达成时进度设为 100
        if (Integer.valueOf(1).equals(status)) goal.setProgress(100);
        updateById(goal);
    }

    @Override
    public List<Goal> list(Long userId, Integer type, Integer status) {
        LambdaQueryWrapper<Goal> wrapper = new LambdaQueryWrapper<Goal>()
                .eq(Goal::getUserId, userId);
        if (type != null) wrapper.eq(Goal::getType, type);
        if (status != null) wrapper.eq(Goal::getStatus, status);
        wrapper.orderByAsc(Goal::getTargetDate);
        return list(wrapper);
    }

    @Override
    public void remove(Long userId, Long id) {
        getAndCheckOwner(userId, id);
        removeById(id);
    }

    private Goal getAndCheckOwner(Long userId, Long id) {
        Goal goal = getById(id);
        if (goal == null || !goal.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.GOAL_NOT_FOUND);
        }
        return goal;
    }
}
