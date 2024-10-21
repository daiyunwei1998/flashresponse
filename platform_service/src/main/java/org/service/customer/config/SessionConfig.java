package org.service.customer.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisHttpSession
public class SessionConfig {

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();

        // Set the name of the session cookie
        serializer.setCookieName("SESSION");

        // Set the path for the session cookie
        serializer.setCookiePath("/");

        // (Optional) Set domain name pattern if your application spans multiple subdomains
        // serializer.setDomainNamePattern("^.+?\\.(\\w+\\.[a-z]+)$");

        serializer.setUseHttpOnlyCookie(true);

        // (Optional) Enable secure cookies in production (requires HTTPS)
        // serializer.setUseSecureCookie(true);

        return serializer;
    }
}
