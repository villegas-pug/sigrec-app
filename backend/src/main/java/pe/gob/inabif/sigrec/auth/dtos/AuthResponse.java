package pe.gob.inabif.sigrec.auth.dtos;

import pe.gob.inabif.sigrec.security.Acceso.Asignacion;
import java.util.List;

public record AuthResponse(Long id, String nombre, List<Asignacion> asignaciones) {}
