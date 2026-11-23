package pe.gob.inabif.sigrec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.inicio.dtos.ResumenVehiculosResponse;
import pe.gob.inabif.sigrec.inicio.service.ResumenVehiculos;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;
import pe.gob.inabif.sigrec.vehiculo.dtos.VehiculoAtencion;
import pe.gob.inabif.sigrec.security.MovilidadAcceso;

class EquivalenciaVehiculosTest {
    private record Resultado(String nombre, ResumenVehiculosResponse resumen) {}

    @Test
    void restringeCentrosYConservaLaConsultaDeVehiculos() {
        var centros = mock(CentroRepository.class);
        var acceso = mock(Acceso.class);
        var vehiculos = mock(MovilidadAcceso.class);
        var centro = mock(Centro.class);
        when(centro.codigo()).thenReturn("A");
        when(acceso.consultaCentros()).thenReturn(List.of(new Acceso.Asignacion(
                1L, "TEST", "Test", "CENTRO", new Acceso.ContextoCentro("A", "Centro A"), null,
                List.of("centros"), List.of())));
        when(centros.findByCodigoInOrderById(List.of("A"))).thenReturn(List.of(centro));
        when(vehiculos.listarAtencion("vehiculos", "centros")).thenReturn(List.of());
        var resultado = new ResumenVehiculos(centros, acceso, vehiculos).consultar();
        assertEquals(0, resultado.requierenAtencion());
        verify(centros, never()).findAllByOrderById();
        verify(vehiculos).listarAtencion("vehiculos", "centros");
    }

    @Test
    void exportaResultadosRealesParaComparacionConFrontend() throws Exception {
        var json = new ObjectMapper();
        var casos = json.readTree(Path.of("src/test/resources/resumen-vehiculos-casos.json").toFile());
        var resultados = new ArrayList<Resultado>();
        for (var caso : casos) {
            var centros = mock(CentroRepository.class);
            var acceso = mock(Acceso.class);
            var vehiculos = mock(MovilidadAcceso.class);
            var sello = new Sello("2026-01-01", "Prueba", "Prueba");
            when(acceso.consultaCentros()).thenReturn(List.of(
                    new Acceso.Asignacion(1L, "TEST", "Test", "GLOBAL", null, null, List.of("centros"), List.of())));
            var cars = new ArrayList<Centro>();
            for (var c : caso.get("cars")) {
                var centro = mock(Centro.class);
                when(centro.codigo()).thenReturn(c.get("id").asText());
                if (c.path("anulado").asBoolean()) when(centro.anulacion()).thenReturn(sello);
                cars.add(centro);
            }
            when(centros.findAllByOrderById()).thenReturn(cars);
            var registros = new ArrayList<VehiculoAtencion>();
            for (var v : caso.get("vehiculos")) {
                var estado = v.path("estadoOperativo").asText();
                if (v.path("anulado").asBoolean() || !List.of("detenido", "requiereMantenimiento").contains(estado)) continue;
                var monto = v.path("monto").isNumber() ? v.get("monto").decimalValue() : null;
                registros.add(new VehiculoAtencion(v.get("carId").asText(), monto));
            }
            when(vehiculos.listarAtencion("vehiculos", "centros")).thenReturn(registros);
            var resultado = new ResumenVehiculos(centros, acceso, vehiculos).consultar();
            var esperado = caso.get("esperado");
            assertEquals(esperado.get("requierenAtencion").asLong(), resultado.requierenAtencion(), caso.get("nombre").asText());
            assertEquals(0, esperado.get("presupuestoEstimado").decimalValue().compareTo(resultado.presupuestoEstimado()));
            assertEquals(esperado.get("sinEstimar").asLong(), resultado.sinEstimar());
            resultados.add(new Resultado(caso.get("nombre").asText(), resultado));
        }
        Files.createDirectories(Path.of("target"));
        json.writeValue(Path.of("target/resumen-vehiculos-resultados.json").toFile(), resultados);
    }
}
