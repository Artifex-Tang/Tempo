package com.tempo.daycraft.common.result;

import lombok.Getter;

@Getter
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    ERROR(500, "系统繁忙，请稍后重试"),
    PARAM_ERROR(400, "请求参数有误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    WX_LOGIN_FAIL(1001, "微信登录失败"),
    WX_PUSH_FAIL(1002, "消息推送失败"),
    TODO_NOT_FOUND(1100, "待办任务不存在"),
    GOAL_NOT_FOUND(1200, "目标计划不存在"),
    CATEGORY_DUPLICATE(1300, "分类名称已存在");

    private final int code;
    private final String msg;

    ResultCode(int code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
