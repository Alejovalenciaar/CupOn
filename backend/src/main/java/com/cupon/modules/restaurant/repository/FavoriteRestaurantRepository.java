package com.cupon.modules.restaurant.repository;

import com.cupon.modules.restaurant.entity.FavoriteRestaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRestaurantRepository extends JpaRepository<FavoriteRestaurant, UUID> {

    Page<FavoriteRestaurant> findByUserId(UUID userId, Pageable pageable);

    Optional<FavoriteRestaurant> findByUserIdAndRestaurantProfileId(UUID userId, UUID restaurantProfileId);

    boolean existsByUserIdAndRestaurantProfileId(UUID userId, UUID restaurantProfileId);

    void deleteByUserIdAndRestaurantProfileId(UUID userId, UUID restaurantProfileId);
}

