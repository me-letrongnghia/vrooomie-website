package com.example.rental.services.impl;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarDto;
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

    @Cacheable(value = "cars")
    public List<CarDto> getAllCars() {
        System.out.println("Fetching cars from database...");
        return carRepository.findAll().stream()
                .map(CarMapper::toDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "cars", key = "#id")
    public CarDto getCarById(Long id) {
        System.out.println("Fetching car by id from database...");
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Car not found"));
        return CarMapper.toDto(car);
    }

    @CacheEvict(value = "cars", allEntries = true)
    public CarDto createCar(CarRequest request, User owner) {
        Car car = CarMapper.toEntity(request, owner);
        Car saved = carRepository.save(car);
        return CarMapper.toDto(saved);
    }

    @CacheEvict(value = "cars", allEntries = true)
    public CarDto updateCar(Long id, CarDto carDto) {
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

    @CacheEvict(value = "cars", allEntries = true)
    public void deleteCar(Long id) {
        if (!carRepository.existsById(id)) {
            throw new RuntimeException("Car not found");
        }
        carRepository.deleteById(id);
    }
}

