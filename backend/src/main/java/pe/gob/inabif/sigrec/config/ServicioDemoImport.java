package pe.gob.inabif.sigrec.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.servicio.dtos.*;
import pe.gob.inabif.sigrec.servicio.model.*;
import pe.gob.inabif.sigrec.servicio.repository.*;
import pe.gob.inabif.sigrec.servicio.service.ServicioServiceImpl;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

@Component
@Profile("dev")
@Order(30)
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
@RequiredArgsConstructor
public class ServicioDemoImport implements ApplicationRunner {
    private final ObjectMapper json;
    private final UsuarioRepository usuarios;
    private final ServicioServiceImpl servicios;
    private final PeriodoRepository periodos;
    private final HechoServicioRepository hechos;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        var actor = usuarios.findByCodigo("SIGREC_TECNICO").orElseThrow();
        try (var input = new ClassPathResource("demo/servicios.json").getInputStream()) {
            for (var fila : json.readTree(input)) {
                var datos = new CreateServicioRequest(fila.path("carId").asText(), fila.path("tipo").asText(),
                        fila.path("periodicidad").asText(), json.treeToValue(fila, ServicioDatos.class));
                var servicio = servicios.importar(datos, fila.path("id").asText(), actor);
                if (servicio == null) continue;
                var anios = fila.path("periodos").fields();
                while (anios.hasNext()) {
                    var anio = anios.next();
                    importarPeriodos(servicio, Integer.parseInt(anio.getKey()), anio.getValue(), actor);
                }
                for (var nodo : fila.path("hechos")) {
                    var hecho = new HechoServicio();
                    hecho.setCodigo(nodo.path("id").asText());
                    hecho.setTipo(nodo.path("tipo").asText().toUpperCase(Locale.ROOT));
                    hecho.setFecha(LocalDate.parse(nodo.path("fecha").asText()));
                    hecho.setDetalle(nodo.path("detalle").asText(null));
                    hecho.setAutorReferencia(nodo.path("informadoPor").asText(null));
                    hecho.setServicio(servicio);
                    hecho.registrar(actor);
                    hechos.save(hecho);
                }
            }
        }
    }

    private void importarPeriodos(Servicio servicio, int anio, JsonNode filas, Usuario actor) throws IOException {
        for (var numero : filas.path("pagados")) {
            var pago = json.treeToValue(filas.path("pagos").required(numero.asText()), UpdatePeriodoRequest.Pago.class);
            var periodo = ServicioServiceImpl.periodo(servicio, anio, numero.asInt(), actor);
            ServicioServiceImpl.datosPeriodo(periodo, "PAGADO", new UpdatePeriodoRequest("pagado", null, null, null, pago));
            periodos.save(periodo);
        }
        for (var pendiente : filas.path("pendientes")) {
            var periodo = ServicioServiceImpl.periodo(servicio, anio, pendiente.path("numero").asInt(), actor);
            ServicioServiceImpl.datosPeriodo(periodo, "PENDIENTE", json.treeToValue(pendiente, UpdatePeriodoRequest.class));
            periodos.save(periodo);
        }
    }
}
