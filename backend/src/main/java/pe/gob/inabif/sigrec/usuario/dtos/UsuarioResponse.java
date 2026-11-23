package pe.gob.inabif.sigrec.usuario.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record UsuarioResponse(String codigo, String nombre, String proveedor, String sujeto, boolean activo, List<AsignacionUsuario> asignaciones) {}
