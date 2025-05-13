package com.example.rental.controller;

import com.example.rental.dto.*;
import com.example.rental.entity.User;
import com.example.rental.mapper.UserMapper;
import com.example.rental.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody @Valid UserRegisterRequest request) {
        return  ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyAccount(@RequestBody VerificationRequest request) {
        boolean verified = authService.verify(request.getEmail(), request.getCode());
        if (verified) {
            return ResponseEntity.ok(Map.of("message", "Account verified successfully"));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Invalid code or email"));
    }


    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal User user) {
        return UserMapper.toDTO(user);
    }
}
