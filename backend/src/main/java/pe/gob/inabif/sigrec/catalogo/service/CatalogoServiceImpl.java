package pe.gob.inabif.sigrec.catalogo.service;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.catalogo.dtos.CatalogoResponse;
import pe.gob.inabif.sigrec.catalogo.mappers.CatalogoResponseMapper;
import pe.gob.inabif.sigrec.catalogo.mappers.CatalogoEntityMapper;

import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@lombok.RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogoServiceImpl implements CatalogoService {
    private final CatalogoRepository catalogos;

    private final CatalogoEntityMapper entityMapper;
    private final CatalogoResponseMapper responseMapper;

    public Catalogo obtener(String dominio, String codigo) {
        if (codigo == null) return null;
        return catalogos.findByDominioAndCodigo(dominio, codigo.toUpperCase(Locale.ROOT))
                .filter(Catalogo::vigente)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El valor no pertenece al catálogo " + dominio + "."));
    }

    public List<Catalogo> elementosBase() {
        return catalogos.findByDominioOrderById("ELEMENTO_BASE").stream().filter(Catalogo::vigente).toList();
    }

    public List<CatalogoResponse> listar(String dominio) {
        var records = dominio == null ? catalogos.findAllByOrderById()
                : catalogos.findByDominioOrderById(dominio.toUpperCase(Locale.ROOT));
        return records.stream().filter(Catalogo::vigente).map(entityMapper::toModel).map(responseMapper::toResponse).toList();
    }
}
