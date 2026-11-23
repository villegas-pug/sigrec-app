// Reglas de negocio de la SPA. SPEC 040: el «hoy» es la fecha real del sistema (America/Lima), ya no una fecha de corte fija.
import { anioActual, hoy } from 'src/utils/fechas'

export { hoy }
// Año para el que se calculan las necesidades de renovación o reposición: el siguiente al actual.
export const anioRevision = () => anioActual() + 1
// Opciones del selector «Año a revisar»: el actual y los dos siguientes.
export const aniosRevision = () => [anioActual(), anioActual() + 1, anioActual() + 2]
// Año de los períodos de pago que se revisan.
export const anioServicios = () => anioActual()
export const aniosServicios = () => [anioActual()]

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
