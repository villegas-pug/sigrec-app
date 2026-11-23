package pe.gob.inabif.sigrec.inicio.service;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenVehiculosResponse;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.security.MovilidadAcceso;

@Service
@RequiredArgsConstructor
public class ResumenVehiculos {
    private final CentroRepository centros;
    private final Acceso acceso;
    private final MovilidadAcceso movilidad;

    @Transactional(readOnly = true)
    public ResumenVehiculosResponse consultar() {
        var asignaciones = acceso.consultaCentros();
        var codigos = asignaciones.stream().filter(a -> a.centro() != null)
                .map(a -> a.centro().codigo()).distinct().toList();
        var cars = asignaciones.stream().anyMatch(Acceso.Asignacion::global)
                ? centros.findAllByOrderById() : centros.findByCodigoInOrderById(codigos);
        Set<String> activos = cars.stream().filter(c -> c.anulacion() == null)
                .map(c -> c.codigo()).collect(Collectors.toSet());
        long cantidad = 0;
        long sinEstimar = 0;
        var presupuesto = BigDecimal.ZERO;
        // Consultar incluso sin centros conserva las mismas reglas de acceso que /inicio/datos.
        for (var vehiculo : movilidad.listarAtencion("vehiculos", "centros")) {
            if (!activos.contains(vehiculo.carId())) continue;
            cantidad++;
            var monto = vehiculo.presupuestoEstimado();
            if (monto == null) sinEstimar++;
            else presupuesto = presupuesto.add(monto);
        }
        return new ResumenVehiculosResponse(cantidad, presupuesto, sinEstimar);
    }
}
