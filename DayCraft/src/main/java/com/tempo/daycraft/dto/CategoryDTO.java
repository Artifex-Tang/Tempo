package com.tempo.daycraft.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryDTO {
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 50, message = "分类名称最长 50 字符")
    private String name;
    private String color;
    private String icon;
    private Integer sortOrder;
}
