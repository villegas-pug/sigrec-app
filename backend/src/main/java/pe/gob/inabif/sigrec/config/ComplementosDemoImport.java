package pe.gob.inabif.sigrec.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.foto.service.FotoServiceImpl;
import pe.gob.inabif.sigrec.intervencion.dtos.IntervencionDatos;
import pe.gob.inabif.sigrec.intervencion.service.IntervencionServiceImpl;
import pe.gob.inabif.sigrec.mantenimiento.dtos.MantenimientoDatos;
import pe.gob.inabif.sigrec.mantenimiento.service.MantenimientoServiceImpl;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

@Component
@Profile("dev")
@Order(50)
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
@RequiredArgsConstructor
public class ComplementosDemoImport implements ApplicationRunner {
    private final ObjectMapper json;
    private final UsuarioRepository usuarios;
    private final FotoServiceImpl fotos;
    private final IntervencionServiceImpl intervenciones;
    private final MantenimientoServiceImpl mantenimientos;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        var actor = usuarios.findByCodigo("SIGREC_TECNICO").orElseThrow();
        for (var f : leer("fotos")) {
            fotos.importar(texto(f, "id"), texto(f, "carId"), texto(f, "ambienteId"), texto(f, "bienId"),
                    texto(f, "titulo"), texto(f, "nota"), LocalDate.parse(texto(f, "fecha")), actor);
        }
        int orden = 0;
        for (var i : leer("intervenciones")) {
            intervenciones.importar(texto(i, "id"), texto(i, "ambienteId"),
                    json.treeToValue(i, IntervencionDatos.class), texto(i, "informadoPor"), orden++, actor);
        }
        for (var m : leer("mantenimientos")) {
            var fechaRegistro = texto(m, "registradoEl");
            mantenimientos.importar(texto(m, "id"), texto(m, "carId"), texto(m, "bienId"), texto(m, "vehiculoId"), texto(m, "tipo"),
                    json.treeToValue(m, MantenimientoDatos.class), texto(m, "informadoPor"),
                    fechaRegistro == null ? null : LocalDate.parse(fechaRegistro), actor);
        }
    }

    private String texto(JsonNode fila, String campo) {
        return fila.path(campo).asText(null);
    }

    private JsonNode leer(String nombre) throws IOException {
        try (var input = new ClassPathResource("demo/" + nombre + ".json").getInputStream()) {
            return json.readTree(input);
        }
    }
}
