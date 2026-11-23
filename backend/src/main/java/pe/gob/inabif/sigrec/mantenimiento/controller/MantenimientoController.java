package pe.gob.inabif.sigrec.mantenimiento.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.mantenimiento.dtos.*;
import pe.gob.inabif.sigrec.mantenimiento.service.MantenimientoService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/mantenimientos")
@RequiredArgsConstructor
class MantenimientoController {
    private final MantenimientoService servicio;

    @GetMapping
    ApiResponse<List<MantenimientoResponse>> listar() { return ApiResponse.ok(servicio.listar()); }

    @PostMapping
    ResponseEntity<ApiResponse<MantenimientoResponse.Alta>> crear(@Valid @RequestBody CreateMantenimientoRequest request) {
        return ApiResponse.created(servicio.crear(request));
    }

    @PutMapping("/{codigo}")
    ApiResponse<MantenimientoResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateMantenimientoRequest request) {
        return ApiResponse.ok(servicio.editar(codigo, request));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<MantenimientoResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<MantenimientoResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, null));
    }
}
