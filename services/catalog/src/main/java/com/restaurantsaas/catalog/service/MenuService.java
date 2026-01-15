package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.MenuResponse;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import com.restaurantsaas.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final StoreService storeService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    /**
     * Get menu for public access (via QR code/slug).
     * Only returns menu if store is ACTIVE (published/paid).
     */
    public MenuResponse getMenuByStoreId(UUID storeId) {
        Store store = storeService.getStoreEntity(storeId);
        
        // Only return menu if store is ACTIVE (published)
        if (store.getSubStatus() != Store.SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Store is not published. Menu is only available for active subscriptions.");
        }

        List<Category> categories = categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
        List<Product> products = productRepository.findByStoreIdAndIsAvailableTrueOrderBySortOrderAsc(storeId);
        
        // Fetch categories for products to avoid LazyInitializationException
        products.forEach(product -> product.getCategories().size());

        List<MenuResponse.CategoryMenu> categoryMenus = categories.stream()
                .map(category -> {
                    // Filter products that belong to this category (many-to-many)
                    List<MenuResponse.ProductMenu> categoryProducts = products.stream()
                            .filter(product -> product.getCategories().stream()
                                    .anyMatch(cat -> cat.getId().equals(category.getId())))
                            .map(product -> MenuResponse.ProductMenu.builder()
                                    .id(product.getId())
                                    .name(product.getName())
                                    .description(product.getDescription())
                                    .price(product.getPrice())
                                    .imageUrl(product.getImageUrl())
                                    .isAvailable(product.getIsAvailable())
                                    .build())
                            .collect(Collectors.toList());

                    return MenuResponse.CategoryMenu.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .sortOrder(category.getSortOrder())
                            .products(categoryProducts)
                            .build();
                })
                .collect(Collectors.toList());

        return MenuResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .categories(categoryMenus)
                .build();
    }

    /**
     * Get menu for store owner (for editing/viewing).
     * Returns menu regardless of subscription status - owners can always view/edit their menu.
     */
    public MenuResponse getMenuForOwner(UUID storeId, UUID ownerId) {
        Store store = storeService.getStoreEntity(storeId);
        
        // Validate ownership
        if (!store.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Access denied: Not the store owner");
        }

        // Return menu regardless of subscription status for owner
        List<Category> categories = categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
        List<Product> products = productRepository.findByStoreIdOrderBySortOrderAsc(storeId);  // Include all products, not just available
        
        // Fetch categories for products to avoid LazyInitializationException
        products.forEach(product -> product.getCategories().size());

        List<MenuResponse.CategoryMenu> categoryMenus = categories.stream()
                .map(category -> {
                    // Filter products that belong to this category (many-to-many)
                    List<MenuResponse.ProductMenu> categoryProducts = products.stream()
                            .filter(product -> product.getCategories().stream()
                                    .anyMatch(cat -> cat.getId().equals(category.getId())))
                            .map(product -> MenuResponse.ProductMenu.builder()
                                    .id(product.getId())
                                    .name(product.getName())
                                    .description(product.getDescription())
                                    .price(product.getPrice())
                                    .imageUrl(product.getImageUrl())
                                    .isAvailable(product.getIsAvailable())
                                    .build())
                            .collect(Collectors.toList());

                    return MenuResponse.CategoryMenu.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .sortOrder(category.getSortOrder())
                            .products(categoryProducts)
                            .build();
                })
                .collect(Collectors.toList());

        return MenuResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .categories(categoryMenus)
                .build();
    }
}
