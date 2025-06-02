package com.example.rental.services;

import com.example.rental.dto.CarDto;
import com.example.rental.dto.CarRequest;
import com.example.rental.entity.User;

import java.util.List;

public interface ICarService {
    List<CarDto> getAllCars();
    CarDto getCarById(Long id);
    CarDto createCar(CarRequest request, User owner);
    CarDto updateCar(Long id, CarDto carDto);
    void deleteCar(Long id);
}
