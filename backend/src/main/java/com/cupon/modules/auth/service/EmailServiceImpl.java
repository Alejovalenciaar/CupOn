package com.cupon.modules.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@cupon.com}")
    private String fromAddress;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Recuperación de contraseña - Cupon");
        message.setText("""
                Hola,

                Recibimos una solicitud para restablecer tu contraseña.
                Si fuiste tú, haz clic en el siguiente enlace para continuar:

                %s

                Este enlace expirará pronto y solo puede utilizarse una vez.
                Si no solicitaste este cambio, puedes ignorar este correo.

                Equipo Cupon
                """.formatted(resetLink));
        mailSender.send(message);
    }
}
