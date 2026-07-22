package com.tempo.daycraft.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WebOAuthDTO {
    @NotBlank(message = "code 不能为空")
    private String code;
}
