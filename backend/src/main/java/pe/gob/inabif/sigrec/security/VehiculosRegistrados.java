package pe.gob.inabif.sigrec.security;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;

@Component
@RequiredArgsConstructor
public class VehiculosRegistrados {
    private final VehiculoRepository vehiculos;

    public Optional<String> centro(String codigo) {
        return vehiculos.findByCodigo(codigo).map(v -> v.getCentro().codigo());
    }

    public Optional<String> centroVigente(String codigo) {
        return vehiculos.findByCodigo(codigo).filter(Vehiculo::vigente).map(v -> v.getCentro().codigo());
    }
}
