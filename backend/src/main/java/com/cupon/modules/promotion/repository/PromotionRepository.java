package com.cupon.modules.promotion.repository;

import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {

    Page<Promotion> findByStatus(PromotionStatus status, Pageable pageable);

    Page<Promotion> findByRestaurantProfileId(UUID restaurantProfileId, Pageable pageable);

    Optional<Promotion> findByCode(String code);

    @Query("SELECT p FROM Promotion p WHERE p.status = :status " +
            "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Promotion> searchByTitleOrDescription(@Param("status") PromotionStatus status,
                                                @Param("search") String search,
                                                Pageable pageable);

    long countByStatus(PromotionStatus status);
}
