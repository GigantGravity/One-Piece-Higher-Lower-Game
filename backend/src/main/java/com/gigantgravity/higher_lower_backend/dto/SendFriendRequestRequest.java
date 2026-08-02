package com.gigantgravity.higher_lower_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendFriendRequestRequest {

    @NotBlank(message = "Nutzername darf nicht leer sein")
    private String username;
}