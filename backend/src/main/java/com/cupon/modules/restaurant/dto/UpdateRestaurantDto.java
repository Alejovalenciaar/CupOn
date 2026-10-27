package com.cupon.modules.restaurant.dto;

import jakarta.validation.constraints.Size;

public record UpdateRestaurantDto(
                @Size(min = 2, max = 200, message = "El nombre del negocio debe tener entre 2 y 200 caracteres") String businessName,

                String description,

                @Size(max = 100, message = "El tipo de cocina no puede exceder los 100 caracteres") String cuisineType,

                @Size(max = 500) String address,

                @Size(max = 500) String logoUrl,

                @Size(max = 20) String phoneNumber) {
}
