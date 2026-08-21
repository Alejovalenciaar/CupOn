package com.cupon.modules.restaurant.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.common.dto.PageResponse;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import com.cupon.modules.restaurant.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
@Tag(name = "Restaurantes", description = "Catálogo y gestión de restaurantes")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @GetMapping
    @Operation(summary = "Listar restaurantes aprobados (público)")
    public ResponseEntity<ApiResponse<PageResponse<RestaurantResponse>>> getAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(restaurantService.getApprovedRestaurants(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de un restaurante (público)")
    public ResponseEntity<ApiResponse<RestaurantResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(restaurantService.getRestaurantById(id)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Actualizar mi perfil de restaurante")
    public ResponseEntity<ApiResponse<RestaurantResponse>> updateMyRestaurant(
            Authentication authentication,
            @Valid @RequestBody UpdateRestaurantDto request) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                ApiResponse.success("Restaurante actualizado", restaurantService.updateMyRestaurant(email, request)));
    }
}
