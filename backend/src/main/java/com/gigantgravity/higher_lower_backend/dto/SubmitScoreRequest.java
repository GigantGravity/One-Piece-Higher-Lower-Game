package com.gigantgravity.higher_lower_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitScoreRequest {

    @NotNull(message = "Score darf nicht fehlen")
    @Min(value = 0, message = "Score muss mindestens 0 sein")
    private Integer score;
}