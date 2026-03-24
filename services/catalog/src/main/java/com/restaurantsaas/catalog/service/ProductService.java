package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.ProductRequest;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.exception.AccessDeniedException;
import com.restaurantsaas.catalog.exception.CategoryNotFoundException;
import com.restaurantsaas.catalog.exception.ProductNotFoundException;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import com.restaurantsaas.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StoreService storeService;

    @Transactional
    public Product createProduct(UUID storeId, UUID ownerId, ProductRequest request) {
        // Validate store ownership
        storeService.validateStoreOwnership(storeId, ownerId);

        // Auto-calculate sort order if not provided
        Integer sortOrder = request.getSortOrder();
        if (sortOrder == null) {
            List<Product> existingProducts = productRepository.findByStoreIdOrderBySortOrderAsc(storeId);
            if (existingProducts.isEmpty()) {
                sortOrder = 0;
            } else {
                // Find the maximum sortOrder, handling null values
                Integer maxSortOrder = existingProducts.stream()
                        .map(Product::getSortOrder)
                        .filter(java.util.Objects::nonNull)
                        .max(Integer::compareTo)
                        .orElse(-1);
                sortOrder = maxSortOrder + 1;
            }
        }

        Product product = Product.builder()
                .storeId(storeId)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .sortOrder(sortOrder)
                .styleJson(request.getStyleJson())
                .build();

        // Handle many-to-many categories relationship
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            Set<Category> categories = request.getCategoryIds().stream()
                    .map(categoryId -> {
                        Category category = categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + categoryId));
                        // Validate category belongs to same store
                        if (!category.getStoreId().equals(storeId)) {
                            throw new AccessDeniedException("Category does not belong to this store");
                        }
                        return category;
                    })
                    .collect(Collectors.toSet());
            product.setCategories(categories);
        }

        return productRepository.save(product);
    }

    public List<Product> getProductsByStore(UUID storeId) {
        return productRepository.findByStoreIdAndIsAvailableTrueOrderBySortOrderAsc(storeId);
    }

    public List<Product> getProductsByStoreAndCategory(UUID storeId, UUID categoryId) {
        // Filter products that belong to the category using many-to-many relationship
        return productRepository.findByStoreIdAndIsAvailableTrueOrderBySortOrderAsc(storeId).stream()
                .filter(product -> product.getCategories().stream()
                        .anyMatch(cat -> cat.getId().equals(categoryId)))
                .collect(Collectors.toList());
    }

    public Product getProduct(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with ID: " + productId));
    }

    @Transactional
    public Product updateProductCategories(UUID productId, UUID ownerId, List<UUID> categoryIds) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);

        if (categoryIds != null) {
                Set<Category> categories = categoryIds.stream()
                    .map(categoryId -> {
                        Category category = categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + categoryId));
                        // Validate category belongs to same store
                        if (!category.getStoreId().equals(product.getStoreId())) {
                            throw new AccessDeniedException("Category does not belong to this store");
                        }
                        return category;
                    })
                    .collect(Collectors.toSet());
            product.setCategories(categories);
        } else {
            product.setCategories(new HashSet<>());
        }

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(UUID productId, UUID ownerId, ProductRequest request) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        if (request.getStyleJson() != null) {
            product.setStyleJson(request.getStyleJson());
        }
        if (request.getIsAvailable() != null) {
            product.setIsAvailable(request.getIsAvailable());
        }
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }

        // Handle many-to-many categories relationship
        // If categoryIds is provided (even if empty list), update categories
        // If null, preserve existing categories (backward compatibility)
        if (request.getCategoryIds() != null) {
            if (request.getCategoryIds().isEmpty()) {
                // Empty list means clear all categories
                product.setCategories(new HashSet<>());
            } else {
                Set<Category> categories = request.getCategoryIds().stream()
                        .map(categoryId -> {
                            Category category = categoryRepository.findById(categoryId)
                                    .orElseThrow(() -> new CategoryNotFoundException("Category not found: " + categoryId));
                            if (!category.getStoreId().equals(product.getStoreId())) {
                                throw new AccessDeniedException("Category does not belong to this store");
                            }
                            return category;
                        })
                        .collect(Collectors.toSet());
                product.setCategories(categories);
            }
        }
        // If categoryIds is null, categories remain unchanged (preserve existing)

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(UUID productId, UUID ownerId) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);
        productRepository.delete(product);
    }

    public void validateProductOwnership(UUID productId, UUID ownerId) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);
    }
}
