package com.tempo.daycraft.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("t_todo")
public class Todo {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private Long categoryId;
    private Integer priority;
    private Integer status;
    private LocalDateTime remindTime;
    private Integer remindSent;
    private LocalDate dueDate;
    private LocalDateTime finishTime;
    private String finishNote;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
