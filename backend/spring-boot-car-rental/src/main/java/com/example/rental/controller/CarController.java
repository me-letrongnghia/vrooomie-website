package com.example.rental.controller;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarDto;
import com.example.rental.entity.User;
import com.example.rental.services.ICarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final ICarService iCarService;

    @GetMapping
    public List<CarDto> getAllCars() {
        return iCarService.getAllCars();
    }

    @GetMapping("/{id}")
    public CarDto getCarById(@PathVariable Long id) {
        return iCarService.getCarById(id);
    }

    @PostMapping("/create")
    public CarDto createCar(@RequestBody CarRequest request, @AuthenticationPrincipal User owner) {
        return iCarService.createCar(request, owner);
    }

    @PutMapping("/{id}")
    public CarDto updateCar(@PathVariable Long id, @RequestBody CarDto carDto) {
        return iCarService.updateCar(id, carDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        iCarService.deleteCar(id);
        return ResponseEntity.noContent().build();
    }
}

