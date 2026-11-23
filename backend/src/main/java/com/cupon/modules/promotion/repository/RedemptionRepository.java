package com.cupon.modules.promotion.repository;

import com.cupon.modules.promotion.entity.Redemption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RedemptionRepository extends JpaRepository<Redemption, UUID> {

    boolean existsByUserIdAndPromotionId(UUID userId, UUID promotionId);

    boolean existsByVerificationCode(String verificationCode);

    Optional<Redemption> findByVerificationCode(String verificationCode);

    Page<Redemption> findByUserIdOrderByRedeemedAtDesc(UUID userId, Pageable pageable);

    Page<Redemption> findByPromotionRestaurantProfileIdOrderByRedeemedAtDesc(UUID restaurantProfileId, Pageable pageable);
}
