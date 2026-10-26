package com.cupon.modules.chatbot.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cupon.config.AuditingConfig;
import com.cupon.modules.chatbot.entity.ChatConsulta;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

// @DataJpaTest solo carga el slice JPA: @EnableJpaAuditing (AuditingConfig) no se
// detecta automáticamente, hay que importarlo explícitamente para que createdAt/
// updatedAt (BaseEntity) se completen al guardar.
@DataJpaTest
@Import(AuditingConfig.class)
@ActiveProfiles("test")
class ChatConsultaRepositoryTest {

    @Autowired
    private ChatConsultaRepository chatConsultaRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void guardaYRecuperaConsultaDeInvitado() {
        ChatConsulta consulta = ChatConsulta.builder()
                .pregunta("¿Qué es CupOn?")
                .respuesta("CupOn es un directorio de promociones para restaurantes.")
                .build();

        ChatConsulta guardada = chatConsultaRepository.save(consulta);

        assertThat(guardada.getId()).isNotNull();
        assertThat(guardada.getCreatedAt()).isNotNull();
        assertThat(guardada.getUser()).isNull();

        ChatConsulta recuperada = chatConsultaRepository.findById(guardada.getId()).orElseThrow();
        assertThat(recuperada.getPregunta()).isEqualTo("¿Qué es CupOn?");
        assertThat(recuperada.getRespuesta()).contains("directorio");
    }

    @Test
    void elHistorialDeUnClienteNoIncluyeConsultasDeOtrosNiDeInvitados() {
        User cliente = userRepository.save(User.builder()
                .email("historial-test@cupon.com")
                .password("hash")
                .firstName("Test")
                .lastName("Cliente")
                .role(Role.ROLE_CLIENTE)
                .build());

        chatConsultaRepository.save(ChatConsulta.builder()
                .user(cliente)
                .pregunta("¿Cómo canjeo un cupón?")
                .respuesta("Se canjea directamente en el restaurante.")
                .build());

        chatConsultaRepository.save(ChatConsulta.builder()
                .pregunta("Pregunta de un invitado, no debe aparecer en el historial del cliente")
                .respuesta("...")
                .build());

        Page<ChatConsulta> historial =
                chatConsultaRepository.findByUserId(cliente.getId(), PageRequest.of(0, 10));

        assertThat(historial.getTotalElements()).isEqualTo(1);
        assertThat(historial.getContent().get(0).getPregunta()).isEqualTo("¿Cómo canjeo un cupón?");
    }
}
