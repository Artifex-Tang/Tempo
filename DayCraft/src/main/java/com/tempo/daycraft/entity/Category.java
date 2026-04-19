package com.tempo.daycraft.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("t_category")
public class Category {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String name;
    private String color;
    private String icon;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
