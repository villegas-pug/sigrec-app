package pe.gob.inabif.sigrec.vehiculo.dtos;

import java.math.BigDecimal;

/** Campos necesarios para el resumen de Inicio. */
public record VehiculoAtencion(String carId, BigDecimal presupuestoEstimado) {}
