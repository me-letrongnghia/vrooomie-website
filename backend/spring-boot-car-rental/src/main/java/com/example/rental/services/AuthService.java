package com.example.rental.services;

import com.example.rental.dto.LoginRequest;
import com.example.rental.dto.LoginResponse;
import com.example.rental.dto.UserDto;
import com.example.rental.dto.UserRegisterRequest;
import com.example.rental.entity.User;
import com.example.rental.mapper.UserMapper;
import com.example.rental.repository.UserRepository;
import com.example.rental.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public UserDto register(UserRegisterRequest request) {
//        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
//            throw new RuntimeException("Email already exists");
//        }
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.isEnabled()) {
                throw new RuntimeException("Email already exists");
            } else {
                // Cập nhật thông tin mới và gửi lại code xác thực
                existingUser.setFullName(request.getFullName());
                existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                existingUser.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
                existingUser.setVerificationCode(emailService.generateOtpCode());
                existingUser.setOtpGeneratedAt(LocalDateTime.now());
                existingUser.setOtpExpiry(LocalDateTime.now().plusMinutes(1));
                userRepository.save(existingUser);

                emailService.sendVerificationEmail(existingUser.getEmail(), existingUser.getVerificationCode());
                return UserMapper.toDTO(existingUser);
            }
        }

        String code = emailService.generateOtpCode();

        User.Role role = User.Role.valueOf(request.getRole().toUpperCase());
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(encodedPassword)
                .role(role)
                .enabled(false)
                .verificationCode(code)
                .otpGeneratedAt(LocalDateTime.now())
                .otpExpiry(LocalDateTime.now().plusMinutes(1))
                .build();

        User savedUser = userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), code);

        return UserMapper.toDTO(savedUser);
    }

    public boolean verify(String email, String code) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Kiểm tra mã và thời gian
            if (user.getVerificationCode().equals(code)) {
                if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now())) {
                    throw new RuntimeException("Verification code has expired");
                }

                user.setEnabled(true);
                user.setVerificationCode(null);
                user.setOtpGeneratedAt(null);
                user.setOtpExpiry(null);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Account not verified. Please check your email.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user);

        return new LoginResponse(token);
    }
}
