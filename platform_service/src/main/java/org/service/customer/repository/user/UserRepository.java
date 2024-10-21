package org.service.customer.repository.user;

import org.service.customer.models.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository {

    Optional<User> findByIdAndTenantId(Long id, String tenantId);

    List<User> findAllByTenantId(String tenantId);

    void save(User user);

    void update(User user);

    void deleteByIdAndTenantId(Long id, String tenantId);

    User findByEmailAndTenantId(String username, String tenantId);
}

