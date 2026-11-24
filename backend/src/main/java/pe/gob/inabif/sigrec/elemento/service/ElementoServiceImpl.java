package pe.gob.inabif.sigrec.elemento.service;

import pe.gob.inabif.sigrec.elemento.model.Elemento;
import pe.gob.inabif.sigrec.elemento.dtos.ElementoDatos.Adicional;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.elemento.repository.ElementoRepository;
import pe.gob.inabif.sigrec.elemento.mappers.ElementoEntityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.text.Normalizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class ElementoServiceImpl implements ElementoService {
    private final ElementoRepository elementos;
    private final CatalogoService catalogos;

    private final ElementoEntityMapper mapper;

    @Override
    public List<Elemento> reemplazar(Centro centro, Modulo modulo, Ambiente ambiente, Map<String, String> estados,
                              List<Adicional> adicionales, Usuario actor) {
        var previos = obtener(centro, modulo, ambiente).stream().collect(Collectors.toMap(
                Elemento::getClave, Function.identity(), (anterior, siguiente) -> siguiente.vigente() ? siguiente : anterior));
        var deseados = new LinkedHashMap<String, Adicional>();
        var nombres = new HashSet<String>();
        var evaluados = estados == null ? Map.<String, String>of() : estados;
        for (var adicional : adicionales == null ? List.<Adicional>of() : adicionales) {
            var clave = adicional.key();
            if ((!previos.containsKey(clave) && !clave.matches("extra-[a-f0-9-]{36}"))
                    || normalizar(adicional.label()).isEmpty() || !nombres.add(normalizar(adicional.label()))
                    || deseados.putIfAbsent(clave, adicional) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El elemento no es válido o ya existe.");
            }
        }
        for (var estado : evaluados.entrySet()) {
            if (!deseados.containsKey(estado.getKey())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El elemento evaluado no existe.");
            }
        }

        var guardados = new ArrayList<Elemento>();
        for (var deseado : deseados.entrySet()) {
            var clave = deseado.getKey();
            var adicional = deseado.getValue();
            var elemento = previos.remove(clave);
            if (elemento == null) {
                elemento = new Elemento();
                elemento.setClave(clave);
                elemento.setCentro(centro);
                elemento.setModulo(modulo);
                elemento.setAmbiente(ambiente);
                elemento.registrar(actor);
            } else if (!elemento.vigente()) {
                elemento.reactivar(actor);
            } else {
                elemento.actualizar(actor);
            }
            mapper.fromModelToEntity(adicional, elemento);
            elemento.setBase(null);
            elemento.setCondicion(catalogos.obtener("CONDICION", evaluados.get(clave)));
            guardados.add(elementos.save(elemento));
        }
        previos.values().stream().filter(Elemento::vigente).forEach(e -> e.anular(actor, "Se retiró la evaluación."));
        return guardados;
    }

    private List<Elemento> obtener(Centro centro, Modulo modulo, Ambiente ambiente) {
        if (centro != null) return elementos.findByCentroIdInOrderById(List.of(centro.id()));
        if (modulo != null) return elementos.findByModuloIdInOrderById(List.of(modulo.id()));
        return elementos.findByAmbienteIdInOrderById(List.of(ambiente.id()));
    }

    private String normalizar(String value) {
        return Normalizer.normalize(value.strip().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
