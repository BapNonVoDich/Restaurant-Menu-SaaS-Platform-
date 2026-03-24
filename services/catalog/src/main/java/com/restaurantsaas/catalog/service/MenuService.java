package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.MenuResponse;
import com.restaurantsaas.catalog.entity.Category;
import com.restaurantsaas.catalog.entity.Product;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.repository.CategoryRepository;
import com.restaurantsaas.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
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

        String templateKey = normalizeTemplateKey(store.getMenuTemplateKey());
        Map<String, Object> customization = mergeStoredMenuDataCustomization(store, getCustomization(templateKey));
        Map<String, Object> defaultCategoryStyle = getDefaultCategoryStyle(templateKey);
        Map<String, Object> defaultProductStyle = getDefaultProductStyle(templateKey);

        List<Category> categories = categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
        List<Product> products = productRepository.findByStoreIdAndIsAvailableTrueOrderBySortOrderAsc(storeId);
        
        // Fetch categories for products to avoid LazyInitializationException
        products.forEach(product -> product.getCategories().size());

        List<MenuResponse.CategoryMenu> categoryMenus = categories.stream()
                .map(category -> {
                    Map<String, Object> mergedCategoryStyle = mergeStyle(defaultCategoryStyle, category.getStyleJson());

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
                                    .sortOrder(product.getSortOrder())
                                    .categoryIds(product.getCategories().stream()
                                            .map(Category::getId)
                                            .collect(Collectors.toList()))
                                    .style(mergeProductStyleForMenu(defaultProductStyle, product))
                                    .build())
                            .collect(Collectors.toList());

                    return MenuResponse.CategoryMenu.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .sortOrder(category.getSortOrder())
                            .style(mergedCategoryStyle)
                            .products(categoryProducts)
                            .build();
                })
                .collect(Collectors.toList());

        return MenuResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .backgroundUrl(store.getMenuFileUrl())
                .menuTemplateKey(templateKey)
                .tableOrderingEnabled(Boolean.TRUE.equals(store.getTableOrderingEnabled()))
                .customization(customization)
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

        String templateKey = normalizeTemplateKey(store.getMenuTemplateKey());
        Map<String, Object> customization = mergeStoredMenuDataCustomization(store, getCustomization(templateKey));
        Map<String, Object> defaultCategoryStyle = getDefaultCategoryStyle(templateKey);
        Map<String, Object> defaultProductStyle = getDefaultProductStyle(templateKey);

        // Return menu regardless of subscription status for owner
        List<Category> categories = categoryRepository.findByStoreIdOrderBySortOrderAsc(storeId);
        List<Product> products = productRepository.findByStoreIdOrderBySortOrderAsc(storeId);  // Include all products, not just available
        
        // Fetch categories for products to avoid LazyInitializationException
        products.forEach(product -> product.getCategories().size());

        List<MenuResponse.CategoryMenu> categoryMenus = categories.stream()
                .map(category -> {
                    Map<String, Object> mergedCategoryStyle = mergeStyle(defaultCategoryStyle, category.getStyleJson());

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
                                    .sortOrder(product.getSortOrder())
                                    .categoryIds(product.getCategories().stream()
                                            .map(Category::getId)
                                            .collect(Collectors.toList()))
                                    .style(mergeProductStyleForMenu(defaultProductStyle, product))
                                    .build())
                            .collect(Collectors.toList());

                    return MenuResponse.CategoryMenu.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .sortOrder(category.getSortOrder())
                            .style(mergedCategoryStyle)
                            .products(categoryProducts)
                            .build();
                })
                .collect(Collectors.toList());

        return MenuResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .backgroundUrl(store.getMenuFileUrl())
                .menuTemplateKey(templateKey)
                .tableOrderingEnabled(Boolean.TRUE.equals(store.getTableOrderingEnabled()))
                .customization(customization)
                .categories(categoryMenus)
                .build();
    }

    /**
     * Merge default + product style_json, then ensure uploaded images display unless the owner
     * explicitly set {@code "showImage": false} in style_json (fixes template B default showImage false).
     */
    private Map<String, Object> mergeProductStyleForMenu(Map<String, Object> defaultProductStyle, Product product) {
        Map<String, Object> merged = new HashMap<>(mergeStyle(defaultProductStyle, product.getStyleJson()));
        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            return merged;
        }
        if (styleJsonExplicitlySetsShowImageFalse(product.getStyleJson())) {
            return merged;
        }
        merged.put("showImage", true);
        return merged;
    }

    private boolean styleJsonExplicitlySetsShowImageFalse(String styleJson) {
        if (styleJson == null || styleJson.trim().isEmpty()) {
            return false;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(styleJson);
            if (!node.has("showImage") || node.get("showImage").isNull()) {
                return false;
            }
            JsonNode show = node.get("showImage");
            return show.isBoolean() && !show.booleanValue();
        } catch (Exception e) {
            return false;
        }
    }

    private String normalizeTemplateKey(String templateKey) {
        if (templateKey == null || templateKey.isBlank()) {
            return "A";
        }
        String normalized = templateKey.trim().toUpperCase();
        return switch (normalized) {
            case "A", "B", "C" -> normalized;
            default -> "A";
        };
    }

    /**
     * Shallow-merge {@code customization} object from persisted {@link Store#getMenuData()} JSON
     * (e.g. readability presets saved from dashboard) into template defaults.
     */
    private Map<String, Object> mergeStoredMenuDataCustomization(Store store, Map<String, Object> baseCustomization) {
        Map<String, Object> result = new HashMap<>(baseCustomization);
        String raw = store.getMenuData();
        if (raw == null || raw.isBlank()) {
            return result;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(raw);
            if (!root.isObject()) {
                return result;
            }
            JsonNode customNode = root.get("customization");
            if (customNode == null || !customNode.isObject()) {
                return result;
            }
            Iterator<Map.Entry<String, JsonNode>> fields = customNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> e = fields.next();
                String key = e.getKey();
                JsonNode val = e.getValue();
                if (val.isNull()) {
                    continue;
                }
                if (val.isTextual()) {
                    result.put(key, val.asText());
                } else if (val.isNumber()) {
                    result.put(key, val.numberValue());
                } else if (val.isBoolean()) {
                    result.put(key, val.booleanValue());
                } else {
                    result.put(key, mapper.convertValue(val, Object.class));
                }
            }
        } catch (Exception ignored) {
            // Malformed menuData: keep template defaults only
        }
        return result;
    }

    private Map<String, Object> getCustomization(String templateKey) {
        // Default global settings consumed by frontend menu renderer.
        // These can be extended later when we support richer template configuration.
        Map<String, Object> customization = new HashMap<>();
        customization.put("globalFontFamily", "system-ui, -apple-system, sans-serif");
        customization.put("globalTextColor", "#1f2937");
        customization.put("globalBackgroundColor", "#ffffff");
        customization.put("globalSpacing", "20px");
        customization.put("theme", "light");

        if ("B".equals(templateKey)) {
            customization.put("primaryColor", "#10b981");
            customization.put("secondaryColor", "#14b8a6");
        } else if ("C".equals(templateKey)) {
            customization.put("primaryColor", "#f59e0b");
            customization.put("secondaryColor", "#ef4444");
        } else {
            customization.put("primaryColor", "#3b82f6");
            customization.put("secondaryColor", "#8b5cf6");
        }

        return customization;
    }

    private Map<String, Object> getDefaultCategoryStyle(String templateKey) {
        Map<String, Object> style = new HashMap<>();
        style.put("textColor", "#111827");
        style.put("textAlign", "left");
        style.put("fontWeight", "700");
        style.put("fontSize", "2rem");

        if ("B".equals(templateKey)) {
            style.put("layout", "list");
        } else if ("C".equals(templateKey)) {
            style.put("layout", "grid");
            style.put("columns", 2);
        } else {
            style.put("layout", "grid");
            style.put("columns", 3);
        }

        return style;
    }

    private Map<String, Object> getDefaultProductStyle(String templateKey) {
        Map<String, Object> style = new HashMap<>();
        style.put("textColor", "#111827");
        style.put("fontWeight", "600");

        if ("B".equals(templateKey)) {
            style.put("showImage", false);
            style.put("showDescription", true);
            style.put("showPrice", true);
            style.put("fontSize", "1.05rem");
        } else if ("C".equals(templateKey)) {
            style.put("showImage", true);
            style.put("showDescription", false);
            style.put("showPrice", true);
            style.put("fontSize", "1.25rem");
            style.put("fontWeight", "700");
        } else {
            style.put("showImage", true);
            style.put("showDescription", true);
            style.put("showPrice", true);
            style.put("fontSize", "1.25rem");
        }

        return style;
    }

    private Map<String, Object> mergeStyle(Map<String, Object> baseStyle, String overrideStyleJson) {
        if (overrideStyleJson == null || overrideStyleJson.trim().isEmpty()) {
            return baseStyle;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode baseNode = mapper.valueToTree(baseStyle);
            JsonNode overrideNode = mapper.readTree(overrideStyleJson);
            JsonNode merged = deepMerge(baseNode, overrideNode);

            return mapper.convertValue(merged, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // If override JSON is malformed, fallback to defaults.
            return baseStyle;
        }
    }

    private JsonNode deepMerge(JsonNode base, JsonNode override) {
        if (override == null || override.isNull()) {
            return base;
        }
        if (base == null || base.isNull()) {
            return override;
        }

        if (base.isObject() && override.isObject()) {
            JsonNode merged = base.deepCopy();

            override.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                JsonNode overrideValue = entry.getValue();
                JsonNode baseValue = merged.get(key);
                ((com.fasterxml.jackson.databind.node.ObjectNode) merged).set(key, deepMerge(baseValue, overrideValue));
            });

            return merged;
        }

        // For arrays & primitives, override replaces base.
        return override;
    }
}
