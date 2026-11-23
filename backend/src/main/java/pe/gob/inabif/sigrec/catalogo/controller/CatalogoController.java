package pe.gob.inabif.sigrec.catalogo.controller;

import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.catalogo.dtos.CatalogoResponse;

import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/catalogos")
class CatalogoController {
    private final CatalogoService catalogos;

    CatalogoController(CatalogoService catalogos) { this.catalogos = catalogos; }

    @GetMapping
    ApiResponse<List<CatalogoResponse>> listar(@RequestParam(required = false) String dominio) {
        return ApiResponse.ok(catalogos.listar(dominio));
    }
}
