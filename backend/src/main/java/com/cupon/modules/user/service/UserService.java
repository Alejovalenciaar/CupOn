package com.cupon.modules.user.service;

import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;

public interface UserService {

    UserProfileResponse getMyProfile(String userEmail);

    UserProfileResponse updateMyProfile(String userEmail, UpdateUserRequest request);

}