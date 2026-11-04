<template>
  <detalle-panel
    :titulo="padre ? `Registrar componente de ${padre.nombre}` : `Registrar bien en ${ambiente.nombre}`"
    :ruta="textoUbicacion(ubicacionDeAmbiente(ambiente.id)) + (padre ? ` › ${padre.nombre} ${padre.id}` : '')"
    icono="playlist_add"
    :con-volver="conVolver"
    @volver="cerrar"
  >
    <template #acciones>
      <q-btn flat color="secondary" icon="close" label="Cerrar" @click="cerrar" />
    </template>

    <div class="sg-grid-2">
      <section-card titulo="Datos del bien" :subtitulo="previo ? `Datos aprovechados del inventario previo ${previo.id}` : 'Los campos con * son obligatorios'">
        <template v-if="previo" #acciones>
          <q-btn flat dense color="secondary" icon="close" label="Quitar inventario previo" @click="quitarPrevio" />
        </template>
        <q-form ref="formulario" class="column q-gutter-y-md" @submit="guardar">
          <div class="row q-col-gutter-md">
            <q-select v-model="form.tipoId" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Tipo de bien *" :rules="[requerido]" @update:model-value="alCambiarTipo">
              <template #append><boton-dictado v-model="form.tipoId" tipo="opcion" :opciones="opcionesTipo" emit-value /></template>
            </q-select>
            <q-input v-model="form.nombre" class="col-12 col-sm-6" outlined dense label="Nombre *" :rules="[requerido]">
              <template #append><boton-dictado v-model="form.nombre" /></template>
            </q-input>
            <q-input v-model="form.rotulo" class="col-12 col-sm-6" outlined dense label="Rótulo SIGREC *" hint="Sugerido a partir del ambiente; puede corregirse" :rules="[requerido, rotuloLibre]">
              <template #append><boton-dictado v-model="form.rotulo" tipo="codigo" /></template>
            </q-input>
            <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Cantidad *" :rules="[minimo(1)]">
              <template #append><boton-dictado v-model="form.cantidad" tipo="numero" /></template>
            </q-input>
          </div>

          <div v-if="tipoElegido" class="sg-box">
            <div class="sg-muted">Precio referencial del catálogo (no es el costo original del bien)</div>
            <template v-if="tipoElegido.precio != null">
              <span class="text-weight-bold">{{ soles(tipoElegido.precio) }}</span>
              <span class="sg-muted">{{ tipoElegido.nombre }} · {{ tipoElegido.procedencia ?? 'Procedencia no informada' }} · {{ fecha(tipoElegido.fechaPrecio) }}</span>
            </template>
            <template v-else>
              <div class="sg-chips"><status-chip tono="wa" label="Sin valorar" /></div>
              <router-link v-if="puedeValorar" :to="{ name: 'precios', query: { tipo: tipoElegido.id } }" class="text-weight-bold">Informar el precio de {{ tipoElegido.nombre }}</router-link>
              <span v-else class="sg-muted">Pendiente de valoración por equipo central.</span>
            </template>
          </div>

          <condicion-selector v-model="form.condicion" etiqueta="Condición constatada *" />
          <div v-if="previo" class="sg-muted">Dato previo: {{ previo.condicion ? condicion(previo.condicion).label : 'no informado' }}</div>

          <campo-adquisicion
            v-model="form.fechaAdquisicion"
            label="Adquisición"
            :hint="previo?.fechaAdquisicion ? `Dato previo sin confirmar: ${fecha(previo.fechaAdquisicion)}. Indíquela solo si la constata.` : 'Indique solo lo que conoce: el año o el año y mes. Vacío si se desconoce'"
          />

          <q-expansion-item v-model="adicionalesAbierto" dense expand-separator icon="tune" label="Datos adicionales" caption="Categoría, código patrimonial, marca, serie, deterioro, costo original, vida útil y componente de">
            <div class="column q-gutter-y-md q-pt-md">
              <div class="row q-col-gutter-md">
                <q-select v-model="form.categoria" class="col-12 col-sm-6" :options="OPCIONES_CATEGORIA" emit-value map-options outlined dense label="Categoría *" hint="Se completa con el tipo de bien" :rules="[requerido]">
                  <template #append><boton-dictado v-model="form.categoria" tipo="opcion" :opciones="OPCIONES_CATEGORIA" emit-value /></template>
                </q-select>
                <q-input
                  v-model="form.codigoPatrimonial"
                  class="col-12 col-sm-6"
                  outlined
                  dense
                  label="Código patrimonial"
                  :hint="previo ? `Dato previo: ${previo.codigoPatrimonial ?? 'no informado'}. Déjelo vacío si no es visible.` : 'Vacío si el bien no tiene código patrimonial'">
                  <template #append><boton-dictado v-model="form.codigoPatrimonial" tipo="codigo" /></template>
                </q-input>
                <q-input v-model="form.marcaModelo" class="col-12 col-sm-6" outlined dense label="Marca y modelo" :hint="previo ? `Dato previo: ${previo.marcaModelo ?? 'no informado'}` : ''">
                  <template #append><boton-dictado v-model="form.marcaModelo" /></template>
                </q-input>
                <q-input v-model="form.serie" class="col-12 col-sm-6" outlined dense label="Serie" :hint="previo ? `Dato previo: ${previo.serie ?? 'no informado'}` : ''">
                  <template #append><boton-dictado v-model="form.serie" tipo="codigo" /></template>
                </q-input>
                <q-input v-model.number="form.costo" class="col-12 col-sm-6" outlined dense type="number" min="0" label="Costo original (S/)" hint="Dato histórico; vacío si se desconoce">
                  <template #append><boton-dictado v-model="form.costo" tipo="numero" /></template>
                </q-input>
                <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Vida útil (años)" hint="Vacío = pendiente de definir">
                  <template #append><boton-dictado v-model="form.vidaUtilAnios" tipo="numero" /></template>
                </q-input>
              </div>
              <q-input v-model="form.deterioro" outlined dense type="textarea" autogrow label="Deterioro observado">
                <template #append><boton-dictado v-model="form.deterioro" /></template>
              </q-input>
              <div class="row q-col-gutter-md">
                <q-select
                  v-model="form.asociadoA"
                  class="col-12 col-sm-7"
                  :options="opcionesAsociar"
                  emit-value
                  map-options
                  :clearable="!asociarA"
                  :disable="!!asociarA"
                  outlined
                  dense
                  label="Componente de"
                  hint="Opcional: bien del que forma parte (p. ej. la cama de un colchón). Un componente no admite componentes">
                  <template #append><boton-dictado v-model="form.asociadoA" tipo="opcion" :opciones="opcionesAsociar" emit-value :disable="!!asociarA" /></template>
                </q-select>
                <q-input v-model="form.posicion" class="col-12 col-sm-5" outlined dense label="Posición" :disable="!form.asociadoA" placeholder="Ej.: Cama inferior">
                  <template #append><boton-dictado v-model="form.posicion" :disable="!form.asociadoA" /></template>
                </q-input>
              </div>
            </div>
          </q-expansion-item>

          <div class="row justify-end q-gutter-sm">
            <q-btn outline color="secondary" label="Guardar" @click="guardarYTerminar" />
            <q-btn unelevated color="primary" type="submit" icon="playlist_add" :label="`Guardar y registrar otro en ${ambiente.nombre}`" />
          </div>
        </q-form>
      </section-card>

      <div class="column q-gutter-y-md">
        <section-card v-if="previo" titulo="Contraste con el inventario previo" :subtitulo="`${previo.id} · inventario informático (ficticio)`" sin-relleno>
          <div class="sg-chips q-px-md q-pb-sm">
            <status-chip tono="ok" :label="plural(conteo.coincide, 'coincide', 'coinciden')" />
            <status-chip tono="wa" :label="plural(conteo.diferencia, 'diferencia', 'diferencias')" />
            <status-chip tono="si" :label="plural(conteo.pendiente, 'pendiente de verificación', 'pendientes de verificación')" />
          </div>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <thead>
                <tr><th scope="col">Dato</th><th scope="col">Inventario previo</th><th scope="col">Constatado</th><th scope="col">Resultado</th></tr>
              </thead>
              <tbody>
                <tr v-for="fila in contraste" :key="fila.etiqueta">
                  <td>{{ fila.etiqueta }}</td>
                  <td>{{ fila.previo }}</td>
                  <td>{{ fila.constatado ?? '—' }}</td>
                  <td><status-chip v-bind="RESULTADOS[fila.resultado]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <note-banner tono="in" class="q-ma-md">
            Los datos pendientes se conservan como información previa no verificada. La fuente real y el procedimiento de conciliación están por definir.
          </note-banner>
        </section-card>

        <section-card titulo="Inventario previo sin vincular" :subtitulo="`${plural(disponibles.length, 'registro', 'registros')} en este centro`" sin-relleno>
          <div v-for="item in disponibles" :key="item.id" class="sg-borde-superior row items-center justify-between q-px-md q-py-sm">
            <div class="column">
              <span class="text-weight-bold">{{ item.nombre }}</span>
              <span class="sg-muted">{{ item.id }} · ubicación previa: {{ item.ubicacionPrevia ?? 'no informada' }}</span>
            </div>
            <q-btn outline color="secondary" label="Aprovechar datos" :disable="previo?.id === item.id" @click="usarPrevio(item)" />
          </div>
          <p v-if="!disponibles.length" class="q-pa-md sg-muted q-mb-none">No hay registros pendientes de vincular.</p>
        </section-card>
      </div>
    </div>
  </detalle-panel>
</template>

<script setup>
// Modo registro del explorador de «Gestión de centros»: alta breve de un bien (o de un componente) en el ambiente seleccionado.
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import DetallePanel from 'components/gestion/DetallePanel.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import CondicionSelector from 'components/common/CondicionSelector.vue'
import CampoAdquisicion from 'components/common/CampoAdquisicion.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useBorrador } from 'src/composables/useBorrador'
import { db, bienPorId, bienesDeAmbiente, textoUbicacion, tipoPorId, ubicacionDeAmbiente, vigentes } from 'src/services/datos'
import { informarVerificacion, numeroONulo, registrarBien, rotuloSugerido } from 'src/services/acciones'
import { OPCIONES_CATEGORIA, condicion } from 'src/config/catalogos'
import { minimo, requerido } from 'src/utils/validaciones'
import { fecha, plural, soles } from 'src/utils/formato'

const RESULTADOS = {
  coincide: { label: 'Coincide', tono: 'ok' },
  diferencia: { label: 'Diferencia', tono: 'wa' },
  pendiente: { label: 'Pendiente', tono: 'si' },
  nuevo: { label: 'Dato nuevo', tono: 'in' }
}

const props = defineProps({
  ambiente: { type: Object, required: true },
  // Rótulo del bien del que el nuevo bien será componente; null = bien directo del ambiente.
  asociarA: { type: String, default: null },
  conVolver: { type: Boolean, default: false }
})

// `registrado`: se creó un bien (siga o no el panel abierto). `terminar`: «Guardar» cierra el modo y muestra el bien creado.
// `cerrar`: se pidió salir sin guardar (ya confirmado).
const emit = defineEmits(['registrado', 'terminar', 'cerrar'])

const $q = useQuasar()
const { puedeHacer } = usePerfil()

const padre = computed(() => (props.asociarA ? bienPorId(props.asociarA) : null))
const rotuloLibre = (v) => !bienPorId(v) || 'Ya existe un bien con ese rótulo'

const opcionesTipo = computed(() => vigentes(db.tiposBien).map((t) => ({ label: t.nombre, value: t.id })))
// Un componente solo se asocia a un bien que a su vez no sea componente (un solo nivel).
const opcionesAsociar = computed(() =>
  bienesDeAmbiente(props.ambiente.id)
    .filter((b) => b.situacion === 'activo' && !b.asociadoA)
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

const formulario = ref(null)
const previo = ref(null)

const vacio = () => ({
  tipoId: null,
  nombre: '',
  categoria: null,
  rotulo: '',
  codigoPatrimonial: '',
  cantidad: 1,
  marcaModelo: '',
  serie: '',
  condicion: null,
  deterioro: '',
  fechaAdquisicion: '',
  costo: null,
  vidaUtilAnios: null,
  asociadoA: opcionesAsociar.value.some((o) => o.value === props.asociarA) ? props.asociarA : null,
  posicion: ''
})
const form = reactive(vacio())

// Salir con datos sin guardar pide confirmación; tras guardar, el formulario vuelve a su estado base.
const { fijar, confirmarDescarte } = useBorrador(form, { proteger: true })
defineExpose({ confirmarDescarte })

const tipoElegido = computed(() => (form.tipoId ? tipoPorId(form.tipoId) : null))
const puedeValorar = computed(() => puedeHacer('precio.informar'))

// «Datos adicionales» se abre solo cuando ya trae valores (componente de otro bien o inventario previo).
const adicionalesAbierto = ref(!!form.asociadoA)
watch(previo, (p) => { if (p) adicionalesAbierto.value = true })

function alCambiarTipo (tipoId) {
  const tipo = tipoPorId(tipoId)
  if (!tipo) return
  form.categoria = tipo.categoria
  if (!form.nombre || !previo.value) form.nombre = tipo.nombre
  if (form.vidaUtilAnios == null && tipo.vidaUtilSugerida != null) form.vidaUtilAnios = tipo.vidaUtilSugerida
  form.rotulo = rotuloSugerido(props.ambiente.id, tipoId)
}

const disponibles = computed(() => db.inventarioPrevio.filter((i) => i.carId === props.ambiente.carId && !i.bienId))

// Se aprovechan los datos descriptivos; los verificables (código, marca, serie, condición, adquisición) se constatan físicamente.
function usarPrevio (item) {
  previo.value = item
  Object.assign(form, vacio(), { tipoId: item.tipoId, nombre: item.nombre })
  alCambiarTipo(item.tipoId)
  form.nombre = item.nombre
}

function quitarPrevio () {
  previo.value = null
}

const normalizar = (v) => String(v ?? '').trim().toLowerCase()

const contraste = computed(() => {
  const p = previo.value
  if (!p) return []
  const campo = (etiqueta, valorPrevio, valorForm, formato = (v) => v, igual = (a, b) => normalizar(a) === normalizar(b)) => {
    const constatado = valorForm ? formato(valorForm) : null
    let resultado = 'pendiente'
    if (valorForm && valorPrevio == null) resultado = 'nuevo'
    else if (valorForm) resultado = igual(valorForm, valorPrevio) ? 'coincide' : 'diferencia'
    return { etiqueta, previo: valorPrevio != null ? formato(valorPrevio) : 'No informado', constatado, resultado }
  }
  return [
    campo('Marca y modelo', p.marcaModelo, form.marcaModelo),
    campo('Serie', p.serie, form.serie),
    campo('Código patrimonial', p.codigoPatrimonial, form.codigoPatrimonial),
    campo('Condición', p.condicion, form.condicion, (v) => condicion(v).label),
    campo('Ubicación', p.ubicacionPrevia, props.ambiente.nombre),
    // Se compara con la precisión que ambos valores tienen en común (2019 coincide con 2019-03).
    campo('Fecha de adquisición', p.fechaAdquisicion, form.fechaAdquisicion, fecha, (a, b) => {
      const n = Math.min(String(a).length, String(b).length)
      return String(a).slice(0, n) === String(b).slice(0, n)
    })
  ]
})

const conteo = computed(() => ({
  coincide: contraste.value.filter((f) => f.resultado === 'coincide').length,
  diferencia: contraste.value.filter((f) => f.resultado === 'diferencia').length,
  pendiente: contraste.value.filter((f) => f.resultado === 'pendiente').length
}))

function guardar () {
  if (!form.condicion) {
    $q.notify({ type: 'warning', message: 'Indique la condición constatada del bien.' })
    return null
  }
  const p = previo.value
  const bien = registrarBien({
    id: form.rotulo,
    ambienteId: props.ambiente.id,
    tipoId: form.tipoId,
    nombre: form.nombre,
    categoria: form.categoria,
    codigoPatrimonial: form.codigoPatrimonial || null,
    descripcion: tipoPorId(form.tipoId)?.nombre ?? '',
    marcaModelo: form.marcaModelo || null,
    serie: form.serie || null,
    condicion: form.condicion,
    deterioro: form.deterioro || null,
    // La fecha del inventario previo no se asume: solo se registra la que la persona constata.
    adquisicion: { fecha: form.fechaAdquisicion || null, costo: numeroONulo(form.costo) },
    vidaUtilAnios: numeroONulo(form.vidaUtilAnios),
    cantidad: numeroONulo(form.cantidad) ?? 1,
    asociadoA: form.asociadoA ? { bienId: form.asociadoA, posicion: form.posicion || 'No informada' } : null
  })
  if (p) {
    p.bienId = bien.id
    informarVerificacion(bien, {
      resultado: conteo.value.diferencia ? 'diferencias' : 'coincide',
      nota: `Contraste con ${p.id}: ${plural(conteo.value.coincide, 'coincide', 'coinciden')}, ${plural(conteo.value.diferencia, 'diferencia', 'diferencias')}, ${plural(conteo.value.pendiente, 'pendiente', 'pendientes')}.`
    })
  }
  previo.value = null
  Object.assign(form, vacio())
  fijar()
  formulario.value?.resetValidation()
  $q.notify({ type: 'positive', message: `Bien ${bien.id} registrado en ${props.ambiente.nombre}.` })
  emit('registrado', bien)
  return bien
}

async function guardarYTerminar () {
  const valido = await formulario.value.validate()
  if (!valido) return
  const bien = guardar()
  if (bien) emit('terminar', bien)
}

async function cerrar () {
  if (await confirmarDescarte()) emit('cerrar')
}
</script>
