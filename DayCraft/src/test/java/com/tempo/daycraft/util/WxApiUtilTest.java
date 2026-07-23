package com.tempo.daycraft.util;

import com.tempo.daycraft.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WxApiUtilTest {

    /** 测试子类：覆盖 httpGet 返回桩数据，避免真实微信网络调用（离线 CI 稳定） */
    static class TestableWxApiUtil extends WxApiUtil {
        String stubBody;
        int httpGetCalls = 0;

        @Override
        protected String httpGet(String url) {
            httpGetCalls++;
            return stubBody;
        }
    }

    private TestableWxApiUtil wx;

    @BeforeEach
    void setUp() throws Exception {
        wx = new TestableWxApiUtil();
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
        f.set(wx, value);
    }

    @Test
    void getOpenidByWebCode_returnsMockOpenid_whenSet() throws Exception {
        set("mockOpenid", "mock-openid-xyz");
        // mock 旁路应直接返回，不触发 httpGet
        assertThat(wx.getOpenidByWebCode("any")).isEqualTo("mock-openid-xyz");
        assertThat(wx.httpGetCalls).isZero();
    }

    @Test
    void getOpenidByWebCode_returnsOpenid_onSuccess() {
        wx.stubBody = "{\"openid\":\"oABC123\"}";
        assertThat(wx.getOpenidByWebCode("good-code")).isEqualTo("oABC123");
    }

    @Test
    void getOpenidByWebCode_throws_whenErrcode() {
        wx.stubBody = "{\"errcode\":40013,\"errmsg\":\"invalid appid\"}";
        assertThatThrownBy(() -> wx.getOpenidByWebCode("bad-code"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void getOpenidByWebCode_throws_whenNoOpenid() {
        wx.stubBody = "{}";
        assertThatThrownBy(() -> wx.getOpenidByWebCode("some-code"))
                .isInstanceOf(BusinessException.class);
    }
}
