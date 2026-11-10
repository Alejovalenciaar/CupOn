package com.cupon.modules.restaurant.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import com.cupon.modules.restaurant.entity.FavoriteRestaurant;
import com.cupon.modules.restaurant.mapper.RestaurantMapper;
import com.cupon.modules.restaurant.repository.FavoriteRestaurantRepository;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceImplTest {

    @Mock
    private RestaurantProfileRepository restaurantProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FavoriteRestaurantRepository favoriteRestaurantRepository;

    @Mock
    private RestaurantMapper restaurantMapper;

    @InjectMocks
    private RestaurantServiceImpl restaurantService;

    private final String userEmail = "resto@cupon.com";

    // ─── helpers ────────────────────────────────────────────────────────────

    private User buildUser() {
        User user = User.builder().email(userEmail).build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private RestaurantProfile buildProfile(User owner, ApprovalStatus status) {
        RestaurantProfile profile = RestaurantProfile.builder()
                .user(owner)
                .businessName("Sushi House")
                .description("Sushi fresco")
                .cuisineType("Japonesa")
                .address("Carrera 15 # 90-45")
                .phoneNumber("3009876543")
                .approvalStatus(status)
                .build();
        profile.setId(UUID.randomUUID());
        return profile;
    }

    private RestaurantResponse buildResponse(RestaurantProfile profile) {
        return new RestaurantResponse(
                profile.getId(), profile.getBusinessName(), profile.getDescription(),
                profile.getCuisineType(),
                profile.getAddress(), profile.getLatitude(), profile.getLongitude(),
                null, profile.getPhoneNumber(),
                profile.getApprovalStatus(),
                profile.getUser().getId(), profile.getUser().isEnabled(),
                profile.getUser().getEmail(), LocalDateTime.now());
    }

    // ─── getApprovedRestaurants ─────────────────────────────────────────────

    @Test
    void getApprovedRestaurants_hayAprobados_devuelveLista() {
        Pageable pageable = PageRequest.of(0, 20);
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        RestaurantResponse response = buildResponse(profile);

        Page<RestaurantProfile> page = new PageImpl<>(List.of(profile), pageable, 1);
        when(restaurantProfileRepository.findApprovedWithFilters(ApprovalStatus.APPROVED, null, null, pageable))
                .thenReturn(page);
        when(restaurantMapper.toResponse(profile)).thenReturn(response);

        PageResponse<RestaurantResponse> result = restaurantService.getApprovedRestaurants(null, null, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).approvalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(result.totalElements()).isEqualTo(1);
    }

    @Test
    void getApprovedRestaurants_sinAprobados_devuelveListaVacia() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<RestaurantProfile> page = new PageImpl<>(List.of(), pageable, 0);
        when(restaurantProfileRepository.findApprovedWithFilters(ApprovalStatus.APPROVED, null, null, pageable))
                .thenReturn(page);

        PageResponse<RestaurantResponse> result = restaurantService.getApprovedRestaurants(null, null, pageable);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }

    @Test
    void getApprovedRestaurants_conFiltros_pasaFiltrosLimpiosARepositorio() {
        Pageable pageable = PageRequest.of(0, 20);
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        RestaurantResponse response = buildResponse(profile);

        Page<RestaurantProfile> page = new PageImpl<>(List.of(profile), pageable, 1);
        when(restaurantProfileRepository.findApprovedWithFilters(ApprovalStatus.APPROVED, "Sushi", "Japonesa", pageable))
                .thenReturn(page);
        when(restaurantMapper.toResponse(profile)).thenReturn(response);

        PageResponse<RestaurantResponse> result = restaurantService.getApprovedRestaurants("  Sushi  ", "  Japonesa  ", pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).cuisineType()).isEqualTo("Japonesa");
    }

    // ─── getRestaurantById ──────────────────────────────────────────────────

    @Test
    void getRestaurantById_existente_devuelveResponse() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        RestaurantResponse response = buildResponse(profile);

        when(restaurantProfileRepository.findById(profile.getId())).thenReturn(Optional.of(profile));
        when(restaurantMapper.toResponse(profile)).thenReturn(response);

        RestaurantResponse result = restaurantService.getRestaurantById(profile.getId());

        assertThat(result.id()).isEqualTo(profile.getId());
        assertThat(result.businessName()).isEqualTo("Sushi House");
    }

    @Test
    void getRestaurantById_inexistente_lanzaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(restaurantProfileRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> restaurantService.getRestaurantById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── getMyRestaurant ────────────────────────────────────────────────────

    @Test
    void getMyRestaurant_usuarioConPerfil_devuelveResponse() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        RestaurantResponse response = buildResponse(profile);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(profile));
        when(restaurantMapper.toResponse(profile)).thenReturn(response);

        RestaurantResponse result = restaurantService.getMyRestaurant(userEmail);

        assertThat(result.id()).isEqualTo(profile.getId());
    }

    @Test
    void getMyRestaurant_usuarioSinPerfil_lanzaResourceNotFoundException() {
        User owner = buildUser();
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> restaurantService.getMyRestaurant(userEmail))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyRestaurant_emailInexistente_lanzaResourceNotFoundException() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> restaurantService.getMyRestaurant(userEmail))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── updateMyRestaurant ─────────────────────────────────────────────────

    @Test
    void updateMyRestaurant_camposNulos_noModificaValoresExistentes() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        String originalName = profile.getBusinessName();
        UpdateRestaurantDto request = new UpdateRestaurantDto(null, null, null, null, null, null, null, null);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(restaurantMapper.toResponse(any())).thenReturn(buildResponse(profile));

        restaurantService.updateMyRestaurant(userEmail, request);

        assertThat(profile.getBusinessName()).isEqualTo(originalName);
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void updateMyRestaurant_conNuevoNombre_actualizaSoloEseCampo() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        String originalPhone = profile.getPhoneNumber();
        UpdateRestaurantDto request = new UpdateRestaurantDto("Nuevo Nombre", null, null, null, null, null, null, null);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(restaurantMapper.toResponse(any())).thenReturn(buildResponse(profile));

        restaurantService.updateMyRestaurant(userEmail, request);

        assertThat(profile.getBusinessName()).isEqualTo("Nuevo Nombre");
        assertThat(profile.getPhoneNumber()).isEqualTo(originalPhone); // no cambió
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void updateMyRestaurant_conCuisineType_actualizaEseCampo() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        UpdateRestaurantDto request = new UpdateRestaurantDto(null, null, "Mexicana", null, null, null, null, null);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(restaurantMapper.toResponse(any())).thenReturn(buildResponse(profile));

        restaurantService.updateMyRestaurant(userEmail, request);

        assertThat(profile.getCuisineType()).isEqualTo("Mexicana");
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void updateMyRestaurant_conCoordenadas_actualizaLatitudYLongitud() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner, ApprovalStatus.APPROVED);
        UpdateRestaurantDto request = new UpdateRestaurantDto(null, null, null, null, 4.6768, -74.0482, null, null);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(restaurantMapper.toResponse(any())).thenReturn(buildResponse(profile));

        restaurantService.updateMyRestaurant(userEmail, request);

        assertThat(profile.getLatitude()).isEqualTo(4.6768);
        assertThat(profile.getLongitude()).isEqualTo(-74.0482);
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void updateMyRestaurant_usuarioInexistente_lanzaResourceNotFoundException() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        UpdateRestaurantDto request = new UpdateRestaurantDto("X", null, null, null, null, null, null, null);
        assertThatThrownBy(() -> restaurantService.updateMyRestaurant(userEmail, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(restaurantProfileRepository, never()).save(any());
    }

    @Test
    void updateMyRestaurant_sinPerfilDeRestaurante_lanzaResourceNotFoundException() {
        User owner = buildUser();
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.empty());

        UpdateRestaurantDto request = new UpdateRestaurantDto("X", null, null, null, null, null, null, null);
        assertThatThrownBy(() -> restaurantService.updateMyRestaurant(userEmail, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(restaurantProfileRepository, never()).save(any());
    }

    // ─── toggleFavoriteRestaurant & getMyFavoriteRestaurants ─────────────────

    @Test
    void toggleFavoriteRestaurant_noExistia_guardaFavorito() {
        User client = buildUser();
        RestaurantProfile profile = buildProfile(client, ApprovalStatus.APPROVED);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(client));
        when(restaurantProfileRepository.existsById(profile.getId())).thenReturn(true);
        when(favoriteRestaurantRepository.existsByUserIdAndRestaurantProfileId(client.getId(), profile.getId()))
                .thenReturn(false);
        when(restaurantProfileRepository.getReferenceById(profile.getId())).thenReturn(profile);

        restaurantService.toggleFavoriteRestaurant(userEmail, profile.getId());

        verify(favoriteRestaurantRepository).save(any(FavoriteRestaurant.class));
        verify(favoriteRestaurantRepository, never()).deleteByUserIdAndRestaurantProfileId(any(), any());
    }

    @Test
    void toggleFavoriteRestaurant_yaExistia_eliminaFavorito() {
        User client = buildUser();
        RestaurantProfile profile = buildProfile(client, ApprovalStatus.APPROVED);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(client));
        when(restaurantProfileRepository.existsById(profile.getId())).thenReturn(true);
        when(favoriteRestaurantRepository.existsByUserIdAndRestaurantProfileId(client.getId(), profile.getId()))
                .thenReturn(true);

        restaurantService.toggleFavoriteRestaurant(userEmail, profile.getId());

        verify(favoriteRestaurantRepository).deleteByUserIdAndRestaurantProfileId(client.getId(), profile.getId());
        verify(favoriteRestaurantRepository, never()).save(any());
    }

    @Test
    void toggleFavoriteRestaurant_restauranteInexistente_lanza404() {
        User client = buildUser();
        UUID restId = UUID.randomUUID();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(client));
        when(restaurantProfileRepository.existsById(restId)).thenReturn(false);

        assertThatThrownBy(() -> restaurantService.toggleFavoriteRestaurant(userEmail, restId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyFavoriteRestaurants_devuelvePaginaDeFavoritos() {
        Pageable pageable = PageRequest.of(0, 10);
        User client = buildUser();
        RestaurantProfile profile = buildProfile(client, ApprovalStatus.APPROVED);
        FavoriteRestaurant fav = FavoriteRestaurant.builder()
                .user(client)
                .restaurantProfile(profile)
                .build();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(client));
        when(favoriteRestaurantRepository.findByUserId(client.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(fav), pageable, 1));
        when(restaurantMapper.toResponse(profile)).thenReturn(buildResponse(profile));

        PageResponse<RestaurantResponse> result = restaurantService.getMyFavoriteRestaurants(userEmail, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).businessName()).isEqualTo("Sushi House");
    }
}
