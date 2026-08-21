package com.cupon.modules.admin.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.common.dto.PageResponse;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.admin.service.AdminService;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Administración", description = "Panel de administración del sistema")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/restaurants/pending")
    @Operation(summary = "Listar restaurantes pendientes de aprobación")
    public ResponseEntity<ApiResponse<PageResponse<RestaurantResponse>>> getPendingRestaurants(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingRestaurants(pageable)));
    }

    @PutMapping("/restaurants/{id}/approve")
    @Operation(summary = "Aprobar o rechazar un restaurante")
    public ResponseEntity<ApiResponse<Void>> approveRestaurant(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveRestaurantRequest request) {
        adminService.approveOrRejectRestaurant(id, request);
        String message = request.approved() ? "Restaurante aprobado" : "Restaurante rechazado";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @PutMapping("/users/{id}/suspend")
    @Operation(summary = "Suspender o reactivar una cuenta de usuario")
    public ResponseEntity<ApiResponse<Void>> suspendUser(@PathVariable UUID id) {
        adminService.suspendUser(id);
        return ResponseEntity.ok(ApiResponse.success("Estado de cuenta actualizado", null));
    }

    @DeleteMapping("/promotions/{id}")
    @Operation(summary = "Eliminar una promoción (moderación)")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable UUID id) {
        adminService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Promoción eliminada por moderación", null));
    }

    @GetMapping("/metrics")
    @Operation(summary = "Obtener métricas del sistema")
    public ResponseEntity<ApiResponse<SystemMetricsResponse>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getSystemMetrics()));
    }
}
