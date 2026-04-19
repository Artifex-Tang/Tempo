package com.tempo.daycraft.common.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() {
        super("未登录或登录已过期");
    }

    public UnauthorizedException(String message) {
        super(message);
    }
}
