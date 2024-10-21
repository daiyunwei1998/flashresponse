package org.service.customer.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();
        String requestURI = request.getRequestURI();

        // Log the incoming request
        log.info("Incoming request: Method = {}, URI = {}", method, requestURI);

        try {
            // Proceed with the rest of the filter chain
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("Exception occurred while processing the request: Method = {}, URI = {}", method, requestURI, e);
            throw e;
        }

        // Log the response status after request is processed
        int status = response.getStatus();
        log.info("Response status: Method = {}, URI = {}, Status = {}", method, requestURI, status);
    }
}

