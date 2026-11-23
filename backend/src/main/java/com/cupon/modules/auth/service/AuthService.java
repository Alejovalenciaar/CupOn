package com.cupon.modules.auth.service;

import com.cupon.modules.auth.dto.AuthResponse;
import com.cupon.modules.auth.dto.ForgotPasswordRequest;
import com.cupon.modules.auth.dto.LoginRequest;
import com.cupon.modules.auth.dto.RegisterClientRequest;
import com.cupon.modules.auth.dto.RegisterRestaurantRequest;
import com.cupon.modules.auth.dto.ResetPasswordRequest;

public interface AuthService {

    AuthResponse registerClient(RegisterClientRequest request);

    AuthResponse registerRestaurant(RegisterRestaurantRequest request);

    AuthResponse login(LoginRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}
