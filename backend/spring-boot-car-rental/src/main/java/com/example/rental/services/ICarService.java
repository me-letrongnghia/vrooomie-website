package com.example.rental.services;

import com.example.rental.dto.CarResponse;
import com.example.rental.dto.CarRequest;
import com.example.rental.entity.User;

import java.util.List;

public interface ICarService {
    List<CarResponse> getAllCars();
    CarResponse getCarById(Long id);
    List<CarResponse> getCarsByOwnerId(Long ownerId);
    CarResponse createCar(CarRequest request, User owner);
    CarResponse updateCar(Long id, CarResponse carDto);
    void deleteCar(Long id);
}
