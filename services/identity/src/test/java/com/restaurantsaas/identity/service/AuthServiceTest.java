package com.restaurantsaas.identity.service;

import com.restaurantsaas.identity.dto.AuthResponse;
import com.restaurantsaas.identity.dto.LoginRequest;
import com.restaurantsaas.identity.entity.Role;
import com.restaurantsaas.identity.entity.User;
import com.restaurantsaas.identity.exception.InvalidCredentialsException;
import com.restaurantsaas.identity.exception.UserDisabledException;
import com.restaurantsaas.identity.repository.UserRepository;
import com.restaurantsaas.identity.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private LoginRequest loginRequest;
    private User user;
    private Role storeOwnerRole;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        storeOwnerRole = new Role();
        storeOwnerRole.setName("STORE_OWNER");

        user = User.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .isActive(true)
                .roles(Set.of(storeOwnerRole))
                .build();
    }

    @Test
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken("testuser", user.getId())).thenReturn("jwt-token");

        // Act
        AuthResponse result = authService.login(loginRequest);

        // Assert
        assertNotNull(result);
        assertEquals("jwt-token", result.getToken());
        assertEquals(user.getId(), result.getUserId());
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertTrue(result.getRoles().contains("STORE_OWNER"));
    }

    @Test
    void login_WithInvalidUsername_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        verify(jwtUtil, never()).generateToken(anyString(), any(UUID.class));
    }

    @Test
    void login_WithInvalidPassword_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(false);

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        verify(jwtUtil, never()).generateToken(anyString(), any(UUID.class));
    }

    @Test
    void login_WithDisabledUser_ShouldThrowException() {
        // Arrange
        user.setIsActive(false);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        // Act & Assert
        assertThrows(UserDisabledException.class, () -> authService.login(loginRequest));
        verify(jwtUtil, never()).generateToken(anyString(), any(UUID.class));
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        // Arrange
        String token = "valid-token";
        when(jwtUtil.validateToken(token)).thenReturn(true);

        // Act
        boolean result = authService.validateToken(token);

        // Assert
        assertTrue(result);
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnFalse() {
        // Arrange
        String token = "invalid-token";
        when(jwtUtil.validateToken(token)).thenReturn(false);

        // Act
        boolean result = authService.validateToken(token);

        // Assert
        assertFalse(result);
    }
}
