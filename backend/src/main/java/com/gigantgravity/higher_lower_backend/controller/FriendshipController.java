package com.gigantgravity.higher_lower_backend.controller;

import com.gigantgravity.higher_lower_backend.dto.FriendRequestResponse;
import com.gigantgravity.higher_lower_backend.dto.FriendResponse;
import com.gigantgravity.higher_lower_backend.dto.SendFriendRequestRequest;
import com.gigantgravity.higher_lower_backend.service.FriendshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @PostMapping("/requests")
    public ResponseEntity<Void> sendRequest(
            @Valid @RequestBody SendFriendRequestRequest request,
            Authentication authentication
    ) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        friendshipService.sendRequest(currentUserId, request.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestResponse>> getPendingRequests(Authentication authentication) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(friendshipService.getPendingRequests(currentUserId));
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<Void> acceptRequest(
            @PathVariable UUID requestId,
            Authentication authentication
    ) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        friendshipService.acceptRequest(currentUserId, requestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/requests/{requestId}/decline")
    public ResponseEntity<Void> declineRequest(
            @PathVariable UUID requestId,
            Authentication authentication
    ) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        friendshipService.declineRequest(currentUserId, requestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FriendResponse>> getFriends(Authentication authentication) {
        UUID currentUserId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(friendshipService.getFriends(currentUserId));
    }
}