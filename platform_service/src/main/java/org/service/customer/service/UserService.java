package org.service.customer.service;

import org.service.customer.dto.user.RegisterRequest;
import org.service.customer.dto.user.UpdateUserRequest;
import org.service.customer.exceptions.auth.InvalidRegisterInfo;
import org.service.customer.models.User;
import org.service.customer.repository.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;

@Service
public class UserService {

    private final JdbcTemplate jdbcTemplate;
    private final TenantTableService tenantTableService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(JdbcTemplate jdbcTemplate, TenantTableService tenantTableService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.tenantTableService = tenantTableService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerUser(RegisterRequest registerRequest) {
        String tenantId = registerRequest.getTenantId();
        String name = registerRequest.getName();
        String rawPassword = registerRequest.getPassword();
        String email = registerRequest.getEmail();
        String role = registerRequest.getRole();

        tenantTableService.createTenantUserTable(tenantId);

        // Hash the password
        String encodedPassword = passwordEncoder.encode(rawPassword);

        // Create tenant-specific table name
        String tableName = tenantId + "_users";

        try {
            // Prepare the SQL query to insert the user into the specific tenant table
            String sql = String.format("INSERT INTO %s (name, password, email, registered_time, signed_time, role, tenant_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)", tableName);

            // Execute the query using JdbcTemplate
            jdbcTemplate.update(sql,
                    name,
                    encodedPassword,
                    email,
                    new Timestamp(System.currentTimeMillis()), // registered_time
                    new Timestamp(System.currentTimeMillis()), // signed_time
                    role,
                    tenantId
            );
        } catch (DuplicateKeyException e) {
            // Handle duplicate key exception
            throw new InvalidRegisterInfo("A user with this email already exists!");
        } catch (DataIntegrityViolationException e) {
            // Handle any other data integrity issues
            throw new InvalidRegisterInfo("Data integrity violation occurred: " + e.getMessage());
        } catch (Exception e) {
            // Handle any other exceptions
            throw new RuntimeException("An unexpected error occurred: " + e.getMessage());
        }

    }

    // Update the username of an existing user by user ID
    public void updateUsername(String tenantId, Long userId, String newName) {
        // Create tenant-specific table name
        String tableName = tenantId + "_users";

        // Prepare the SQL query to update the username
        String sql = String.format("UPDATE %s SET name = ? WHERE id = ?", tableName);

        // Execute the update using JdbcTemplate
        jdbcTemplate.update(sql, newName, userId);
    }


    public User getUserById(Long userId, String tenantId) {
        return userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for tenant " + tenantId));
    }


    public List<User> getAllUsers(String tenantId) {
        return userRepository.findAllByTenantId(tenantId);
    }


    public void updateUser(Long userId, String tenantId, UpdateUserRequest updateUserRequest) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for tenant " + tenantId));
        user.setName(updateUserRequest.getName());
        user.setPassword(updateUserRequest.getPassword());
        user.setEmail(updateUserRequest.getEmail());
        userRepository.update(user);
    }

    public void deleteUser(Long userId, String tenantId) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for tenant " + tenantId));
        userRepository.deleteByIdAndTenantId(userId, tenantId);
    }

    public User getUserByEmail(String username,String tenantId) {
        return userRepository.findByEmailAndTenantId(username, tenantId);
    }
}
