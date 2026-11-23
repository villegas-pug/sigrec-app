package pe.gob.inabif.sigrec.catalogo.controller;

import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import pe.gob.inabif.sigrec.catalogo.dtos.*;
import pe.gob.inabif.sigrec.catalogo.service.TipoBienService;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/catalogos/tipos-bien")
@RequiredArgsConstructor
class TipoBienController {
    private final TipoBienService tipos;

    @GetMapping
    ApiResponse<List<TipoBienResponse>> listar() { return ApiResponse.ok(tipos.listar()); }

    @PostMapping
    ResponseEntity<ApiResponse<TipoBienResponse>> crear(@Valid @RequestBody TipoBienRequest datos) {
        return ApiResponse.created(tipos.crear(datos));
    }

    @PutMapping("/{codigo}")
    ApiResponse<TipoBienResponse> editar(@PathVariable String codigo, @Valid @RequestBody TipoBienRequest datos) {
        return ApiResponse.ok(tipos.editar(codigo, datos));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<TipoBienResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest datos) {
        return ApiResponse.ok(tipos.cambiarEstado(codigo, datos.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<TipoBienResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(tipos.cambiarEstado(codigo, null));
    }
}
