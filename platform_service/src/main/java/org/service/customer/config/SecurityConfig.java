package org.service.customer.config;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.filters.JwtAuthenticationFilter;
import org.service.customer.filters.RequestLoggingFilter;
import org.service.customer.filters.TenantContextFilter;
import org.service.customer.repository.tenant.TenantRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Slf4j
@Configuration
public class SecurityConfig {

    private final RequestLoggingFilter requestLoggingFilter;
    private final TenantRepository tenantRepository;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final TenantContextFilter tenantContextFilter;

    public SecurityConfig(RequestLoggingFilter requestLoggingFilter, TenantRepository tenantRepository, JwtAuthenticationFilter jwtAuthenticationFilter, TenantContextFilter tenantContextFilter) {
        this.requestLoggingFilter = requestLoggingFilter;
        this.tenantRepository = tenantRepository;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.tenantContextFilter = tenantContextFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Use this syntax to disable CSRF in the new version
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/tenants/{tenantId}/users/register").permitAll()  // Public access
                        .requestMatchers("/api/v1/tenants/{tenantId}/users/login").permitAll()
                        .requestMatchers("/api/v1/tenants/{tenantId}/users/logout").permitAll()
                        .requestMatchers("/api/v1/chats/handover").permitAll()
                        .requestMatchers("/api/v1/admin/login").permitAll()
                        .requestMatchers("/ws/*").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(requestLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(tenantContextFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /*@Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Fetch all tenant domains from the repository
        List<String> tenantIds = tenantRepository.findAllTenantIds();

        String baseDomain = "localhost:3000";
        List<String> domains = tenantIds.stream()
                .map(tenantId -> "http://" + tenantId + "." + baseDomain)
                .collect(Collectors.toList());
        log.debug(domains.toString());

        CorsConfiguration configuration = new CorsConfiguration();

        // Create a new list for allowed origins
        List<String> allowedOrigins = new ArrayList<>();
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("https://localhost:3000");
        allowedOrigins.addAll(domains);  // Add dynamically generated subdomains

        // Set the allowed origins dynamically
        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type","x-tenant-id","credentials","Set-Cookie"));
        configuration.setAllowCredentials(true); // Allows credentials (e.g., cookies, authorization headers)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }*/

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow all subdomains
        configuration.addAllowedOriginPattern("http://*.localhost:3000");
        configuration.addAllowedOriginPattern("https://*.localhost:3000");
        configuration.addAllowedOriginPattern("http://*.localhost.com:3000");
        configuration.addAllowedOriginPattern("http://*.flashresponse.net");
        configuration.addAllowedOriginPattern("https://*.flashresponse.net");

        // Also allow the main domain without subdomain
        configuration.addAllowedOrigin("http://localhost:3000");
        configuration.addAllowedOrigin("http://localhost:3001");
        configuration.addAllowedOrigin("https://localhost:3000");
        configuration.addAllowedOriginPattern("http://localhost.com:3000");
        configuration.addAllowedOriginPattern("http://203.204.185.67:3000");
        configuration.addAllowedOriginPattern("http://203.204.185.67:3001");
        configuration.addAllowedOrigin("https://www.flashresponse.net");
        configuration.addAllowedOrigin("https://flashresponse.net");


        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "x-tenant-id", "credentials", "Set-Cookie"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }



}
