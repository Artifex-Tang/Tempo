package com.tempo.daycraft.util;

import com.tempo.daycraft.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WxApiUtilTest {

    private WxApiUtil wxApiUtil;

    @BeforeEach
    void setUp() throws Exception {
        wxApiUtil = new WxApiUtil();
        set("appid", "wxappid");
        set("secret", "secret");
        set("mockOpenid", "");
        set("jscode2sessionUrl", "https://api.weixin.qq.com/sns/jscode2session");
        set("webOauthUrl", "https://api.weixin.qq.com/sns/oauth2/access_token");
        set("templateId", "");
    }

    private void set(String name, Object value) throws Exception {
        Field f = WxApiUtil.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(wxApiUtil, value);
    }

    @Test
    void getOpenidByWebCode_returnsMockOpenid_whenSet() throws Exception {
        set("mockOpenid", "mock-openid-xyz");
        assertThat(wxApiUtil.getOpenidByWebCode("any")).isEqualTo("mock-openid-xyz");
    }

    @Test
    void getOpenidByWebCode_throws_whenWeChatReturnsError() {
        // 真实请求会失败/返回无 openid（appid 非法），应抛 BusinessException
        assertThatThrownBy(() -> wxApiUtil.getOpenidByWebCode("bad-code"))
                .isInstanceOf(BusinessException.class);
    }
}
