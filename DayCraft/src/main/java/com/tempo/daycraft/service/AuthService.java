package com.tempo.daycraft.service;

import com.tempo.daycraft.dto.LoginDTO;
import com.tempo.daycraft.vo.LoginVO;

public interface AuthService {
    LoginVO login(LoginDTO dto);
    LoginVO loginWebMock();
    LoginVO loginWebOAuth(String code);
}
