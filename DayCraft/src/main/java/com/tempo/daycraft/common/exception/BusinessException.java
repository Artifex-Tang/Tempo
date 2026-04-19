package com.tempo.daycraft.common.exception;

import com.tempo.daycraft.common.result.ResultCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final int code;
    private final String msg;

    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMsg());
        this.code = resultCode.getCode();
        this.msg = resultCode.getMsg();
    }

    public BusinessException(int code, String msg) {
        super(msg);
        this.code = code;
        this.msg = msg;
    }

    public BusinessException(String msg) {
        super(msg);
        this.code = ResultCode.ERROR.getCode();
        this.msg = msg;
    }
}
