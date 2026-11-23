package pe.gob.inabif.sigrec.catalogo.dtos;

public record CatalogoResponse(String dominio, String codigo, String nombre, String descripcion, String objetivo,
                               Integer mesesSugeridos, Integer vidaUtilSugerida, String categoria) {}
