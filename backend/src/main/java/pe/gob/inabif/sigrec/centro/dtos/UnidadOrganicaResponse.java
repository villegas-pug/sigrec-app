package pe.gob.inabif.sigrec.centro.dtos;

import java.util.List;

public record UnidadOrganicaResponse(Long id, String nombre, String codigo, String direccion, boolean elegible) {
    public record Coincidencia(Long id, String nombre, String codigo, String direccion, boolean ocupada) {}
    public record Pagina(List<Coincidencia> items, long total) {}
}
