package pe.gob.inabif.sigrec.permiso.controller;

import pe.gob.inabif.sigrec.permiso.service.PermisoService;
import pe.gob.inabif.sigrec.permiso.dtos.PermisoResponse;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/permisos")
public class PermisoController {
    private final PermisoService service;

    @GetMapping
    public ApiResponse<List<PermisoResponse>> listar() { return ApiResponse.ok(service.listar()); }
}
