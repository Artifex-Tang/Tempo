package com.tempo.daycraft.job;

import com.tempo.daycraft.entity.User;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.service.SummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SummaryJob {

    private final UserMapper userMapper;
    private final SummaryService summaryService;

    @Scheduled(cron = "0 0 1 * * MON")
    public void generateWeekly() {
        log.info("开始生成周报...");
        List<User> users = userMapper.selectList(null);
        int success = 0, fail = 0;
        for (User user : users) {
            try {
                summaryService.generateWeekly(user.getId());
                success++;
            } catch (Exception e) {
                log.error("生成周报失败: userId={}", user.getId(), e);
                fail++;
            }
        }
        log.info("周报生成完成: success={} fail={}", success, fail);
    }

    @Scheduled(cron = "0 30 1 1 * *")
    public void generateMonthly() {
        log.info("开始生成月报...");
        List<User> users = userMapper.selectList(null);
        int success = 0, fail = 0;
        for (User user : users) {
            try {
                summaryService.generateMonthly(user.getId());
                success++;
            } catch (Exception e) {
                log.error("生成月报失败: userId={}", user.getId(), e);
                fail++;
            }
        }
        log.info("月报生成完成: success={} fail={}", success, fail);
    }
}
