package pe.gob.inabif.sigrec.servicio.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.servicio.dtos.*;
import pe.gob.inabif.sigrec.servicio.service.ServicioService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/servicios")
@RequiredArgsConstructor
class ServicioController {
    private final ServicioService servicios;

    @GetMapping
    ApiResponse<List<ServicioResponse>> listar() { return ApiResponse.ok(servicios.listar()); }

    @PostMapping
    org.springframework.http.ResponseEntity<ApiResponse<ServicioResponse>> crear(@Valid @RequestBody CreateServicioRequest request) {
        return ApiResponse.created(servicios.crear(request));
    }

    @PutMapping("/{codigo}")
    ApiResponse<ServicioResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateServicioRequest request) {
        return ApiResponse.ok(servicios.editar(codigo, request));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<ServicioResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicios.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<ServicioResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(servicios.cambiarEstado(codigo, null));
    }

    @PutMapping("/{codigo}/periodos/{anio}/{numero}")
    ApiResponse<ServicioResponse> informarPeriodo(@PathVariable String codigo, @PathVariable int anio, @PathVariable int numero,
                                                 @Valid @RequestBody UpdatePeriodoRequest request) {
        return ApiResponse.ok(servicios.informarPeriodo(codigo, anio, numero, request));
    }

    @PostMapping("/{codigo}/hechos")
    ApiResponse<ServicioResponse> crearHecho(@PathVariable String codigo, @Valid @RequestBody HechoServicioRequest request) {
        return ApiResponse.ok(servicios.guardarHecho(codigo, null, request));
    }

    @PutMapping("/{codigo}/hechos/{hecho}")
    ApiResponse<ServicioResponse> editarHecho(@PathVariable String codigo, @PathVariable String hecho,
                                            @Valid @RequestBody HechoServicioRequest request) {
        return ApiResponse.ok(servicios.guardarHecho(codigo, hecho, request));
    }

    @PostMapping("/{codigo}/hechos/{hecho}/anular")
    ApiResponse<ServicioResponse> anularHecho(@PathVariable String codigo, @PathVariable String hecho,
                                             @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicios.cambiarEstadoHecho(codigo, hecho, request.motivo()));
    }

    @PostMapping("/{codigo}/hechos/{hecho}/reactivar")
    ApiResponse<ServicioResponse> reactivarHecho(@PathVariable String codigo, @PathVariable String hecho) {
        return ApiResponse.ok(servicios.cambiarEstadoHecho(codigo, hecho, null));
    }
}
