package com.gigantgravity.higher_lower_backend.service;

import com.gigantgravity.higher_lower_backend.dto.HighscoreResponse;
import com.gigantgravity.higher_lower_backend.entity.HighscoreEntry;
import com.gigantgravity.higher_lower_backend.entity.User;
import com.gigantgravity.higher_lower_backend.repository.HighscoreRepository;
import com.gigantgravity.higher_lower_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HighscoreService {

    private final HighscoreRepository highscoreRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;

    public HighscoreResponse submitScore(UUID userId, int score) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutzer nicht gefunden"));

        HighscoreEntry entry = HighscoreEntry.builder()
                .user(user)
                .score(score)
                .build();

        HighscoreEntry saved = highscoreRepository.save(entry);

        return toResponse(saved);
    }

    public HighscoreResponse getPersonalBest(UUID userId) {
        return highscoreRepository.findTopByUserIdOrderByScoreDesc(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    public List<HighscoreResponse> getGlobalLeaderboard() {
        return highscoreRepository.findGlobalLeaderboard(org.springframework.data.domain.PageRequest.of(0, 10))
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<HighscoreResponse> getFriendsLeaderboard(UUID userId) {
        List<UUID> friendIds = new java.util.ArrayList<>(friendshipService.getFriendIds(userId));
        friendIds.add(userId);

        return highscoreRepository.findLeaderboardForUsers(friendIds)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private HighscoreResponse toResponse(HighscoreEntry entry) {
        return HighscoreResponse.builder()
                .username(entry.getUser().getUsername())
                .score(entry.getScore())
                .achievedAt(entry.getAchievedAt())
                .build();
    }
}