package com.gigantgravity.higher_lower_backend.controller;

import com.gigantgravity.higher_lower_backend.dto.HighscoreResponse;
import com.gigantgravity.higher_lower_backend.dto.SubmitScoreRequest;
import com.gigantgravity.higher_lower_backend.service.HighscoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/highscores")
@RequiredArgsConstructor
public class HighscoreController {

    private final HighscoreService highscoreService;

    @PostMapping
    public ResponseEntity<HighscoreResponse> submitScore(
            @Valid @RequestBody SubmitScoreRequest request,
            Authentication authentication
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        HighscoreResponse response = highscoreService.submitScore(userId, request.getScore());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<HighscoreResponse> getMyBest(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        HighscoreResponse response = highscoreService.getPersonalBest(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/global")
    public ResponseEntity<List<HighscoreResponse>> getGlobalLeaderboard() {
        return ResponseEntity.ok(highscoreService.getGlobalLeaderboard());
    }

    @GetMapping("/friends")
    public ResponseEntity<List<HighscoreResponse>> getFriendsLeaderboard(Authentication authentication) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(highscoreService.getFriendsLeaderboard(currentUserId));
    }
}