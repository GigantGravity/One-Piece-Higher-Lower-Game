package com.gigantgravity.higher_lower_backend.repository;

import com.gigantgravity.higher_lower_backend.entity.Friendship;
import com.gigantgravity.higher_lower_backend.entity.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.requester.id = :userId1 AND f.addressee.id = :userId2)
               OR (f.requester.id = :userId2 AND f.addressee.id = :userId1)
            """)
    Optional<Friendship> findBetweenUsers(@Param("userId1") UUID userId1, @Param("userId2") UUID userId2);

    List<Friendship> findByAddresseeIdAndStatus(UUID addresseeId, FriendshipStatus status);

    @Query("""
            SELECT f FROM Friendship f
            WHERE (f.requester.id = :userId OR f.addressee.id = :userId)
              AND f.status = 'ACCEPTED'
            """)
    List<Friendship> findAcceptedFriendships(@Param("userId") UUID userId);
}