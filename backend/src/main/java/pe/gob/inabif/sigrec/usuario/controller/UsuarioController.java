package pe.gob.inabif.sigrec.usuario.controller;

import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.usuario.dtos.*;
import pe.gob.inabif.sigrec.usuario.service.UsuarioService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/usuarios")
class UsuarioController {
    private final UsuarioService usuarios;

    UsuarioController(UsuarioService usuarios) { this.usuarios = usuarios; }

    @GetMapping
    ApiResponse<List<UsuarioResponse>> listar() { return ApiResponse.ok(usuarios.listar()); }

    @GetMapping("/{codigo}")
    ApiResponse<UsuarioResponse> consultar(@PathVariable String codigo) { return ApiResponse.ok(usuarios.consultar(codigo)); }

    @PutMapping("/{codigo}")
    ApiResponse<UsuarioResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateUsuarioRequest datos) {
        return ApiResponse.ok(usuarios.actualizar(codigo, datos));
    }

    @PostMapping("/{codigo}/desactivar")
    ApiResponse<UsuarioResponse> desactivar(@PathVariable String codigo, @Valid @RequestBody DesactivarUsuarioRequest motivo) {
        return ApiResponse.ok(usuarios.desactivar(codigo, motivo));
    }

    @PutMapping("/{codigo}/asignaciones")
    ApiResponse<UsuarioResponse> asignar(@PathVariable String codigo, @Valid @RequestBody AsignarPerfilesRequest datos) {
        return ApiResponse.ok(usuarios.asignar(codigo, datos));
    }
}
