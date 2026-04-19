package com.tempo.daycraft;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.tempo.daycraft.mapper")
@EnableScheduling
public class DayCraftApplication {
    public static void main(String[] args) {
        SpringApplication.run(DayCraftApplication.class, args);
    }
}
