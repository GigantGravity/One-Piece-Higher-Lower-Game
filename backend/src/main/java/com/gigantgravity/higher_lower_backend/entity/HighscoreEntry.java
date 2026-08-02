package com.gigantgravity.higher_lower_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "highscore_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HighscoreEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false, updatable = false)
    private Instant achievedAt;

    @PrePersist
    protected void onCreate() {
        this.achievedAt = Instant.now();
    }
}