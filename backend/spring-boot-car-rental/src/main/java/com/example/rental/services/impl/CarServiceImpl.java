package com.example.rental.services.impl;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarResponse;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;
import com.example.rental.mapper.CarMapper;
import com.example.rental.repository.CarRepository;
import com.example.rental.services.ICarService;
import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarServiceImpl implements ICarService {

    private final CarRepository carRepository;

    @Cacheable(value = "allCars")
    public List<CarResponse> getAllCars() {
        System.out.println("Fetching cars from database...");
        return carRepository.findAll().stream()
                .map(CarMapper::toDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "carById", key = "#id")
    public CarResponse getCarById(Long id) {
        System.out.println("Fetching car by id from database...");
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Car not found"));
        return CarMapper.toDto(car);
    }

    @CacheEvict(value = {"allCars", "carById", "carsByOwner"}, allEntries = true)
    public CarResponse createCar(CarRequest request, User owner) {
        Car car = CarMapper.toEntity(request, owner);
        Car saved = carRepository.save(car);
        return CarMapper.toDto(saved);
    }

    @CacheEvict(value = {"allCars", "carById", "carsByOwner"}, allEntries = true)
    public CarResponse updateCar(Long id, CarResponse carDto) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Car not found"));
        // Cập nhật các field cần thiết từ DTO
        car.setBrand(carDto.getBrand());
        car.setModel(carDto.getModel());
        car.setLicensePlate(carDto.getLicensePlate());
        car.setType(carDto.getType());
        car.setPricePerDay(carDto.getPricePerDay());
        car.setStatus(Car.CarStatus.valueOf(carDto.getStatus()));
        car.setImageUrl(carDto.getImageUrl());
        car.setDescription(carDto.getDescription());

        return CarMapper.toDto(carRepository.save(car));
    }

    @CacheEvict(value = {"allCars", "carById", "carsByOwner"}, allEntries = true)
    public void deleteCar(Long id) {
        if (!carRepository.existsById(id)) {
            throw new RuntimeException("Car not found");
        }
        carRepository.deleteById(id);
    }

    @Override
    @Cacheable(value = "carsByOwner", key = "#ownerId")
    public List<CarResponse> getCarsByOwnerId(Long ownerId) {
        System.out.println("Fetching cars by owner from database...");
        return carRepository.findByOwnerId(ownerId).stream()
                .map(CarMapper::toDto)
                .collect(Collectors.toList());
    }
}

