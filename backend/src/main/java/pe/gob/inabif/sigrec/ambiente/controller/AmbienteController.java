package pe.gob.inabif.sigrec.ambiente.controller;

import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import pe.gob.inabif.sigrec.ambiente.dtos.CreateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.UpdateAmbienteRequest;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.ambiente.service.AmbienteService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ambientes")
public class AmbienteController {
    private final AmbienteService service;

    @PostMapping
    public ResponseEntity<ApiResponse<CambioResponse<AmbienteResponse>>> crear(@Valid @RequestBody CreateAmbienteRequest datos) {
        return ApiResponse.created(service.crear(datos));
    }

    @PutMapping("/{codigo}")
    public ApiResponse<CambioResponse<AmbienteResponse>> editar(@PathVariable String codigo, @Valid @RequestBody UpdateAmbienteRequest datos) {
        return ApiResponse.ok(service.editar(codigo, datos));
    }

    @PostMapping("/{codigo}/anular")
    public ApiResponse<AmbienteResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest datos) {
        return ApiResponse.ok(service.cambiarEstado(codigo, datos.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    public ApiResponse<AmbienteResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(service.cambiarEstado(codigo, null));
    }
}
