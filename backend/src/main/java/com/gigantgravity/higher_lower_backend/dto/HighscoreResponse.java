package com.gigantgravity.higher_lower_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
@Builder
public class HighscoreResponse {
    private String username;
    private Integer score;
    private Instant achievedAt;
}