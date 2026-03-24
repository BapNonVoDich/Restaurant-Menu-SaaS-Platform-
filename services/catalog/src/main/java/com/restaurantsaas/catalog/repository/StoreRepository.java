package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {
    Optional<Store> findByOwnerId(UUID ownerId);
    Optional<Store> findBySlug(String slug);
    boolean existsBySlug(String slug);

    Optional<Store> findByCustomDomainIgnoreCase(String customDomain);

    Optional<Store> findByCustomDomainIgnoreCaseAndDomainVerifiedTrue(String customDomain);
}
