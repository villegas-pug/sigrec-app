package pe.gob.inabif.sigrec.centro.repository;

import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse;
import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse.Coincidencia;
import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse.Pagina;

import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UnidadOrganicaRepository {
    private static final int TAMANO_PAGINA = 5;
    private static final int MAXIMO_IN_ORACLE = 1000;
    private static final String COLUMNAS = "u.IDUNIDADORGANICA, u.UORNOMBRE, u.UOR_CODIGO_CENTRO, u.UORDIRECCION";
    private static final String ELEGIBLE = "u.UORESTADO = 1 AND u.UORELIMINADO = 0";
    // INSTR trata %, _ y los demás caracteres como texto literal.
    private static final String NOMBRE = TextoOracle.sinTildes("u.UORNOMBRE");
    private static final String COINCIDENCIAS = " WHERE " + ELEGIBLE + " AND INSTR(" + NOMBRE
            + ", " + TextoOracle.sinTildes("TO_NCHAR(:q)") + ") > 0";

    private static final RowMapper<UnidadOrganicaResponse> UNIDAD = (fila, indice) -> new UnidadOrganicaResponse(
            fila.getLong("IDUNIDADORGANICA"), fila.getNString("UORNOMBRE"), fila.getString("UOR_CODIGO_CENTRO"),
            fila.getString("UORDIRECCION"), fila.getInt("ELEGIBLE") == 1);
    private final NamedParameterJdbcTemplate jdbc;
    private final String tablaUnidades;
    private final String tablaCentros;
    private final String consultar;

    public UnidadOrganicaRepository(NamedParameterJdbcTemplate jdbc,
                                    @Value("${spring.jpa.properties.hibernate.default_schema:}") String esquema) {
        this.jdbc = jdbc;
        tablaUnidades = TextoOracle.tabla(esquema, "TGUNIDADORGANICA");
        tablaCentros = TextoOracle.tabla(esquema, "SGR_CENTRO");
        consultar = "SELECT " + COLUMNAS + ", CASE WHEN " + ELEGIBLE
                + " THEN 1 ELSE 0 END AS ELEGIBLE FROM " + tablaUnidades + " u";
    }

    public Pagina buscar(String texto, int pagina, String codigoCentro) {
        long desde = (pagina - 1L) * TAMANO_PAGINA;
        var parametros = new MapSqlParameterSource()
                .addValue("q", texto, Types.NVARCHAR)
                .addValue("centro", codigoCentro, Types.VARCHAR)
                .addValue("desde", desde);
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM " + tablaUnidades + " u" + COINCIDENCIAS, parametros, Long.class);
        if (desde >= total) return new Pagina(List.of(), total);

        var items = jdbc.query("SELECT " + COLUMNAS + """
                , CASE WHEN c.CODIGO IS NOT NULL AND (:centro IS NULL OR c.CODIGO <> :centro)
                     THEN 1 ELSE 0 END AS OCUPADA
                """ + " FROM " + tablaUnidades + " u LEFT JOIN " + tablaCentros
                + " c ON c.ID_UNIDAD_ORGANICA = u.IDUNIDADORGANICA"
                + COINCIDENCIAS + " ORDER BY " + NOMBRE + ", u.IDUNIDADORGANICA"
                + " OFFSET :desde ROWS FETCH NEXT " + TAMANO_PAGINA + " ROWS ONLY", parametros,
                (fila, indice) -> new Coincidencia(fila.getLong("IDUNIDADORGANICA"), fila.getNString("UORNOMBRE"),
                        fila.getString("UOR_CODIGO_CENTRO"), fila.getString("UORDIRECCION"), fila.getInt("OCUPADA") == 1));
        return new Pagina(items, total);
    }

    public UnidadOrganicaResponse porId(Long id) {
        if (id == null) return null;
        return jdbc.query(consultar + " WHERE u.IDUNIDADORGANICA = :id", Map.of("id", id), UNIDAD)
                .stream().findFirst().orElse(null);
    }

    public Map<Long, UnidadOrganicaResponse> porIds(List<Long> ids) {
        var unidades = new HashMap<Long, UnidadOrganicaResponse>();
        for (int inicio = 0; inicio < ids.size(); inicio += MAXIMO_IN_ORACLE) {
            var bloque = ids.subList(inicio, Math.min(inicio + MAXIMO_IN_ORACLE, ids.size()));
            jdbc.query(consultar + " WHERE u.IDUNIDADORGANICA IN (:ids)", Map.of("ids", bloque), UNIDAD)
                    .forEach(unidad -> unidades.put(unidad.id(), unidad));
        }
        return unidades;
    }

    public boolean vinculada(Long id) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + tablaCentros + " WHERE ID_UNIDAD_ORGANICA = :id",
                Map.of("id", id), Integer.class) > 0;
    }
}
