package pe.gob.inabif.sigrec.config;

import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.modulo.service.ModuloService;
import pe.gob.inabif.sigrec.ambiente.service.AmbienteService;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;
import pe.gob.inabif.sigrec.centro.dtos.CentroDatos;
import pe.gob.inabif.sigrec.modulo.dtos.ModuloDatos;
import pe.gob.inabif.sigrec.ambiente.dtos.AmbienteDatos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@lombok.RequiredArgsConstructor
@Profile("dev")
@org.springframework.core.annotation.Order(0)
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
public class DemoImport implements ApplicationRunner {
    private final UsuarioRepository usuarios;
    private final CentroService centros;
    private final ModuloService modulos;
    private final AmbienteService ambientes;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final Environment entorno;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        var actor = usuarios.findByCodigo("SIGREC_TECNICO")
                .orElseThrow(() -> new IllegalStateException("Ejecute primero las semillas de catálogos y perfiles."));
        var filas = leer("elementos");
        cargarCentros(actor, filas);
        cargarModulos(actor, filas);
        cargarAmbientes(actor, filas);
        cargarUsuarios();
    }

    private void cargarCentros(Usuario actor, JsonNode elementos) throws IOException {
        for (var fila : leer("cars")) {
            var id = fila.path("id").asText();
            var copia = (ObjectNode) fila.deepCopy();
            var construccion = copia.withObject("/inmueble/construccion");
            anexarElementos(construccion, elementos, "carId", id);
            centros.importar(json.treeToValue(copia, CentroDatos.class), actor);
        }
    }

    private void cargarModulos(Usuario actor, JsonNode elementos) throws IOException {
        for (var fila : leer("modulos")) {
            var id = fila.path("id").asText();
            var copia = (ObjectNode) fila.deepCopy();
            anexarElementos(copia, elementos, "moduloId", id);
            modulos.importar(json.treeToValue(copia, ModuloDatos.class), id, actor);
        }
    }

    private void cargarAmbientes(Usuario actor, JsonNode elementos) throws IOException {
        for (var fila : leer("ambientes")) {
            var id = fila.path("id").asText();
            var copia = (ObjectNode) fila.deepCopy();
            anexarElementos(copia, elementos, "ambienteId", id);
            ambientes.importar(json.treeToValue(copia, AmbienteDatos.class), id, actor);
        }
    }

    private void anexarElementos(ObjectNode target, JsonNode filas, String campo, String id) {
        var estados = target.putObject("estadoElementos");
        var adicionales = target.putArray("elementosAdicionales");
        for (var fila : filas) {
            if (!id.equals(fila.path(campo).asText())) continue;
            var clave = fila.path("clave").asText();
            if (fila.hasNonNull("condicion")) estados.put(clave, fila.get("condicion").asText());
            if (fila.hasNonNull("nombre")) adicionales.addObject().put("key", clave).put("label", fila.get("nombre").asText());
        }
    }

    private void cargarUsuarios() throws IOException {
        var cuentas = List.of(new CuentaDemo("demo.central", "Equipo central USPNNA", "CENTRAL", "GLOBAL", null, null),
                new CuentaDemo("demo.car", "Personal del CAR", "CAR", "CENTRO", "AMA", null),
                new CuentaDemo("demo.verifica", "Verificación física", "VERIFICA", "CENTRO", "AMA", null),
                new CuentaDemo("demo.chofer", "Chofer", "CHOFER", "VEHICULO", null, "AMA-V01"));
        var alta = sql("usuarios");
        var asignar = sql("asignaciones");
        for (var cuenta : cuentas) {
            if (usuarios.findByCodigo(cuenta.login()).isEmpty()) {
                var hash = entorno.getProperty("SIGREC_DEMO_" + cuenta.perfil() + "_HASH");
                if (hash == null || !hash.matches("\\$2[aby]\\$(1[2-9]|2[0-9]|3[01])\\$[./A-Za-z0-9]{53}")) {
                    throw new IllegalStateException("Configure el hash BCrypt de prueba para " + cuenta.perfil() + ".");
                }
                jdbc.update(alta, cuenta.login(), cuenta.nombre(), hash);
            }
            jdbc.update(asignar, cuenta.alcance(), cuenta.vehiculo(), cuenta.centro(), cuenta.login(), cuenta.perfil());
        }
    }

    private JsonNode leer(String nombre) throws IOException {
        try (var entrada = new ClassPathResource("demo/" + nombre + ".json").getInputStream()) {
            return json.readTree(entrada);
        }
    }

    private String sql(String nombre) throws IOException {
        return new ClassPathResource("db/demo/" + nombre + ".sql").getContentAsString(StandardCharsets.UTF_8);
    }

    private record CuentaDemo(String login, String nombre, String perfil, String alcance, String centro, String vehiculo) {}
}
