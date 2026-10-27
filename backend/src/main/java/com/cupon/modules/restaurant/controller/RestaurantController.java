package com.cupon.modules.restaurant.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.common.dto.PageResponse;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import com.cupon.modules.restaurant.service.RestaurantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
import org.springframework.web.bind.annotation.RequestParam;
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
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listado obtenido exitosamente")
        })
        public ResponseEntity<ApiResponse<PageResponse<RestaurantResponse>>> getAll(
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) String cuisineType,
                        @PageableDefault(size = 20) Pageable pageable) {
                return ResponseEntity.ok(ApiResponse.success(
                                restaurantService.getApprovedRestaurants(search, cuisineType, pageable)));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Obtener detalle de un restaurante (público)")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Restaurante encontrado"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Restaurante no encontrado")
        })
        public ResponseEntity<ApiResponse<RestaurantResponse>> getById(@PathVariable UUID id) {
                return ResponseEntity.ok(ApiResponse.success(restaurantService.getRestaurantById(id)));
        }

        @GetMapping("/me")
        @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
        @Operation(summary = "Obtener mi perfil de restaurante autenticado")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Perfil de restaurante obtenido"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "No autenticado"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "El usuario no tiene rol de restaurante"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Perfil de restaurante no encontrado")
        })
        public ResponseEntity<ApiResponse<RestaurantResponse>> getMyRestaurant(Authentication authentication) {
                String email = authentication.getName();
                return ResponseEntity.ok(ApiResponse.success(restaurantService.getMyRestaurant(email)));
        }

        @PutMapping("/me")
        @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
        @Operation(summary = "Actualizar mi perfil de restaurante")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Restaurante actualizado"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "No autenticado"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "El usuario no tiene rol de restaurante"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Perfil de restaurante no encontrado")
        })
        public ResponseEntity<ApiResponse<RestaurantResponse>> updateMyRestaurant(
                        Authentication authentication,
                        @Valid @RequestBody UpdateRestaurantDto request) {
                String email = authentication.getName();
                return ResponseEntity.ok(
                                ApiResponse.success("Restaurante actualizado",
                                                restaurantService.updateMyRestaurant(email, request)));
        }
}
