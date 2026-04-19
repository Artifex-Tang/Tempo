package com.tempo.daycraft.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tempo.daycraft.dto.FocusStartDTO;
import com.tempo.daycraft.entity.FocusRecord;

import java.util.List;
import java.util.Map;

public interface FocusService extends IService<FocusRecord> {
    void record(Long userId, FocusStartDTO dto);
    List<Map<String, Object>> dailyStats(Long userId, int days);
}
