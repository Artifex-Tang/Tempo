package com.tempo.daycraft.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tempo.daycraft.dto.GoalDTO;
import com.tempo.daycraft.entity.Goal;

import java.util.List;

public interface GoalService extends IService<Goal> {
    Goal create(Long userId, GoalDTO dto);
    Goal update(Long userId, Long id, GoalDTO dto);
    void updateProgress(Long userId, Long id, Integer progress);
    void finish(Long userId, Long id, Integer status, String finishNote);
    List<Goal> list(Long userId, Integer type, Integer status);
    void remove(Long userId, Long id);
}
