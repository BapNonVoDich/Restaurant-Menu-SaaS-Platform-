package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.CategoryRequest;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import com.restaurantsaas.catalog.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final StoreService storeService;

    @Transactional
    public Category createCategory(UUID storeId, UUID ownerId, CategoryRequest request) {
        // Validate store ownership
        storeService.validateStoreOwnership(storeId, ownerId);

        Category category = Category.builder()
                .storeId(storeId)
                .name(request.getName())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        return categoryRepository.save(category);
    }

    public List<Category> getCategoriesByStore(UUID storeId) {
        return categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
    }

    public Category getCategory(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    public void validateCategoryOwnership(UUID categoryId, UUID ownerId) {
        Category category = getCategory(categoryId);
        storeService.validateStoreOwnership(category.getStoreId(), ownerId);
    }
}
