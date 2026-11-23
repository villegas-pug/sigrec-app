package pe.gob.inabif.sigrec.inicio.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;
import pe.gob.inabif.sigrec.inicio.service.InicioService;
import pe.gob.inabif.sigrec.inicio.service.ResumenJerarquia;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenJerarquiaResponse;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenVehiculosResponse;
import pe.gob.inabif.sigrec.inicio.service.ResumenVehiculos;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/inicio")
@RequiredArgsConstructor
class InicioController {
    private final InicioService inicio;
    private final ResumenJerarquia jerarquia;
    private final ResumenVehiculos vehiculos;

    /** SPEC 041: una sola llamada para Inicio, en lugar de una por colección. */
    @GetMapping("/datos")
    ApiResponse<InicioDatosResponse> datos() { return ApiResponse.ok(inicio.consultar()); }

    @GetMapping("/resumen-jerarquia")
    ApiResponse<ResumenJerarquiaResponse> resumenJerarquia() { return ApiResponse.ok(jerarquia.consultar()); }

    @GetMapping("/resumen-vehiculos")
    ApiResponse<ResumenVehiculosResponse> resumenVehiculos() { return ApiResponse.ok(vehiculos.consultar()); }
}
