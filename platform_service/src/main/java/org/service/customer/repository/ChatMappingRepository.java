package org.service.customer.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

// Define a key-value repository where the key is customerId and the value is agentId
@Repository
public interface ChatMappingRepository extends CrudRepository<ChatMapping, String> {
    // Additional query methods can be defined here if needed
}
