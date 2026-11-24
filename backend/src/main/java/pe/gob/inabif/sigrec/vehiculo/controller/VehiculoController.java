package pe.gob.inabif.sigrec.vehiculo.controller;

import pe.gob.inabif.sigrec.centro.service.FiltroCentros;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;
import pe.gob.inabif.sigrec.vehiculo.service.VehiculoService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/vehiculos")
@RequiredArgsConstructor
class VehiculoController {
    private final VehiculoService servicio;
    private final FiltroCentros filtros;

    @GetMapping
    /** SPEC 052: filtros de cabecera opcionales. */
    ApiResponse<List<VehiculoResponse>> listar(@RequestParam(required = false) String centro, @RequestParam(required = false) Integer anio,
                                  @RequestParam(required = false) Integer mes, @RequestParam(required = false) String registro) {
        return ApiResponse.ok(servicio.listar(filtros.filtro(centro, anio, mes, registro)));
    }

    @PostMapping
    ResponseEntity<ApiResponse<VehiculoResponse>> crear(@Valid @RequestBody CreateVehiculoRequest request) {
        return ApiResponse.created(servicio.crear(request));
    }

    @PutMapping("/{codigo}")
    ApiResponse<VehiculoResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateVehiculoRequest request) {
        return ApiResponse.ok(servicio.editar(codigo, request));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<VehiculoResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<VehiculoResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, null));
    }
}
