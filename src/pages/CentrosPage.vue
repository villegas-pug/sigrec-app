<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header>
        <template #acciones>
          <q-btn v-if="puedeHacer('centro.registrar')" outline color="secondary" icon="add_business" label="Registrar centro" @click="dialogos.centro = true" />
          <q-btn v-if="puedeHacer('centro.actualizar')" outline color="secondary" icon="edit" label="Actualizar ficha" :disable="!activo" @click="dialogos.ficha = true" />
        </template>
      </page-header>

      <div class="sg-split">
        <section-card titulo="Centros" :subtitulo="perfil.ambito.descripcion" sin-relleno>
          <template #acciones>
            <filtro-inactivos v-model="mostrarInactivos" />
          </template>
          <div class="q-px-md q-pb-md">
            <q-input v-model="busqueda" dense outlined clearable label="Buscar centro">
              <template #append><boton-dictado v-model="busqueda" /></template>
            </q-input>
          </div>
          <button
            v-for="c in carsFiltrados"
            :key="c.id"
            type="button"
            class="sg-list-btn"
            :aria-current="c.id === carId ? 'true' : 'false'"
            @click="seleccionar(c.id)"
          >
            <span class="text-weight-bold">{{ c.nombre }}</span>
            <span class="sg-muted">{{ c.id }}</span>
            <span class="sg-chips">
              <status-chip v-bind="condicionInmueble(c.inmueble?.condicion)" />
              <status-chip tono="ne" :label="plural(ambientesDeCar(c.id).length, 'ambiente', 'ambientes')" />
              <status-chip v-if="c.anulacion" v-bind="CHIP_ANULADO" />
            </span>
          </button>
          <p v-if="!carsFiltrados.length" class="q-pa-md sg-muted">Sin resultados.</p>
        </section-card>

        <div v-if="car" ref="fichaRef" class="column q-gutter-y-md">
          <section-card :titulo="`Ficha del centro · ${car.nombre}`" :subtitulo="`${car.id} · datos del centro y del inmueble donde funciona.`">
            <template #acciones>
              <status-chip v-bind="condicionInmueble(inmueble.condicion)" />
              <status-chip v-if="car.anulacion" v-bind="CHIP_ANULADO" />
              <menu-acciones :items="accionesCentro" :etiqueta="`Acciones de ${car.nombre}`" />
            </template>
            <note-banner v-if="car.anulacion" tono="ne" icono="block" class="q-mb-md">
              Centro anulado el {{ fecha(car.anulacion.fecha) }} por {{ car.anulacion.por }}. Motivo: {{ car.anulacion.motivo }}
            </note-banner>
            <div class="sg-kv-grid">
              <key-value etiqueta="Dirección">
                <template v-if="inmueble.direccion">{{ inmueble.direccion }}</template>
                <status-chip v-else tono="si" label="No informada" />
              </key-value>
              <key-value etiqueta="Referencia de fundación" :nota="inmueble.fundacion.nota || ''">
                <template v-if="inmueble.fundacion.referencia">{{ inmueble.fundacion.referencia }}</template>
                <status-chip v-else tono="si" label="No informada" />
              </key-value>
              <key-value etiqueta="Condición del inmueble">{{ condicionInmueble(inmueble.condicion).label }}</key-value>
              <template v-if="inmueble.condicion === 'alquilado'">
                <key-value etiqueta="Arrendador">
                  <template v-if="inmueble.arrendador">{{ inmueble.arrendador }}</template>
                  <status-chip v-else tono="si" label="Información pendiente" />
                </key-value>
                <key-value etiqueta="Contrato de alquiler">
                  <template v-if="inmueble.contratoHasta">Vigente hasta el {{ fecha(inmueble.contratoHasta) }}</template>
                  <status-chip v-else tono="si" label="Información pendiente" />
                </key-value>
              </template>
              <key-value etiqueta="Litigios" :nota="inmueble.litigios ? '' : 'No se ha informado si existen litigios'">
                <template v-if="inmueble.litigios">{{ inmueble.litigios }}</template>
                <status-chip v-else tono="si" label="Información pendiente" />
              </key-value>
            </div>
          </section-card>

          <section-card titulo="Construcción e infraestructura">
            <div class="sg-kv-grid">
              <key-value v-for="campo in camposConstruccion" :key="campo.etiqueta" :etiqueta="campo.etiqueta" :nota="campo.nota || ''">
                <template v-if="campo.valor != null && campo.valor !== ''">{{ campo.valor }}</template>
                <status-chip v-else tono="si" label="No informado" />
              </key-value>
              <key-value etiqueta="Estado general">
                <status-chip v-bind="condicion(inmueble.construccion.estado)" />
              </key-value>
              <key-value etiqueta="Última actualización" :nota="inmueble.actualizado.por">{{ fecha(inmueble.actualizado.fecha) }}</key-value>
            </div>
          </section-card>

          <galeria-fotos :centro="car" titulo="Fotografías del centro" />

          <section-card :titulo="`Ambientes del centro (${ambientesCentro.length})`" subtitulo="Cada ambiente tiene su ficha, su galería y sus bienes" sin-relleno>
            <template v-if="puedeAcceder('ambientes')" #acciones>
              <q-btn outline color="secondary" icon="meeting_room" label="Ver todos" :to="{ name: 'ambientes', query: { car: carId } }" />
            </template>
            <div v-for="amb in ambientesCentro" :key="amb.id" class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
              <div class="column">
                <router-link v-if="puedeAcceder('ambientes')" :to="{ name: 'ambientes', query: { car: carId, ambiente: amb.id } }" class="text-weight-bold">{{ amb.nombre }}</router-link>
                <span v-else class="text-weight-bold">{{ amb.nombre }}</span>
                <span class="sg-muted">{{ [amb.piso != null ? `Piso ${amb.piso}` : null, amb.bloque, amb.ubicacion].filter(Boolean).join(' · ') || 'Ubicación no informada' }}</span>
              </div>
              <div class="sg-chips">
                <status-chip v-bind="condicion(amb.condicion)" />
                <status-chip tono="ne" :label="plural(bienesDeAmbiente(amb.id).filter((b) => b.situacion === 'activo').length, 'bien activo', 'bienes activos')" />
              </div>
            </div>
            <p v-if="!ambientesCentro.length" class="q-pa-md sg-muted q-mb-none">El centro aún no tiene ambientes registrados.</p>
          </section-card>
        </div>
      </div>
    </div>

    <centro-dialog v-model="dialogos.centro" @hecho="seleccionar" />
    <centro-ficha-dialog v-if="car" v-model="dialogos.ficha" :centro="car" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, nextTick, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import KeyValue from 'components/common/KeyValue.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import CentroDialog from 'components/centros/CentroDialog.vue'
import CentroFichaDialog from 'components/centros/CentroFichaDialog.vue'
import GaleriaFotos from 'components/centros/GaleriaFotos.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useCentroSeleccionado } from 'src/composables/useCentroSeleccionado'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientesDeCar, bienesDeAmbiente, vigente } from 'src/services/datos'
import { anular, dependenciasDeCentro } from 'src/services/acciones'
import { CHIP_ANULADO, condicion, condicionInmueble } from 'src/config/catalogos'
import { fecha, plural } from 'src/utils/formato'

const $q = useQuasar()
const route = useRoute()
const { perfil, carsDelAmbito, puedeAcceder, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const busqueda = ref('')
const mostrarInactivos = ref(false)
const fichaRef = ref(null)

const carsVisibles = computed(() => carsDelAmbito(mostrarInactivos.value))
const { carId, car } = useCentroSeleccionado(route.query.car, { fuente: carsVisibles })

const carsFiltrados = computed(() => {
  const t = (busqueda.value ?? '').toLowerCase()
  return carsVisibles.value.filter((c) => !t || c.nombre.toLowerCase().includes(t) || c.id.toLowerCase().includes(t))
})

const inmueble = computed(() => car.value?.inmueble)
const activo = computed(() => !!car.value && vigente(car.value))
const ambientesCentro = computed(() => (car.value ? ambientesDeCar(car.value.id) : []))

const camposConstruccion = computed(() => {
  const c = inmueble.value.construccion
  return [
    { etiqueta: 'Material de construcción', valor: c.material },
    { etiqueta: 'Antigüedad', valor: c.antiguedad, nota: c.antiguedadNota },
    { etiqueta: 'Pisos', valor: c.pisos },
    { etiqueta: 'Área construida', valor: c.areaM2 ? `${c.areaM2} m²` : null },
    { etiqueta: 'Características', valor: c.caracteristicas }
  ]
})

// En pantallas pequeñas la ficha queda debajo de la lista: se baja hasta ella al elegir un centro.
async function seleccionar (id) {
  carId.value = id
  if ($q.screen.lt.md) {
    await nextTick()
    fichaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const dialogos = reactive({ centro: false, ficha: false })

const accionesCentro = computed(() => {
  if (!car.value) return []
  const c = car.value
  return [
    {
      label: 'Anular centro',
      icono: 'block',
      peligro: true,
      visible: puedeHacer('centro.anular') && vigente(c),
      accion: () => pedirAnulacion({
        titulo: 'Anular centro',
        subtitulo: `${c.nombre} · ${c.id}`,
        dependencias: dependenciasDeCentro(c),
        mensaje: 'Centro anulado.',
        ejecutar: (datos) => anular(c, datos)
      })
    },
    {
      label: 'Reactivar centro',
      icono: 'restore',
      visible: puedeHacer('centro.anular') && !vigente(c),
      accion: () => pedirReactivacion({ entidad: 'centro', registro: c, nombre: 'Centro' })
    }
  ]
})
</script>
