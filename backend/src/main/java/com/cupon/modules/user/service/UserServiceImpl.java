package com.cupon.modules.user.service;

import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;
import com.cupon.modules.user.entity.User;
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

    @Override
    public UserProfileResponse getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", userId));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", userId));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
