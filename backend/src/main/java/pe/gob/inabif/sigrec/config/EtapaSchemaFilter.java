package pe.gob.inabif.sigrec.config;

import org.hibernate.boot.model.relational.Namespace;
import org.hibernate.boot.model.relational.Sequence;
import org.hibernate.mapping.Table;
import org.hibernate.tool.schema.spi.SchemaFilter;

import java.util.Locale;
import java.util.Set;

// Limita la generación a las tablas autorizadas de una etapa en el esquema compartido.
record EtapaSchemaFilter(Set<String> tablas) implements SchemaFilter {
    @Override public boolean includeNamespace(Namespace namespace) { return true; }
    @Override public boolean includeTable(Table table) { return tablas.contains(table.getName().toUpperCase(Locale.ROOT)); }
    @Override public boolean includeSequence(Sequence sequence) { return false; }
}
