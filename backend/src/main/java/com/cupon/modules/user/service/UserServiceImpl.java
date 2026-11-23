package com.cupon.modules.user.service;

import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;
import com.cupon.modules.user.entity.ClientProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;

    @Override
    public UserProfileResponse getMyProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

        String phoneNumber = clientProfileRepository.findByUserId(user.getId())
                .map(ClientProfile::getPhoneNumber)
                .orElse(null);

        return toResponse(user, phoneNumber);
    }

    @Override
    @Transactional
    public UserProfileResponse updateMyProfile(String userEmail, UpdateUserRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName());
        }
        User savedUser = userRepository.save(user);

        String phoneNumber = null;
        if (request.phoneNumber() != null) {
            ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> ClientProfile.builder().user(user).build());
            profile.setPhoneNumber(request.phoneNumber());
            clientProfileRepository.save(profile);
            phoneNumber = profile.getPhoneNumber();
        } else {
            phoneNumber = clientProfileRepository.findByUserId(user.getId())
                    .map(ClientProfile::getPhoneNumber)
                    .orElse(null);
        }

        return toResponse(savedUser, phoneNumber);

    }

    private UserProfileResponse toResponse(User user, String phoneNumber) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                phoneNumber,
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt());
    }
}
