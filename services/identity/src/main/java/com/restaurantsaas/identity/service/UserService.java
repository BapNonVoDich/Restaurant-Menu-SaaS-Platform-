package com.restaurantsaas.identity.service;

import com.restaurantsaas.identity.dto.RegisterRequest;
import com.restaurantsaas.identity.dto.UserResponse;
import com.restaurantsaas.identity.entity.Role;
import com.restaurantsaas.identity.entity.User;
import com.restaurantsaas.identity.repository.RoleRepository;
import com.restaurantsaas.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();

        // Assign default role: STORE_OWNER
        Role storeOwnerRole = roleRepository.findByName("STORE_OWNER")
                .orElseThrow(() -> new RuntimeException("STORE_OWNER role not found"));
        
        Set<Role> roles = new HashSet<>();
        roles.add(storeOwnerRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    public UserResponse getUserById(java.util.UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .isActive(user.getIsActive())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .build();
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
