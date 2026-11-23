package pe.gob.inabif.sigrec.bien.dtos;

import pe.gob.inabif.sigrec.shared.model.Auditable.Sello;

public record BienResponse(String id, String ambienteId, String tipoId, String nombre, String categoria,
                           String codigoPatrimonial, String marcaModelo, String serie, String descripcion,
                           String condicion, String deterioro, BienDatos.Adquisicion adquisicion,
                           Integer vidaUtilAnios, Integer cantidad, BienDatos.Asociacion asociadoA, Sello anulacion) {}
