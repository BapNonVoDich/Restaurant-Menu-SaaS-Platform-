package com.restaurantsaas.catalog.repository;

import com.restaurantsaas.catalog.dto.CategorySummaryResponse;
import com.restaurantsaas.catalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByStoreIdOrderBySortOrderAsc(UUID storeId);

    @Query("""
            select new com.restaurantsaas.catalog.dto.CategorySummaryResponse(
                c.id,
                c.name,
                c.sortOrder,
                c.styleJson,
                (select count(p.id) from Product p join p.categories cat where cat.id = c.id)
            )
            from Category c
            where c.storeId = :storeId
            order by c.sortOrder asc
            """)
    List<CategorySummaryResponse> findSummariesByStoreId(@Param("storeId") UUID storeId);
}
