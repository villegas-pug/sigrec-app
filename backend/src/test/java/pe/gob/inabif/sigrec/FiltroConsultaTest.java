package pe.gob.inabif.sigrec;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** SPEC 052: rango semiabierto de la fecha de registro y validación de los filtros de cabecera. */
class FiltroConsultaTest {

    @Test
    void sinFiltrosIncluyeCualquierFecha() {
        assertThat(FiltroConsulta.TODO.incluye(LocalDateTime.of(2001, 1, 1, 0, 0))).isTrue();
        assertThat(FiltroConsulta.TODO.desde()).isNull();
        assertThat(FiltroConsulta.TODO.hasta()).isNull();
    }

    @Test
    void anioCubreDeEneroADiciembre() {
        var filtro = new FiltroConsulta(null, 2026, null);
        assertThat(filtro.incluye(LocalDateTime.of(2026, 1, 1, 0, 0))).isTrue();
        assertThat(filtro.incluye(LocalDateTime.of(2026, 12, 31, 23, 59, 59))).isTrue();
        assertThat(filtro.incluye(LocalDateTime.of(2027, 1, 1, 0, 0))).isFalse();
        assertThat(filtro.incluye(null)).isFalse();
    }

    @Test
    void mesCubreSoloEseMesIncluidoFebreroBisiesto() {
        var filtro = new FiltroConsulta(null, 2028, 2);
        assertThat(filtro.incluye(LocalDateTime.of(2028, 2, 29, 12, 0))).isTrue();
        assertThat(filtro.incluye(LocalDateTime.of(2028, 3, 1, 0, 0))).isFalse();
        assertThat(filtro.incluye(LocalDateTime.of(2028, 1, 31, 23, 59))).isFalse();
    }

    @Test
    void diciembrePasaAlAnioSiguiente() {
        assertThat(new FiltroConsulta(null, 2026, 12).hasta()).isEqualTo(LocalDateTime.of(2027, 1, 1, 0, 0));
    }

    @Test
    void centroVacioEquivaleATodos() {
        assertThat(new FiltroConsulta("  ", null, null).centro()).isNull();
        assertThat(new FiltroConsulta("  ", null, null).deCentro("XYZ")).isTrue();
        assertThat(new FiltroConsulta("ABC", null, null).deCentro("XYZ")).isFalse();
    }

    @Test
    void soloCentrosQuitaElPeriodoYLimitaLosCentros() {
        var filtro = new FiltroConsulta(null, 2026, 5).soloCentros(java.util.Set.of("ABC"));
        assertThat(filtro.porPeriodo()).isFalse();
        assertThat(filtro.deCentro("ABC")).isTrue();
        assertThat(filtro.deCentro("XYZ")).isFalse();
        assertThat(new FiltroConsulta("XYZ", null, null).soloCentros(java.util.Set.of("ABC")).deCentro("XYZ")).isFalse();
    }

    @Test
    void rechazaFiltrosInvalidos() {
        assertThatThrownBy(() -> new FiltroConsulta(null, null, 3)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> new FiltroConsulta(null, 2026, 13)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> new FiltroConsulta("abc", null, null)).isInstanceOf(ResponseStatusException.class);
    }
}
