package pe.gob.inabif.sigrec.foto.controller;

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

    @GetMapping
    ApiResponse<List<FotoResponse>> listar() { return ApiResponse.ok(fotos.listar()); }

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
