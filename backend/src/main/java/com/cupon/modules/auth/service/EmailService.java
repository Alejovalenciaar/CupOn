package com.cupon.modules.auth.service;

public interface EmailService {

    void sendPasswordResetEmail(String toEmail, String resetLink);
}
