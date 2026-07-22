package com.tempo.daycraft.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WebOAuthDTO {
    @NotBlank(message = "code 不能为空")
    @Size(max = 64, message = "code 长度不能超过 64")
    private String code;
}
