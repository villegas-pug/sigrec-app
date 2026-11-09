// Parámetros fijos de la demostración: hacen reproducibles los cálculos con independencia del reloj.
export const FECHA_CORTE = '2026-10-30'
export const ANIO_REVISION = 2027
export const ANIOS_REVISION = [2026, 2027, 2028]
export const ANIOS_SERVICIOS = [2026]

// Umbrales provisionales de servicios (SPEC 010 §6, por validar con las direcciones de los centros).
export const PARAMETROS_SERVICIOS = {
  // Un servicio con al menos `umbralRecurrencia` interrupciones en los últimos `mesesRecurrencia` meses se señala como recurrente.
  mesesRecurrencia: 12,
  umbralRecurrencia: 3,
  // Se avisa de una renovación cuando faltan, como máximo, estos días.
  diasAvisoRenovacion: 60
}
