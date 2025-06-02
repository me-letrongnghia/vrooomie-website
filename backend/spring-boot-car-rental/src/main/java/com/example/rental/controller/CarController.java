package com.example.rental.controller;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarDto;
import com.example.rental.entity.User;
import com.example.rental.services.impl.CarServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarServiceImpl carServiceImpl;

    @GetMapping
    public List<CarDto> getAllCars() {
        return carServiceImpl.getAllCars();
    }

    @GetMapping("/{id}")
    public CarDto getCarById(@PathVariable Long id) {
        return carServiceImpl.getCarById(id);
    }

    @PostMapping("/create")
    public CarDto createCar(@RequestBody CarRequest request, @AuthenticationPrincipal User owner) {
        return carServiceImpl.createCar(request, owner);
    }

    @PutMapping("/{id}")
    public CarDto updateCar(@PathVariable Long id, @RequestBody CarDto carDto) {
        return carServiceImpl.updateCar(id, carDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        carServiceImpl.deleteCar(id);
        return ResponseEntity.noContent().build();
    }
}

