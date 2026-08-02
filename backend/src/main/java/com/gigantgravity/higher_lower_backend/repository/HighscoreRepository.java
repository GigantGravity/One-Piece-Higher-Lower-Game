package com.gigantgravity.higher_lower_backend.repository;

import com.gigantgravity.higher_lower_backend.entity.HighscoreEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HighscoreRepository extends JpaRepository<HighscoreEntry, UUID> {

    Optional<HighscoreEntry> findTopByUserIdOrderByScoreDesc(UUID userId);

    @Query("""
            SELECT h FROM HighscoreEntry h
            WHERE h.id IN (
                SELECT MAX(h2.id) FROM HighscoreEntry h2
                WHERE h2.score = (
                    SELECT MAX(h3.score) FROM HighscoreEntry h3 WHERE h3.user.id = h2.user.id
                )
                GROUP BY h2.user.id
            )
            ORDER BY h.score DESC
            """)
    Page<HighscoreEntry> findGlobalLeaderboard(Pageable pageable);

    @Query("""
            SELECT h FROM HighscoreEntry h
            WHERE h.user.id IN :userIds
            AND h.id IN (
                SELECT MAX(h2.id) FROM HighscoreEntry h2
                WHERE h2.user.id IN :userIds
                AND h2.score = (
                    SELECT MAX(h3.score) FROM HighscoreEntry h3 WHERE h3.user.id = h2.user.id
                )
                GROUP BY h2.user.id
            )
            ORDER BY h.score DESC
            """)
    List<HighscoreEntry> findLeaderboardForUsers(@Param("userIds") List<UUID> userIds);
}