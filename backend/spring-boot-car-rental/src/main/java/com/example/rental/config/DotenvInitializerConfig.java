package com.example.rental.config;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DotenvInitializerConfig {
    @PostConstruct
    public void init() {
        Dotenv dotenv = Dotenv.configure()
                              .filename("local.env")
                              .ignoreIfMissing()
                              .load();
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });
    }
}