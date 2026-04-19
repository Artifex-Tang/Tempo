package com.tempo.daycraft.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tempo.daycraft.entity.Summary;

public interface SummaryService extends IService<Summary> {
    Summary getWeekly(Long userId);
    Summary getMonthly(Long userId);
    void generateWeekly(Long userId);
    void generateMonthly(Long userId);
}
