package com.restaurantsaas.catalog.service;

import com.restaurantsaas.catalog.dto.StoreRequest;
import com.restaurantsaas.catalog.entity.Store;
import com.restaurantsaas.catalog.exception.AccessDeniedException;
import com.restaurantsaas.catalog.exception.SlugAlreadyExistsException;
import com.restaurantsaas.catalog.exception.StoreAlreadyExistsException;
import com.restaurantsaas.catalog.exception.StoreNotFoundException;
import com.restaurantsaas.catalog.repository.StoreRepository;
import com.restaurantsaas.catalog.repository.StoreStaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    private StoreRepository storeRepository;
    private StoreStaffRepository storeStaffRepository;
    private DnsTxtLookupService dnsTxtLookupService;
    private StoreService storeService;

    private UUID ownerId;
    private UUID storeId;
    private StoreRequest storeRequest;
    private Store store;

    @BeforeEach
    void setUp() {
        storeRepository = mock(StoreRepository.class);
        storeStaffRepository = mock(StoreStaffRepository.class);
        dnsTxtLookupService = mock(DnsTxtLookupService.class);
        storeService = new StoreService(storeRepository, storeStaffRepository, dnsTxtLookupService);
        lenient().when(storeStaffRepository.findByUserId(any(UUID.class))).thenReturn(Collections.emptyList());
        ownerId = UUID.randomUUID();
        storeId = UUID.randomUUID();

        storeRequest = new StoreRequest();
        storeRequest.setName("My Restaurant");
        storeRequest.setSlug("my-restaurant");
        storeRequest.setDescription("A great restaurant");

        store = Store.builder()
                .id(storeId)
                .ownerId(ownerId)
                .name("My Restaurant")
                .slug("my-restaurant")
                .description("A great restaurant")
                .subStatus(Store.SubscriptionStatus.INACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createStore_WithValidRequest_ShouldReturnStoreResponse() {
        // Arrange
        when(storeRepository.existsBySlug("my-restaurant")).thenReturn(false);
        when(storeRepository.findByOwnerId(ownerId)).thenReturn(Optional.empty());
        when(storeRepository.save(any(Store.class))).thenReturn(store);

        // Act
        var result = storeService.createStore(ownerId, storeRequest);

        // Assert
        assertNotNull(result);
        assertEquals("My Restaurant", result.getName());
        assertEquals("my-restaurant", result.getSlug());
        verify(storeRepository).save(any(Store.class));
    }

    @Test
    void createStore_WithExistingSlug_ShouldThrowException() {
        // Arrange
        when(storeRepository.existsBySlug("my-restaurant")).thenReturn(true);

        // Act & Assert
        assertThrows(SlugAlreadyExistsException.class, () -> 
            storeService.createStore(ownerId, storeRequest));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    void createStore_WithExistingStore_ShouldThrowException() {
        // Arrange
        when(storeRepository.existsBySlug("my-restaurant")).thenReturn(false);
        when(storeRepository.findByOwnerId(ownerId)).thenReturn(Optional.of(store));

        // Act & Assert
        assertThrows(StoreAlreadyExistsException.class, () -> 
            storeService.createStore(ownerId, storeRequest));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    void getStoreEntity_WithValidId_ShouldReturnStore() {
        // Arrange
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        // Act
        Store result = storeService.getStoreEntity(storeId);

        // Assert
        assertNotNull(result);
        assertEquals(storeId, result.getId());
    }

    @Test
    void getStoreEntity_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(storeRepository.findById(storeId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(StoreNotFoundException.class, () -> storeService.getStoreEntity(storeId));
    }

    @Test
    void validateStoreOwnership_WithValidOwner_ShouldNotThrowException() {
        // Arrange
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        // Act & Assert
        assertDoesNotThrow(() -> storeService.validateStoreOwnership(storeId, ownerId));
    }

    @Test
    void validateStoreOwnership_WithInvalidOwner_ShouldThrowException() {
        // Arrange
        UUID otherOwnerId = UUID.randomUUID();
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> 
            storeService.validateStoreOwnership(storeId, otherOwnerId));
    }
}
