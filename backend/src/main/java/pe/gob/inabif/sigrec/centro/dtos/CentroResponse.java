package pe.gob.inabif.sigrec.centro.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record CentroResponse(String id, String nombre, InmuebleResponse inmueble, Sello anulacion) {}
