// Parámetros fijos de la demostración: hacen reproducibles los cálculos con independencia del reloj.
export const FECHA_CORTE = '2026-10-30'
export const ANIO_REVISION = 2027
export const ANIOS_REVISION = [2026, 2027, 2028]
export const ANIOS_SERVICIOS = [2026]

// Umbral provisional de los controles preventivos: se avisa «por vencer» cuando faltan, como máximo, estos días.
export const PARAMETROS_CONTROL = { diasPorVencer: 30 }

// Umbrales provisionales de servicios (SPEC 010 §6, por validar con las direcciones de los centros).
export const PARAMETROS_SERVICIOS = {
  // Un servicio con al menos `umbralRecurrencia` interrupciones en los últimos `mesesRecurrencia` meses se señala como recurrente.
  mesesRecurrencia: 12,
  umbralRecurrencia: 3,
  // Se avisa de una renovación cuando faltan, como máximo, estos días.
  diasAvisoRenovacion: 60
}

// Horizonte del calendario de vencimientos de Inicio › «Atención requerida › Próximos» (SPEC 011, por validar).
export const PARAMETROS_ATENCION = { diasProximos: 60 }

// Priorización provisional de necesidades para el simulador de presupuesto (SPEC 011, Ola 3, por validar con la jefatura).
// Menor puntaje = mayor prioridad. Se ordena por clasificación, luego por condición y, a igualdad, por antigüedad de la vida útil.
export const PARAMETROS_PRIORIDAD = {
  clase: { reposicion: 0, renovacion: 1 },
  condicion: { inservible: 0, malo: 1, regular: 2, bueno: 3, sin_dato: 2 }
}
