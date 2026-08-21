package com.cupon.modules.promotion.repository;

import com.cupon.modules.promotion.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {

    Page<Favorite> findByUserId(UUID userId, Pageable pageable);

    Optional<Favorite> findByUserIdAndPromotionId(UUID userId, UUID promotionId);

    boolean existsByUserIdAndPromotionId(UUID userId, UUID promotionId);

    void deleteByUserIdAndPromotionId(UUID userId, UUID promotionId);
}
