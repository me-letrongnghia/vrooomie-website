package com.example.rental.services;

public interface EmailService {
    String generateOtpCode();
    void sendVerificationEmail(String toEmail, String code);
}
