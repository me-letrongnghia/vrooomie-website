package com.example.rental.mapper;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarResponse;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;

public class CarMapper {

    public static CarResponse toDto(Car car) {
        return CarResponse.builder()
                .id(car.getId())
                .ownerId(car.getOwner().getId())
                .brand(car.getBrand())
                .model(car.getModel())
                .licensePlate(car.getLicensePlate())
                .type(car.getType())
                .pricePerDay(car.getPricePerDay())
                .status(car.getStatus().name())
                .imageUrl(car.getImageUrl())
                .address(car.getAddress())
                .description(car.getDescription())
                .build();
    }

    public static Car toEntity(CarRequest req, User owner) {
        return Car.builder()
                .owner(owner)
                .brand(req.getBrand())
                .model(req.getModel())
                .licensePlate(req.getLicensePlate())
                .type(req.getType())
                .pricePerDay(req.getPricePerDay())
                .status(Car.CarStatus.AVAILABLE)
                .imageUrl(req.getImageUrl())
                .address(req.getAddress())
                .description(req.getDescription())
                .build();
    }
}

