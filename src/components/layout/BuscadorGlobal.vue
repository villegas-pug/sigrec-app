<template>
  <q-dialog :model-value="modelValue" position="top" :maximized="$q.screen.lt.sm" @update:model-value="$emit('update:modelValue', $event)" @show="alMostrar">
    <q-card class="sg-dialog sg-buscador" style="width: 640px; max-width: 100vw">
      <q-card-section class="q-pb-sm">
        <q-input
          ref="entrada"
          v-model="consulta"
          outlined
          dense
          autofocus
          clearable
          placeholder="Rótulo, bien, ambiente, centro, placa, servicio o pantalla"
          aria-label="Buscar en SIGREC"
          @keydown.down.prevent="mover(1)"
          @keydown.up.prevent="mover(-1)"
          @keydown.enter.prevent="elegir(resultados[activo])"
        >
          <template #prepend><q-icon name="search" /></template>
          <template #append>
            <boton-dictado v-model="consulta" tipo="texto" />
            <q-btn flat round dense icon="qr_code_scanner" color="secondary" aria-label="Escanear rótulo" title="Escanear rótulo" @click="escaner = true" />
          </template>
        </q-input>
        <p class="sg-muted q-mb-none q-mt-xs gt-xs">Atajo: Ctrl + K · ↑ ↓ para moverse · Enter para abrir</p>
      </q-card-section>

      <q-list v-if="resultados.length" separator class="sg-buscador__lista" role="listbox" aria-label="Resultados">
        <q-item
          v-for="(r, i) in resultados"
          :key="r.clave"
          clickable
          :active="i === activo"
          active-class="sg-buscador__activo"
          role="option"
          :aria-selected="i === activo ? 'true' : 'false'"
          @click="elegir(r)"
          @mouseenter="activo = i"
        >
          <q-item-section avatar><q-icon :name="r.icono" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ r.titulo }}</q-item-label>
            <q-item-label caption>{{ r.etiquetaTipo }} · {{ r.id }}<template v-if="r.detalle"> · {{ r.detalle }}</template></q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-section v-else-if="consulta" class="sg-muted">Sin resultados en el ámbito del perfil para «{{ consulta }}».</q-card-section>
      <q-card-section v-else class="sg-muted">Escriba al menos una palabra. Puede buscar por rótulo SIGREC (p. ej. AMA-COM-EXT01) o escanearlo.</q-card-section>
    </q-card>

    <escaner-rotulo v-model="escaner" @leido="alEscanear" />
  </q-dialog>
</template>

<script setup>
// Buscador global y paleta de navegación (SPEC 011, Ola 3). Busca en el ámbito del perfil y solo ofrece destinos a los que
// el perfil tiene acceso. Un rótulo escaneado o escrito exactamente abre su ficha directamente.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import BotonDictado from 'components/common/BotonDictado.vue'
import EscanerRotulo from 'components/common/EscanerRotulo.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { buscar, indiceDeBusqueda } from 'src/services/busqueda'
import { MENU } from 'src/config/menu'
import { FECHA_CORTE } from 'src/config/demo'
import { ANIO_SERVICIOS } from 'src/composables/useAtencion'
import { normalizar } from 'src/utils/interpretacionVoz'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const router = useRouter()
const { carsEnAmbito, vehiculosEnAmbito, puedeAcceder, puedeHacer } = usePerfil()

const ETIQUETAS = { centro: 'Centro', modulo: 'Módulo', ambiente: 'Ambiente', bien: 'Bien', vehiculo: 'Vehículo', servicio: 'Servicio', tipo: 'Tipo de bien', pantalla: 'Pantalla', accion: 'Acción' }

const consulta = ref('')
const activo = ref(0)
const escaner = ref(false)
const entrada = ref(null)

// El índice se arma al abrir (los datos pueden haber cambiado); las pantallas del menú se buscan como «Ir a…».
const indice = ref([])
const pantallas = computed(() =>
  MENU.flatMap((e) => e.items ?? [e])
    .filter((e) => puedeAcceder(e.key))
    .map((e) => ({ clave: `ir-${e.key}`, tipo: 'pantalla', id: e.key, titulo: `Ir a ${e.label}`, detalle: '', icono: e.icon, destino: { name: e.key }, texto: normalizar(e.label) }))
)

function alMostrar () {
  indice.value = indiceDeBusqueda({ cars: carsEnAmbito.value, vehiculos: vehiculosEnAmbito.value, fechaCorte: FECHA_CORTE, anioServicios: ANIO_SERVICIOS }).filter((e) => puedeAcceder(e.destino.name))
  consulta.value = ''
  activo.value = 0
}

const resultados = computed(() => {
  const q = normalizar(consulta.value)
  const irA = q ? pantallas.value.filter((p) => q.split(' ').every((w) => p.texto.includes(w))).slice(0, 3) : []
  const encontrados = buscar(indice.value, consulta.value)
  // Acciones de los 3 primeros resultados (solo las que el perfil puede hacer y a cuyo destino accede): «Registrar bien en…», «Informar pago de…».
  const acciones = encontrados.slice(0, 3).flatMap((e) =>
    (e.acciones ?? [])
      .filter((a) => puedeHacer(a.permiso) && puedeAcceder(a.destino.name))
      .map((a) => ({ clave: `${e.clave}-${a.permiso}`, tipo: 'accion', id: e.id, titulo: a.label, detalle: '', icono: a.icono, destino: a.destino }))
  )
  return [...encontrados, ...acciones, ...irA].map((r) => ({ ...r, etiquetaTipo: ETIQUETAS[r.tipo] }))
})
watch(resultados, () => { activo.value = 0 })

function mover (paso) {
  if (!resultados.value.length) return
  activo.value = (activo.value + paso + resultados.value.length) % resultados.value.length
}

function elegir (r) {
  if (!r) return
  emit('update:modelValue', false)
  router.push(r.destino)
}

// Un rótulo exacto abre la ficha; si no, se deja como búsqueda para elegir.
function alEscanear (rotulo) {
  const exacto = indice.value.find((e) => e.id.toUpperCase() === rotulo)
  if (exacto) {
    elegir(exacto)
    return
  }
  consulta.value = rotulo
  $q.notify({ type: 'warning', message: `El rótulo ${rotulo} no está en el ámbito del perfil o no existe.` })
}
</script>

<style scoped>
.sg-buscador__lista { max-height: min(60vh, 520px); overflow-y: auto; }
.sg-buscador__activo { background: rgba(0, 0, 0, 0.06); }
</style>
