package com.example.rental.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.rental.entity.District;
import com.example.rental.entity.Province;
import com.example.rental.entity.Ward;
import com.example.rental.repository.DistrictRepository;
import com.example.rental.repository.ProvinceRepository;
import com.example.rental.repository.WardRepository;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AddressController {

    @Autowired
    private ProvinceRepository provinceRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private WardRepository wardRepository;

    @GetMapping("/provinces")
    public List<Province> getAllProvinces() {
        return provinceRepository.findAll();
    }

    @GetMapping("/districts")
    public List<District> getDistricts(@RequestParam Long provinceId) {
        return districtRepository.findByProvinceId(provinceId);
    }

    @GetMapping("/wards")
    public List<Ward> getWards(@RequestParam Long districtId) {
        return wardRepository.findByDistrictId(districtId);
    }      
}
