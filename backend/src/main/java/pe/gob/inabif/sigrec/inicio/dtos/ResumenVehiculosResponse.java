package pe.gob.inabif.sigrec.inicio.dtos;

import java.math.BigDecimal;

/** Indicador de vehículos de Inicio (SPEC 042). */
public record ResumenVehiculosResponse(long requierenAtencion, BigDecimal presupuestoEstimado, long sinEstimar) {}
