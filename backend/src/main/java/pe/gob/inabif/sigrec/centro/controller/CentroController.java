package pe.gob.inabif.sigrec.centro.controller;

import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.centro.dtos.CreateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.UpdateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.centro.service.JerarquiaQueries;
import pe.gob.inabif.sigrec.centro.dtos.JerarquiaResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/centros")
public class CentroController {
    private final CentroService service;
    private final JerarquiaQueries queries;

    @GetMapping("/jerarquia")
    public ApiResponse<JerarquiaResponse> consultar() { return ApiResponse.ok(queries.consultar()); }

    @PostMapping
    public ResponseEntity<ApiResponse<CambioResponse<CentroResponse>>> crear(@Valid @RequestBody CreateCentroRequest datos) {
        return ApiResponse.created(service.crear(datos));
    }

    @PutMapping("/{codigo}")
    public ApiResponse<CambioResponse<CentroResponse>> editar(@PathVariable String codigo, @Valid @RequestBody UpdateCentroRequest datos) {
        return ApiResponse.ok(service.editar(codigo, datos));
    }

    @PostMapping("/{codigo}/anular")
    public ApiResponse<CentroResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest datos) {
        return ApiResponse.ok(service.cambiarEstado(codigo, datos.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    public ApiResponse<CentroResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(service.cambiarEstado(codigo, null));
    }
}
