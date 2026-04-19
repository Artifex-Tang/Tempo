package com.tempo.daycraft.util;

import com.tempo.daycraft.common.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    @Value("${tempo.jwt.secret}")
    private String secret;

    @Value("${tempo.jwt.expire}")
    private long expireSeconds;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        // 确保 secret 至少 32 字节以满足 HMAC-SHA256 要求
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expireSeconds * 1000);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public Long parseUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Long.parseLong(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT 解析失败: {}", e.getMessage());
            throw new UnauthorizedException();
        }
    }
}
