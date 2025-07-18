package com.example.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.rental.entity.District;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {

    List<District> findByProvinceId(Long provinceId);
}
