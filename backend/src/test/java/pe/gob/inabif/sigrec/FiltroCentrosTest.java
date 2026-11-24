package pe.gob.inabif.sigrec;

import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.service.FiltroCentros;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/** SPEC 052: con registro=CENTRO el periodo se traduce en los centros registrados en él. */
class FiltroCentrosTest {
    private final CentroRepository centros = mock(CentroRepository.class);
    private final FiltroCentros filtros = new FiltroCentros(centros);

    private static Centro centro(String codigo, LocalDateTime registro) {
        var c = mock(Centro.class);
        when(c.codigo()).thenReturn(codigo);
        when(c.fechaRegistro()).thenReturn(registro);
        return c;
    }

    @Test
    void registroCentroLimitaALosCentrosDelPeriodo() {
        var lista = List.of(centro("AAA", LocalDateTime.of(2026, 3, 10, 9, 0)),
                centro("BBB", LocalDateTime.of(2026, 4, 1, 0, 0)));
        when(centros.findAllByOrderById()).thenReturn(lista);
        var filtro = filtros.filtro(null, 2026, 3, "CENTRO");
        assertThat(filtro.porPeriodo()).isFalse();
        assertThat(filtro.deCentro("AAA")).isTrue();
        assertThat(filtro.deCentro("BBB")).isFalse();
        // Los registros de un centro del periodo se admiten aunque se hayan registrado en otra fecha.
        assertThat(filtro.admite("AAA", LocalDateTime.of(2027, 1, 1, 0, 0))).isTrue();
    }

    @Test
    void sinRegistroCentroElPeriodoSeAplicaAlRegistro() {
        var filtro = filtros.filtro("AAA", 2026, null, null);
        assertThat(filtro.porPeriodo()).isTrue();
        assertThat(filtro.admite("AAA", LocalDateTime.of(2025, 12, 31, 23, 0))).isFalse();
        verifyNoInteractions(centros);
    }
}
