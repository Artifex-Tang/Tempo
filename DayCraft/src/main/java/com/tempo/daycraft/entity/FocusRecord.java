package com.tempo.daycraft.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_focus_record")
public class FocusRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long todoId;
    private Long goalId;
    private Integer durationMin;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
