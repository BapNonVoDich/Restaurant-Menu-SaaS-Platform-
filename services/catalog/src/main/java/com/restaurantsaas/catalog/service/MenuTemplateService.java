package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.MenuTemplateRequest;
import com.restaurantsaas.catalog.dto.MenuTemplateResponse;
import com.restaurantsaas.catalog.entity.MenuTemplate;
import com.restaurantsaas.catalog.repository.MenuTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuTemplateService {

    private final MenuTemplateRepository templateRepository;
    private static final int MAX_TEMPLATES_PER_STORE = 3;

    public List<MenuTemplateResponse> getTemplatesByStoreId(UUID storeId) {
        return templateRepository.findByStoreIdOrderByCreatedAtDesc(storeId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public MenuTemplateResponse getTemplateById(UUID templateId, UUID storeId) {
        return templateRepository.findByIdAndStoreId(templateId, storeId)
            .map(this::toResponse)
            .orElseThrow(() -> new RuntimeException("Template not found"));
    }

    @Transactional
    public MenuTemplateResponse createTemplate(UUID storeId, MenuTemplateRequest request) {
        // Check max templates limit
        long currentCount = templateRepository.countByStoreId(storeId);
        if (currentCount >= MAX_TEMPLATES_PER_STORE) {
            throw new RuntimeException("Maximum number of templates (" + MAX_TEMPLATES_PER_STORE + ") reached. Please delete an existing template first.");
        }

        MenuTemplate template = MenuTemplate.builder()
            .storeId(storeId)
            .name(request.getName())
            .templateData(request.getTemplateData())
            .build();

        MenuTemplate saved = templateRepository.save(template);
        return toResponse(saved);
    }

    @Transactional
    public void deleteTemplate(UUID templateId, UUID storeId) {
        MenuTemplate template = templateRepository.findByIdAndStoreId(templateId, storeId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        templateRepository.delete(template);
    }

    private MenuTemplateResponse toResponse(MenuTemplate template) {
        return MenuTemplateResponse.builder()
            .id(template.getId())
            .storeId(template.getStoreId())
            .name(template.getName())
            .templateData(template.getTemplateData())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }
}
