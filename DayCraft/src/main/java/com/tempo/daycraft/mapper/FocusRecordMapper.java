package com.tempo.daycraft.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tempo.daycraft.entity.FocusRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface FocusRecordMapper extends BaseMapper<FocusRecord> {

    /**
     * 按天聚合专注时长，返回最近 N 天每天的 day 和 totalMin
     */
    @Select("SELECT DATE(start_time) AS day, SUM(duration_min) AS totalMin " +
            "FROM t_focus_record " +
            "WHERE user_id = #{userId} " +
            "AND start_time >= DATE_SUB(NOW(), INTERVAL #{days} DAY) " +
            "GROUP BY DATE(start_time) " +
            "ORDER BY day ASC")
    List<Map<String, Object>> dailyStats(@Param("userId") Long userId,
                                          @Param("days") int days);

    /**
     * 日期范围内累计专注分钟，无记录时返回 0
     */
    @Select("SELECT COALESCE(SUM(duration_min), 0) " +
            "FROM t_focus_record " +
            "WHERE user_id = #{userId} " +
            "AND DATE(start_time) BETWEEN #{startDate} AND #{endDate}")
    Integer sumMinByDateRange(@Param("userId") Long userId,
                               @Param("startDate") String startDate,
                               @Param("endDate") String endDate);
}
