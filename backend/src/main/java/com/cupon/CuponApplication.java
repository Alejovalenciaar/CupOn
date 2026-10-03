package com.cupon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CuponApplication {

    public static void main(String[] args) {
        SpringApplication.run(CuponApplication.class, args);
    }

}
