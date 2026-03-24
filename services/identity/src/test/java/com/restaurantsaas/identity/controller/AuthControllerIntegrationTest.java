package com.restaurantsaas.identity.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurantsaas.identity.dto.RegisterRequest;
import com.restaurantsaas.identity.entity.Role;
import com.restaurantsaas.identity.repository.RoleRepository;
import com.restaurantsaas.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        // Ensure STORE_OWNER role exists for tests (since Liquibase is disabled)
        if (roleRepository.findByName("STORE_OWNER").isEmpty()) {
            Role storeOwnerRole = new Role();
            storeOwnerRole.setId(UUID.randomUUID());
            storeOwnerRole.setName("STORE_OWNER");
            storeOwnerRole.setStoreId(null);
            roleRepository.save(storeOwnerRole);
        }
    }

    @Test
    void register_WithValidRequest_ShouldReturnCreated() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    void register_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(""); // Invalid: empty username
        request.setEmail("invalid-email");
        request.setPassword("123"); // Invalid: too short

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithValidCredentials_ShouldReturnOk() throws Exception {
        // First register a user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("loginuser");
        registerRequest.setEmail("loginuser@example.com");
        registerRequest.setPassword("password123");

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // Then login
        var loginRequest = new com.restaurantsaas.identity.dto.LoginRequest();
        loginRequest.setUsername("loginuser");
        loginRequest.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }
}
