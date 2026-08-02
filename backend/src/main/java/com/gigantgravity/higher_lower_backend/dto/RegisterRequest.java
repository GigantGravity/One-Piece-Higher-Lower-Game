package com.gigantgravity.higher_lower_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Nutzername darf nicht leer sein")
    @Size(min = 3, max = 30, message = "Nutzername muss zwischen 3 und 30 Zeichen lang sein")
    private String username;

    @NotBlank(message = "Passwort darf nicht leer sein")
    @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein")
    private String password;
}