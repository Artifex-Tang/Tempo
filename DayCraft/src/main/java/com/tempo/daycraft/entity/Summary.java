package com.tempo.daycraft.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("t_summary")
public class Summary {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Integer type;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer todoTotal;
    private Integer todoDone;
    private Integer focusTotalMin;
    private Integer goalTotal;
    private Integer goalDone;
    private String aiSummary;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
