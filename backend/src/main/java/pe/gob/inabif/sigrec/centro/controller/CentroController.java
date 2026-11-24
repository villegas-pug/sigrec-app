package pe.gob.inabif.sigrec.centro.controller;

import pe.gob.inabif.sigrec.centro.dtos.CreateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.UpdateCentroRequest;
import pe.gob.inabif.sigrec.centro.dtos.CentroResponse;
import pe.gob.inabif.sigrec.centro.dtos.CambioResponse;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;
import pe.gob.inabif.sigrec.centro.service.JerarquiaQueries;
import pe.gob.inabif.sigrec.centro.dtos.JerarquiaResponse;
import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse.Pagina;
import pe.gob.inabif.sigrec.centro.repository.UnidadOrganicaRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/centros")
public class CentroController {
    private final CentroService service;
    private final JerarquiaQueries queries;
    private final UnidadOrganicaRepository unidades;
    private final Acceso acceso;

    @GetMapping("/jerarquia")
    public ApiResponse<JerarquiaResponse> consultar() { return ApiResponse.ok(queries.consultar()); }

    @GetMapping("/unidades-organicas")
    public ApiResponse<Pagina> buscarUnidades(@RequestParam String q, @RequestParam(defaultValue = "1") int pagina,
                                             @RequestParam(required = false) String centro) {
        String texto = q.strip();
        int longitud = texto.codePointCount(0, texto.length());
        if (longitud < 3 || longitud > 240 || pagina < 1 || (centro != null && !centro.matches("[A-Z]{3}"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revise el texto de búsqueda, el centro y la página.");
        }
        acceso.accionCentro(centro == null ? "centro.registrar" : "centro.actualizar", centro);
        return ApiResponse.ok(unidades.buscar(texto, pagina, centro));
    }

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
