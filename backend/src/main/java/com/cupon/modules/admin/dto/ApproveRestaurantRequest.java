package com.cupon.modules.admin.dto;

import jakarta.validation.constraints.NotNull;

public record ApproveRestaurantRequest(
        @NotNull(message = "El campo 'approved' es obligatorio")
        Boolean approved,

        String rejectionReason
) {
}
