package org.service.customer.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.service.customer.service.CustomUserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = extractTenantId(request);
            if (tenantId != null) {
                CustomUserDetailsService.setTenantContext(tenantId);
            }
            filterChain.doFilter(request, response);
        } finally {
            // Ensure the ThreadLocal is cleared after the request is processed
            CustomUserDetailsService.clearTenantContext();
        }
    }

    private String extractTenantId(HttpServletRequest request) {
        // Assuming tenantId is a path variable in the URL
        String path = request.getServletPath();
        String[] parts = path.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if ("tenants".equals(parts[i])) {
                return parts[i + 1];
            }
        }
        return null;
    }
}
