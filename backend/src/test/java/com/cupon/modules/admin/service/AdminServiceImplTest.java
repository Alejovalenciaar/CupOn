package com.cupon.modules.admin.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.mapper.RestaurantMapper;
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
class AdminServiceImplTest {

    @Mock
    private RestaurantProfileRepository restaurantProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private RestaurantMapper restaurantMapper;

    @InjectMocks
    private AdminServiceImpl adminService;

    // ─── helpers ────────────────────────────────────────────────────────────

    private User buildUser() {
        User user = User.builder().email("admin@cupon.com").build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private RestaurantProfile buildProfile(User owner) {
        RestaurantProfile profile = RestaurantProfile.builder()
                .user(owner)
                .businessName("Pizza Feliz")
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
        profile.setId(UUID.randomUUID());
        return profile;
    }

    private RestaurantResponse buildResponse(RestaurantProfile profile) {
        return new RestaurantResponse(
                profile.getId(), profile.getBusinessName(), "desc", "Calle 1",
                null, "3001234567", profile.getApprovalStatus(),
                profile.getUser().getEmail(), LocalDateTime.now());
    }

    // ─── getPendingRestaurants ──────────────────────────────────────────────

    @Test
    void getPendingRestaurants_hayPendientes_devuelvePageResponse() {
        Pageable pageable = PageRequest.of(0, 20);
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner);
        RestaurantResponse response = buildResponse(profile);

        Page<RestaurantProfile> page = new PageImpl<>(List.of(profile), pageable, 1);

        when(restaurantProfileRepository.findByApprovalStatus(ApprovalStatus.PENDING, pageable))
                .thenReturn(page);
        when(restaurantMapper.toResponse(profile)).thenReturn(response);

        PageResponse<RestaurantResponse> result = adminService.getPendingRestaurants(pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content().get(0).approvalStatus()).isEqualTo(ApprovalStatus.PENDING);
    }

    @Test
    void getPendingRestaurants_sinPendientes_devuelveListaVacia() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<RestaurantProfile> page = new PageImpl<>(List.of(), pageable, 0);

        when(restaurantProfileRepository.findByApprovalStatus(ApprovalStatus.PENDING, pageable))
                .thenReturn(page);

        PageResponse<RestaurantResponse> result = adminService.getPendingRestaurants(pageable);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }

    // ─── approveOrRejectRestaurant ──────────────────────────────────────────

    @Test
    void approveRestaurant_cuandoApproved_estableceEstadoAPPROVED() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner);
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(true, null);

        when(restaurantProfileRepository.findById(profile.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adminService.approveOrRejectRestaurant(profile.getId(), request);

        assertThat(profile.getApprovalStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(profile.getRejectionReason()).isNull();
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void rejectRestaurant_cuandoNotApproved_estableceEstadoREJECTED() {
        User owner = buildUser();
        RestaurantProfile profile = buildProfile(owner);
        String reason = "Documentos insuficientes";
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(false, reason);

        when(restaurantProfileRepository.findById(profile.getId())).thenReturn(Optional.of(profile));
        when(restaurantProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adminService.approveOrRejectRestaurant(profile.getId(), request);

        assertThat(profile.getApprovalStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(profile.getRejectionReason()).isEqualTo(reason);
        verify(restaurantProfileRepository).save(profile);
    }

    @Test
    void approveRestaurant_perfilInexistente_lanzaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(restaurantProfileRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.approveOrRejectRestaurant(id,
                new ApproveRestaurantRequest(true, null)))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(restaurantProfileRepository, never()).save(any());
    }

    // ─── suspendUser ────────────────────────────────────────────────────────

    @Test
    void suspendUser_usuarioActivo_loDesactiva() {
        User user = buildUser();
        user.setEnabled(true);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adminService.suspendUser(user.getId());

        assertThat(user.isEnabled()).isFalse();
        verify(userRepository).save(user);
    }

    @Test
    void suspendUser_usuarioSuspendido_loReactiva() {
        User user = buildUser();
        user.setEnabled(false);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        adminService.suspendUser(user.getId());

        assertThat(user.isEnabled()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    void suspendUser_usuarioInexistente_lanzaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.suspendUser(id))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userRepository, never()).save(any());
    }

    // ─── deletePromotion ────────────────────────────────────────────────────

    @Test
    void deletePromotion_existente_laElimina() {
        com.cupon.modules.promotion.entity.Promotion promotion =
                com.cupon.modules.promotion.entity.Promotion.builder()
                        .title("Test")
                        .status(PromotionStatus.ACTIVE)
                        .build();
        promotion.setId(UUID.randomUUID());

        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));

        adminService.deletePromotion(promotion.getId());

        verify(promotionRepository).delete(promotion);
    }

    @Test
    void deletePromotion_inexistente_lanzaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(promotionRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.deletePromotion(id))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(promotionRepository, never()).delete(any());
    }

    // ─── getSystemMetrics ───────────────────────────────────────────────────

    @Test
    void getSystemMetrics_devuelveDatosAgregadosDelRepositorio() {
        when(userRepository.count()).thenReturn(50L);
        when(restaurantProfileRepository.count()).thenReturn(10L);
        when(restaurantProfileRepository.countByApprovalStatus(ApprovalStatus.PENDING)).thenReturn(3L);
        when(promotionRepository.count()).thenReturn(25L);
        when(promotionRepository.countByStatus(PromotionStatus.ACTIVE)).thenReturn(18L);

        SystemMetricsResponse metrics = adminService.getSystemMetrics();

        assertThat(metrics.totalUsers()).isEqualTo(50L);
        assertThat(metrics.totalRestaurants()).isEqualTo(10L);
        assertThat(metrics.pendingApprovals()).isEqualTo(3L);
        assertThat(metrics.totalPromotions()).isEqualTo(25L);
        assertThat(metrics.activePromotions()).isEqualTo(18L);
    }

    @Test
    void getSystemMetrics_sinDatos_devuelveCerosEnTodo() {
        when(userRepository.count()).thenReturn(0L);
        when(restaurantProfileRepository.count()).thenReturn(0L);
        when(restaurantProfileRepository.countByApprovalStatus(ApprovalStatus.PENDING)).thenReturn(0L);
        when(promotionRepository.count()).thenReturn(0L);
        when(promotionRepository.countByStatus(PromotionStatus.ACTIVE)).thenReturn(0L);

        SystemMetricsResponse metrics = adminService.getSystemMetrics();

        assertThat(metrics.totalUsers()).isZero();
        assertThat(metrics.totalRestaurants()).isZero();
        assertThat(metrics.pendingApprovals()).isZero();
        assertThat(metrics.totalPromotions()).isZero();
        assertThat(metrics.activePromotions()).isZero();
    }
}
