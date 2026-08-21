package com.cupon.modules.user.repository;

import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantProfileRepository extends JpaRepository<RestaurantProfile, UUID> {

    Optional<RestaurantProfile> findByUserId(UUID userId);

    Page<RestaurantProfile> findByApprovalStatus(ApprovalStatus status, Pageable pageable);

    long countByApprovalStatus(ApprovalStatus status);
}
