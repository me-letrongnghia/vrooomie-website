package com.example.rental.services.impl;

import com.example.rental.entity.User;
import com.example.rental.repository.UserRepository;
import com.example.rental.services.IOAuth2UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2UserServiceImpl implements IOAuth2UserService {

    private final UserRepository userRepository;
    
    @Value("${app.oauth2.default-user-role}")
    private String defaultUserRole;
    
    // Email domains that might indicate car owner potential
    private final List<String> businessDomains = Arrays.asList(
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com"
    );

    @Override
    public User processOAuth2User(OAuth2User oAuth2User, String registrationId) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub") != null ? 
            oAuth2User.getAttribute("sub") : oAuth2User.getAttribute("id");

        log.info("Processing OAuth2 user: email={}, provider={}", email, registrationId);

        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update provider info if user exists
            if (user.getProvider() == null || "LOCAL".equals(user.getProvider())) {
                user.setProvider(registrationId.toUpperCase());
                user.setProviderId(providerId);
                log.info("Updated existing user {} with OAuth2 provider info", email);
                return userRepository.save(user);
            }
            return user;
        } else {
            // Determine appropriate role for new user
            User.Role assignedRole = determineUserRole(email, name);
            
            // Create new user
            User newUser = User.builder()
                .email(email)
                .fullName(name)
                .provider(registrationId.toUpperCase())
                .providerId(providerId)
                .enabled(true) // OAuth users are automatically verified
                .role(assignedRole)
                .build();
            
            log.info("Created new OAuth2 user: email={}, role={}", email, assignedRole);
            return userRepository.save(newUser);
        }
    }
    
    private User.Role determineUserRole(String email, String name) {
        try {
            // Use configured default role
            User.Role defaultRole = User.Role.valueOf(defaultUserRole.toUpperCase());
            
            // Add intelligent role detection logic here
            // For now, just use the configured default
            // Future enhancements could include:
            // - Checking email domain for business indicators
            // - Analyzing user profile information
            // - Implementing role selection flow for OAuth2 users
            
            return defaultRole;
        } catch (IllegalArgumentException e) {
            log.warn("Invalid default user role configured: {}. Using RENTER as fallback.", defaultUserRole);
            return User.Role.RENTER;
        }
    }
}
