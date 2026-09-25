package com.cupon.modules.user.service;

import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;
import com.cupon.modules.user.entity.ClientProfile;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientProfileRepository clientProfileRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;
    private ClientProfile sampleProfile;
    private final String email = "cliente@test.com";

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .email(email)
                .password("encoded_pass")
                .firstName("Alejo")
                .lastName("Valencia")
                .role(Role.ROLE_CLIENTE)
                .enabled(true)
                .build();
        sampleUser.setId(UUID.randomUUID());

        sampleProfile = ClientProfile.builder()
                .user(sampleUser)
                .phoneNumber("+57 300 1234567")
                .build();
    }

    @Test
    void getMyProfile_whenUserExists_shouldReturnProfileWithPhone() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(sampleUser));
        when(clientProfileRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleProfile));

        UserProfileResponse response = userService.getMyProfile(email);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo(email);
        assertThat(response.firstName()).isEqualTo("Alejo");
        assertThat(response.phoneNumber()).isEqualTo("+57 300 1234567");
        verify(userRepository).findByEmail(email);
    }

    @Test
    void getMyProfile_whenUserDoesNotExist_shouldThrowResourceNotFoundException() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getMyProfile(email))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Usuario no encontrado");
    }

    @Test
    void updateMyProfile_whenValidData_shouldUpdateNameAndPhone() {
        UpdateUserRequest request = new UpdateUserRequest("Carlos", "Gomez", "+57 311 9876543");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(clientProfileRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleProfile));
        when(clientProfileRepository.save(any(ClientProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.updateMyProfile(email, request);

        assertThat(response.firstName()).isEqualTo("Carlos");
        assertThat(response.lastName()).isEqualTo("Gomez");
        assertThat(response.phoneNumber()).isEqualTo("+57 311 9876543");
        verify(userRepository).save(any(User.class));
        verify(clientProfileRepository).save(any(ClientProfile.class));
    }

    @Test
    void updateMyProfile_withoutPhone_shouldUpdateOnlyName() {
        UpdateUserRequest request = new UpdateUserRequest("NuevoNombre", null, null);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(clientProfileRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleProfile));

        UserProfileResponse response = userService.updateMyProfile(email, request);

        assertThat(response.firstName()).isEqualTo("NuevoNombre");
        assertThat(response.lastName()).isEqualTo("Valencia");
        assertThat(response.phoneNumber()).isEqualTo("+57 300 1234567");
    }

    @Test
    void updateMyProfile_whenUserDoesNotExist_shouldThrowResourceNotFoundException() {
        UpdateUserRequest request = new UpdateUserRequest("Carlos", "Gomez", null);
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateMyProfile(email, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
