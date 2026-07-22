package com.tempo.daycraft.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tempo.daycraft.config.WebConfig;
import com.tempo.daycraft.mapper.CategoryMapper;
import com.tempo.daycraft.mapper.FocusRecordMapper;
import com.tempo.daycraft.mapper.GoalMapper;
import com.tempo.daycraft.mapper.SummaryMapper;
import com.tempo.daycraft.mapper.TodoMapper;
import com.tempo.daycraft.mapper.UserMapper;
import com.tempo.daycraft.service.AuthService;
import com.tempo.daycraft.util.JwtUtil;
import com.tempo.daycraft.vo.LoginVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(WebConfig.class)
class AuthControllerWebTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @MockBean AuthService authService;
    @MockBean JwtUtil jwtUtil;   // WebConfig / AuthInterceptor 依赖
    // 主启动类带 @MapperScan，@WebMvcTest 切片下不会装配 DataSource/SqlSessionFactory，
    // MapperFactoryBean 会因缺失 sqlSessionFactory 报错。这里逐个 Mock Mapper，
    // @MockBean 会替换 MapperFactoryBean 定义，绕开 MyBatis 基础设施的初始化。
    @MockBean UserMapper userMapper;
    @MockBean CategoryMapper categoryMapper;
    @MockBean TodoMapper todoMapper;
    @MockBean GoalMapper goalMapper;
    @MockBean FocusRecordMapper focusRecordMapper;
    @MockBean SummaryMapper summaryMapper;

    @Test
    void webMockLogin_returnsToken() throws Exception {
        when(authService.loginWebMock()).thenReturn(
                LoginVO.builder().token("jwt-mock").userId(1L).isNew(true).build());

        mvc.perform(post("/api/auth/web-mock-login"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").value("jwt-mock"));
    }

    @Test
    void webOAuthCallback_returnsToken() throws Exception {
        when(authService.loginWebOAuth(eq("the-code"))).thenReturn(
                LoginVO.builder().token("jwt-oauth").userId(2L).isNew(false).build());

        mvc.perform(post("/api/auth/web-oauth/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsBytes(new AuthControllerWebTest.WebOAuthPayload("the-code"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("jwt-oauth"));
    }

    @Test
    void webOAuthCallback_returns400_whenCodeBlank() throws Exception {
        // 项目 GlobalExceptionHandler 将 @Valid 校验失败统一包装成 R<T>（HTTP 200 + body.code=400 PARAM_ERROR），
        // 因此这里断言响应体 code=400，而不是 HTTP 400。code 为空时不应进入 service。
        mvc.perform(post("/api/auth/web-oauth/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsBytes(new AuthControllerWebTest.WebOAuthPayload(""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    // 测试用 payload（结构对齐 WebOAuthDTO）
    static record WebOAuthPayload(String code) {}
}
