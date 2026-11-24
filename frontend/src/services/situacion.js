// Situación por centro (SPEC 011, antes «Tablero de control» de la SPEC 010 §8): una fila por centro que reúne necesidades,
// infraestructura, bienes, controles preventivos, vehículos y servicios. No crea reglas nuevas: reutiliza las de cada módulo,
// de modo que sus cifras coinciden con las pantallas de detalle. Inicio es la única pantalla que la muestra.
import { db, ambientesDeCar, bienesActivosDeCentros, modulosDeCar, vigente, estaAtendida, verificacionDe } from './datos'
import { conteoPorCondicion, elementosCriticos } from './infraestructura'
import { elementosAdicionalesDe, estadoElementosDe, novedadesDe } from './centros'
import { calcularNecesidades, consolidarPorCar } from './necesidades'
import { controlesPendientes, fumigacionDeCentro, resumirControles } from './mantenimientos'
import { avisosDeServicios, problemasRecurrentes, resumirAvisos, serviciosDeCar } from './servicios'
import { resumirEstadoVehiculos } from './vehiculos'
import { CONDICIONES_CRITICAS } from 'src/config/catalogos'

const sumar = (lista) => lista.reduce((suma, n) => suma + n, 0)

// Novedades vigentes sin atender de un ambiente.
export const novedadesAbiertas = (ambiente) => novedadesDe(ambiente.id).filter((n) => vigente(n) && !estaAtendida(n))

/**
 * Una fila por centro. `anio` es el año de revisión de las necesidades; `anioServicios`, el de los períodos de pago.
 * - `bienesActivos` y `bienesMalos` cuentan unidades (como Inventario); `registrosActivos` y `verificados`, registros (como Inicio).
 */
export function resumenPorCentro (cars, { fechaCorte, anioServicios, anio }) {
  const necesidades = consolidarPorCar(calcularNecesidades({ anio, carIds: cars.map((c) => c.id) }), cars)

  return cars.map((car, i) => {
    const ambientes = ambientesDeCar(car.id)
    const activos = bienesActivosDeCentros([car.id])
    const condiciones = conteoPorCondicion(activos)
    const servicios = serviciosDeCar(car.id)
    const avisos = avisosDeServicios(servicios, anioServicios, fechaCorte)
    const construccion = car.inmueble.construccion ?? {}
    const modulos = modulosDeCar(car.id)
    const criticosInmueble = elementosCriticos(estadoElementosDe('centro', car.id), elementosAdicionalesDe('centro', car.id)).length
    const n = necesidades[i]

    return {
      car,
      necesidades: { cantidad: n.cantidad, importeConocido: n.importeConocido, sinValorar: n.sinValorar, infraestructura: n.infraestructura, atendidas: n.atendidas },
      estadoGeneral: construccion.estado ?? null,
      ambientesCriticos: ambientes.filter((a) => CONDICIONES_CRITICAS.includes(a.condicion)).length,
      modulosCriticos: modulos.filter((m) => CONDICIONES_CRITICAS.includes(m.condicion)).length,
      // Inmueble, módulos activos (con sus elementos agregados, SPEC 022) y ambientes. Los del inmueble se ven en la ficha del centro.
      elementosCriticosInmueble: criticosInmueble,
      elementosCriticos: criticosInmueble +
        sumar(modulos.map((m) => elementosCriticos(estadoElementosDe('modulo', m.id), elementosAdicionalesDe('modulo', m.id)).length)) +
        sumar(ambientes.map((a) => elementosCriticos(estadoElementosDe('ambiente', a.id)).length)),
      novedadesAbiertas: sumar(ambientes.map((a) => novedadesAbiertas(a).length)),
      bienesActivos: sumar(Object.values(condiciones)),
      bienesMalos: condiciones.malo + condiciones.inservible,
      registrosActivos: activos.length,
      verificados: activos.filter((b) => verificacionDe(b)).length,
      controles: resumirControles(controlesPendientes([car.id], fechaCorte)),
      fumigacion: fumigacionDeCentro(car.id, fechaCorte).estado,
      vehiculos: resumirEstadoVehiculos(db.vehiculos.filter((v) => v.carId === car.id)),
      servicios: {
        ...resumirAvisos(avisos),
        renovaciones: avisos.filter((a) => a.clase.startsWith('renovacion')).length,
        recurrentes: servicios.filter((s) => problemasRecurrentes(s, fechaCorte).recurrente).length
      }
    }
  })
}

// SPEC 044: los totales viven en un módulo ligero que Inicio usa sin cargar las reglas de cada módulo.
export { totalizarSituacion } from './totalesInicio'
