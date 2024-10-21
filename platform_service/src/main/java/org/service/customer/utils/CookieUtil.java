package org.service.customer.utils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;

@Slf4j
public class CookieUtil {
    public static void addJwtToCookie(String jwt, HttpServletResponse response) {
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true)
                .domain("flashresponse.net")
               // .secure(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days in seconds
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", jwtCookie.toString());
        // Log the cookie being set (be cautious with logging sensitive information in production)
        log.debug("Setting JWT cookie: {}", jwtCookie.toString());
    }

    public static void addTenantIdToCookie(String tenantId, HttpServletResponse response) {
        ResponseCookie tenantCookie = ResponseCookie.from("tenantId", tenantId)
                .httpOnly(true)
                .domain("flashresponse.net")
                // .secure(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days in seconds
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", tenantCookie.toString());
        // Log the cookie being set (be cautious with logging sensitive information in production)
        log.debug("Setting tenant cookie: {}", tenantCookie.toString());
    }

    public static void setCookie(String key, String value, HttpServletResponse response) {
        ResponseCookie tenantCookie = ResponseCookie.from(key, value)
                .httpOnly(true)
                .path("/")
                .domain("flashresponse.net")
                .maxAge(7 * 24 * 60 * 60) // 7 days in seconds
                .build();

        response.addHeader("Set-Cookie", tenantCookie.toString());
        // Log the cookie being set (be cautious with logging sensitive information in production)
        log.debug("Setting tenant cookie: {}", tenantCookie.toString());
    }

    public static void clearCookie(String key, HttpServletResponse response) {
        Cookie cookie = new Cookie(key, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setDomain("flashresponse.net");
        response.addCookie(cookie);
    }


}