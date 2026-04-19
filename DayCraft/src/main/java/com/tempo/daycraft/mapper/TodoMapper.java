package com.tempo.daycraft.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tempo.daycraft.entity.Todo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface TodoMapper extends BaseMapper<Todo> {

    /**
     * 查询待推送提醒：remind_time 在 [from,to] 范围内，未发送，状态为待办或进行中
     * 此索引 idx_remind(remind_time, remind_sent) 专为该查询创建
     */
    @Select("SELECT * FROM t_todo WHERE remind_time BETWEEN #{from} AND #{to} " +
            "AND remind_sent = 0 AND status IN (0, 1)")
    List<Todo> selectPendingReminders(@Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);

    @Update("UPDATE t_todo SET remind_sent = 1 WHERE id = #{id}")
    void markRemindSent(@Param("id") Long id);

    /**
     * 日期范围内任务统计，返回 total 和 done 两个 key
     */
    @Select("SELECT COUNT(*) AS total, " +
            "SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS done " +
            "FROM t_todo " +
            "WHERE user_id = #{userId} " +
            "AND DATE(created_at) BETWEEN #{startDate} AND #{endDate}")
    Map<String, Object> statsByDateRange(@Param("userId") Long userId,
                                         @Param("startDate") String startDate,
                                         @Param("endDate") String endDate);
}
