package com.tempo.daycraft.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GoalDTO {
    @NotBlank(message = "标题不能为空")
    private String title;
    private String description;
    @NotNull(message = "目标类型不能为空")
    private Integer type;
    @NotNull(message = "截止日期不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate targetDate;
}
