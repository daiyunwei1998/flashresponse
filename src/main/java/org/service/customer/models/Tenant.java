package org.service.customer.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenants", schema = "flash_response_cloud")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Size(max = 255)
    @Column(name = "tenant_id")
    private String tenantId;

    @Size(max = 255)
    @Column(name = "logo")
    private String logo;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 10)
    @NotNull
    @Column(name = "alias", nullable = false, length = 10)
    private String alias;

    @NotNull
    @Column(name = "active_state", nullable = false)
    private Boolean activeState = false;

}