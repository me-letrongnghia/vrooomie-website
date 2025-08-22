package com.example.rental.mapper;

import com.example.rental.dto.UserResponse;
import com.example.rental.dto.RegisterRequest;
import com.example.rental.entity.User;

public class UserMapper {

    public static UserResponse toDTO(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .birthDate(user.getBirthDate())
                .gender(user.getGender())
                .driverLicense(user.getDriverLicense())
                .driverLicenseExpiryDate(user.getDriverLicenseExpiryDate())
                .driverLicenseImage(user.getDriverLicenseImage())
                .email(user.getEmail())
                .role(user.getRole().name())
                .points(user.getPoints())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static User toEntity(RegisterRequest request, User.Role roleEncodedPassword) {
        return User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(request.getPassword()) // nên mã hóa trước khi gọi hàm này
                .role(roleEncodedPassword)
                .build();
    }
}

