package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.tempo.daycraft.dto.FocusStartDTO;
import com.tempo.daycraft.entity.FocusRecord;
import com.tempo.daycraft.entity.User;
import com.tempo.daycraft.mapper.FocusRecordMapper;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.service.FocusService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FocusServiceImpl extends ServiceImpl<FocusRecordMapper, FocusRecord> implements FocusService {

    private final UserMapper userMapper;

    @Override
    @Transactional
    public void record(Long userId, FocusStartDTO dto) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusMinutes(dto.getDurationMin());

        FocusRecord record = new FocusRecord();
        record.setUserId(userId);
        record.setTodoId(dto.getTodoId());
        record.setGoalId(dto.getGoalId());
        record.setDurationMin(dto.getDurationMin());
        record.setStartTime(startTime);
        record.setEndTime(endTime);
        record.setNote(dto.getNote());
        save(record);

        // 更新用户累计专注时长（冗余字段，避免频繁聚合查询）
        userMapper.update(null,
                new LambdaUpdateWrapper<User>()
                        .eq(User::getId, userId)
                        .setSql("focus_total = focus_total + " + dto.getDurationMin()));
    }

    @Override
    public List<Map<String, Object>> dailyStats(Long userId, int days) {
        return baseMapper.dailyStats(userId, days);
    }
}
