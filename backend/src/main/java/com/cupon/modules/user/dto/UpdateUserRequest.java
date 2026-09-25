package com.cupon.modules.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
                @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres") String firstName,

                @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres") String lastName,

                @Pattern(regexp = "^[0-9+()\\-\\s]{7,20}$", message = "El formato del teléfono no es válido") String phoneNumber) {
}
