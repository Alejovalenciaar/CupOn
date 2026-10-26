package com.cupon.modules.chatbot.entity;

import com.cupon.common.entity.BaseEntity;
import com.cupon.modules.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro de una pregunta hecha al chatbot y la respuesta generada.
 *
 * <p>{@code user} es nulo para consultas de invitados (sin sesión iniciada);
 * se conserva el historial aunque el usuario autenticado sea eliminado
 * posteriormente (ver migración V4, ON DELETE SET NULL).
 */
@Entity
@Table(name = "chat_consultas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConsulta extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String pregunta;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String respuesta;
}
