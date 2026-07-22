package com.tempo.daycraft.controller;

import com.tempo.daycraft.common.result.R;
import com.tempo.daycraft.dto.LoginDTO;
import com.tempo.daycraft.dto.WebOAuthDTO;
import com.tempo.daycraft.service.AuthService;
import com.tempo.daycraft.vo.LoginVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "微信登录")
    @PostMapping("/login")
    public R<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return R.ok(authService.login(dto));
    }

    @Operation(summary = "Web 开发期 mock 登录")
    @PostMapping("/web-mock-login")
    public R<LoginVO> webMockLogin() {
        return R.ok(authService.loginWebMock());
    }

    @Operation(summary = "Web 微信网页 OAuth 登录")
    @PostMapping("/web-oauth/callback")
    public R<LoginVO> webOAuthCallback(@Valid @RequestBody WebOAuthDTO dto) {
        return R.ok(authService.loginWebOAuth(dto.getCode()));
    }
}
