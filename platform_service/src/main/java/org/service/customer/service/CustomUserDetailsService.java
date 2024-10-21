package org.service.customer.service;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.models.CustomUserDetails;
import org.service.customer.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserService userService;

    // This ThreadLocal will store tenantId for each request
    private static ThreadLocal<String> tenantContext = new ThreadLocal<>();

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Retrieve tenantId from the ThreadLocal (it must be set earlier, like in a filter)
        String tenantId = tenantContext.get();

        if (tenantId == null) {
            log.error("tenant ID Missing");
            throw new UsernameNotFoundException("Tenant ID is missing");
        }

        // Fetch the user using both email (username) and tenantId

        User user = userService.getUserByEmail(username, tenantId);
        if (user == null) {
            throw new UsernameNotFoundException("User not found for tenant: " + tenantId);
        }

        return new CustomUserDetails(user);
    }

    // This method can be used to set tenantId in the filter or controller
    public static void setTenantContext(String tenantId) {
        tenantContext.set(tenantId);
    }

    // Call this method to clear the tenant context after the request
    public static void clearTenantContext() {
        tenantContext.remove();
    }
}
