package pe.gob.inabif.sigrec.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.YearMonth;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.precio.mappers.PrecioEntityMapper;
import pe.gob.inabif.sigrec.precio.model.PrecioValor;
import pe.gob.inabif.sigrec.precio.repository.PrecioRepository;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

@Component
@RequiredArgsConstructor
@Profile("dev")
@Order(20)
@ConditionalOnProperty(prefix = "sigrec.demo", name = "importar", havingValue = "true")
public class PrecioDemoImport implements ApplicationRunner {
    private final ObjectMapper json;
    private final CatalogoRepository catalogos;
    private final PrecioRepository precios;
    private final UsuarioRepository usuarios;
    private final PrecioEntityMapper mapper;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        var actor = usuarios.findByCodigo("SIGREC_TECNICO").orElseThrow();
        try (var entrada = new ClassPathResource("demo/tipos-bien.json").getInputStream()) {
            for (var fila : json.readTree(entrada)) {
                if (!fila.hasNonNull("precio")) continue;
                var codigo = fila.path("id").asText().toUpperCase(Locale.ROOT);
                var tipo = catalogos.bloquear("TIPO_BIEN", codigo).orElseThrow();
                if (!tipo.vigente() || precios.existsByTipoId(tipo.id())) continue;
                var mes = fila.hasNonNull("fechaPrecio") ? YearMonth.parse(fila.get("fechaPrecio").asText()).atDay(1) : null;
                var procedencia = fila.path("procedencia").asText(null);
                var valor = new PrecioValor(fila.path("precio").decimalValue(), mes, procedencia);
                var precio = mapper.toEntity(valor);
                precio.setTipo(tipo);
                precio.registrar(actor);
                precios.save(precio);
            }
        }
    }
}
