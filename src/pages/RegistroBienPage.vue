<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header />

      <section-card titulo="Contexto de registro" subtitulo="Se conserva al guardar para continuar con otros bienes del mismo ambiente">
        <div class="sg-kv-grid items-end">
          <q-select v-model="carId" :options="opcionesCar" emit-value map-options outlined dense label="Establecimiento (CAR)" />
          <q-select v-model="ambienteId" :options="opcionesAmbiente" emit-value map-options outlined dense label="Ambiente" />
          <div v-if="ambiente" class="sg-chips items-center">
            <q-icon name="location_on" color="secondary" size="20px" aria-hidden="true" />
            <span class="text-weight-bold">{{ textoUbicacion(ubicacionDeAmbiente(ambiente.id)) }}</span>
            <status-chip tono="ok" label="Contexto conservado" />
          </div>
        </div>
      </section-card>

      <div class="sg-grid-2">
        <section-card titulo="Registrar bien" :subtitulo="previo ? `Datos aprovechados del inventario previo ${previo.id}` : 'Los campos con * son obligatorios'">
          <template v-if="previo" #acciones>
            <q-btn flat dense color="secondary" icon="close" label="Quitar inventario previo" @click="quitarPrevio" />
          </template>
          <q-form ref="formulario" class="column q-gutter-y-md" @submit="guardar">
            <div class="row q-col-gutter-md">
              <q-select v-model="form.tipoId" class="col-12 col-sm-6" :options="opcionesTipo" emit-value map-options outlined dense label="Tipo de bien *" :rules="[requerido]" @update:model-value="alCambiarTipo" />
              <q-input v-model="form.nombre" class="col-12 col-sm-6" outlined dense label="Nombre *" :rules="[requerido]" />
              <q-select v-model="form.categoria" class="col-12 col-sm-6" :options="OPCIONES_CATEGORIA" emit-value map-options outlined dense label="Categoría *" :rules="[requerido]" />
              <q-input v-model="form.rotulo" class="col-12 col-sm-6" outlined dense label="Rótulo SIGREC *" hint="Sugerido a partir del ambiente; puede corregirse" :rules="[requerido, rotuloLibre]" />
              <q-input
                v-model="form.codigoPatrimonial"
                class="col-12 col-sm-6"
                outlined
                dense
                label="Código patrimonial"
                :hint="previo ? `Dato previo: ${previo.codigoPatrimonial ?? 'no informado'}. Déjelo vacío si no es visible.` : 'Vacío si el bien no tiene código patrimonial'"
              />
              <q-input v-model.number="form.cantidad" class="col-12 col-sm-6" outlined dense type="number" min="1" label="Cantidad *" :rules="[(v) => v >= 1 || 'Mínimo 1']" />
              <q-input v-model="form.marcaModelo" class="col-12 col-sm-6" outlined dense label="Marca y modelo" :hint="previo ? `Dato previo: ${previo.marcaModelo ?? 'no informado'}` : ''" />
              <q-input v-model="form.serie" class="col-12 col-sm-6" outlined dense label="Serie" :hint="previo ? `Dato previo: ${previo.serie ?? 'no informado'}` : ''" />
            </div>

            <div>
              <div class="sg-kv__label q-mb-xs">Condición constatada *</div>
              <q-btn-toggle v-model="form.condicion" :options="OPCIONES_CONDICION" unelevated toggle-color="secondary" color="white" text-color="secondary" no-caps />
              <div v-if="previo" class="sg-muted q-mt-xs">Dato previo: {{ previo.condicion ? condicion(previo.condicion).label : 'no informado' }}</div>
            </div>
            <q-input v-model="form.deterioro" outlined dense type="textarea" autogrow label="Deterioro observado" />

            <div class="row q-col-gutter-md">
              <q-input v-model="form.fechaAdquisicion" class="col-12 col-sm-4" outlined dense type="month" stack-label label="Adquisición" :hint="previo?.fechaAdquisicion ? `Previo: ${previo.fechaAdquisicion}` : 'Vacío si se desconoce'" />
              <q-input v-model.number="form.costo" class="col-12 col-sm-4" outlined dense type="number" min="0" label="Costo de adquisición (S/)" hint="Vacío si se desconoce" />
              <q-input v-model.number="form.vidaUtilAnios" class="col-12 col-sm-4" outlined dense type="number" min="1" label="Vida útil (años)" hint="Vacío = pendiente de definir" />
            </div>

            <div class="row q-col-gutter-md">
              <q-select v-model="form.asociadoA" class="col-12 col-sm-7" :options="opcionesAsociar" emit-value map-options clearable outlined dense label="Asociar con" hint="Opcional: ayuda a localizar el bien concreto" />
              <q-input v-model="form.posicion" class="col-12 col-sm-5" outlined dense label="Posición" :disable="!form.asociadoA" placeholder="Ej.: Cama inferior" />
            </div>

            <div class="row justify-end q-gutter-sm">
              <q-btn outline color="secondary" label="Guardar" @click="guardarYSalir" />
              <q-btn unelevated color="primary" type="submit" icon="playlist_add" :label="`Guardar y registrar otro en ${ambiente?.nombre ?? 'el ambiente'}`" />
            </div>
          </q-form>
        </section-card>

        <div class="column q-gutter-y-md">
          <section-card v-if="previo" titulo="Contraste con el inventario previo" :subtitulo="`${previo.id} · inventario informático (ficticio)`" sin-relleno>
            <div class="sg-chips q-px-md q-pb-sm">
              <status-chip tono="ok" :label="`${conteo.coincide} coinciden`" />
              <status-chip tono="wa" :label="`${conteo.diferencia} diferencias`" />
              <status-chip tono="si" :label="`${conteo.pendiente} pendientes de verificación`" />
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

          <section-card titulo="Inventario previo sin vincular" :subtitulo="`${disponibles.length} registros en este local`" sin-relleno>
            <div v-for="item in disponibles" :key="item.id" class="row items-center justify-between q-px-md q-py-sm" style="border-top: 1px solid var(--sg-border-soft)">
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

      <section-card :titulo="`Registrados en esta sesión (${registrados.length})`" sin-relleno>
        <div class="sg-table-wrap">
          <table class="sg-table">
            <thead>
              <tr><th scope="col">Bien</th><th scope="col">Rótulo</th><th scope="col">Ubicación</th><th scope="col">Categoría</th><th scope="col">Condición</th><th scope="col">Asociado a</th><th scope="col">Vida útil</th></tr>
            </thead>
            <tbody>
              <tr v-for="b in registrados" :key="b.id">
                <td>{{ b.nombre }}</td>
                <td>
                  <router-link v-if="puedeAcceder('bienes')" :to="{ name: 'bienes', query: { bien: b.id } }">{{ b.id }}</router-link>
                  <template v-else>{{ b.id }}</template>
                </td>
                <td>{{ ambientePorId(b.ambienteId).nombre }}</td>
                <td>{{ CATEGORIAS[b.categoria] }}<template v-if="!b.codigoPatrimonial"> · sin código patrimonial</template></td>
                <td><status-chip v-bind="condicion(b.condicion)" /></td>
                <td>{{ b.asociadoA ? `${b.asociadoA.bienId} (${b.asociadoA.posicion})` : '—' }}</td>
                <td>
                  <template v-if="b.vidaUtilAnios">{{ b.vidaUtilAnios }} años</template>
                  <status-chip v-else tono="si" label="Pendiente" />
                </td>
              </tr>
              <tr v-if="!registrados.length"><td colspan="7" class="sg-muted">Aún no se registran bienes en esta sesión.</td></tr>
            </tbody>
          </table>
        </div>
      </section-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import PageHeader from 'components/common/PageHeader.vue'
import SectionCard from 'components/common/SectionCard.vue'
import StatusChip from 'components/common/StatusChip.vue'
import NoteBanner from 'components/common/NoteBanner.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { db, ambientePorId, ambientesDeCar, bienPorId, bienesDeAmbiente, localesDeCar, textoUbicacion, tipoPorId, ubicacionDeAmbiente } from 'src/services/datos'
import { informarVerificacion, numeroONulo, registrarBien, rotuloSugerido } from 'src/services/acciones'
import { CATEGORIAS, OPCIONES_CATEGORIA, OPCIONES_CONDICION, condicion } from 'src/config/catalogos'

const RESULTADOS = {
  coincide: { label: 'Coincide', tono: 'ok' },
  diferencia: { label: 'Diferencia', tono: 'wa' },
  pendiente: { label: 'Pendiente', tono: 'si' },
  nuevo: { label: 'Dato nuevo', tono: 'in' }
}

const $q = useQuasar()
const router = useRouter()
const { carsEnAmbito, puedeAcceder } = usePerfil()

const requerido = (v) => (v !== null && v !== undefined && v !== '') || 'Campo obligatorio'
const rotuloLibre = (v) => !bienPorId(v) || 'Ya existe un bien con ese rótulo'

const opcionesCar = computed(() => carsEnAmbito.value.map((c) => ({ label: c.nombre, value: c.id })))
const carId = ref(carsEnAmbito.value[0]?.id)
const opcionesAmbiente = computed(() => (carId.value ? ambientesDeCar(carId.value) : []).map((a) => ({ label: a.nombre, value: a.id })))
const ambienteId = ref(opcionesAmbiente.value.find((o) => o.label === 'Sala de estudio')?.value ?? opcionesAmbiente.value[0]?.value)
const ambiente = computed(() => (ambienteId.value ? ambientePorId(ambienteId.value) : null))

watch(carsEnAmbito, (cars) => {
  if (!cars.some((c) => c.id === carId.value)) carId.value = cars[0]?.id
})
watch(carId, () => {
  ambienteId.value = opcionesAmbiente.value[0]?.value
})

const opcionesTipo = computed(() => db.tiposBien.map((t) => ({ label: t.nombre, value: t.id })))
const opcionesAsociar = computed(() =>
  (ambienteId.value ? bienesDeAmbiente(ambienteId.value) : [])
    .filter((b) => b.situacion === 'activo')
    .map((b) => ({ label: `${b.nombre} · ${b.id}`, value: b.id }))
)

const formulario = ref(null)
const previo = ref(null)
const registrados = ref([])

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
  asociadoA: null,
  posicion: ''
})
const form = reactive(vacio())

function alCambiarTipo (tipoId) {
  const tipo = tipoPorId(tipoId)
  if (!tipo) return
  form.categoria = tipo.categoria
  if (!form.nombre || !previo.value) form.nombre = tipo.nombre
  if (ambienteId.value) form.rotulo = rotuloSugerido(ambienteId.value, tipoId)
}

watch(ambienteId, (id) => {
  if (id && form.tipoId) form.rotulo = rotuloSugerido(id, form.tipoId)
  form.asociadoA = null
})

const local = computed(() => (carId.value ? localesDeCar(carId.value)[0] : null))
const disponibles = computed(() => db.inventarioPrevio.filter((i) => i.localId === local.value?.id && !i.bienId))

// Se aprovechan los datos descriptivos; los verificables (código, marca, serie, condición) se constatan físicamente.
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
  const campo = (etiqueta, valorPrevio, valorForm, formato = (v) => v) => {
    const constatado = valorForm ? formato(valorForm) : null
    let resultado = 'pendiente'
    if (valorForm && valorPrevio == null) resultado = 'nuevo'
    else if (valorForm) resultado = normalizar(valorForm) === normalizar(valorPrevio) ? 'coincide' : 'diferencia'
    return { etiqueta, previo: valorPrevio != null ? formato(valorPrevio) : 'No informado', constatado, resultado }
  }
  return [
    campo('Marca y modelo', p.marcaModelo, form.marcaModelo),
    campo('Serie', p.serie, form.serie),
    campo('Código patrimonial', p.codigoPatrimonial, form.codigoPatrimonial),
    campo('Condición', p.condicion, form.condicion, (v) => condicion(v).label),
    campo('Ubicación', p.ubicacionPrevia, ambiente.value?.nombre),
    campo('Fecha de adquisición', p.fechaAdquisicion, form.fechaAdquisicion)
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
    ambienteId: ambienteId.value,
    tipoId: form.tipoId,
    nombre: form.nombre,
    categoria: form.categoria,
    codigoPatrimonial: form.codigoPatrimonial || null,
    descripcion: tipoPorId(form.tipoId)?.nombre ?? '',
    marcaModelo: form.marcaModelo || null,
    serie: form.serie || null,
    condicion: form.condicion,
    deterioro: form.deterioro || null,
    adquisicion: { fecha: form.fechaAdquisicion || p?.fechaAdquisicion || null, costo: numeroONulo(form.costo) },
    vidaUtilAnios: numeroONulo(form.vidaUtilAnios),
    cantidad: numeroONulo(form.cantidad) ?? 1,
    asociadoA: form.asociadoA ? { bienId: form.asociadoA, posicion: form.posicion || 'No informada' } : null
  })
  if (p) {
    p.bienId = bien.id
    informarVerificacion(bien, {
      resultado: conteo.value.diferencia ? 'diferencias' : 'coincide',
      nota: `Contraste con ${p.id}: ${conteo.value.coincide} coinciden, ${conteo.value.diferencia} diferencias, ${conteo.value.pendiente} pendientes.`
    })
  }
  registrados.value.unshift(bien)
  previo.value = null
  Object.assign(form, vacio())
  formulario.value?.resetValidation()
  $q.notify({ type: 'positive', message: `Bien ${bien.id} registrado en ${ambiente.value.nombre}.` })
  return bien
}

async function guardarYSalir () {
  const valido = await formulario.value.validate()
  if (!valido) return
  const bien = guardar()
  if (bien && puedeAcceder('bienes')) router.push({ name: 'bienes', query: { bien: bien.id } })
}
</script>
