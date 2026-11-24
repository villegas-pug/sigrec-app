package pe.gob.inabif.sigrec.centro.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import org.junit.jupiter.api.Test;

/** SPEC 054: tokenización del término de búsqueda de unidades orgánicas. */
class TextoOracleTest {
    @Test
    void separaPorEspaciosYPuntuacionSinDistinguirExtremos() {
        assertEquals(List.of("UNIDAD", "DE", "SERVICIOS", "DE", "PROTECCIÓN", "DE", "NIÑAS", "NIÑOS", "Y", "ADOLESCENTES"),
                TextoOracle.palabras("  UNIDAD DE  SERVICIOS DE PROTECCIÓN DE NIÑAS, NIÑOS Y ADOLESCENTES ")
                        .stream().map(String::toUpperCase).toList());
    }

    @Test
    void trataNbspSaltosYSignosComoSeparadores() {
        assertEquals(List.of("niñas", "niños", "usp"), TextoOracle.palabras("niñas, niños\n(usp)."));
    }

    @Test
    void componeTildesDescompuestas() {
        assertEquals(List.of("PROTECCIÓN"), TextoOracle.palabras("PROTECCIÓN"));
    }

    @Test
    void sinLetrasNiDigitosNoHayPalabras() {
        assertEquals(List.of(), TextoOracle.palabras(" ... , "));
    }
}
