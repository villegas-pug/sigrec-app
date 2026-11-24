package pe.gob.inabif.sigrec.foto.controller;

import pe.gob.inabif.sigrec.centro.service.FiltroCentros;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pe.gob.inabif.sigrec.centro.dtos.MotivoRequest;
import pe.gob.inabif.sigrec.foto.dtos.*;
import pe.gob.inabif.sigrec.foto.service.FotoService;
import pe.gob.inabif.sigrec.shared.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/fotos")
@RequiredArgsConstructor
class FotoController {
    private final FotoService fotos;
    private final FiltroCentros filtros;

    @GetMapping
    /** SPEC 052: filtros de cabecera opcionales. */
    ApiResponse<List<FotoResponse>> listar(@RequestParam(required = false) String centro, @RequestParam(required = false) Integer anio,
                                  @RequestParam(required = false) Integer mes, @RequestParam(required = false) String registro) {
        return ApiResponse.ok(fotos.listar(filtros.filtro(centro, anio, mes, registro)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ApiResponse<FotoResponse>> crear(@Valid @RequestPart("datos") CreateFotoRequest datos,
                                                     @RequestPart("archivo") MultipartFile archivo) {
        return ApiResponse.created(fotos.crear(datos, archivo));
    }

    @PutMapping(value = "/{codigo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FotoResponse> editar(@PathVariable String codigo, @Valid @RequestPart("datos") UpdateFotoRequest datos,
                                     @RequestPart(value = "archivo", required = false) MultipartFile archivo) {
        return ApiResponse.ok(fotos.editar(codigo, datos, archivo));
    }

    @PostMapping("/{codigo}/anular")
    ApiResponse<FotoResponse> anular(@PathVariable String codigo, @Valid @RequestBody MotivoRequest request) {
        return ApiResponse.ok(fotos.cambiarEstado(codigo, request.motivo()));
    }

    @PostMapping("/{codigo}/reactivar")
    ApiResponse<FotoResponse> reactivar(@PathVariable String codigo) {
        return ApiResponse.ok(fotos.cambiarEstado(codigo, null));
    }

    @GetMapping("/{codigo}/contenido")
    ResponseEntity<byte[]> contenido(@PathVariable String codigo) {
        var contenido = fotos.contenido(codigo);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(contenido.tipo()))
                .cacheControl(CacheControl.noStore()).header("Content-Security-Policy", "sandbox").body(contenido.bytes());
    }
}
