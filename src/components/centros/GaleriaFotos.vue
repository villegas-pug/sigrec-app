<template>
  <div>
    <section-card :titulo="`${titulo} (${items.length})`" subtitulo="Sin imágenes de personas. En el prototipo las imágenes se conservan solo durante la sesión.">
      <template #acciones>
        <filtro-inactivos v-model="mostrarInactivas" />
        <q-btn v-if="puedeHacer(bien ? 'bien.actualizar' : 'centro.foto')" outline color="secondary" icon="add_a_photo" label="Incorporar fotografía" :disable="!activo" @click="abrir(null)" />
      </template>
      <div v-if="items.length" class="sg-photo-grid">
        <figure v-for="{ foto, i } in items" :key="i" class="sg-photo q-ma-none">
          <button v-if="disponible(foto)" type="button" class="sg-photo__open" :aria-label="`Ampliar fotografía ${foto.titulo}`" @click="abrirVisor(foto, $event)">
            <img :src="foto.url" :alt="foto.titulo" class="sg-photo__img" @error="marcarError(foto.url)">
          </button>
          <div v-else class="sg-photo__missing">
            <q-icon name="image" size="28px" aria-hidden="true" />
            <span>Imagen no disponible</span>
          </div>
          <figcaption class="sg-photo__caption">
            <strong>{{ foto.titulo }}</strong>
            <span>{{ fecha(foto.fecha) }}</span><span v-if="foto.nota">{{ foto.nota }}</span>
            <status-chip v-if="!ambienteId && !bien" tono="ne" :label="nombreAmbiente(foto)" class="q-ml-xs" />
            <status-chip v-if="foto.anulacion" v-bind="CHIP_ANULADO" class="q-ml-xs" />
          </figcaption>
          <div class="sg-photo__actions">
            <q-btn v-if="disponible(foto)" flat round icon="download" color="secondary" :aria-label="`Descargar imagen ${foto.titulo}`" @click="descargar(foto)" />
            <menu-acciones :items="accionesFoto(foto)" :etiqueta="`Acciones de la fotografía ${foto.titulo}`" />
          </div>
        </figure>
      </div>
      <p v-else class="sg-muted q-mb-none">{{ ambienteId ? 'Este ambiente no tiene fotografías.' : 'No hay fotografías registradas.' }}</p>
      <slot />
    </section-card>

    <foto-dialog v-model="dialogo" :centro="centro" :bien="bien" :foto="enEdicion" :ambiente-inicial="ambienteId" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
    <visor-fotos v-model="visorAbierto" :fotos="fotosDisponibles" :indice-inicial="indiceInicial" :contexto="contexto" @descargar="descargar" @error-imagen="marcarError" @hide="restaurarFoco" />
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
import VisorFotos from 'components/centros/VisorFotos.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, etiquetaAmbiente, vigente } from 'src/services/datos'
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
const errores = ref([])
const visorAbierto = ref(false)
const indiceInicial = ref(0)
let focoAnterior = null

const activo = computed(() => props.bien ? props.bien.situacion === 'activo' : vigente(props.centro) && (!props.ambienteId || vigente(ambientePorId(props.ambienteId) ?? {})))

// Se conserva el índice original para dar una clave estable aunque cambien los filtros.
const items = computed(() =>
  (props.bien ? (props.bien.fotos ?? []) : (props.centro.inmueble?.fotos ?? []))
    .map((foto, i) => ({ foto, i }))
    .filter(({ foto }) => !props.ambienteId || foto.ambienteId === props.ambienteId)
    .filter(({ foto }) => mostrarInactivas.value || vigente(foto))
)

const disponible = (foto) => !!foto.url && !errores.value.includes(foto.url)
const fotosDisponibles = computed(() => items.value.map(({ foto }) => foto).filter(disponible))
const marcarError = (url) => { if (url && !errores.value.includes(url)) errores.value = [...errores.value, url] }
// «Módulo › Ambiente» de la foto (SPEC 020); sin ambiente es del centro.
const nombreAmbiente = (foto) => {
  if (!foto.ambienteId) return 'Del centro'
  const a = ambientePorId(foto.ambienteId)
  return a ? etiquetaAmbiente(a) : 'Ambiente'
}
const contexto = (foto) => props.bien ? `${props.bien.nombre} · ${props.bien.id}` : nombreAmbiente(foto)
function abrirVisor (foto, evento) {
  focoAnterior = evento.currentTarget
  indiceInicial.value = fotosDisponibles.value.indexOf(foto)
  visorAbierto.value = true
}
function restaurarFoco () { if (focoAnterior?.isConnected) focoAnterior.focus() }
function descargar (foto) {
  if (!disponible(foto)) return
  const enlace = document.createElement('a')
  enlace.href = foto.url
  enlace.download = (foto.nombreArchivo || foto.titulo || 'fotografia').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
  enlace.click()
}

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
      ejecutar: (datos) => anular(foto, datos),
      registro: foto
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
