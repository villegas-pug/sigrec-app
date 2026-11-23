package pe.gob.inabif.sigrec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
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

class EquivalenciaJerarquiaTest {
    private record Resultado(String nombre, ResumenJerarquiaResponse resumen) {}

    @Test
    void exportaResultadosRealesParaComparacionConFrontend() throws Exception {
        var json = new ObjectMapper();
        var casos = json.readTree(Path.of("src/test/resources/resumen-jerarquia-casos.json").toFile());
        var resultados = new ArrayList<Resultado>();
        for (var caso : casos) {
            var centros = mock(CentroRepository.class);
            var modulos = mock(ModuloRepository.class);
            var ambientes = mock(AmbienteRepository.class);
            var acceso = mock(Acceso.class);
            var sello = new Sello("2026-01-01", "Prueba", "Prueba");
            when(acceso.consultaCentros()).thenReturn(List.of(
                    new Acceso.Asignacion(1L, "TEST", "Test", "GLOBAL", null, null, List.of("centros"), List.of())));
            var cars = new ArrayList<Centro>();
            for (var c : caso.get("cars")) {
                var entidad = mock(Centro.class);
                when(entidad.id()).thenReturn(c.get("id").asLong());
                if (c.get("anulado").asBoolean()) when(entidad.anulacion()).thenReturn(sello);
                cars.add(entidad);
            }
            when(centros.findAllByOrderById()).thenReturn(cars);
            when(modulos.findByCentroIdInOrderById(anyCollection())).thenAnswer(inv -> {
                java.util.Collection<Long> ids = inv.getArgument(0);
                var encontrados = new ArrayList<Modulo>();
                for (var m : caso.get("modulos")) {
                    if (!ids.contains(m.get("carId").asLong())) continue;
                    var entidad = mock(Modulo.class);
                    when(entidad.id()).thenReturn(m.get("id").asLong());
                    if (m.get("anulado").asBoolean()) when(entidad.anulacion()).thenReturn(sello);
                    encontrados.add(entidad);
                }
                return encontrados;
            });
            when(ambientes.findByModuloIdInOrderById(anyCollection())).thenAnswer(inv -> {
                java.util.Collection<Long> ids = inv.getArgument(0);
                var encontrados = new ArrayList<Ambiente>();
                for (var a : caso.get("ambientes")) {
                    if (!ids.contains(a.get("moduloId").asLong())) continue;
                    var entidad = mock(Ambiente.class);
                    if (a.get("anulado").asBoolean()) when(entidad.anulacion()).thenReturn(sello);
                    encontrados.add(entidad);
                }
                return encontrados;
            });
            var resultado = new ResumenJerarquia(centros, modulos, ambientes, acceso).consultar();
            JsonNode esperado = caso.get("esperado");
            assertEquals(new ResumenJerarquiaResponse(esperado.get("centros").asLong(), esperado.get("modulos").asLong(),
                    esperado.get("ambientes").asLong()), resultado, caso.get("nombre").asText());
            resultados.add(new Resultado(caso.get("nombre").asText(), resultado));
        }
        Files.createDirectories(Path.of("target"));
        json.writeValue(Path.of("target/resumen-jerarquia-resultados.json").toFile(), resultados);
    }
}
