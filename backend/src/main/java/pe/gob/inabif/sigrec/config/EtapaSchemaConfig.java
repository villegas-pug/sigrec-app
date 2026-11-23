package pe.gob.inabif.sigrec.config;

import org.hibernate.cfg.SchemaToolingSettings;
import org.hibernate.tool.schema.internal.HibernateSchemaManagementTool;
import org.hibernate.tool.schema.spi.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Map;
import java.util.Set;

@Configuration(proxyBeanMethods = false)
@Profile("dev")
public class EtapaSchemaConfig {
    @Bean
    @ConditionalOnProperty(prefix = "sigrec.ddl", name = "etapa2", havingValue = "true")
    HibernatePropertiesCustomizer filtrarDdlDeInventario() {
        return limitarDdl(Set.of("SGR_BIEN", "SGR_INVENTARIO_PREVIO", "SGR_HISTORIAL_BIEN",
                "SGR_INCIDENTE", "SGR_ATENCION", "SGR_BAJA", "SGR_REPOSICION", "SGR_BIEN_IMPLICADO"));
    }

    @Bean
    @ConditionalOnProperty(prefix = "sigrec.ddl", name = "etapa3", havingValue = "true")
    HibernatePropertiesCustomizer filtrarDdlDePrecios() {
        return limitarDdl(Set.of("SGR_PRECIO"));
    }

    @Bean
    @ConditionalOnProperty(prefix = "sigrec.ddl", name = "etapa4", havingValue = "true")
    HibernatePropertiesCustomizer filtrarDdlDeServicios() {
        return limitarDdl(Set.of("SGR_SERVICIO", "SGR_PERIODO", "SGR_HECHO"));
    }

    @Bean
    @ConditionalOnProperty(prefix = "sigrec.ddl", name = "etapa5", havingValue = "true")
    HibernatePropertiesCustomizer filtrarDdlDeMovilidad() {
        return limitarDdl(Set.of("SGR_VEHICULO", "SGR_ITINERARIO", "SGR_COMBUSTIBLE"));
    }

    @Bean
    @ConditionalOnProperty(prefix = "sigrec.ddl", name = "integracion", havingValue = "true")
    HibernatePropertiesCustomizer filtrarDdlDeComplementos() {
        return limitarDdl(Set.of("SGR_FOTO", "SGR_INTERVENCION", "SGR_MANTENIMIENTO"));
    }

    private HibernatePropertiesCustomizer limitarDdl(Set<String> tablas) {
        return propiedades -> {
            var modo = propiedades.getOrDefault(SchemaToolingSettings.HBM2DDL_AUTO, "none").toString();
            if (!Set.of("none", "update", "validate").contains(modo)) {
                throw new IllegalStateException("El esquema compartido solo admite la generación no destructiva.");
            }
            if (propiedades.get(SchemaToolingSettings.SCHEMA_MANAGEMENT_TOOL) instanceof EtapaTool) {
                throw new IllegalStateException("Habilite la generación de una única etapa.");
            }
            propiedades.put(SchemaToolingSettings.UNIQUE_CONSTRAINT_SCHEMA_UPDATE_STRATEGY, "RECREATE_QUIETLY");
            propiedades.put(SchemaToolingSettings.SCHEMA_MANAGEMENT_TOOL, new EtapaTool(tablas));
        };
    }

    private static final class EtapaTool extends HibernateSchemaManagementTool {
        private final SchemaFilter filtro;

        private EtapaTool(Set<String> tablas) {
            filtro = new EtapaSchemaFilter(tablas);
        }

        @Override
        public SchemaCreator getSchemaCreator(Map<String, Object> config) {
            var creator = super.getSchemaCreator(config);
            return (metadata, options, matcher, source, target) ->
                    creator.doCreation(metadata, aplicar(options), matcher, source, target);
        }

        @Override
        public SchemaMigrator getSchemaMigrator(Map<String, Object> config) {
            var migrator = super.getSchemaMigrator(config);
            return (metadata, options, matcher, target) ->
                    migrator.doMigration(metadata, aplicar(options), matcher, target);
        }

        // Hibernate 6.4 construye las opciones de ejecución con el filtro predeterminado.
        private ExecutionOptions aplicar(ExecutionOptions options) {
            return SchemaManagementToolCoordinator.buildExecutionOptions(options.getConfigurationValues(), filtro,
                    options.getExceptionHandler());
        }
    }
}
