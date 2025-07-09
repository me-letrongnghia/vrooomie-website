package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RefreshAccessTokenResponse {
    private String newAccessToken;
}
