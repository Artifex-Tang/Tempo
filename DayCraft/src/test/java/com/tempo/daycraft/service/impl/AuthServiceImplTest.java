package com.tempo.daycraft.service.impl;

import com.tempo.daycraft.entity.User;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.util.JwtUtil;
import com.tempo.daycraft.util.WxApiUtil;
import com.tempo.daycraft.vo.LoginVO;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock UserMapper userMapper;
    @Mock WxApiUtil wxApiUtil;
    @Mock JwtUtil jwtUtil;
    @InjectMocks AuthServiceImpl authService;

    @Test
    void loginWebMock_createsUserAndReturnsToken_whenOpenidResolved() {
        when(wxApiUtil.getOpenid("web-mock")).thenReturn("mock-openid-xyz");
        when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);
        when(jwtUtil.generateToken(any())).thenReturn("jwt-token");

        LoginVO vo = authService.loginWebMock();

        verify(userMapper).insert(any(User.class));
        assertThat(vo.getToken()).isEqualTo("jwt-token");
        assertThat(vo.isNew()).isTrue();
    }

    @Test
    void loginWebOAuth_resolvesOpenidByWebCode_andReusesExistingUser() {
        when(wxApiUtil.getOpenidByWebCode("oauth-code")).thenReturn("openid-abc");
        User existing = new User();
        existing.setId(7L);
        existing.setOpenid("openid-abc");
        existing.setFocusTotal(120);
        when(userMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
        when(jwtUtil.generateToken(7L)).thenReturn("jwt-7");

        LoginVO vo = authService.loginWebOAuth("oauth-code");

        verify(userMapper, never()).insert(any(User.class));
        assertThat(vo.getUserId()).isEqualTo(7L);
        assertThat(vo.getToken()).isEqualTo("jwt-7");
        assertThat(vo.isNew()).isFalse();
    }
}
