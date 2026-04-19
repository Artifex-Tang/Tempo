package com.tempo.daycraft.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FocusStartDTO {
    @NotNull(message = "专注时长不能为空")
    @Min(value = 1, message = "专注时长至少 1 分钟")
    private Integer durationMin;
    private Long todoId;
    private Long goalId;
    private String note;
}
