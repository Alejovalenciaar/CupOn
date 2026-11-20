package com.cupon.modules.user.repository;

import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantProfileRepository extends JpaRepository<RestaurantProfile, UUID> {

    Optional<RestaurantProfile> findByUserId(UUID userId);

    Page<RestaurantProfile> findByApprovalStatus(ApprovalStatus status, Pageable pageable);

    @Query("""
            SELECT r FROM RestaurantProfile r
            WHERE r.approvalStatus = :status
            AND (CAST(:search AS string) IS NULL
                OR LOWER(r.businessName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                OR LOWER(r.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (CAST(:cuisineType AS string) IS NULL
                OR LOWER(r.cuisineType) = LOWER(CAST(:cuisineType AS string)))
            """)
    Page<RestaurantProfile> findApprovedWithFilters(
            @Param("status") ApprovalStatus status,
            @Param("search") String search,
            @Param("cuisineType") String cuisineType,
            Pageable pageable);

    long countByApprovalStatus(ApprovalStatus status);
}
