<template>
  <section-card titulo="Simulador de presupuesto" icono="calculate" :subtitulo="`¿Qué necesidades cubre un monto? · ${tituloAmbito} · ${anio}`" sin-relleno>
    <template #acciones>
      <ayuda-contextual etiqueta="¿Cómo se prioriza?">
        Orden provisional, por validar con la jefatura: primero la reposición por incidente, luego la peor condición (inservible, malo, regular)
        y, a igualdad, la vida útil cumplida hace más tiempo. Se recorre la lista en ese orden: si el importe cabe en el saldo se cubre; si no,
        queda «sin saldo» y se sigue con la siguiente. Las necesidades sin valorar se informan aparte y nunca se cuentan como cero.
        Es una simulación: no aprueba compras ni reserva presupuesto.
      </ayuda-contextual>
      <q-btn outline color="secondary" icon="download" label="Exportar CSV" :disable="!resultado" @click="exportar" />
    </template>

    <div class="sg-filters q-px-md q-pt-md">
      <q-input v-model.number="techo" outlined dense type="number" min="0" step="100" label="Monto disponible (S/)" hint="Ingrese un techo para simular" clearable>
        <template #append><boton-dictado v-model="techo" tipo="numero" /></template>
      </q-input>
      <div class="row items-center q-gutter-xs">
        <q-btn v-for="m in sugeridos" :key="m" flat dense no-caps color="secondary" :label="soles(m)" @click="techo = m" />
      </div>
    </div>

    <template v-if="resultado">
      <div class="q-px-md q-pt-md sg-chips">
        <status-chip tono="ok" :label="`${plural(resultado.cubiertas.length, 'cubierta', 'cubiertas')} · ${soles(resultado.importeCubierto)}`" />
        <status-chip :tono="resultado.sinSaldo.length ? 'da' : 'ne'" :label="`${plural(resultado.sinSaldo.length, 'sin saldo', 'sin saldo')} · ${soles(resultado.importeSinSaldo)}`" />
        <status-chip :tono="resultado.sinValorar.length ? 'wa' : 'ne'" :label="`${resultado.sinValorar.length} sin valorar (aparte)`" />
        <status-chip tono="in" :label="`Saldo: ${soles(resultado.saldo)}`" />
      </div>

      <div class="sg-table-wrap q-mt-sm">
        <table class="sg-table">
          <thead>
            <tr>
              <th scope="col" class="sg-num">Prioridad</th>
              <th scope="col">Bien</th>
              <th scope="col">Clasificación</th>
              <th scope="col">Condición</th>
              <th scope="col" class="sg-num">Importe</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in resultado.ordenadas" :key="n.id">
              <td class="sg-num">{{ n.prioridad }}</td>
              <td>
                <span class="text-weight-bold">{{ n.bien.nombre }} · {{ n.id }}</span>
                <div class="sg-muted">{{ n.ubicacion.car.nombre }} › {{ n.ubicacion.ambiente.nombre }}</div>
              </td>
              <td>{{ n.clase === 'reposicion' ? 'Reposición por incidente' : 'Renovación por vida útil' }}</td>
              <td><status-chip v-bind="condicion(n.bien.condicion)" /></td>
              <td class="sg-num"><template v-if="n.importe != null">{{ soles(n.importe) }}</template><status-chip v-else tono="wa" label="Sin valorar" /></td>
              <td><status-chip v-bind="estado(n)" /></td>
            </tr>
            <tr v-if="!resultado.ordenadas.length"><td colspan="6" class="sg-muted">Sin necesidades para los filtros seleccionados.</td></tr>
          </tbody>
        </table>
      </div>
    </template>
    <p v-else class="q-pa-md sg-muted q-mb-none">Ingrese un monto para ver qué necesidades cubriría, en orden de prioridad.</p>
  </section-card>
</template>

<script setup>
// Simulador de presupuesto (SPEC 011, Ola 3): ordena las necesidades por prioridad provisional y muestra cuáles cubre un techo.
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import BotonDictado from 'components/common/BotonDictado.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import AyudaContextual from 'components/common/AyudaContextual.vue'
import { simularTecho, totalizar } from 'src/services/necesidades'
import { condicion } from 'src/config/catalogos'
import { exportarCsv } from 'src/utils/csv'
import { plural, soles } from 'src/utils/formato'

const props = defineProps({
  // Necesidades pendientes ya filtradas (las mismas del detalle).
  pendientes: { type: Array, required: true },
  tituloAmbito: { type: String, default: '' },
  anio: { type: Number, required: true }
})

const $q = useQuasar()
const techo = ref(null)

// Atajos: la mitad y el total del importe conocido (redondeados a centenas).
const sugeridos = computed(() => {
  const total = totalizar(props.pendientes).importeConocido
  return total ? [...new Set([Math.round(total / 200) * 100, total])].filter((m) => m > 0) : []
})

const resultado = computed(() => (Number.isFinite(techo.value) && techo.value > 0 ? simularTecho(props.pendientes, techo.value) : null))

const cubiertas = computed(() => new Set(resultado.value?.cubiertas.map((n) => n.id)))
const estado = (n) => {
  if (n.importe == null) return { tono: 'wa', label: 'Sin valorar · aparte' }
  return cubiertas.value.has(n.id) ? { tono: 'ok', label: 'Cubierta' } : { tono: 'da', label: 'Sin saldo' }
}

function exportar () {
  const columnas = [
    { titulo: 'Prioridad', valor: (n) => n.prioridad },
    { titulo: 'Rótulo', valor: (n) => n.id },
    { titulo: 'Bien', valor: (n) => n.bien.nombre },
    { titulo: 'CAR', valor: (n) => n.ubicacion.car.nombre },
    { titulo: 'Ambiente', valor: (n) => n.ubicacion.ambiente.nombre },
    { titulo: 'Clasificación', valor: (n) => n.clase },
    { titulo: 'Condición', valor: (n) => condicion(n.bien.condicion).label },
    { titulo: 'Importe (S/)', valor: (n) => n.importe ?? 'Sin valorar' },
    { titulo: 'Resultado', valor: (n) => estado(n).label }
  ]
  const ok = exportarCsv(`sigrec-simulacion-${props.anio}-${techo.value}.csv`, columnas, resultado.value.ordenadas)
  if (!ok) $q.notify({ type: 'negative', message: 'El navegador bloqueó la descarga del archivo.' })
}
</script>
