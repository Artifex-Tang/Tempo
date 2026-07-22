package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tempo.daycraft.dto.LoginDTO;
import com.tempo.daycraft.entity.User;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.service.AuthService;
import com.tempo.daycraft.util.JwtUtil;
import com.tempo.daycraft.util.WxApiUtil;
import com.tempo.daycraft.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final WxApiUtil wxApiUtil;
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;

    @Override
    public LoginVO login(LoginDTO dto) {
        String openid = wxApiUtil.getOpenid(dto.getCode());
        return loginByOpenid(openid, dto.getNickname(), dto.getAvatarUrl());
    }

    @Override
    public LoginVO loginWebMock() {
        String openid = wxApiUtil.getOpenid("web-mock");
        return loginByOpenid(openid, "Web 测试用户", null);
    }

    @Override
    public LoginVO loginWebOAuth(String code) {
        String openid = wxApiUtil.getOpenidByWebCode(code);
        return loginByOpenid(openid, null, null);
    }

    private LoginVO loginByOpenid(String openid, String nickname, String avatarUrl) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getOpenid, openid));

        boolean isNew = false;
        if (user == null) {
            user = new User();
            user.setOpenid(openid);
            user.setNickname(nickname);
            user.setAvatarUrl(avatarUrl);
            user.setFocusTotal(0);
            userMapper.insert(user);
            isNew = true;
        } else if (StringUtils.hasText(nickname) || StringUtils.hasText(avatarUrl)) {
            if (StringUtils.hasText(nickname)) user.setNickname(nickname);
            if (StringUtils.hasText(avatarUrl)) user.setAvatarUrl(avatarUrl);
            userMapper.updateById(user);
        }

        String token = jwtUtil.generateToken(user.getId());
        return LoginVO.builder()
                .token(token)
                .userId(user.getId())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .focusTotal(user.getFocusTotal())
                .isNew(isNew)
                .build();
    }
}
