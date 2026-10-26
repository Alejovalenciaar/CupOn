package com.cupon.modules.promotion.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categorías", description = "Categorías de promociones")
public class CategoryController {

        private final PromotionService promotionService;

        @GetMapping
        @Operation(summary = "Listar categorías (público)")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Listado obtenido exitosamente")
        })
        public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAll() {
                return ResponseEntity.ok(ApiResponse.success(promotionService.getCategories()));
        }
}
