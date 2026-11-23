package pe.gob.inabif.sigrec.catalogo.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record TipoBienResponse(String id, String nombre, String categoria, Integer vidaUtilSugerida, Sello anulacion) {}
