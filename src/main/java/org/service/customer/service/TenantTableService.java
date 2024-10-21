package org.service.customer.service;

import org.service.customer.exceptions.auth.InvalidRegisterInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class TenantTableService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void createTenantUserTable(String tenantId) {

        // Sanitize tenantId to allow only alphanumeric characters and underscores
        if (!tenantId.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid tenant ID:"+tenantId);
        }

        String createTableQuery = String.format(
                "CREATE TABLE IF NOT EXISTS `%s_users` (" +
                        "`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
                        "`name` VARCHAR(255) NOT NULL, " +
                        "`password` VARCHAR(255) NOT NULL, " +
                        "`email` VARCHAR(255) NOT NULL UNIQUE, " +
                        "`registered_time` TIMESTAMP NOT NULL, " +
                        "`signed_time` TIMESTAMP, " +
                        "`role` VARCHAR(255) NOT NULL, " +
                        "`tenant_id` VARCHAR(255) NOT NULL" +
                        ");", tenantId);

        jdbcTemplate.execute(createTableQuery);
    }
}

