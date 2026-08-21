package com.cupon.modules.promotion.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
@Tag(name = "Promociones", description = "Gestión de promociones y favoritos")
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    @Operation(summary = "Listar promociones activas (público)")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getAll(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getActivePromotions(search, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de una promoción (público)")
    public ResponseEntity<ApiResponse<PromotionResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getPromotionById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Crear una promoción (restaurante)")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CreatePromotionRequest request) {
        String email = authentication.getName();
        PromotionResponse response = promotionService.createPromotion(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Promoción creada exitosamente", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Actualizar una promoción (restaurante)")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody CreatePromotionRequest request) {
        String email = authentication.getName();
        PromotionResponse response = promotionService.updatePromotion(email, id, request);
        return ResponseEntity.ok(ApiResponse.success("Promoción actualizada", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Eliminar una promoción (restaurante)")
    public ResponseEntity<ApiResponse<Void>> delete(
            Authentication authentication,
            @PathVariable UUID id) {
        String email = authentication.getName();
        promotionService.deletePromotion(email, id);
        return ResponseEntity.ok(ApiResponse.success("Promoción eliminada", null));
    }

    @PostMapping("/{id}/favorite")
    @PreAuthorize("hasAuthority('ROLE_CLIENTE')")
    @Operation(summary = "Marcar/desmarcar como favorito (cliente)")
    public ResponseEntity<ApiResponse<Void>> toggleFavorite(
            Authentication authentication,
            @PathVariable UUID id) {
        String email = authentication.getName();
        promotionService.toggleFavorite(email, id);
        return ResponseEntity.ok(ApiResponse.success("Favorito actualizado", null));
    }

    @GetMapping("/favorites")
    @PreAuthorize("hasAuthority('ROLE_CLIENTE')")
    @Operation(summary = "Listar mis promociones favoritas (cliente)")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getMyFavorites(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        String email = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(promotionService.getMyFavorites(email, pageable)));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Listar mis promociones (restaurante)")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getMyPromotions(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        String email = authentication.getName();
        return ResponseEntity.ok(ApiResponse.success(promotionService.getMyPromotions(email, pageable)));
    }
}
