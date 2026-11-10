package com.cupon.modules.restaurant.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import com.cupon.modules.restaurant.entity.FavoriteRestaurant;
import com.cupon.modules.restaurant.mapper.RestaurantMapper;
import com.cupon.modules.restaurant.repository.FavoriteRestaurantRepository;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestaurantServiceImpl implements RestaurantService {

        private final RestaurantProfileRepository restaurantProfileRepository;
        private final UserRepository userRepository;
        private final FavoriteRestaurantRepository favoriteRestaurantRepository;
        private final RestaurantMapper restaurantMapper;

        @Override
        public PageResponse<RestaurantResponse> getApprovedRestaurants(String search, String cuisineType,
                        Pageable pageable) {
                String cleanSearch = (search != null && !search.isBlank() ? search.trim() : null);
                String cleanCuisine = (cuisineType != null && !cuisineType.isBlank() ? cuisineType.trim() : null);

                Page<RestaurantResponse> page = restaurantProfileRepository
                                .findApprovedWithFilters(ApprovalStatus.APPROVED, cleanSearch, cleanCuisine, pageable)
                                .map(restaurantMapper::toResponse);
                return PageResponse.of(page);
        }

        @Override
        public RestaurantResponse getRestaurantById(UUID id) {
                RestaurantProfile profile = restaurantProfileRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Restaurante", "id", id));
                return restaurantMapper.toResponse(profile);
        }

        @Override
        public RestaurantResponse getMyRestaurant(String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

                RestaurantProfile profile = restaurantProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("Perfil de restaurante", "userId",
                                                user.getId()));

                return restaurantMapper.toResponse(profile);
        }

        @Override
        @Transactional
        public RestaurantResponse updateMyRestaurant(String userEmail, UpdateRestaurantDto request) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

                RestaurantProfile profile = restaurantProfileRepository.findByUserId(user.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("Perfil de restaurante", "userId",
                                                user.getId()));

                if (request.businessName() != null)
                        profile.setBusinessName(request.businessName());
                if (request.description() != null)
                        profile.setDescription(request.description());
                if (request.address() != null)
                        profile.setAddress(request.address());
                if (request.latitude() != null)
                        profile.setLatitude(request.latitude());
                if (request.longitude() != null)
                        profile.setLongitude(request.longitude());
                if (request.logoUrl() != null)
                        profile.setLogoUrl(request.logoUrl());
                if (request.phoneNumber() != null)
                        profile.setPhoneNumber(request.phoneNumber());
                if (request.cuisineType() != null)
                        profile.setCuisineType(request.cuisineType());

                RestaurantProfile saved = restaurantProfileRepository.save(profile);
                return restaurantMapper.toResponse(saved);
        }

        @Override
        @Transactional
        public void toggleFavoriteRestaurant(String userEmail, UUID restaurantId) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

                if (!restaurantProfileRepository.existsById(restaurantId)) {
                        throw new ResourceNotFoundException("Restaurante", "id", restaurantId);
                }

                if (favoriteRestaurantRepository.existsByUserIdAndRestaurantProfileId(user.getId(), restaurantId)) {
                        favoriteRestaurantRepository.deleteByUserIdAndRestaurantProfileId(user.getId(), restaurantId);
                } else {
                        RestaurantProfile restaurant = restaurantProfileRepository.getReferenceById(restaurantId);
                        FavoriteRestaurant favorite = FavoriteRestaurant.builder()
                                        .user(user)
                                        .restaurantProfile(restaurant)
                                        .build();
                        favoriteRestaurantRepository.save(favorite);
                }
        }

        @Override
        public PageResponse<RestaurantResponse> getMyFavoriteRestaurants(String userEmail, Pageable pageable) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", userEmail));

                Page<RestaurantResponse> page = favoriteRestaurantRepository.findByUserId(user.getId(), pageable)
                                .map(fav -> restaurantMapper.toResponse(fav.getRestaurantProfile()));
                return PageResponse.of(page);
        }
}
