package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByStoreIdOrderBySortOrderAsc(UUID storeId);
}
