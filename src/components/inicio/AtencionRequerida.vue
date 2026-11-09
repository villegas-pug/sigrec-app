<template>
  <section-card id="atencion" titulo="Atención requerida" subtitulo="Avisos consultados dentro de SIGREC; destinatarios y otros canales por definir" sin-relleno>
    <q-tabs v-model="horizonte" dense no-caps align="left" active-color="primary" indicator-color="primary" class="q-px-md">
      <q-tab name="ahora" :label="`Ahora (${avisos.ahora.length})`" />
      <q-tab name="proximo" :label="`Próximos ${PARAMETROS_ATENCION.diasProximos} días (${avisos.proximos.length})`" />
    </q-tabs>

    <div class="sg-filters q-px-md q-pt-md">
      <q-select v-model="categoria" :options="opcionesCategoria" emit-value map-options outlined dense label="Tema">
        <template #append><boton-dictado v-model="categoria" tipo="opcion" :opciones="opcionesCategoria" emit-value /></template>
      </q-select>
      <q-select v-if="opcionesCar.length > 1" v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Centro">
        <template #append><boton-dictado v-model="carId" tipo="opcion" :opciones="opcionesCar" emit-value /></template>
      </q-select>
    </div>

    <ul class="sg-timeline q-px-md">
      <li v-for="aviso in visibles" :key="aviso.id" class="sg-timeline__item">
        <div class="column q-gutter-y-xs" style="min-width: 0">
          <div class="sg-chips items-center">
            <status-chip :tono="aviso.tono" :label="aviso.etiqueta" />
            <span class="sg-muted">{{ aviso.contexto }}</span>
          </div>
          <span>{{ aviso.texto }}</span>
          <div class="row items-center q-gutter-sm">
            <q-btn v-if="accionDe(aviso)" dense unelevated no-caps color="primary" :icon="aviso.accion.icono" :label="aviso.accion.label" @click="abrirAccion(aviso.accion)" />
            <router-link v-if="destinoDe(aviso)" :to="destinoDe(aviso)" class="text-weight-bold">{{ aviso.enlace }}</router-link>
          </div>
        </div>
      </li>
      <li v-if="!visibles.length" class="sg-timeline__item sg-muted">
        {{ horizonte === 'ahora' ? 'Sin avisos para los filtros seleccionados.' : 'Nada vence en los próximos días para los filtros seleccionados.' }}
      </li>
    </ul>

    <!-- Las acciones abren los mismos diálogos de cada módulo, sin salir de Inicio. -->
    <mantenimiento-dialog
      v-if="dialogo.tipo === 'mantenimiento'"
      v-model="dialogo.abierto"
      :centro="carPorId(dialogo.datos.carId)"
      :tipo-inicial="dialogo.datos.tipo"
      :bien-id="dialogo.datos.bienId"
      :vehiculo-id="dialogo.datos.vehiculoId"
    />
    <periodo-dialog v-if="dialogo.tipo === 'periodo'" v-model="dialogo.abierto" :servicio="dialogo.servicio" :celda="dialogo.celda" :anio="dialogo.datos.anio" />
    <hecho-servicio-dialog v-if="dialogo.tipo === 'hecho'" v-model="dialogo.abierto" :servicio="dialogo.servicio" :tipo-inicial="dialogo.datos.tipo" />
    <servicio-dialog v-if="dialogo.tipo === 'servicio'" v-model="dialogo.abierto" :centro="carPorId(dialogo.servicio.carId)" :servicio="dialogo.servicio" />
  </section-card>
</template>

<script setup>
// «Atención requerida» de Inicio (SPEC 011): avisos de ahora y próximos vencimientos, filtrables por tema y centro.
// Cada aviso ofrece su acción (si el perfil puede hacerla) y el enlace al registro exacto (si el perfil puede acceder).
import { computed, nextTick, reactive, ref } from 'vue'
import BotonDictado from 'components/common/BotonDictado.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import MantenimientoDialog from 'components/centros/MantenimientoDialog.vue'
import PeriodoDialog from 'components/servicios/PeriodoDialog.vue'
import HechoServicioDialog from 'components/servicios/HechoServicioDialog.vue'
import ServicioDialog from 'components/servicios/ServicioDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { carPorId, servicioPorId } from 'src/services/datos'
import { celdasDelServicio } from 'src/services/servicios'
import { CATEGORIAS_AVISO } from 'src/services/atencion'
import { TODOS } from 'src/config/catalogos'
import { FECHA_CORTE, PARAMETROS_ATENCION } from 'src/config/demo'

const props = defineProps({
  // { ahora: [], proximos: [] } de services/atencion › avisosDeAtencion
  avisos: { type: Object, required: true }
})

const { carsEnAmbito, puedeAcceder, puedeHacer } = usePerfil()

const horizonte = ref('ahora')
const categoria = ref(TODOS)
const carId = ref(TODOS)
useEstadoNavegacion('atencion', { horizonte, categoria, carId })

const lista = computed(() => (horizonte.value === 'ahora' ? props.avisos.ahora : props.avisos.proximos))
const visibles = computed(() =>
  lista.value.filter((a) => (categoria.value === TODOS || a.categoria === categoria.value) && (carId.value === TODOS || a.carId === carId.value))
)

const opcionesCategoria = [{ label: 'Todos los temas', value: TODOS }, ...Object.entries(CATEGORIAS_AVISO).map(([value, label]) => ({ value, label }))]
const opcionesCar = computed(() =>
  carsEnAmbito.value.length > 1 ? [{ label: 'Todos los centros', value: TODOS }, ...carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id }))] : []
)

// Primer destino al que el perfil tiene acceso (p. ej. el mantenimiento de un vehículo: ficha del centro o Vehículos).
const destinoDe = (aviso) => aviso.destinos?.find((d) => puedeAcceder(d.name)) ?? null
const accionDe = (aviso) => (aviso.accion && puedeHacer(aviso.accion.permiso) ? aviso.accion : null)

// El diálogo se monta con sus datos y se abre en el siguiente ciclo, para que inicialice su formulario al abrirse.
const dialogo = reactive({ tipo: null, abierto: false, datos: {}, servicio: null, celda: null })
async function abrirAccion (accion) {
  const servicio = accion.datos.servicioId ? servicioPorId(accion.datos.servicioId) : null
  const celda = servicio && accion.tipo === 'periodo'
    ? celdasDelServicio(servicio, accion.datos.anio, FECHA_CORTE).find((c) => c.numero === accion.datos.numero) ?? null
    : null
  Object.assign(dialogo, { tipo: accion.tipo, abierto: false, datos: accion.datos, servicio, celda })
  await nextTick()
  dialogo.abierto = true
}
</script>
