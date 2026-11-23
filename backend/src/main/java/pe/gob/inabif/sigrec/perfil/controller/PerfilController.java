package pe.gob.inabif.sigrec.perfil.controller;

import pe.gob.inabif.sigrec.perfil.service.PerfilService;
import pe.gob.inabif.sigrec.perfil.dtos.PerfilResponse;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/usuarios/perfiles")
public class PerfilController {
    private final PerfilService service;

    @GetMapping
    public ApiResponse<List<PerfilResponse>> listar() { return ApiResponse.ok(service.listar()); }
}
