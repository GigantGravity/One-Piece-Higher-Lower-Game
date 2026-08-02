package com.gigantgravity.higher_lower_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class FriendResponse {
    private UUID userId;
    private String username;
}