package com.example.rental.services;

import com.example.rental.entity.User;
import org.springframework.security.oauth2.core.user.OAuth2User;

public interface IOAuth2UserService {
    User processOAuth2User(OAuth2User oAuth2User, String registrationId);
}
