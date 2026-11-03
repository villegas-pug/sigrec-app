<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('tipoBien.registrar')" unelevated color="primary" icon="add" label="Registrar tipo de bien" @click="abrirTipo(null)" />
        </template>
      </page-header>

      <registro-no-disponible v-if="tipoNoDisponible" entidad="El tipo de bien" :id="tipoPedido" :volver="{ name: 'precios' }" etiqueta-volver="Ver todos los tipos" />

      <note-banner tono="in">
        El precio referencial es el precio esperado de reposición y no el costo original de adquisición. Su fuente y vigencia están por definir.
        El catálogo de tipos de bien lo administra el equipo central.
      </note-banner>

      <div class="sg-filters">
        <q-input v-model="texto" outlined dense clearable label="Buscar tipo de bien" />
        <q-select v-model="filtro" :options="OPCIONES_FILTRO" emit-value map-options outlined dense label="Mostrar" />
        <div class="row items-center"><filtro-inactivos v-model="mostrarInactivos" /></div>
      </div>

      <section-card titulo="Tipos de bien y precios" :subtitulo="`Necesidades del ${ANIO_REVISION} · ${perfil.ambito.descripcion}`" sin-relleno>
        <div v-if="!$q.screen.lt.sm" class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr>
                <th scope="col">Tipo de bien</th>
                <th scope="col" class="sg-num">Precio referencial</th>
                <th scope="col">Fecha</th>
                <th scope="col">Procedencia</th>
                <th scope="col" class="sg-num">Necesidades que lo usan</th>
                <th scope="col"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in filas" :id="`tipo-${fila.tipo.id}`" :key="fila.tipo.id" :class="{ 'sg-row--selected': fila.tipo.id === tipoResaltado }">
                <td>
                  {{ fila.tipo.nombre }}
                  <div class="sg-muted">
                    {{ CATEGORIAS[fila.tipo.categoria] }}<template v-if="fila.tipo.vidaUtilSugerida"> · vida útil sugerida {{ plural(fila.tipo.vidaUtilSugerida, 'año', 'años') }}</template>
                  </div>
                  <status-chip v-if="fila.tipo.anulacion" v-bind="CHIP_ANULADO" />
                </td>
                <td class="sg-num">
                  <template v-if="fila.tipo.precio != null">{{ soles(fila.tipo.precio) }}</template>
                  <status-chip v-else tono="wa" label="Sin precio" />
                </td>
                <td>
                  <template v-if="fila.tipo.fechaPrecio">{{ fecha(fila.tipo.fechaPrecio) }}</template>
                  <status-chip v-else tono="si" label="No informada" />
                </td>
                <td>
                  <template v-if="fila.tipo.procedencia">{{ fila.tipo.procedencia }}</template>
                  <status-chip v-else tono="si" label="No informada" />
                </td>
                <td class="sg-num">
                  <template v-if="fila.necesidades">{{ fila.necesidades }} ({{ plural(fila.unidades, 'unidad', 'unidades') }})</template>
                  <span v-else class="sg-muted">—</span>
                </td>
                <td class="text-right no-wrap">
                  <q-btn v-if="puedeHacer('precio.informar') && vigente(fila.tipo)" flat dense color="secondary" icon="sell" label="Informar precio" @click="abrirPrecio(fila.tipo)" />
                  <menu-acciones :items="accionesTipo(fila.tipo)" :etiqueta="`Acciones del tipo ${fila.tipo.nombre}`" />
                </td>
              </tr>
              <tr v-if="!filas.length"><td colspan="6" class="sg-muted">Sin tipos de bien para los filtros seleccionados.</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Móvil: una tarjeta por tipo, con sus acciones a la vista. -->
        <div v-else class="column q-gutter-y-md q-px-md q-pb-md">
          <div v-for="fila in filas" :id="`tipo-${fila.tipo.id}`" :key="fila.tipo.id" class="sg-box" :class="{ 'sg-box--resaltada': fila.tipo.id === tipoResaltado }">
            <div class="row items-start no-wrap justify-between">
              <div class="column">
                <span class="text-weight-bold">{{ fila.tipo.nombre }}</span>
                <span class="sg-muted">{{ CATEGORIAS[fila.tipo.categoria] }}<template v-if="fila.tipo.vidaUtilSugerida"> · vida útil sugerida {{ plural(fila.tipo.vidaUtilSugerida, 'año', 'años') }}</template></span>
              </div>
              <menu-acciones :items="accionesTipo(fila.tipo)" :etiqueta="`Acciones del tipo ${fila.tipo.nombre}`" />
            </div>
            <status-chip v-if="fila.tipo.anulacion" v-bind="CHIP_ANULADO" />
            <div>
              <span class="sg-kv__label">Precio referencial: </span>
              <template v-if="fila.tipo.precio != null"><strong>{{ soles(fila.tipo.precio) }}</strong> · {{ fecha(fila.tipo.fechaPrecio) }}</template>
              <status-chip v-else tono="wa" label="Sin precio" />
            </div>
            <span class="sg-muted">Procedencia: {{ fila.tipo.procedencia ?? 'no informada' }}</span>
            <span v-if="fila.necesidades" class="sg-muted">{{ plural(fila.necesidades, 'necesidad', 'necesidades') }} ({{ plural(fila.unidades, 'unidad', 'unidades') }})</span>
            <q-btn v-if="puedeHacer('precio.informar') && vigente(fila.tipo)" outline dense no-caps color="secondary" icon="sell" label="Informar precio" class="self-start" @click="abrirPrecio(fila.tipo)" />
          </div>
          <p v-if="!filas.length" class="sg-muted q-mb-none">Sin tipos de bien para los filtros seleccionados.</p>
        </div>
      </section-card>
    </div>

    <tipo-bien-dialog v-model="dialogoTipo.abierto" :tipo="dialogoTipo.tipo" />
    <precio-dialog v-if="dialogoPrecio.tipo" v-model="dialogoPrecio.abierto" :tipo="dialogoPrecio.tipo" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
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
import { fecha, plural, soles } from 'src/utils/formato'
import { parametro } from 'src/utils/navegacion'

const OPCIONES_FILTRO = [
  { label: 'Todos los tipos', value: 'todos' },
  { label: 'Usados por necesidades', value: 'usados' },
  { label: 'Necesidades sin precio', value: 'faltantes' }
]

const route = useRoute()
const { perfil, carIdsEnAmbito, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

// Enlaces profundos: ?tipo= abre la valoración de ese tipo (o lo resalta si el perfil no puede valorar); ?filtro=faltantes muestra los tipos sin precio.
const tipoPedido = parametro(route.query.tipo)
const tipoSolicitado = tipoPedido ? tipoPorId(tipoPedido) : null
const tipoNoDisponible = !!tipoPedido && !tipoSolicitado
const tipoResaltado = tipoSolicitado?.id ?? null

const texto = ref('')
const filtro = ref(OPCIONES_FILTRO.some((o) => o.value === parametro(route.query.filtro)) ? parametro(route.query.filtro) : 'todos')
const mostrarInactivos = ref(!!tipoSolicitado?.anulacion)

const pendientes = computed(() => calcularNecesidades({ anio: ANIO_REVISION, carIds: carIdsEnAmbito.value }).pendientes)

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

const dialogoTipo = reactive({ abierto: false, tipo: null })
const dialogoPrecio = reactive({ abierto: false, tipo: null })

const abrirTipo = (tipo) => Object.assign(dialogoTipo, { abierto: true, tipo })
const abrirPrecio = (tipo) => Object.assign(dialogoPrecio, { abierto: true, tipo })

onMounted(async () => {
  if (!tipoSolicitado) return
  if (puedeHacer('precio.informar') && vigente(tipoSolicitado)) abrirPrecio(tipoSolicitado)
  await nextTick()
  document.getElementById(`tipo-${tipoSolicitado.id}`)?.scrollIntoView({ block: 'center' })
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
      ejecutar: (datos) => anular(tipo, datos)
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
