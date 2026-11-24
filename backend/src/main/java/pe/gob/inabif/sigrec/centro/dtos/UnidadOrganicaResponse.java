package pe.gob.inabif.sigrec.centro.dtos;

import java.util.List;

public record UnidadOrganicaResponse(Long id, String nombre, String codigo, String direccion, boolean elegible) {
    /** `padre` es el valor de UOR_UNIDAD_PADRE (nulo si la unidad no depende de otra; SPEC 054). */
    public record Coincidencia(Long id, String nombre, String codigo, String direccion, Long padre, boolean ocupada) {}
    public record Pagina(List<Coincidencia> items, long total) {}
}
