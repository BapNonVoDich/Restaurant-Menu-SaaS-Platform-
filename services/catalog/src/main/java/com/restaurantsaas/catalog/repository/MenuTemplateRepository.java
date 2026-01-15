package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.entity.MenuTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MenuTemplateRepository extends JpaRepository<MenuTemplate, UUID> {
    List<MenuTemplate> findByStoreIdOrderByCreatedAtDesc(UUID storeId);
    Optional<MenuTemplate> findByIdAndStoreId(UUID id, UUID storeId);
    long countByStoreId(UUID storeId);
}
