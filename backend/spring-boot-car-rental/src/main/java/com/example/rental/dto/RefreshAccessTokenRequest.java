package com.example.rental.dto;

import lombok.Data;

@Data
public class RefreshAccessTokenRequest {
    private String refreshToken;
}
