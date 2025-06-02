package com.example.rental.services;

public interface IEmailService {
    String generateOtpCode();
    void sendVerificationEmail(String toEmail, String code);
}
