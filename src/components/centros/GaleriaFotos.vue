<template>
  <div>
    <section-card :titulo="`${titulo} (${items.length})`" subtitulo="Sin imágenes de personas. En el prototipo las imágenes se conservan solo durante la sesión.">
      <template #acciones>
        <filtro-inactivos v-model="mostrarInactivas" />
        <q-btn v-if="puedeHacer(bien ? 'bien.actualizar' : 'centro.foto')" outline color="secondary" icon="add_a_photo" label="Incorporar fotografía" :disable="!activo" @click="abrir(null)" />
      </template>
      <div v-if="items.length" class="sg-kv-grid">
        <figure v-for="{ foto, i } in items" :key="i" class="sg-photo q-ma-none">
          <img v-if="foto.url" :src="foto.url" :alt="foto.titulo" class="sg-photo__img">
          <template v-else>
            <q-icon name="image" size="28px" aria-hidden="true" />
            <span>[Foto: {{ foto.titulo }}]</span>
          </template>
          <figcaption class="sg-muted text-center">
            <template v-if="foto.url">{{ foto.titulo }} · </template>{{ fecha(foto.fecha) }}<template v-if="foto.nota"> · {{ foto.nota }}</template>
            <status-chip v-if="!ambienteId && !bien" tono="ne" :label="foto.ambienteId ? (ambientePorId(foto.ambienteId)?.nombre ?? 'Ambiente') : 'Del centro'" class="q-ml-xs" />
            <status-chip v-if="foto.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
          </figcaption>
          <menu-acciones :items="accionesFoto(foto)" :etiqueta="`Acciones de la fotografía ${foto.titulo}`" />
        </figure>
      </div>
      <p v-else class="sg-muted q-mb-none">{{ ambienteId ? 'Este ambiente no tiene fotografías.' : 'No hay fotografías registradas.' }}</p>
      <slot />
    </section-card>

    <foto-dialog v-model="dialogo" :centro="centro" :bien="bien" :foto="enEdicion" :ambiente-inicial="ambienteId" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </div>
</template>

<script setup>
// Galería de fotografías de un centro o, con `ambienteId`, de uno de sus ambientes. Las fotografías históricas, sin ambiente,
// se tratan como del centro y solo aparecen en la galería del centro.
import { computed, ref } from 'vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import MenuAcciones from 'components/common/MenuAcciones.vue'
import FiltroInactivos from 'components/common/FiltroInactivos.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import FotoDialog from 'components/centros/FotoDialog.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, vigente } from 'src/services/datos'
import { anular } from 'src/services/acciones'
import { CHIP_ANULADO } from 'src/config/catalogos'
import { fecha } from 'src/utils/formato'

const props = defineProps({
  centro: { type: Object, default: null },
  bien: { type: Object, default: null },
  // null = galería del centro (todas sus fotografías); si no, solo las de ese ambiente.
  ambienteId: { type: String, default: null },
  titulo: { type: String, default: 'Fotografías' }
})

const { puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const mostrarInactivas = ref(false)
const dialogo = ref(false)
const enEdicion = ref(null)

const activo = computed(() => props.bien ? props.bien.situacion === 'activo' : vigente(props.centro) && (!props.ambienteId || vigente(ambientePorId(props.ambienteId) ?? {})))

// Se conserva el índice original para dar una clave estable aunque cambien los filtros.
const items = computed(() =>
  (props.bien ? (props.bien.fotos ?? []) : (props.centro.inmueble?.fotos ?? []))
    .map((foto, i) => ({ foto, i }))
    .filter(({ foto }) => !props.ambienteId || foto.ambienteId === props.ambienteId)
    .filter(({ foto }) => mostrarInactivas.value || vigente(foto))
)

function abrir (foto) {
  enEdicion.value = foto
  dialogo.value = true
}

const accionesFoto = (foto) => [
  { label: 'Actualizar fotografía', icono: 'edit', visible: puedeHacer('foto.actualizar') && vigente(foto), accion: () => abrir(foto) },
  {
    label: 'Anular fotografía',
    icono: 'block',
    peligro: true,
    visible: puedeHacer('foto.anular') && vigente(foto),
    accion: () => pedirAnulacion({
      titulo: 'Anular fotografía',
      subtitulo: foto.titulo,
      mensaje: 'Fotografía anulada.',
      ejecutar: (datos) => anular(foto, datos)
    })
  },
  {
    label: 'Reactivar fotografía',
    icono: 'restore',
    visible: puedeHacer('foto.anular') && !vigente(foto),
    accion: () => pedirReactivacion({ entidad: 'foto', registro: foto, nombre: 'Fotografía' })
  }
]
</script>
