package com.restaurantsaas.identity.service;

import com.restaurantsaas.identity.dto.RegisterRequest;
import com.restaurantsaas.identity.dto.UserResponse;
import com.restaurantsaas.identity.entity.Role;
import com.restaurantsaas.identity.entity.User;
import com.restaurantsaas.identity.exception.RoleNotFoundException;
import com.restaurantsaas.identity.exception.UserAlreadyExistsException;
import com.restaurantsaas.identity.exception.UserNotFoundException;
import com.restaurantsaas.identity.repository.RoleRepository;
import com.restaurantsaas.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();

        // Assign default role: STORE_OWNER
        Role storeOwnerRole = roleRepository.findByName("STORE_OWNER")
                .orElseThrow(() -> new RoleNotFoundException("STORE_OWNER role not found"));
        
        Set<Role> roles = new HashSet<>();
        roles.add(storeOwnerRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    /**
     * Staff self-registration: WAITER role only (no store). Owner assigns this user to a store in catalog.
     */
    @Transactional
    public User registerWaiter(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();

        Role waiterRole = roleRepository.findByName("WAITER")
                .orElseThrow(() -> new RoleNotFoundException("WAITER role not found"));

        Set<Role> roles = new HashSet<>();
        roles.add(waiterRole);
        user.setRoles(roles);

        return userRepository.save(user);
    }

    public UserResponse getUserById(java.util.UUID userId) {
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
        
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
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
    }

    public boolean existsById(java.util.UUID userId) {
        return userRepository.existsById(Objects.requireNonNull(userId));
    }

    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return userRepository
                .findTop10ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query.trim(), query.trim())
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .isActive(user.getIsActive())
                        .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                        .build())
                .collect(Collectors.toList());
    }
}
