package com.example.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String fullName;
    private String email;
    private String role;
}
