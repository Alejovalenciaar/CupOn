package com.cupon.modules.chatbot.repository;

import com.cupon.modules.chatbot.entity.ChatConsulta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChatConsultaRepository extends JpaRepository<ChatConsulta, UUID> {

    Page<ChatConsulta> findByUserId(UUID userId, Pageable pageable);
}
