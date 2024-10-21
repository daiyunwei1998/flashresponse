package org.service.customer.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.service.customer.service.CustomUserDetailsService;
import org.service.customer.utils.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    private AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();

        return pathMatcher.match("/api/v1/tenants/*/users/login", path) ||
                pathMatcher.match("/api/v1/tenants/*/users/register", path) ||
                pathMatcher.match("/api/v1/tenants/*/users/logout", path) ||
                pathMatcher.match("/api/v1/admin/login", path) ||
                pathMatcher.match("/api/v1/chats/handover", path);
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Map<String, String> cookieValues = getCookieValues(request);
        for(String k: cookieValues.keySet()) {
            log.error(k);
        }
        String jwt = cookieValues.get("jwt");

        if (jwt != null) {
            log.info("JWT found in cookie: {}", jwt);

            // Create a wrapper to add all cookie values as headers
            request = new HttpServletRequestWrapper(request) {
                @Override
                public String getHeader(String name) {
                    if (cookieValues.containsKey(name.toLowerCase())) {
                        return cookieValues.get(name.toLowerCase());
                    }
                    return super.getHeader(name);
                }

                @Override
                public java.util.Enumeration<String> getHeaderNames() {
                    java.util.Set<String> set = new java.util.HashSet<>(java.util.Collections.list(super.getHeaderNames()));
                    set.addAll(cookieValues.keySet());
                    return java.util.Collections.enumeration(set);
                }
            };

            String username = jwtTokenProvider.getUsernameFromToken(jwt);
            String tenantId = cookieValues.get("tenantId");  // Get tenantId from cookie
            log.error("context set:"+tenantId);
            CustomUserDetailsService.setTenantContext(tenantId);

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

            if (jwtTokenProvider.validateToken(jwt, userDetails, tenantId)) {
                log.info("User {} has authorities: {}", username, userDetails.getAuthorities());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                log.info("Token invalid");
            }
        } else {
            log.info("No JWT token found in cookie");
        }

        chain.doFilter(request, response);
    }

    private Map<String, String> getCookieValues(HttpServletRequest request) {
        Map<String, String> cookieValues = new HashMap<>();
        Cookie[] cookies = request.getCookies();
        log.error(cookies.toString());
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                cookieValues.put(cookie.getName(), cookie.getValue());
                log.error("putting cookie name: {}, value:{}", cookie.getName(), cookie.getValue());
            }
        }
        log.info("Extracted cookie values: {}", cookieValues);
        return cookieValues;
    }
}