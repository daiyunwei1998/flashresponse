package org.service.customer.repository.user;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;


import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Repository
public class UserRepositoryImpl implements UserRepository {

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public Optional<User> findByIdAndTenantId(Long id, String tenantId) {
        String query = "SELECT * FROM :tenantId_users WHERE id = :id";
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("tenantId", tenantId);

        List<User> users = jdbcTemplate.query(query, params, new BeanPropertyRowMapper<>(User.class));
        return users.stream().findFirst();
    }

    @Override
    public List<User> findAllByTenantId(String tenantId) {
        String query = "SELECT * FROM :tenantId_users";
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);

        return jdbcTemplate.query(query, params, new BeanPropertyRowMapper<>(User.class));
    }

    @Override
    public void save(User user) {
        Timestamp timestamp = new Timestamp(System.currentTimeMillis());
        String query = "INSERT INTO :tenantId_users (name, password, email, registered_time, signed_time, role, tenant_id) " +
                "VALUES (:name, :password, :email, :registeredTime, :signedTime, :role, :tenantId)";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("name", user.getName())
                .addValue("password", user.getPassword())
                .addValue("email", user.getEmail())
                .addValue("registeredTime", timestamp)
                .addValue("role", user.getRole())
                .addValue("tenantId", user.getTenantId());

        jdbcTemplate.update(query, params);
    }

    @Override
    public void update(User user) {
        String query = "UPDATE :tenantId_users SET name = :name, password = :password, email = :email WHERE id = :id";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("name", user.getName())
                .addValue("password", user.getPassword())
                .addValue("email", user.getEmail())
                .addValue("id", user.getId())
                .addValue("tenantId", user.getTenantId());

        jdbcTemplate.update(query, params);
    }

    @Override
    public void deleteByIdAndTenantId(Long id, String tenantId) {
        String query = "DELETE FROM :tenantId_users WHERE id = :id";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId);

        jdbcTemplate.update(query, params);
    }

    public User findByEmailAndTenantId(String username, String tenantId) {

        // Directly concatenate tenantId into the table name
        String query = "SELECT * FROM " + tenantId + "_users WHERE email = :email";

        Map<String, Object> params = new HashMap<>();
        params.put("email", username);

        List<User> users = jdbcTemplate.query(query, params, new BeanPropertyRowMapper<>(User.class));

        if (users.size() > 0) {
            log.info("User found: " + username + " in tenant " + tenantId);
            return users.get(0);
        }

        log.info("User not found: " + username + " in tenant " + tenantId);
        return null;
    }

}

