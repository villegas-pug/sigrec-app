package pe.gob.inabif.sigrec.bien.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.gob.inabif.sigrec.bien.dtos.*;
import pe.gob.inabif.sigrec.bien.service.BienService;
import pe.gob.inabif.sigrec.bien.service.InventarioConsulta;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.centro.service.FiltroCentros;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bienes")
@RequiredArgsConstructor
public class BienController {
    private final BienService service;
    private final InventarioConsulta consulta;
    private final FiltroCentros filtros;

    /** SPEC 052: filtros de cabecera; el periodo se aplica al registro indicado (bien, hecho o centro dueño). */
    @GetMapping("/datos")
    public ApiResponse<InventarioResponse> inventario(@RequestParam(required = false) String centro,
                                                      @RequestParam(required = false) Integer anio,
                                                      @RequestParam(required = false) Integer mes,
                                                      @RequestParam(required = false) InventarioConsulta.Registro registro) {
        // Con CENTRO el periodo ya se tradujo en centros: no queda periodo por aplicar a bienes ni hechos.
        var filtro = filtros.filtro(centro, anio, mes, registro == null ? null : registro.name());
        return ApiResponse.ok(consulta.consultar(filtro, registro == InventarioConsulta.Registro.CENTRO ? null : registro));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BienResponse>> crear(@Valid @RequestBody CreateBienRequest request) {
        return ApiResponse.created(service.crear(request));
    }

    @PutMapping("/{rotulo}")
    public ApiResponse<BienResponse> editar(@PathVariable String rotulo, @Valid @RequestBody UpdateBienRequest request) {
        return ApiResponse.ok(service.editar(rotulo, request));
    }

    @PostMapping("/verificaciones")
    public ApiResponse<Void> verificarLote(@Valid @RequestBody BienOperaciones.LoteVerificacion request) {
        service.verificarLote(request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/verificacion")
    public ApiResponse<Void> verificar(@PathVariable String rotulo, @Valid @RequestBody BienOperaciones.Verificacion request) {
        service.verificar(rotulo, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/asociacion")
    public ApiResponse<Void> asociar(@PathVariable String rotulo, @Valid @RequestBody BienOperaciones.Asociacion request) {
        service.asociar(rotulo, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/traslado")
    public ApiResponse<Void> trasladar(@PathVariable String rotulo, @Valid @RequestBody BienOperaciones.Traslado request) {
        service.trasladar(rotulo, request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/cerrar-revision")
    public ApiResponse<Void> cerrarRevision(@PathVariable String rotulo) {
        service.cerrarRevision(rotulo);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/anular")
    public ApiResponse<Void> anular(@PathVariable String rotulo, @Valid @RequestBody MotivoRequest request) {
        service.cambiarEstado(rotulo, request.motivo());
        return ApiResponse.ok(null);
    }

    @PostMapping("/{rotulo}/reactivar")
    public ApiResponse<Void> reactivar(@PathVariable String rotulo) {
        service.cambiarEstado(rotulo, null);
        return ApiResponse.ok(null);
    }
}
