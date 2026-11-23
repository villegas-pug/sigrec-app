package pe.gob.inabif.sigrec;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.security.MovilidadAcceso;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;

class MovilidadResumenAccesoTest {
    private final Acceso acceso = mock(Acceso.class);
    private final VehiculoRepository repositorio = mock(VehiculoRepository.class);
    private final MovilidadAcceso movilidad = new MovilidadAcceso(acceso, repositorio);

    private Acceso.Asignacion asignacion(String alcance, String centro, String vehiculo, String ruta) {
        return new Acceso.Asignacion(1L, "TEST", "Test", alcance,
                centro == null ? null : new Acceso.ContextoCentro(centro, centro),
                vehiculo, List.of(ruta), List.of());
    }

    @Test
    void combinaAmbitosAutorizadosYDescartaRutasAjenas() {
        when(acceso.concesiones()).thenReturn(List.of(
                asignacion("CENTRO", "A", null, "centros"),
                asignacion("CENTRO", "A", null, "centros"),
                asignacion("VEHICULO", "B", "B-V01", "vehiculos"),
                asignacion("GLOBAL", null, null, "servicios")));
        movilidad.listarAtencion("vehiculos", "centros");
        verify(repositorio).atencionAmbito(List.of("A"), List.of("B-V01"));
        verify(repositorio, never()).atencionGlobal();
    }

    @Test
    void globalYDenegacionConservanReglasDeMovilidad() {
        when(acceso.concesiones()).thenReturn(List.of(asignacion("GLOBAL", null, null, "vehiculos")));
        movilidad.listarAtencion("vehiculos", "centros");
        verify(repositorio).atencionGlobal();
        when(acceso.concesiones()).thenReturn(List.of(asignacion("GLOBAL", null, null, "servicios")));
        assertThrows(AccessDeniedException.class, () -> movilidad.listarAtencion("vehiculos", "centros"));
        verifyNoMoreInteractions(repositorio);
    }
}
