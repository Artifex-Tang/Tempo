package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.tempo.daycraft.common.exception.BusinessException;
import com.tempo.daycraft.common.result.ResultCode;
import com.tempo.daycraft.dto.TodoDTO;
import com.tempo.daycraft.dto.TodoFinishDTO;
import com.tempo.daycraft.entity.Todo;
import com.tempo.daycraft.mapper.TodoMapper;
import com.tempo.daycraft.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TodoServiceImpl extends ServiceImpl<TodoMapper, Todo> implements TodoService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Todo create(Long userId, TodoDTO dto) {
        Todo todo = new Todo();
        todo.setUserId(userId);
        todo.setTitle(dto.getTitle());
        todo.setDescription(dto.getDescription());
        todo.setCategoryId(dto.getCategoryId());
        todo.setPriority(dto.getPriority() != null ? dto.getPriority() : 2);
        todo.setStatus(0);
        todo.setRemindSent(0);
        todo.setRemindTime(dto.getRemindTime());
        todo.setDueDate(dto.getDueDate());
        todo.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        save(todo);
        return todo;
    }

    @Override
    public Todo update(Long userId, Long id, TodoDTO dto) {
        Todo todo = getAndCheckOwner(userId, id);
        todo.setTitle(dto.getTitle());
        todo.setDescription(dto.getDescription());
        todo.setCategoryId(dto.getCategoryId());
        if (dto.getPriority() != null) todo.setPriority(dto.getPriority());
        // 提醒时间变化时重置已发送标记
        if (!Objects.equals(todo.getRemindTime(), dto.getRemindTime())) {
            todo.setRemindTime(dto.getRemindTime());
            todo.setRemindSent(0);
        }
        todo.setDueDate(dto.getDueDate());
        if (dto.getSortOrder() != null) todo.setSortOrder(dto.getSortOrder());
        updateById(todo);
        return todo;
    }

    @Override
    public void finish(Long userId, Long id, TodoFinishDTO dto) {
        Todo todo = getAndCheckOwner(userId, id);
        todo.setStatus(dto.getStatus());
        todo.setFinishNote(dto.getFinishNote());
        // 已完成时记录完成时间
        if (Integer.valueOf(2).equals(dto.getStatus())) {
            todo.setFinishTime(LocalDateTime.now());
        }
        updateById(todo);
    }

    @Override
    public List<Todo> todayList(Long userId) {
        LocalDate today = LocalDate.now();
        // 今日截止 OR 超期未完成(due_date < today and status < 2) OR 进行中
        return list(new LambdaQueryWrapper<Todo>()
                .eq(Todo::getUserId, userId)
                .and(w -> w
                        .eq(Todo::getDueDate, today)
                        .or(w2 -> w2.lt(Todo::getDueDate, today).lt(Todo::getStatus, 2))
                        .or(w3 -> w3.eq(Todo::getStatus, 1))
                )
                .orderByAsc(Todo::getPriority)
                .orderByAsc(Todo::getSortOrder));
    }

    @Override
    public List<Todo> list(Long userId, Integer status, Long categoryId) {
        LambdaQueryWrapper<Todo> wrapper = new LambdaQueryWrapper<Todo>()
                .eq(Todo::getUserId, userId);
        if (status != null) wrapper.eq(Todo::getStatus, status);
        if (categoryId != null) wrapper.eq(Todo::getCategoryId, categoryId);
        wrapper.orderByAsc(Todo::getPriority).orderByAsc(Todo::getSortOrder);
        return list(wrapper);
    }

    @Override
    public Map<String, Object> statistics(Long userId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days - 1);
        Map<String, Object> result = baseMapper.statsByDateRange(
                userId, start.format(DATE_FMT), end.format(DATE_FMT));
        // 保证 total/done 字段不为 null
        Map<String, Object> safe = new HashMap<>();
        safe.put("total", result.getOrDefault("total", 0L));
        safe.put("done", result.getOrDefault("done", 0L));
        return safe;
    }

    @Override
    public void remove(Long userId, Long id) {
        getAndCheckOwner(userId, id);
        removeById(id);
    }

    private Todo getAndCheckOwner(Long userId, Long id) {
        Todo todo = getById(id);
        if (todo == null || !todo.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TODO_NOT_FOUND);
        }
        return todo;
    }
}
