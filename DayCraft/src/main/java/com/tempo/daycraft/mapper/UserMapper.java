package com.tempo.daycraft.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tempo.daycraft.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
