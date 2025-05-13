package com.example.rental.dto;

import lombok.Data;

@Data
public class VerificationRequest {
    private String email;
    private String code;
}
