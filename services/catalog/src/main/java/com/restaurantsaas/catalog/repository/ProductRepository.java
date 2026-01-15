package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByStoreIdAndIsAvailableTrueOrderBySortOrderAsc(UUID storeId);
    List<Product> findByStoreIdOrderBySortOrderAsc(UUID storeId);
    boolean existsByIdAndStoreId(UUID productId, UUID storeId);
}
