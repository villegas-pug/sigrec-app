package pe.gob.inabif.sigrec.inicio.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenJerarquiaResponse;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.security.Acceso;

@Service
@RequiredArgsConstructor
public class ResumenJerarquia {
    private final CentroRepository centros;
    private final ModuloRepository modulos;
    private final AmbienteRepository ambientes;
    private final Acceso acceso;

    @Transactional(readOnly = true)
    public ResumenJerarquiaResponse consultar() {
        var asignaciones = acceso.consultaCentros();
        var codigos = asignaciones.stream().filter(a -> a.centro() != null)
                .map(a -> a.centro().codigo()).distinct().toList();
        var cars = asignaciones.stream().anyMatch(Acceso.Asignacion::global)
                ? centros.findAllByOrderById() : centros.findByCodigoInOrderById(codigos);
        var activos = cars.stream().filter(c -> c.anulacion() == null).toList();
        if (activos.isEmpty()) return new ResumenJerarquiaResponse(0, 0, 0);
        Set<Long> ids = activos.stream().map(Centro::id).collect(Collectors.toSet());
        var todosModulos = modulos.findByCentroIdInOrderById(ids);
        var idsModulos = todosModulos.stream().map(Modulo::id).toList();
        long totalModulos = todosModulos.stream().filter(m -> m.anulacion() == null).count();
        // No se excluyen módulos anulados: ambientesDeCar cuenta sus ambientes vigentes.
        var espacios = idsModulos.isEmpty() ? List.<pe.gob.inabif.sigrec.ambiente.model.Ambiente>of()
                : ambientes.findByModuloIdInOrderById(idsModulos);
        long totalAmbientes = espacios.stream().filter(a -> a.anulacion() == null).count();
        return new ResumenJerarquiaResponse(activos.size(), totalModulos, totalAmbientes);
    }
}
