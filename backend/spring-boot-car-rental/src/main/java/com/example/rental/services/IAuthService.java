package com.example.rental.services;

import com.example.rental.dto.LoginRequest;
import com.example.rental.dto.LoginResponse;
import com.example.rental.dto.UserDto;
import com.example.rental.dto.RegisterRequest;

public interface IAuthService {
    UserDto register(RegisterRequest request);
    boolean verify(String email, String code);
    LoginResponse login(LoginRequest request);
}
