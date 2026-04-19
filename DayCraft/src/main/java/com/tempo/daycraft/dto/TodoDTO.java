package com.tempo.daycraft.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TodoDTO {
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题最长 200 字符")
    private String title;
    private String description;
    private Long categoryId;
    private Integer priority;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime remindTime;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    private Integer sortOrder;
}
