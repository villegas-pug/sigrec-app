package pe.gob.inabif.sigrec.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.combustible.dtos.CombustibleDatos;
import pe.gob.inabif.sigrec.combustible.service.CombustibleServiceImpl;
import pe.gob.inabif.sigrec.itinerario.dtos.ItinerarioDatos;
import pe.gob.inabif.sigrec.itinerario.repository.ItinerarioRepository;
import pe.gob.inabif.sigrec.itinerario.service.ItinerarioServiceImpl;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.vehiculo.dtos.*;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;
import pe.gob.inabif.sigrec.vehiculo.service.VehiculoServiceImpl;

@Component
@Profile("dev")
@Order(40)
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
@RequiredArgsConstructor
public class MovilidadDemoImport implements ApplicationRunner {
    private final ObjectMapper json;
    private final UsuarioRepository usuarios;
    private final VehiculoServiceImpl vehiculos;
    private final VehiculoRepository vehiculosRepo;
    private final ItinerarioServiceImpl itinerarios;
    private final ItinerarioRepository itinerariosRepo;
    private final CombustibleServiceImpl combustible;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        var tecnico = usuarios.findByCodigo("SIGREC_TECNICO").orElseThrow();
        var chofer = usuarios.findByCodigo("demo.chofer").orElseThrow();
        for (var fila : leer("vehiculos")) {
            vehiculos.importar(fila.path("id").asText(), new CreateVehiculoRequest(fila.path("carId").asText(),
                    json.treeToValue(fila, VehiculoDatos.class)), tecnico);
        }
        for (var fila : leer("itinerarios")) {
            var vehiculo = vehiculosRepo.findByCodigo(fila.path("vehiculoId").asText()).orElseThrow();
            itinerarios.importar(fila.path("id").asText(), vehiculo, json.treeToValue(fila, ItinerarioDatos.class), tecnico);
        }
        for (var fila : leer("combustible")) {
            var datos = json.treeToValue(fila, CombustibleDatos.class);
            var v = datos.itinerarioId() == null ? vehiculosRepo.findByCodigo(fila.path("vehiculoId").asText()).orElseThrow()
                    : itinerariosRepo.findByCodigo(datos.itinerarioId()).orElseThrow().getVehiculo();
            var autor = fila.path("informadoPor").asText(null);
            combustible.importar(fila.path("id").asText(), v, datos, "Chofer".equals(autor) ? chofer : tecnico, autor);
        }
    }

    private JsonNode leer(String fichero) throws IOException {
        try (var input = new ClassPathResource("demo/" + fichero + ".json").getInputStream()) {
            return json.readTree(input);
        }
    }
}
