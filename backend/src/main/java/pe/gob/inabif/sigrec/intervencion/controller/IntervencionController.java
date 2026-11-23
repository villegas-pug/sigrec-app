package pe.gob.inabif.sigrec.intervencion.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.intervencion.dtos.*;
import pe.gob.inabif.sigrec.intervencion.service.IntervencionService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/intervenciones")
@RequiredArgsConstructor
class IntervencionController {
    private final IntervencionService servicio;

    @GetMapping
    ApiResponse<List<IntervencionResponse>> listar() { return ApiResponse.ok(servicio.listar()); }

    @PostMapping
    ResponseEntity<ApiResponse<IntervencionResponse.Cambio>> crear(@Valid @RequestBody CreateIntervencionRequest request) {
        return ApiResponse.created(servicio.crear(request));
    }

    @PutMapping("/{codigo}")
    ApiResponse<IntervencionResponse.Cambio> editar(@PathVariable String codigo, @Valid @RequestBody UpdateIntervencionRequest request) {
        return ApiResponse.ok(servicio.editar(codigo, request));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<IntervencionResponse.Cambio> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<IntervencionResponse.Cambio> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, null));
    }
}
