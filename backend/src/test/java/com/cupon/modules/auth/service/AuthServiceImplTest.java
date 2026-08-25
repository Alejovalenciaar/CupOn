package com.cupon.modules.auth.service;

import com.cupon.common.exception.DuplicateResourceException;
import com.cupon.modules.auth.dto.AuthResponse;
import com.cupon.modules.auth.dto.LoginRequest;
import com.cupon.modules.auth.dto.RegisterClientRequest;
import com.cupon.modules.auth.dto.RegisterRestaurantRequest;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientProfileRepository clientProfileRepository;

    @Mock
    private RestaurantProfileRepository restaurantProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void registerClient_conCorreoNuevo_creaUsuarioYDevuelveToken() {
        RegisterClientRequest request = new RegisterClientRequest(
                "nuevo@cupon.com", "password123", "Ana", "Perez");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hashed");
        when(jwtService.generateToken(request.email(), Role.ROLE_CLIENTE.name())).thenReturn("token-123");

        AuthResponse response = authService.registerClient(request);

        assertThat(response.token()).isEqualTo("token-123");
        assertThat(response.email()).isEqualTo(request.email());
        assertThat(response.role()).isEqualTo(Role.ROLE_CLIENTE.name());
        verify(userRepository).save(any(User.class));
        verify(clientProfileRepository).save(any());
    }

    @Test
    void registerClient_conCorreoExistente_lanzaDuplicateResourceException() {
        RegisterClientRequest request = new RegisterClientRequest(
                "existente@cupon.com", "password123", "Ana", "Perez");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerClient(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(userRepository, never()).save(any());
        verify(clientProfileRepository, never()).save(any());
    }

    @Test
    void registerRestaurant_conCorreoNuevo_creaPerfilYDevuelveToken() {
        RegisterRestaurantRequest request = new RegisterRestaurantRequest(
                "resto@cupon.com", "password123", "Carlos", "Gomez",
                "Pizza Feliz", "La mejor pizza", "Calle 123");

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("hashed");
        when(jwtService.generateToken(request.email(), Role.ROLE_RESTAURANTE.name())).thenReturn("token-456");

        AuthResponse response = authService.registerRestaurant(request);

        assertThat(response.token()).isEqualTo("token-456");
        assertThat(response.role()).isEqualTo(Role.ROLE_RESTAURANTE.name());
        verify(restaurantProfileRepository).save(any());
    }

    @Test
    void registerRestaurant_conCorreoExistente_lanzaDuplicateResourceException() {
        RegisterRestaurantRequest request = new RegisterRestaurantRequest(
                "resto@cupon.com", "password123", "Carlos", "Gomez",
                "Pizza Feliz", "La mejor pizza", "Calle 123");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.registerRestaurant(request))
                .isInstanceOf(DuplicateResourceException.class);

        verify(restaurantProfileRepository, never()).save(any());
    }

    @Test
    void login_conCredencialesValidas_devuelveToken() {
        LoginRequest request = new LoginRequest("user@cupon.com", "password123");
        User user = User.builder()
                .email(request.email())
                .password("hashed")
                .firstName("Ana")
                .lastName("Perez")
                .role(Role.ROLE_CLIENTE)
                .enabled(true)
                .build();

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(true);
        when(jwtService.generateToken(user.getEmail(), user.getRole().name())).thenReturn("token-789");

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("token-789");
        assertThat(response.email()).isEqualTo(user.getEmail());
    }

    @Test
    void login_conUsuarioInexistente_lanzaBadCredentialsException() {
        LoginRequest request = new LoginRequest("noexiste@cupon.com", "password123");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_conPasswordIncorrecta_lanzaBadCredentialsException() {
        LoginRequest request = new LoginRequest("user@cupon.com", "wrongpassword");
        User user = User.builder()
                .email(request.email())
                .password("hashed")
                .role(Role.ROLE_CLIENTE)
                .enabled(true)
                .build();

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_conCuentaDeshabilitada_lanzaBadCredentialsException() {
        LoginRequest request = new LoginRequest("user@cupon.com", "password123");
        User user = User.builder()
                .email(request.email())
                .password("hashed")
                .role(Role.ROLE_CLIENTE)
                .enabled(false)
                .build();

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(jwtService, never()).generateToken(anyString(), anyString());
    }
}
