package com.gigantgravity.higher_lower_backend.service;

import com.gigantgravity.higher_lower_backend.dto.FriendRequestResponse;
import com.gigantgravity.higher_lower_backend.dto.FriendResponse;
import com.gigantgravity.higher_lower_backend.entity.Friendship;
import com.gigantgravity.higher_lower_backend.entity.FriendshipStatus;
import com.gigantgravity.higher_lower_backend.entity.User;
import com.gigantgravity.higher_lower_backend.repository.FriendshipRepository;
import com.gigantgravity.higher_lower_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendRequest(UUID requesterId, String addresseeUsername) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutzer nicht gefunden"));

        User addressee = userRepository.findByUsername(addresseeUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nutzer mit diesem Namen nicht gefunden"));

        if (requester.getId().equals(addressee.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Du kannst dir nicht selbst eine Anfrage senden");
        }

        friendshipRepository.findBetweenUsers(requester.getId(), addressee.getId())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Es besteht bereits eine Freundschaft oder offene Anfrage");
                });

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .addressee(addressee)
                .status(FriendshipStatus.PENDING)
                .build();

        friendshipRepository.save(friendship);
    }

    @Transactional
    public void acceptRequest(UUID currentUserId, UUID friendshipId) {
        Friendship friendship = getOwnedPendingRequest(currentUserId, friendshipId);
        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(friendship);
    }

    @Transactional
    public void declineRequest(UUID currentUserId, UUID friendshipId) {
        Friendship friendship = getOwnedPendingRequest(currentUserId, friendshipId);
        friendship.setStatus(FriendshipStatus.DECLINED);
        friendshipRepository.save(friendship);
    }

    private Friendship getOwnedPendingRequest(UUID currentUserId, UUID friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anfrage nicht gefunden"));

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Du kannst nur Anfragen bearbeiten, die an dich gerichtet sind");
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Diese Anfrage wurde bereits bearbeitet");
        }

        return friendship;
    }

    public List<FriendRequestResponse> getPendingRequests(UUID userId) {
        return friendshipRepository.findByAddresseeIdAndStatus(userId, FriendshipStatus.PENDING)
                .stream()
                .map(f -> FriendRequestResponse.builder()
                        .requestId(f.getId())
                        .fromUsername(f.getRequester().getUsername())
                        .createdAt(f.getCreatedAt())
                        .build())
                .toList();
    }

    public List<FriendResponse> getFriends(UUID userId) {
        return friendshipRepository.findAcceptedFriendships(userId)
                .stream()
                .map(f -> {
                    User other = f.getRequester().getId().equals(userId) ? f.getAddressee() : f.getRequester();
                    return FriendResponse.builder()
                            .userId(other.getId())
                            .username(other.getUsername())
                            .build();
                })
                .toList();
    }

    public List<UUID> getFriendIds(UUID userId) {
        return friendshipRepository.findAcceptedFriendships(userId)
                .stream()
                .map(f -> f.getRequester().getId().equals(userId) ? f.getAddressee().getId() : f.getRequester().getId())
                .toList();
    }
}