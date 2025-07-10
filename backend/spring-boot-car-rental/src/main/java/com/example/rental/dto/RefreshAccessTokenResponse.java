package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RefreshAccessTokenResponse {
    private String accessToken;
    private String refreshToken;
    private String email;
    private String fullName;
}
