<template>
  <div class="sg-catalogo-precios" :class="{ 'sg-catalogo-precios--compacto': compacto }">
    <q-resize-observer @resize="medirCatalogo" />
    <div class="catalogo-toolbar">
      <q-input v-model="texto" outlined dense clearable label="Buscar tipo de bien" />
      <q-btn v-if="compacto" outline dense icon="filter_list" label="Filtros" color="secondary">
        <q-menu><div class="q-pa-md column q-gutter-md" style="width: 260px">
          <q-select v-model="filtro" :options="OPCIONES_FILTRO" emit-value map-options outlined dense label="Mostrar" />
          <filtro-inactivos v-model="mostrarInactivos" />
        </div></q-menu>
      </q-btn>
      <template v-else>
        <q-select v-model="filtro" :options="OPCIONES_FILTRO" emit-value map-options outlined dense label="Mostrar" />
        <filtro-inactivos v-model="mostrarInactivos" />
      </template>
      <q-btn v-if="puedeHacer('tipoBien.registrar')" unelevated dense color="primary" icon="add" :label="compacto ? 'Registrar tipo' : 'Registrar tipo de bien'" @click="abrirTipo(null)" />
    </div>
    <div class="catalogo-contexto">
      <span class="catalogo-texto">Necesidades de {{ anio }} · {{ contextoVisible }}</span>
      <ayuda-contextual etiqueta="Alcance de los precios y conteos">
        El precio referencial es el esperado de reposición, no el costo original de adquisición. Su fuente y vigencia están por definir.
        El equipo central administra el catálogo. Los conteos incluyen todas las necesidades pendientes de estos centros y año, sin restringir por tipo ni clasificación.
      </ayuda-contextual>
    </div>
    <p v-if="tipoPedido && !tipoSolicitado" role="status" class="q-ma-none">Registro no disponible: {{ tipoPedido }}</p>
    <div class="catalogo-resultados">
      <table v-if="!compacto && filas.length" class="sg-table catalogo-tabla">
        <colgroup><col style="width: 26%"><col style="width: 14%"><col style="width: 12%"><col style="width: 18%"><col style="width: 12%"><col style="width: 18%"></colgroup>
        <thead><tr><th>Tipo de bien</th><th>Precio referencial</th><th>Fecha</th><th>Procedencia</th><th>Necesidades / unidades</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="fila in visibles" :key="fila.tipo.id" :class="{ 'sg-row--selected': fila.tipo.id === tipoResaltado }" :aria-current="fila.tipo.id === tipoResaltado ? 'true' : undefined">
            <td><strong class="catalogo-texto">{{ fila.tipo.nombre }}</strong><span class="catalogo-texto sg-muted">{{ CATEGORIAS[fila.tipo.categoria] }}</span><status-chip v-if="fila.tipo.anulacion" v-bind="CHIP_ANULADO" /></td>
            <td>{{ fila.tipo.precio == null ? 'Sin precio' : soles(fila.tipo.precio) }}</td>
            <td>{{ fila.tipo.fechaPrecio ? fecha(fila.tipo.fechaPrecio) : 'No informada' }}</td>
            <td><span class="catalogo-texto">{{ fila.tipo.procedencia || 'No informada' }}</span></td>
            <td>{{ fila.necesidades }} / {{ fila.unidades }}</td>
            <td><div class="catalogo-acciones"><q-btn flat dense no-caps label="Ver detalle" color="secondary" @click="detalle = fila" /><q-btn v-if="puedeHacer('precio.informar') && vigente(fila.tipo)" flat dense icon="sell" color="secondary" :aria-label="`Informar precio de ${fila.tipo.nombre}`" @click="abrirPrecio(fila.tipo)" /><menu-acciones :items="accionesTipo(fila.tipo)" :etiqueta="`Acciones de ${fila.tipo.nombre}`" /></div></td>
          </tr>
        </tbody>
      </table>
      <article v-else-if="visibles.length" class="catalogo-tarjeta" :aria-current="visibles[0].tipo.id === tipoResaltado ? 'true' : undefined">
        <strong class="catalogo-texto">{{ visibles[0].tipo.nombre }}</strong>
        <span class="catalogo-texto sg-muted">{{ CATEGORIAS[visibles[0].tipo.categoria] }} · {{ visibles[0].tipo.anulacion ? 'Anulado' : 'Vigente' }}</span>
        <strong>{{ visibles[0].tipo.precio == null ? 'Sin precio' : soles(visibles[0].tipo.precio) }}</strong>
        <span class="catalogo-texto">{{ visibles[0].necesidades }} necesidades · {{ visibles[0].unidades }} unidades</span>
        <div class="catalogo-acciones">
          <q-btn flat dense color="secondary" label="Ver detalle" @click="detalle = visibles[0]" />
          <q-btn v-if="puedeHacer('precio.informar') && vigente(visibles[0].tipo)" flat dense color="secondary" icon="sell" label="Precio" @click="abrirPrecio(visibles[0].tipo)" />
          <menu-acciones :items="accionesTipo(visibles[0].tipo)" :etiqueta="`Acciones de ${visibles[0].tipo.nombre}`" />
        </div>
      </article>
      <p v-if="!filas.length" role="status">Sin tipos de bien para los filtros seleccionados.</p>
    </div>
    <footer class="catalogo-paginador">
      <span role="status">Registros {{ filas.length ? inicio + 1 : 0 }}–{{ Math.min(inicio + porPagina, filas.length) }} de {{ filas.length }}</span>
      <div class="catalogo-acciones">
        <q-btn flat dense round icon="first_page" aria-label="Primera página" :disable="pagina === 1" @click="pagina = 1" />
        <q-btn flat dense round icon="chevron_left" aria-label="Página anterior" :disable="pagina === 1" @click="pagina--" />
        <span aria-live="polite">Página {{ pagina }} de {{ paginas }}</span>
        <q-btn flat dense round icon="chevron_right" aria-label="Página siguiente" :disable="pagina === paginas" @click="pagina++" />
        <q-btn flat dense round icon="last_page" aria-label="Última página" :disable="pagina === paginas" @click="pagina = paginas" />
      </div>
    </footer>
    <form-dialog :model-value="!!detalle" titulo="Detalle del tipo de bien" solo-lectura @update:model-value="detalle = null">
      <template v-if="detalle">
        <strong>{{ detalle.tipo.nombre }}</strong><span>{{ detalle.tipo.id }} · {{ CATEGORIAS[detalle.tipo.categoria] }}</span>
        <span>{{ detalle.tipo.anulacion ? 'Anulado' : 'Vigente' }} · Vida útil sugerida: {{ detalle.tipo.vidaUtilSugerida ?? 'No informada' }}</span>
        <span>Precio: {{ detalle.tipo.precio == null ? 'Sin precio' : soles(detalle.tipo.precio) }}</span>
        <span>Fecha: {{ detalle.tipo.fechaPrecio ? fecha(detalle.tipo.fechaPrecio) : 'No informada' }}</span>
        <span>Procedencia: {{ detalle.tipo.procedencia || 'No informada' }}</span>
        <span>{{ detalle.necesidades }} necesidades · {{ detalle.unidades }} unidades</span>
      </template>
    </form-dialog>
    <tipo-bien-dialog v-model="dialogoTipo.abierto" :tipo="dialogoTipo.tipo" />
    <precio-dialog v-if="dialogoPrecio.tipo" v-model="dialogoPrecio.abierto" :tipo="dialogoPrecio.tipo" />
    <anular-dialog confirmar-descarte v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { QResizeObserver, useQuasar } from 'quasar'
import FormDialog from 'components/common/FormDialog.vue'
import AyudaContextual from 'components/common/AyudaContextual.vue'
import StatusChip from 'components/common/StatusChip.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import TipoBienDialog from 'components/precios/TipoBienDialog.vue'
import PrecioDialog from 'components/precios/PrecioDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { db, tipoPorId, vigente } from 'src/services/datos'
import { calcularNecesidades } from 'src/services/necesidades'
import { anular, dependenciasDeTipoBien } from 'src/services/acciones'
import { CATEGORIAS, CHIP_ANULADO } from 'src/config/catalogos'
import { ANIO_REVISION } from 'src/config/demo'
import { fecha, soles } from 'src/utils/formato'

const OPCIONES_FILTRO = [
  { label: 'Todos los tipos', value: 'todos' },
  { label: 'Usados por necesidades', value: 'usados' },
  { label: 'Necesidades sin precio', value: 'faltantes' }
]

const props = defineProps({
  anio: { type: Number, default: ANIO_REVISION },
  carIds: { type: Array, default: null },
  contexto: { type: String, default: '' },
  tipoPedido: { type: String, default: '' },
  filtroInicial: { type: String, default: 'todos' }
})

const $q = useQuasar()
const espacio = reactive({ width: 0, height: 0 })
const compacto = computed(() => espacio.width < 900 || espacio.height < 600)
function medirCatalogo ({ width, height }) {
  Object.assign(espacio, { width, height })
}
const pagina = ref(1)
const detalle = ref(null)
const { perfil, carIdsEnAmbito, enAmbitoCar, puedeHacer } = usePerfil()
const contextoVisible = computed(() => props.contexto || perfil.value.ambito.descripcion)
// Los parámetros de contexto nunca amplían el ámbito autorizado del perfil.
const centrosDelContexto = computed(() => props.carIds === null ? carIdsEnAmbito.value : props.carIds.filter(enAmbitoCar))
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

// Enlaces profundos: ?tipo= abre la valoración de ese tipo (o lo resalta si el perfil no puede valorar); ?filtro=faltantes muestra los tipos sin precio.
const tipoSolicitado = props.tipoPedido ? tipoPorId(props.tipoPedido) : null
const tipoResaltado = tipoSolicitado?.id ?? null

const texto = ref('')
const filtro = ref(OPCIONES_FILTRO.some((o) => o.value === props.filtroInicial) ? props.filtroInicial : 'todos')
const mostrarInactivos = ref(!!tipoSolicitado?.anulacion)

const pendientes = computed(() => calcularNecesidades({ anio: props.anio, carIds: centrosDelContexto.value }).pendientes)

const filas = computed(() => {
  const t = (texto.value ?? '').toLowerCase()
  return db.tiposBien
    .filter((tipo) => mostrarInactivos.value || vigente(tipo))
    .map((tipo) => {
      const usan = pendientes.value.filter((n) => n.bien.tipoId === tipo.id)
      return { tipo, necesidades: usan.length, unidades: usan.reduce((s, n) => s + n.cantidad, 0) }
    })
    .filter((f) => !t || f.tipo.nombre.toLowerCase().includes(t))
    .filter((f) => filtro.value === 'todos' || (f.necesidades > 0 && (filtro.value === 'usados' || f.tipo.precio == null)))
    .sort((a, b) => b.necesidades - a.necesidades || a.tipo.nombre.localeCompare(b.tipo.nombre))
})

const porPagina = computed(() => compacto.value ? 1 : 5)
const paginas = computed(() => Math.max(1, Math.ceil(filas.value.length / porPagina.value)))
const inicio = computed(() => (pagina.value - 1) * porPagina.value)
const visibles = computed(() => filas.value.slice(inicio.value, inicio.value + porPagina.value))
watch([texto, filtro, mostrarInactivos], () => { pagina.value = 1 })
watch(paginas, (n) => { pagina.value = Math.min(pagina.value, n) })
watch(porPagina, (n, anterior) => { pagina.value = Math.floor(((pagina.value - 1) * anterior) / n) + 1 }, { flush: 'sync' })

const dialogoTipo = reactive({ abierto: false, tipo: null })
const dialogoPrecio = reactive({ abierto: false, tipo: null })
const operacionAbierta = computed(() => dialogoTipo.abierto || dialogoPrecio.abierto || anulacion.abierto || !!detalle.value)
defineExpose({ operacionAbierta })

const abrirTipo = (tipo) => Object.assign(dialogoTipo, { abierto: true, tipo })
const abrirPrecio = (tipo) => Object.assign(dialogoPrecio, { abierto: true, tipo })

onMounted(async () => {
  if (!tipoSolicitado) return
  const indice = filas.value.findIndex((f) => f.tipo.id === tipoSolicitado.id)
  if (indice < 0) filtro.value = 'todos'
  await nextTick()
  pagina.value = Math.floor(Math.max(0, filas.value.findIndex((f) => f.tipo.id === tipoSolicitado.id)) / porPagina.value) + 1
  if (puedeHacer('precio.informar') && vigente(tipoSolicitado)) abrirPrecio(tipoSolicitado)
  await nextTick()

})

const accionesTipo = (tipo) => [
  { label: 'Actualizar tipo de bien', icono: 'edit', visible: puedeHacer('tipoBien.actualizar') && vigente(tipo), accion: () => abrirTipo(tipo) },
  {
    label: 'Anular tipo de bien',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('tipoBien.anular') && vigente(tipo),
    accion: () => pedirAnulacion({
      titulo: 'Anular tipo de bien',
      subtitulo: tipo.nombre,
      dependencias: dependenciasDeTipoBien(tipo),
      aviso: 'Los bienes activos de este tipo deben cambiar de tipo o darse de baja antes de anularlo. Un tipo anulado ya no se ofrece al registrar bienes.',
      mensaje: 'Tipo de bien anulado.',
      ejecutar: (datos) => anular(tipo, datos),
      registro: tipo
    })
  },
  {
    label: 'Reactivar tipo de bien',
    icono: 'restore',
    visible: puedeHacer('tipoBien.anular') && !vigente(tipo),
    accion: () => pedirReactivacion({ entidad: 'tipoBien', registro: tipo, nombre: 'Tipo de bien' })
  }
]
</script>

<style scoped>
.sg-catalogo-precios { position: relative; container: catalogo / size; display: flex; flex-direction: column; gap: 12px; height: 100%; min-height: 0; min-width: 0; overflow: hidden; }
.catalogo-toolbar { display: flex; gap: 12px; align-items: center; flex: 0 0 auto; }
.catalogo-toolbar > .q-input, .catalogo-toolbar > .q-select { flex: 1; min-width: 0; }
.catalogo-contexto { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 0 auto; }
.catalogo-resultados { flex: 1; min-height: 0; min-width: 0; overflow: hidden; }
.catalogo-tabla { table-layout: fixed; height: 100%; }
.catalogo-tabla th { white-space: normal; }
.catalogo-tabla td { overflow: hidden; padding: 6px; }
.catalogo-texto { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; min-width: 0; }
.catalogo-acciones { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.catalogo-paginador { display: flex; align-items: center; justify-content: space-between; flex: 0 0 auto; gap: 4px; }
.catalogo-tarjeta { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--sg-border); border-radius: 8px; }
.sg-catalogo-precios--compacto .catalogo-toolbar { gap: 4px; flex-wrap: wrap; }
.sg-catalogo-precios--compacto .catalogo-toolbar > .q-input { flex-basis: 100%; }
.sg-catalogo-precios--compacto .catalogo-paginador { flex-direction: column; align-items: center; }
@container catalogo (max-height: 520px) {
  .sg-catalogo-precios--compacto .catalogo-toolbar > .q-input { flex-basis: 0; }
  .catalogo-tarjeta { gap: 2px; padding: 4px; }
  .catalogo-tarjeta > .sg-muted { display: none; }
  .catalogo-paginador { flex-direction: row !important; font-size: 11px; }
}
</style>
