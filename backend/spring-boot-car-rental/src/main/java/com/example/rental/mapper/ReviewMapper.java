package com.example.rental.mapper;

import com.example.rental.dto.ReviewResponse;
import com.example.rental.entity.Car;
import com.example.rental.entity.Review;
import com.example.rental.entity.User;

public class ReviewMapper {

    public static ReviewResponse toDto(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .carId(review.getCar().getId())
                .renterId(review.getRenter().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .build();
    }

    public static Review toEntity(ReviewResponse dto, Car car, User renter) {
        return Review.builder()
                .car(car)
                .renter(renter)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();
    }
}

