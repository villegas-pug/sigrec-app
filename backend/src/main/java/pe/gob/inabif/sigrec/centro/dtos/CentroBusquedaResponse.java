package pe.gob.inabif.sigrec.centro.dtos;

import java.util.List;

/** SPEC 052: página de centros para el buscador de los filtros de cabecera. */
public record CentroBusquedaResponse(List<Item> items, long total) {
    public record Item(String codigo, String nombre, String unidadOrganica, String direccion) {}
}
