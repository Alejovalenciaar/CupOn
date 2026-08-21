package com.cupon.modules.user.service;

import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;

import java.util.UUID;

public interface UserService {

    UserProfileResponse getUserProfile(UUID userId);

    UserProfileResponse updateUser(UUID userId, UpdateUserRequest request);
}
