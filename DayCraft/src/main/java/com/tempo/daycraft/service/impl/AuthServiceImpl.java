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

        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getOpenid, openid));

        boolean isNew = false;
        if (user == null) {
            // 首次登录，创建用户
            user = new User();
            user.setOpenid(openid);
            user.setNickname(dto.getNickname());
            user.setAvatarUrl(dto.getAvatarUrl());
            user.setFocusTotal(0);
            userMapper.insert(user);
            isNew = true;
        } else if (StringUtils.hasText(dto.getNickname()) || StringUtils.hasText(dto.getAvatarUrl())) {
            // 更新昵称/头像
            if (StringUtils.hasText(dto.getNickname())) user.setNickname(dto.getNickname());
            if (StringUtils.hasText(dto.getAvatarUrl())) user.setAvatarUrl(dto.getAvatarUrl());
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
