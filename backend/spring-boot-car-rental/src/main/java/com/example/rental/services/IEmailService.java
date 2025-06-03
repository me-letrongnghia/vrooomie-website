package com.example.rental.services;

import com.example.rental.entity.Booking;
import com.example.rental.entity.User;

public interface IEmailService {
    String generateOtpCode();
    void sendVerificationEmail(String toEmail, String code);
    void sendBookingStatusNotification(User recipient, Booking booking, String subject, String message);
    void sendHtmlEmail(String to, String subject, String htmlContent);
}
