package pe.gob.inabif.sigrec.catalogo.model;

import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import java.util.List;

public record CatalogoDatos(String dominio, String codigo, String nombre, String descripcion, String objetivo,
                           Integer mesesSugeridos, Integer vidaUtilSugerida, String categoria) {}
