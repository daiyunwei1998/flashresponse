package org.service.customer.repository.tenant;

import org.service.customer.models.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // Custom query to get all tenantIds
    @Query("SELECT t.tenantId FROM Tenant t")
    List<String> findAllTenantIds();
}

