package com.gigantgravity.higher_lower_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class FriendRequestResponse {
    private UUID requestId;
    private String fromUsername;
    private Instant createdAt;
}