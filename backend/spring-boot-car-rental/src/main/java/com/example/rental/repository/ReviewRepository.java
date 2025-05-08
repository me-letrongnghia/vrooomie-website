package com.example.rental.repository;

import com.example.rental.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByCarId(Long carId);
    List<Review> findByRenterId(Long renterId);
}

