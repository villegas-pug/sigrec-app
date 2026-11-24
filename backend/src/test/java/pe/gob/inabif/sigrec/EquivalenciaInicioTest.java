package pe.gob.inabif.sigrec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import pe.gob.inabif.sigrec.inicio.calculo.CalculoInicio;
import pe.gob.inabif.sigrec.inicio.dtos.InicioDatosResponse;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenInicioResponse;

/**
 * SPEC 044. Calcula el resumen de Inicio con los casos compartidos con el frontend y exporta los resultados reales para
 * que {@code frontend/e2e/equivalencia-inicio.cjs} los compare con las reglas anteriores de la SPA. No usa Oracle.
 */
class EquivalenciaInicioTest {
    private static final Path CASOS = Path.of("src/test/resources/resumen-inicio-casos.json");

    private record Resultado(String nombre, ResumenInicioResponse resumen) {}

    private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();

    private ResumenInicioResponse calcular(com.fasterxml.jackson.databind.JsonNode caso) throws Exception {
        var datos = json.treeToValue(caso.get("datos"), InicioDatosResponse.class);
        return CalculoInicio.calcular(datos, List.of(), LocalDate.parse(caso.get("hoy").asText()));
    }

    @Test
    void exportaResultadosRealesParaComparacionConFrontend() throws Exception {
        var casos = json.readTree(CASOS.toFile());
        var resultados = new ArrayList<Resultado>();
        for (var caso : casos) resultados.add(new Resultado(caso.get("nombre").asText(), calcular(caso)));
        Files.createDirectories(Path.of("target"));
        json.writerWithDefaultPrettyPrinter().writeValue(Path.of("target/resumen-inicio-resultados.json").toFile(), resultados);
        assertEquals(casos.size(), resultados.size());
    }

    @Test
    void sinDatosNoGeneraCifrasNiAvisos() throws Exception {
        var resumen = calcular(json.readTree(CASOS.toFile()).get(0));
        assertTrue(resumen.filas().isEmpty());
        assertEquals(0, resumen.jerarquia().centros());
        assertEquals(0, resumen.recorridos().total());
        assertTrue(resumen.avisos().ahora().isEmpty());
        assertTrue(resumen.avisos().proximos().isEmpty());
    }

    @Test
    void soloContarCentrosVigentesYOrdenaLosAvisos() throws Exception {
        var resumen = calcular(json.readTree(CASOS.toFile()).get(1));
        assertEquals(List.of("A01", "B02"), resumen.filas().stream().map(f -> f.car().id()).toList());
        assertEquals(2, resumen.jerarquia().centros());
        // La fumigación vencida y la dotación incompleta de extintores aparecen en la fila del centro Alfa.
        var alfa = resumen.filas().get(0);
        assertEquals("vencido", alfa.fumigacion());
        assertEquals(1, alfa.controles().extintoresFaltantes());
        assertEquals("sin_programar", resumen.filas().get(1).fumigacion());
        // «Ahora» va de lo más grave («da») a lo menos grave («si»); «próximos», por días.
        var pesos = List.of("da", "wa", "in", "si");
        var tonos = resumen.avisos().ahora().stream().map(a -> pesos.indexOf(a.tono())).toList();
        assertEquals(tonos.stream().sorted().toList(), tonos);
        var dias = resumen.avisos().proximos().stream().map(a -> a.dias()).toList();
        assertEquals(dias.stream().sorted().toList(), dias);
    }
}
