package com.cupon.modules.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cupon.common.dto.ApiResponse;
import com.cupon.modules.auth.dto.AuthResponse;
import com.cupon.modules.auth.dto.ForgotPasswordRequest;
import com.cupon.modules.auth.dto.LoginRequest;
import com.cupon.modules.auth.dto.RegisterClientRequest;
import com.cupon.modules.auth.dto.RegisterRestaurantRequest;
import com.cupon.modules.auth.dto.ResetPasswordRequest;
import com.cupon.modules.auth.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de registro y login")
public class AuthController {

        private final AuthService authService;

        @PostMapping("/register/client")
        @Operation(summary = "Registrar un nuevo cliente")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Cliente registrado exitosamente"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos de registro inválidos"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "El correo ya está registrado")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> registerClient(
                        @Valid @RequestBody RegisterClientRequest request) {
                AuthResponse response = authService.registerClient(request);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Cliente registrado exitosamente", response));
        }

        @PostMapping("/register/restaurant")
        @Operation(summary = "Registrar un nuevo restaurante")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Restaurante registrado exitosamente (pendiente de aprobación)"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos de registro inválidos"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "El correo ya está registrado")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> registerRestaurant(
                        @Valid @RequestBody RegisterRestaurantRequest request) {
                AuthResponse response = authService.registerRestaurant(request);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.success(
                                                "Restaurante registrado exitosamente (pendiente de aprobación)",
                                                response));
        }

        @PostMapping("/login")
        @Operation(summary = "Iniciar sesión")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login exitoso"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos de login inválidos"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Credenciales inválidas o cuenta deshabilitada")
        })
        public ResponseEntity<ApiResponse<AuthResponse>> login(
                        @Valid @RequestBody LoginRequest request) {
                AuthResponse response = authService.login(request);
                return ResponseEntity.ok(ApiResponse.success("Login exitoso", response));
        }

        @PostMapping("/forgot-password")
        @Operation(summary = "Solicitar recuperación de contraseña")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Solicitud procesada: si el correo está registrado, se enviarán instrucciones"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Datos inválidos")
        })
        public ResponseEntity<ApiResponse<Void>> forgotPassword(
                        @Valid @RequestBody ForgotPasswordRequest request) {
                authService.forgotPassword(request);
                return ResponseEntity.ok(ApiResponse.success(
                                "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña",
                                null));
        }

        @PostMapping("/reset-password")
        @Operation(summary = "Restablecer contraseña mediante token")
        @ApiResponses({
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contraseña restablecida exitosamente"),
                        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Token inválido, expirado, ya utilizado o datos inválidos")
        })
        public ResponseEntity<ApiResponse<Void>> resetPassword(
                        @Valid @RequestBody ResetPasswordRequest request) {
                authService.resetPassword(request);
                return ResponseEntity.ok(ApiResponse.success("Contraseña restablecida exitosamente", null));
        }
}
