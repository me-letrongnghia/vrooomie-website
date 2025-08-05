package com.example.rental.mapper;

import com.example.rental.dto.UserDto;
import com.example.rental.dto.RegisterRequest;
import com.example.rental.entity.User;

public class UserMapper {

    public static UserDto toDTO(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
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

