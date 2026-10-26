package com.cupon.modules.promotion.repository;

import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {

    Page<Promotion> findByRestaurantProfileId(UUID restaurantProfileId, Pageable pageable);

    Optional<Promotion> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT p FROM Promotion p WHERE p.status = :status " +
            "AND (CAST(:search AS string) IS NULL " +
            "OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:dayOfWeek IS NULL OR :dayOfWeek MEMBER OF p.daysOfWeek) " +
            "AND (:categoryId IS NULL OR EXISTS (SELECT c FROM p.categories c WHERE c.id = :categoryId))")
    Page<Promotion> search(@Param("status") PromotionStatus status,
                            @Param("search") String search,
                            @Param("dayOfWeek") DayOfWeek dayOfWeek,
                            @Param("categoryId") UUID categoryId,
                            Pageable pageable);

    long countByStatus(PromotionStatus status);

    /**
     * Devuelve el número de promociones ACTIVE cuya fecha de fin ya pasó.
     * Usada por el job de expiración para actualizar el estado a EXPIRED.
     */
    @Modifying
    @Query("UPDATE Promotion p SET p.status = com.cupon.modules.promotion.entity.PromotionStatus.EXPIRED " +
           "WHERE p.status = com.cupon.modules.promotion.entity.PromotionStatus.ACTIVE " +
           "AND p.endDate < :now")
    int expirePromotions(@Param("now") LocalDateTime now);
}

