package pe.gob.inabif.sigrec.catalogo.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import pe.gob.inabif.sigrec.bien.repository.BienRepository;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.catalogo.dtos.*;
import pe.gob.inabif.sigrec.catalogo.mappers.*;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class TipoBienServiceImpl implements TipoBienService {
    private static final String DOMINIO = "TIPO_BIEN";
    private final CatalogoRepository repository;
    private final CatalogoService catalogos;
    private final BienRepository bienes;
    private final ReglasBien reglas;
    private final Acceso acceso;
    private final TipoBienEntityMapper mapper;
    private final TipoBienResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TipoBienResponse> listar() {
        return repository.findByDominioOrderById(DOMINIO).stream().map(responseMapper::toResponse).toList();
    }

    @Override
    public TipoBienResponse crear(TipoBienRequest request) {
        acceso.global("tipoBien.registrar");
        var entidad = new Catalogo();
        entidad.setDominio(DOMINIO);
        entidad.setCodigo(siguiente(request.nombre()));
        copiar(request, entidad);
        entidad.registrar(acceso.actor());
        return responseMapper.toResponse(repository.save(entidad));
    }

    @Override
    public TipoBienResponse editar(String codigo, TipoBienRequest request) {
        acceso.global("tipoBien.actualizar");
        var tipo = bloquear(codigo);
        if (!tipo.vigente()) throw ReglasBien.conflicto("El tipo de bien está anulado.");
        copiar(request, tipo);
        tipo.actualizar(acceso.actor());
        return responseMapper.toResponse(tipo);
    }

    @Override
    public TipoBienResponse cambiarEstado(String codigo, String motivo) {
        acceso.global("tipoBien.anular");
        var tipo = bloquear(codigo);
        var actor = acceso.actor();
        if (motivo == null) {
            if (!tipo.vigente()) tipo.reactivar(actor);
        } else if (tipo.vigente()) {
            if (bienes.findByTipoId(tipo.id()).stream().anyMatch(reglas::activo)) {
                throw ReglasBien.conflicto("Resuelva primero los bienes activos de ese tipo.");
            }
            tipo.anular(actor, motivo.strip());
        }
        return responseMapper.toResponse(tipo);
    }

    private Catalogo bloquear(String codigo) {
        return repository.bloquear(DOMINIO, codigo.toUpperCase(Locale.ROOT)).orElseThrow(ReglasBien::noDisponible);
    }

    private void copiar(TipoBienRequest request, Catalogo entidad) {
        mapper.fromRequest(request, entidad);
        entidad.setCategoria(catalogos.obtener("CATEGORIA_BIEN", request.categoria()));
    }

    private String siguiente(String nombre) {
        var base = Normalizer.normalize(nombre.strip().toUpperCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replaceAll("[^A-Z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.isBlank()) throw ReglasBien.invalido("El nombre del tipo de bien debe contener letras o números.");
        base = base.substring(0, Math.min(34, base.length()));
        var codigo = base;
        for (int i = 2; repository.findByDominioAndCodigo(DOMINIO, codigo).isPresent(); i++) codigo = base + "-" + i;
        return codigo;
    }
}
