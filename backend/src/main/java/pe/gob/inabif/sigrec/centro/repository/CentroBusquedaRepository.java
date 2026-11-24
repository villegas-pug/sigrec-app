package pe.gob.inabif.sigrec.centro.repository;

import pe.gob.inabif.sigrec.centro.dtos.CentroBusquedaResponse;
import pe.gob.inabif.sigrec.centro.dtos.CentroBusquedaResponse.Item;

import java.sql.Types;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** SPEC 052: búsqueda paginada de centros vigentes por código o nombre, sin distinguir tildes. */
@Repository
public class CentroBusquedaRepository {
    private static final int TAMANO_PAGINA = 5;
    private static final String NOMBRE = TextoOracle.sinTildes("c.NOMBRE");
    private final NamedParameterJdbcTemplate jdbc;
    private final String tablaCentros;
    private final String tablaUnidades;

    public CentroBusquedaRepository(NamedParameterJdbcTemplate jdbc,
                                    @Value("${spring.jpa.properties.hibernate.default_schema:}") String esquema) {
        this.jdbc = jdbc;
        tablaCentros = TextoOracle.tabla(esquema, "SGR_CENTRO");
        tablaUnidades = TextoOracle.tabla(esquema, "TGUNIDADORGANICA");
    }

    /** {@code codigos} nulo: todos los centros (ámbito global); vacío: ninguno. */
    public CentroBusquedaResponse buscar(String texto, int pagina, List<String> codigos) {
        if (codigos != null && codigos.isEmpty()) return new CentroBusquedaResponse(List.of(), 0);
        long desde = (pagina - 1L) * TAMANO_PAGINA;
        var parametros = new MapSqlParameterSource()
                .addValue("q", texto, Types.NVARCHAR)
                .addValue("desde", desde);
        // INSTR trata %, _ y los demás caracteres como texto literal.
        var condicion = " WHERE c.ESTADO = 1 AND c.ELIMINADO = 0 AND (INSTR(" + NOMBRE + ", "
                + TextoOracle.sinTildes("TO_NCHAR(:q)") + ") > 0 OR INSTR(c.CODIGO, UPPER(:q)) > 0)";
        if (codigos != null) {
            parametros.addValue("codigos", codigos);
            condicion += " AND c.CODIGO IN (:codigos)";
        }
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM " + tablaCentros + " c" + condicion, parametros, Long.class);
        if (desde >= total) return new CentroBusquedaResponse(List.of(), total);

        var items = jdbc.query("SELECT c.CODIGO, c.NOMBRE, c.DIRECCION, u.UORNOMBRE FROM " + tablaCentros + " c"
                        + " LEFT JOIN " + tablaUnidades + " u ON u.IDUNIDADORGANICA = c.ID_UNIDAD_ORGANICA"
                        + condicion + " ORDER BY " + NOMBRE + ", c.CODIGO"
                        + " OFFSET :desde ROWS FETCH NEXT " + TAMANO_PAGINA + " ROWS ONLY", parametros,
                (fila, indice) -> new Item(fila.getString("CODIGO"), fila.getString("NOMBRE"),
                        fila.getNString("UORNOMBRE"), fila.getString("DIRECCION")));
        return new CentroBusquedaResponse(items, total);
    }
}
