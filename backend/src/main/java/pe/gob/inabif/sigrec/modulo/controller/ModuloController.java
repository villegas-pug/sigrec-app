package pe.gob.inabif.sigrec.modulo.controller;

import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.modulo.dtos.CreateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.UpdateModuloRequest;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.modulo.service.ModuloService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/modulos")
public class ModuloController {
    private final ModuloService service;

    @PostMapping
    public ResponseEntity<ApiResponse<CambioResponse<ModuloResponse>>> crear(@Valid @RequestBody CreateModuloRequest datos) {
        return ApiResponse.created(service.crear(datos));
    }

    @PutMapping("/{codigo}")
    public ApiResponse<CambioResponse<ModuloResponse>> editar(@PathVariable String codigo, @Valid @RequestBody UpdateModuloRequest datos) {
        return ApiResponse.ok(service.editar(codigo, datos));
    }

    @PostMapping("/{codigo}/anular")
    public ApiResponse<ModuloResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest datos) {
        return ApiResponse.ok(service.cambiarEstado(codigo, datos.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    public ApiResponse<ModuloResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(service.cambiarEstado(codigo, null));
    }
}
