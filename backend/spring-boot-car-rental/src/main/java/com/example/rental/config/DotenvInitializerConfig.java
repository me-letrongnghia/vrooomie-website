package com.example.rental.config;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DotenvInitializerConfig {
    @PostConstruct
    public void init() {
        Dotenv dotenv = Dotenv.configure()
                              .directory("./backend/spring-boot-car-rental/")
                              .filename("local-car-rental.env")
                              .ignoreIfMissing()
                              .load();
        
        System.out.println("=== Loading Environment Variables ===");
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
            System.out.println("Loaded: " + entry.getKey() + " = " + 
                (entry.getKey().contains("PASSWORD") || entry.getKey().contains("SECRET") 
                    ? "***" : entry.getValue()));
        });
        System.out.println("=== Environment Variables Loaded ===");
    }
}