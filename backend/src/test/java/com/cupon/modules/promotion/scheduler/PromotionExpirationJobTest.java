package com.cupon.modules.promotion.scheduler;

import com.cupon.modules.promotion.repository.PromotionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PromotionExpirationJob — tests unitarios")
class PromotionExpirationJobTest {

    @Mock
    private PromotionRepository promotionRepository;

    @InjectMocks
    private PromotionExpirationJob job;

    @Test
    @DisplayName("Expira N promociones vencidas e imprime log")
    void expireOutdatedPromotions_conVencidas_expiraYLoguea() {
        when(promotionRepository.expirePromotions(any(LocalDateTime.class))).thenReturn(5);

        job.expireOutdatedPromotions();

        verify(promotionRepository, times(1)).expirePromotions(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Sin promociones vencidas — no lanza excepción y continúa")
    void expireOutdatedPromotions_sinVencidas_noFalla() {
        when(promotionRepository.expirePromotions(any(LocalDateTime.class))).thenReturn(0);

        job.expireOutdatedPromotions();

        verify(promotionRepository, times(1)).expirePromotions(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Si el repositorio lanza excepción, el job la propaga (falla auditable)")
    void expireOutdatedPromotions_errorRepository_propagaExcepcion() {
        when(promotionRepository.expirePromotions(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("DB connection lost"));

        org.junit.jupiter.api.Assertions.assertThrows(
                RuntimeException.class,
                () -> job.expireOutdatedPromotions()
        );
    }
}
