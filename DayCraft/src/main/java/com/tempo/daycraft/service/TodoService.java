package com.tempo.daycraft.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.tempo.daycraft.dto.TodoDTO;
import com.tempo.daycraft.dto.TodoFinishDTO;
import com.tempo.daycraft.entity.Todo;

import java.util.List;
import java.util.Map;

public interface TodoService extends IService<Todo> {
    Todo create(Long userId, TodoDTO dto);
    Todo update(Long userId, Long id, TodoDTO dto);
    void finish(Long userId, Long id, TodoFinishDTO dto);
    List<Todo> todayList(Long userId);
    List<Todo> list(Long userId, Integer status, Long categoryId);
    Map<String, Object> statistics(Long userId, int days);
    void remove(Long userId, Long id);
}
