package com.gigantgravity.higher_lower_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Nutzername darf nicht leer sein")
    private String username;

    @NotBlank(message = "Passwort darf nicht leer sein")
    private String password;
}