package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.ProductRequest;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import com.restaurantsaas.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

        Product product = Product.builder()
                .storeId(storeId)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        // Handle many-to-many categories relationship
        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            Set<Category> categories = request.getCategoryIds().stream()
                    .map(categoryId -> {
                        Category category = categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));
                        // Validate category belongs to same store
                        if (!category.getStoreId().equals(storeId)) {
                            throw new RuntimeException("Category does not belong to this store");
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
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    @Transactional
    public Product updateProductCategories(UUID productId, UUID ownerId, List<UUID> categoryIds) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);

        if (categoryIds != null) {
            Set<Category> categories = categoryIds.stream()
                    .map(categoryId -> {
                        Category category = categoryRepository.findById(categoryId)
                                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));
                        // Validate category belongs to same store
                        if (!category.getStoreId().equals(product.getStoreId())) {
                            throw new RuntimeException("Category does not belong to this store");
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

    public void validateProductOwnership(UUID productId, UUID ownerId) {
        Product product = getProduct(productId);
        storeService.validateStoreOwnership(product.getStoreId(), ownerId);
    }
}
