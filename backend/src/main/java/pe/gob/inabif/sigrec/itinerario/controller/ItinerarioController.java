package pe.gob.inabif.sigrec.itinerario.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.itinerario.dtos.*;
import pe.gob.inabif.sigrec.itinerario.service.ItinerarioService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/itinerarios")
@RequiredArgsConstructor
class ItinerarioController {
    private final ItinerarioService servicio;

    @GetMapping
    ApiResponse<List<ItinerarioResponse>> listar() { return ApiResponse.ok(servicio.listar()); }

    @PostMapping
    ResponseEntity<ApiResponse<ItinerarioResponse>> crear(@Valid @RequestBody CreateItinerarioRequest request) {
        return ApiResponse.created(servicio.crear(request));
    }

    @PutMapping("/{codigo}")
    ApiResponse<ItinerarioResponse> editar(@PathVariable String codigo, @Valid @RequestBody UpdateItinerarioRequest request) {
        return ApiResponse.ok(servicio.editar(codigo, request));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<ItinerarioResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<ItinerarioResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(servicio.cambiarEstado(codigo, null));
    }
    @PostMapping("/{codigo}/ejecucion")
    ApiResponse<ItinerarioResponse> ejecutar(@PathVariable String codigo, @Valid @RequestBody ItinerarioDatos.Tramo tramo) {
        return ApiResponse.ok(servicio.ejecutar(codigo, tramo));
    }

}
