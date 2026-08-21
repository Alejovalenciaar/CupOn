package com.cupon.modules.restaurant.mapper;

import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.user.entity.RestaurantProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RestaurantMapper {

    @Mapping(target = "ownerName",
            expression = "java(profile.getUser().getFirstName() + \" \" + profile.getUser().getLastName())")
    RestaurantResponse toResponse(RestaurantProfile profile);
}
