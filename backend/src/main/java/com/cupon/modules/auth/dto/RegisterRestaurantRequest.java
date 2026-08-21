package com.cupon.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRestaurantRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo debe tener un formato válido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100)
        String firstName,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = 2, max = 100)
        String lastName,

        @NotBlank(message = "El nombre del negocio es obligatorio")
        @Size(min = 2, max = 200)
        String businessName,

        String description,

        @NotBlank(message = "La dirección es obligatoria")
        @Size(max = 500)
        String address
) {
}
