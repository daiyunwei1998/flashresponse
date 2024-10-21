package org.service.customer.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class CustomHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(CustomHandshakeInterceptor.class);

    @Override
    public boolean beforeHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull org.springframework.http.server.ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            @NonNull Map<String, Object> attributes) throws Exception {

        URI uri = request.getURI();
        Map<String, String> params = getQueryParams(uri.getQuery());

        String tenantId = params.get("tenant-id");
        String userId = params.get("user-id");
        String userType = params.get("user-type");

        if (tenantId != null && userId != null && userType != null) {
            attributes.put("tenant-id", tenantId);
            attributes.put("user-id", userId);
            attributes.put("user-type", userType);
            logger.info("WebSocket connection from user {} of type {} under tenant {}", userId, userType, tenantId);
            return true;
        } else {
            logger.warn("Missing required parameters in WebSocket handshake");
            return false; // Reject the connection
        }
    }

    @Override
    public void afterHandshake(
            @NonNull ServerHttpRequest request,
            @NonNull org.springframework.http.server.ServerHttpResponse response,
            @NonNull WebSocketHandler wsHandler,
            Exception exception) {
        // No implementation needed
    }

    private Map<String, String> getQueryParams(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null) return params;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf('=');
            params.put(
                    URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8),
                    URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8)
            );
        }
        return params;
    }
}
