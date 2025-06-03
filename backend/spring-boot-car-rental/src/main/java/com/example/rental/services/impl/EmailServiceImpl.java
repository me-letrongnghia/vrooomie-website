package com.example.rental.services.impl;

import com.example.rental.entity.Booking;
import com.example.rental.entity.User;
import com.example.rental.services.IEmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    public String generateOtpCode() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // Tạo số từ 100000 đến 999999
        return String.valueOf(otp);
    }

    public void sendVerificationEmail(String toEmail, String code) {
        String verifyUrl = "http://localhost:8080/api/auth/verify?email=" + toEmail + "&code=" + code;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Email Verification");
        message.setText("Click the following link to verify your email:\n" + verifyUrl);
        mailSender.send(message);
    }

    @Override
    public void sendBookingStatusNotification(User recipient, Booking booking, String subject, String message) {
        String content = String.format("""
        <p>Xin chào %s,</p>
        <p>%s</p>
        <p><strong>Thông tin xe:</strong> %s - %s</p>
        <p><strong>Thời gian:</strong> %s đến %s</p>
        <p>Trạng thái hiện tại: <strong>%s</strong></p>
    """,
                recipient.getFullName(),
                message,
                booking.getCar().getBrand(),
                booking.getCar().getModel(),
                booking.getStartDate(),
                booking.getEndDate(),
                booking.getStatus()
        );

        sendHtmlEmail(recipient.getEmail(), subject, content);
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = gửi HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
