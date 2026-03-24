package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.CategoryRequest;
import com.restaurantsaas.catalog.dto.CategorySummaryResponse;
import com.restaurantsaas.catalog.dto.StoreResponse;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.exception.CategoryNotFoundException;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final StoreService storeService;

    @Transactional
    public Category createCategory(UUID storeId, UUID ownerId, CategoryRequest request) {
        // Validate store ownership
        storeService.validateStoreOwnership(storeId, ownerId);

        // Auto-calculate sort order if not provided
        Integer sortOrder = request.getSortOrder();
        if (sortOrder == null) {
            List<Category> existingCategories = categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
            if (existingCategories.isEmpty()) {
                sortOrder = 0;
            } else {
                // Find the maximum sortOrder, handling null values
                Integer maxSortOrder = existingCategories.stream()
                        .map(Category::getSortOrder)
                        .filter(java.util.Objects::nonNull)
                        .max(Integer::compareTo)
                        .orElse(-1);
                sortOrder = maxSortOrder + 1;
            }
        }

        Category category = Category.builder()
                .storeId(storeId)
                .name(request.getName())
                .sortOrder(sortOrder)
                .styleJson(request.getStyleJson())
                .build();

        return categoryRepository.save(category);
    }

    public List<Category> getCategoriesByStore(UUID storeId) {
        return categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
    }

    public List<CategorySummaryResponse> listSummariesForMyStore(UUID ownerId) {
        StoreResponse store = storeService.getOrCreateStore(ownerId);
        return categoryRepository.findSummariesByStoreId(store.getId());
    }

    public List<CategorySummaryResponse> listSummariesForStore(UUID storeId, UUID ownerId) {
        storeService.validateStoreOwnership(storeId, ownerId);
        return categoryRepository.findSummariesByStoreId(storeId);
    }

    public Category getCategory(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with ID: " + categoryId));
    }

    @Transactional
    public Category updateCategory(UUID categoryId, UUID ownerId, CategoryRequest request) {
        Category category = getCategory(categoryId);
        storeService.validateStoreOwnership(category.getStoreId(), ownerId);

        category.setName(request.getName());
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        if (request.getStyleJson() != null) {
            category.setStyleJson(request.getStyleJson());
        }

        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(UUID categoryId, UUID ownerId) {
        Category category = getCategory(categoryId);
        storeService.validateStoreOwnership(category.getStoreId(), ownerId);
        categoryRepository.delete(category);
    }

    public void validateCategoryOwnership(UUID categoryId, UUID ownerId) {
        Category category = getCategory(categoryId);
        storeService.validateStoreOwnership(category.getStoreId(), ownerId);
    }
}
