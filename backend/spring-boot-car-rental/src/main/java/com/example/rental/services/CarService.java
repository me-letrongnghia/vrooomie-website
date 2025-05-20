package com.example.rental.services;

import com.example.rental.dto.CarCreateRequest;
import com.example.rental.dto.CarDto;
import com.example.rental.entity.Car;
import com.example.rental.entity.User;
import com.example.rental.mapper.CarMapper;
import com.example.rental.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;

    public List<CarDto> getAllCars() {
        return carRepository.findAll().stream()
                .map(CarMapper::toDto)
                .collect(Collectors.toList());
    }

    public CarDto getCarById(Long id) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Car not found"));
        return CarMapper.toDto(car);
    }

    public CarDto createCar(CarCreateRequest request, User owner) {
        Car car = CarMapper.toEntity(request, owner);
        Car saved = carRepository.save(car);
        return CarMapper.toDto(saved);
    }

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

    public void deleteCar(Long id) {
        if (!carRepository.existsById(id)) {
            throw new RuntimeException("Car not found");
        }
        carRepository.deleteById(id);
    }
}

