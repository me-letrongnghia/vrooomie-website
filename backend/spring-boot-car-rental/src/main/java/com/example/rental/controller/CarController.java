package com.example.rental.controller;

import com.example.rental.dto.CarRequest;
import com.example.rental.dto.CarResponse;
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
    public List<CarResponse> getAllCars() {
        return iCarService.getAllCars();
    }

    @GetMapping("/{id}")
    public CarResponse getCarById(@PathVariable Long id) {
        return iCarService.getCarById(id);
    }

    @GetMapping("/owner/{ownerId}")
    public List<CarResponse> getCarsByOwnerId(@PathVariable Long ownerId) {
        return iCarService.getCarsByOwnerId(ownerId);
    }

    @PostMapping("/create")
    public CarResponse createCar(@RequestBody CarRequest request, @AuthenticationPrincipal User owner) {
        return iCarService.createCar(request, owner);
    }

    @PutMapping("/{id}")
    public CarResponse updateCar(@PathVariable Long id, @RequestBody CarResponse carDto) {
        return iCarService.updateCar(id, carDto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        iCarService.deleteCar(id);
        return ResponseEntity.noContent().build();
    }
}

