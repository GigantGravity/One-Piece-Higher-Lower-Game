package com.gigantgravity.higher_lower_backend.service;

import com.gigantgravity.higher_lower_backend.dto.AuthResponse;
import com.gigantgravity.higher_lower_backend.dto.LoginRequest;
import com.gigantgravity.higher_lower_backend.dto.RegisterRequest;
import com.gigantgravity.higher_lower_backend.dto.UserResponse;
import com.gigantgravity.higher_lower_backend.entity.User;
import com.gigantgravity.higher_lower_backend.repository.UserRepository;
import com.gigantgravity.higher_lower_backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nutzername bereits vergeben");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        User savedUser = userRepository.save(user);

        return UserResponse.builder()
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ungültiger Nutzername oder Passwort"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ungültiger Nutzername oder Passwort");
        }

        String token = jwtService.generateToken(user.getId(), user.getUsername());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userResponse)
                .build();
    }
}