package pe.gob.inabif.sigrec.incidencia.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.bien.dtos.BienResponse;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.incidencia.dtos.*;
import pe.gob.inabif.sigrec.incidencia.service.IncidenciaService;
import pe.gob.inabif.sigrec.incidencia.service.PatrimonioService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/incidencias")
@RequiredArgsConstructor
public class IncidenciaController {
    private final IncidenciaService service;
    private final PatrimonioService patrimonio;

    @PostMapping
    public ResponseEntity<ApiResponse<IncidenciaResponse>> crear(@Valid @RequestBody CreateIncidenciaRequest request) {
        return ApiResponse.created(service.crear(request));
    }

    @PutMapping("/{codigo}")
    public ApiResponse<IncidenciaResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateIncidenciaRequest request) {
        return ApiResponse.ok(service.editar(codigo, request));
    }

    @PostMapping("/{codigo}/atender")
    public ApiResponse<Void> atender(@PathVariable String codigo, @Valid @RequestBody IncidenciaOperaciones.Atender request) {
        service.atender(codigo, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{codigo}/anular")
    public ApiResponse<Void> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        service.cambiarEstado(codigo, request.motivo());
        return ApiResponse.ok(null);
    }

    @PostMapping("/{codigo}/reactivar")
    public ApiResponse<Void> reactivar(@PathVariable String codigo) {
        service.cambiarEstado(codigo, null);
        return ApiResponse.ok(null);
    }

    @PostMapping("/bajas/{rotulo}")
    public ResponseEntity<ApiResponse<IncidenciaResponse>> baja(@PathVariable String rotulo,
                                                                @Valid @RequestBody IncidenciaOperaciones.Baja request) {
        return ApiResponse.created(patrimonio.darDeBaja(rotulo, request));
    }

    @PostMapping("/reposiciones/{rotulo}")
    public ResponseEntity<ApiResponse<BienResponse>> reponer(@PathVariable String rotulo,
                                                              @Valid @RequestBody IncidenciaOperaciones.Reponer request) {
        return ApiResponse.created(patrimonio.reponer(rotulo, request));
    }

    @PostMapping("/bajas/{codigo}/anular")
    public ApiResponse<Void> anularBaja(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        patrimonio.anularBaja(codigo, request.motivo());
        return ApiResponse.ok(null);
    }

    @PostMapping("/reposiciones/{codigo}/anular")
    public ApiResponse<Void> anularReposicion(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        patrimonio.anularReposicion(codigo, request.motivo());
        return ApiResponse.ok(null);
    }
}
