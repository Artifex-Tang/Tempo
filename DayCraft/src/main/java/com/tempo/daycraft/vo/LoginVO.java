package com.tempo.daycraft.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginVO {
    private String token;
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private Integer focusTotal;
    private boolean isNew;
}
