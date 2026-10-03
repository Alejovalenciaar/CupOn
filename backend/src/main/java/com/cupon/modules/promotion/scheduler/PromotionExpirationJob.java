package com.cupon.modules.promotion.scheduler;

import com.cupon.modules.promotion.repository.PromotionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Job de expiración automática de promociones (HU — Expiración de cupones).
 *
 * <p>Se ejecuta cada 15 minutos y marca como {@code EXPIRED} todas las
 * promociones con estado {@code ACTIVE} cuya {@code endDate} ya pasó.
 * La operación es una sola sentencia {@code UPDATE} bulk, sin cargar
 * entidades en memoria, lo que la hace O(1) en consumo de heap.
 */
@Component
public class PromotionExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(PromotionExpirationJob.class);

    private final PromotionRepository promotionRepository;

    public PromotionExpirationJob(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    /**
     * Cron: cada 15 minutos en punto (0, 15, 30, 45 de cada hora).
     * Para pruebas locales puedes usar {@code fixedDelay = 60_000} (cada 1 min).
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void expireOutdatedPromotions() {
        LocalDateTime now = LocalDateTime.now();
        int expired = promotionRepository.expirePromotions(now);

        if (expired > 0) {
            log.info("[PromotionExpirationJob] {} promoción(es) marcada(s) como EXPIRED a las {}",
                    expired, now);
        } else {
            log.debug("[PromotionExpirationJob] Sin promociones por expirar — {}", now);
        }
    }
}
