package com.example.rental.services;

import com.example.rental.dto.*;

public interface IAuthService {
    UserResponse register(RegisterRequest request);
    boolean verify(String email, String code);
    LoginResponse login(LoginRequest request);
    RefreshAccessTokenResponse refreshAccessToken(RefreshAccessTokenRequest request);
}
