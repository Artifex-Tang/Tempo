package com.tempo.daycraft.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.tempo.daycraft.entity.Goal;
import com.tempo.daycraft.entity.Summary;
import com.tempo.daycraft.mapper.FocusRecordMapper;
import com.tempo.daycraft.mapper.GoalMapper;
import com.tempo.daycraft.mapper.SummaryMapper;
import com.tempo.daycraft.mapper.TodoMapper;
import com.tempo.daycraft.service.SummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummaryServiceImpl extends ServiceImpl<SummaryMapper, Summary> implements SummaryService {

    private final TodoMapper todoMapper;
    private final FocusRecordMapper focusRecordMapper;
    private final GoalMapper goalMapper;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Summary getWeekly(Long userId) {
        LocalDate today = LocalDate.now();
        // 本周 Mon-Sun
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate sunday = today.with(DayOfWeek.SUNDAY);
        Summary summary = getOne(new LambdaQueryWrapper<Summary>()
                .eq(Summary::getUserId, userId)
                .eq(Summary::getType, 1)
                .eq(Summary::getPeriodStart, monday));
        if (summary == null) {
            buildAndSave(userId, 1, monday, sunday);
            summary = getOne(new LambdaQueryWrapper<Summary>()
                    .eq(Summary::getUserId, userId)
                    .eq(Summary::getType, 1)
                    .eq(Summary::getPeriodStart, monday));
        }
        return summary;
    }

    @Override
    public Summary getMonthly(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate firstDay = today.withDayOfMonth(1);
        LocalDate lastDay = today.withDayOfMonth(today.lengthOfMonth());
        Summary summary = getOne(new LambdaQueryWrapper<Summary>()
                .eq(Summary::getUserId, userId)
                .eq(Summary::getType, 2)
                .eq(Summary::getPeriodStart, firstDay));
        if (summary == null) {
            buildAndSave(userId, 2, firstDay, lastDay);
            summary = getOne(new LambdaQueryWrapper<Summary>()
                    .eq(Summary::getUserId, userId)
                    .eq(Summary::getType, 2)
                    .eq(Summary::getPeriodStart, firstDay));
        }
        return summary;
    }

    @Override
    public void generateWeekly(Long userId) {
        // 上一周 Mon-Sun
        LocalDate today = LocalDate.now();
        LocalDate lastMonday = today.with(DayOfWeek.MONDAY).minusWeeks(1);
        LocalDate lastSunday = lastMonday.plusDays(6);
        buildAndSave(userId, 1, lastMonday, lastSunday);
    }

    @Override
    public void generateMonthly(Long userId) {
        // 上个月
        LocalDate firstDayLastMonth = LocalDate.now().withDayOfMonth(1).minusMonths(1);
        LocalDate lastDayLastMonth = firstDayLastMonth.withDayOfMonth(firstDayLastMonth.lengthOfMonth());
        buildAndSave(userId, 2, firstDayLastMonth, lastDayLastMonth);
    }

    private void buildAndSave(Long userId, int type, LocalDate start, LocalDate end) {
        String startStr = start.format(DATE_FMT);
        String endStr = end.format(DATE_FMT);

        Map<String, Object> todoStats = todoMapper.statsByDateRange(userId, startStr, endStr);
        int todoTotal = ((Number) todoStats.getOrDefault("total", 0L)).intValue();
        int todoDone = ((Number) todoStats.getOrDefault("done", 0L)).intValue();

        Integer focusTotalMin = focusRecordMapper.sumMinByDateRange(userId, startStr, endStr);
        if (focusTotalMin == null) focusTotalMin = 0;

        // 统计该时间段内目标数量
        List<Goal> goals = goalMapper.selectList(new LambdaQueryWrapper<Goal>()
                .eq(Goal::getUserId, userId)
                .between(Goal::getTargetDate, start, end));
        int goalTotal = goals.size();
        int goalDone = (int) goals.stream().filter(g -> g.getStatus() == 1).count();

        // 生成规则文字总结
        int rate = todoTotal > 0 ? Math.round(todoDone * 100f / todoTotal) : 0;
        String focusText = formatMinutes(focusTotalMin);
        String aiSummary = String.format(
                "本期共创建%d个待办，完成%d个（完成率%d%%）；累计专注%s；目标达成%d/%d个。",
                todoTotal, todoDone, rate, focusText, goalDone, goalTotal);

        // upsert：有则更新，无则新建（按 userId + type + periodStart 判重）
        Summary existing = getOne(new LambdaQueryWrapper<Summary>()
                .eq(Summary::getUserId, userId)
                .eq(Summary::getType, type)
                .eq(Summary::getPeriodStart, start));
        if (existing != null) {
            existing.setPeriodEnd(end);
            existing.setTodoTotal(todoTotal);
            existing.setTodoDone(todoDone);
            existing.setFocusTotalMin(focusTotalMin);
            existing.setGoalTotal(goalTotal);
            existing.setGoalDone(goalDone);
            existing.setAiSummary(aiSummary);
            updateById(existing);
        } else {
            Summary summary = new Summary();
            summary.setUserId(userId);
            summary.setType(type);
            summary.setPeriodStart(start);
            summary.setPeriodEnd(end);
            summary.setTodoTotal(todoTotal);
            summary.setTodoDone(todoDone);
            summary.setFocusTotalMin(focusTotalMin);
            summary.setGoalTotal(goalTotal);
            summary.setGoalDone(goalDone);
            summary.setAiSummary(aiSummary);
            save(summary);
        }
    }

    private String formatMinutes(int min) {
        if (min == 0) return "0分钟";
        if (min < 60) return min + "分钟";
        int hours = min / 60;
        int mins = min % 60;
        return mins > 0 ? hours + "小时" + mins + "分" : hours + "小时";
    }
}
