package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.entity.StoreStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreStaffRepository extends JpaRepository<StoreStaff, UUID> {
    Optional<StoreStaff> findByStoreIdAndUserId(UUID storeId, UUID userId);
    List<StoreStaff> findByStoreId(UUID storeId);
    List<StoreStaff> findByUserId(UUID userId);
    void deleteByStoreIdAndUserId(UUID storeId, UUID userId);
}

