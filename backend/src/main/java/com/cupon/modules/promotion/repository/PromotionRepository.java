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

    /** Filtros del catálogo compartidos por {@link #search} y {@link #searchPopular}. */
    String CATALOG_FILTER = "WHERE p.status = :status " +
            "AND (CAST(:search AS string) IS NULL " +
            "OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:dayOfWeek IS NULL OR :dayOfWeek MEMBER OF p.daysOfWeek) " +
            "AND (:categoryId IS NULL OR EXISTS (SELECT c FROM p.categories c WHERE c.id = :categoryId)) ";

    /** Pesos de la popularidad: un canje vale más que un favorito, y este más que una vista. */
    int POPULARITY_REDEMPTION_WEIGHT = 3;
    int POPULARITY_FAVORITE_WEIGHT = 2;
    int POPULARITY_VIEW_WEIGHT = 1;

    @Query("SELECT p FROM Promotion p " + CATALOG_FILTER)
    Page<Promotion> search(@Param("status") PromotionStatus status,
                            @Param("search") String search,
                            @Param("dayOfWeek") DayOfWeek dayOfWeek,
                            @Param("categoryId") UUID categoryId,
                            Pageable pageable);

    /**
     * Igual que {@link #search} pero ordenado por popularidad (sort=popular):
     * canjes * 3 + favoritos * 2 + vistas, de mayor a menor. Los empates se resuelven por la
     * promoción más reciente. El orden va fijo en la consulta, así que el Pageable no debe traer Sort.
     */
    @Query(value = "SELECT p FROM Promotion p " + CATALOG_FILTER +
            "ORDER BY (p.currentRedemptions * " + POPULARITY_REDEMPTION_WEIGHT +
            " + (SELECT COUNT(f) FROM Favorite f WHERE f.promotion = p) * " + POPULARITY_FAVORITE_WEIGHT +
            " + p.viewCount * " + POPULARITY_VIEW_WEIGHT + ") DESC, p.createdAt DESC, p.id",
            countQuery = "SELECT COUNT(p) FROM Promotion p " + CATALOG_FILTER)
    Page<Promotion> searchPopular(@Param("status") PromotionStatus status,
                                  @Param("search") String search,
                                  @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                  @Param("categoryId") UUID categoryId,
                                  Pageable pageable);

    long countByStatus(PromotionStatus status);

    /**
     * Incrementa el contador de vistas en una sola sentencia UPDATE para no perder
     * incrementos con peticiones concurrentes. Devuelve 0 si la promoción no existe.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Promotion p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int incrementViewCount(@Param("id") UUID id);

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

