package com.example.rental.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.rental.entity.Province;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Long> {

}
