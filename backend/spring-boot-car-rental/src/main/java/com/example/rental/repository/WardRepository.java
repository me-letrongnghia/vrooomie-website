package com.example.rental.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.rental.entity.Ward;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {

    List<Ward> findByDistrictId(Long districtId);
}
