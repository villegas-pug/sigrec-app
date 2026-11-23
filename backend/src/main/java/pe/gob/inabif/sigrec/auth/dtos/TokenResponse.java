package pe.gob.inabif.sigrec.auth.dtos;

import java.time.Duration;

public record TokenResponse(String valor, Duration duracion) {}
