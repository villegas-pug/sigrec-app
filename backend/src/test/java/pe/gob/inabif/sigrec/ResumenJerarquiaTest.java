package pe.gob.inabif.sigrec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenJerarquiaResponse;
import pe.gob.inabif.sigrec.inicio.service.ResumenJerarquia;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

class ResumenJerarquiaTest {
    private final CentroRepository centros = mock(CentroRepository.class);
    private final ModuloRepository modulos = mock(ModuloRepository.class);
    private final AmbienteRepository ambientes = mock(AmbienteRepository.class);
    private final Acceso acceso = mock(Acceso.class);
    private final ResumenJerarquia resumen = new ResumenJerarquia(centros, modulos, ambientes, acceso);
    private final Sello anulado = new Sello("2026-01-01", "Prueba", "Prueba");

    @Test
    void cuentaSegunReglasDeInicioIncluyendoAmbienteDeModuloAnulado() {
        var activo = mock(Centro.class);
        var inactivo = mock(Centro.class);
        when(activo.id()).thenReturn(1L);
        when(inactivo.anulacion()).thenReturn(anulado);
        var modulo = mock(Modulo.class);
        var moduloAnulado = mock(Modulo.class);
        when(modulo.id()).thenReturn(10L);
        when(moduloAnulado.id()).thenReturn(11L);
        when(moduloAnulado.anulacion()).thenReturn(anulado);
        var ambiente = mock(Ambiente.class);
        var ambienteEnModuloAnulado = mock(Ambiente.class);
        var ambienteAnulado = mock(Ambiente.class);
        when(ambienteAnulado.anulacion()).thenReturn(anulado);
        when(acceso.consultaCentros()).thenReturn(List.of(asignacion("GLOBAL", null)));
        when(centros.findAllByOrderById()).thenReturn(List.of(activo, inactivo));
        when(modulos.findByCentroIdInOrderById(anyCollection())).thenReturn(List.of(modulo, moduloAnulado));
        when(ambientes.findByModuloIdInOrderById(anyCollection()))
                .thenReturn(List.of(ambiente, ambienteEnModuloAnulado, ambienteAnulado));

        assertEquals(new ResumenJerarquiaResponse(1, 1, 2), resumen.consultar());
        verify(modulos).findByCentroIdInOrderById(java.util.Set.of(1L));
        verify(ambientes).findByModuloIdInOrderById(List.of(10L, 11L));
    }

    @Test
    void respetaAmbitoYNoConsultaHijosSinCentrosVigentes() {
        when(acceso.consultaCentros()).thenReturn(List.of(asignacion("CENTRO", new Acceso.ContextoCentro("001", "Centro"))));
        when(centros.findByCodigoInOrderById(List.of("001"))).thenReturn(List.of());

        assertEquals(new ResumenJerarquiaResponse(0, 0, 0), resumen.consultar());
        verifyNoInteractions(modulos, ambientes);
        verify(centros, never()).findAllByOrderById();
    }

    private static Acceso.Asignacion asignacion(String alcance, Acceso.ContextoCentro centro) {
        return new Acceso.Asignacion(1L, "TEST", "Test", alcance, centro, null, List.of("centros"), List.of());
    }
}
