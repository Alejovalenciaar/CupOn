package com.cupon.modules.promotion.mapper;

import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.Promotion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface PromotionMapper {

    @Mapping(target = "restaurantName", source = "restaurantProfile.businessName")
    @Mapping(target = "restaurantId", source = "restaurantProfile.id")
    @Mapping(target = "restaurantInstagramUrl", source = "restaurantProfile.instagramUrl")
    @Mapping(target = "categories", source = "categories", qualifiedByName = "categoriesToNames")
    @Mapping(target = "currentlyActive", expression = "java(promotion.isCurrentlyActive())")
    PromotionResponse toResponse(Promotion promotion);

    @Named("categoriesToNames")
    default Set<String> categoriesToNames(Set<Category> categories) {
        if (categories == null) return Set.of();
        return categories.stream()
                .map(Category::getName)
                .collect(Collectors.toSet());
    }
}
