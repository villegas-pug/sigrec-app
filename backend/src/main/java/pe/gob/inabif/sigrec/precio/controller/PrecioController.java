package pe.gob.inabif.sigrec.precio.controller;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pe.gob.inabif.sigrec.precio.dtos.PrecioResponse;
import pe.gob.inabif.sigrec.precio.dtos.UpdatePrecioRequest;
import pe.gob.inabif.sigrec.precio.service.PrecioService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/precios")
@RequiredArgsConstructor
class PrecioController {
    private final PrecioService precios;

    @GetMapping
    ApiResponse<List<PrecioResponse>> listar() {
        return ApiResponse.ok(precios.listar());
    }

    @PutMapping("/{tipo}")
    ApiResponse<PrecioResponse> informar(@PathVariable String tipo, @Valid @RequestBody UpdatePrecioRequest request) {
        return ApiResponse.ok(precios.informar(tipo, request));
    }
}
