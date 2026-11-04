<template>
  <q-page class="sg-page sg-page--explorador" :style-fn="altoPagina">
    <div class="sg-page__inner">
      <div class="sg-page-head">
        <h1 class="sg-page-title">Gestión de centros</h1>
        <q-btn v-if="puedeHacer('centro.registrar')" outline color="secondary" icon="add_business" label="Registrar centro" @click="dialogoCentro = true" />
      </div>

      <registro-no-disponible v-if="pedidoNoDisponible" :entidad="pedidoNoDisponible.entidad" :id="pedidoNoDisponible.id" :volver="{ name: 'centros' }" etiqueta-volver="Ver todos los centros" />

      <div class="sg-explorer">
        <arbol-centros
          v-if="!movil || vista === 'arbol'"
          v-model:texto="texto"
          v-model:situacion="situacion"
          v-model:inactivos="inactivos"
          v-model:expandidos="expandidos"
          :nodos="arbol"
          :seleccionado="seleccion"
          :nuevos="nuevos"
          @seleccionar="seleccionar"
        />

        <div v-if="!movil || vista === 'detalle'" class="sg-explorer__col">
          <template v-if="nodo">
            <detalle-centro v-if="nodo.tipo === 'centro'" :key="seleccion" :centro="nodo.registro" :con-volver="movil" @seleccionar="seleccionar" @volver="vista = 'arbol'" />
            <detalle-ambiente
              v-else-if="nodo.tipo === 'ambiente'"
              :key="seleccion"
              :ambiente="nodo.registro"
              :inactivos="inactivos"
              :tab-inicial="tabInicial"
              :novedad-resaltada="novedadResaltada"
              :con-volver="movil"
              @seleccionar="seleccionar"
              @registrar-bien="iniciarRegistro"
              @volver="vista = 'arbol'"
            />
            <bien-ficha
              v-else
              :key="seleccion"
              :bien="nodo.registro"
              :con-volver="movil"
              @accion="abrirAccion"
              @seleccionar="seleccionar"
              @mantener="mantener"
              @volver="vista = 'arbol'"
            />
          </template>
          <div v-else class="q-pa-lg sg-muted">Seleccione un centro, ambiente, bien o componente del árbol para ver su detalle y sus acciones.</div>
        </div>
      </div>
    </div>

    <registro-bien-panel
      v-if="modo === 'registro' && ambienteRegistro"
      ref="registroRef"
      :key="`${registro.ambienteId}|${registro.asociarA}`"
      :ambiente="ambienteRegistro"
      :asociar-a="registro.asociarA"
      @registrado="alRegistrar"
      @terminar="alTerminarRegistro"
      @cerrar="modo = 'detalle'"
    />
    <centro-dialog v-model="dialogoCentro" @hecho="(id) => seleccionar(nodoCentroId(id))" />
    <bien-accion-dialog v-if="bien" v-model="accion.abierta" :modo="accion.modo" :bien="bien" @hecho="seleccionar" />
    <bien-edicion-dialog v-if="bien" v-model="edicion.abierta" :modo="edicion.modo" :bien="bien" @hecho="seleccionar" />
    <incidente-dialog v-model="incidente.abierto" :bien="bien" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
// «Gestión de centros»: explorador Centro › Ambiente › Bien › Componente. Elegir un nodo muestra su detalle y sus acciones;
// el registro de bienes se abre en un modal sobre el detalle seleccionado.
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import ArbolCentros from 'components/gestion/ArbolCentros.vue'
import DetalleCentro from 'components/gestion/DetalleCentro.vue'
import DetalleAmbiente from 'components/gestion/DetalleAmbiente.vue'
import RegistroBienPanel from 'components/gestion/RegistroBienPanel.vue'
import BienFicha from 'components/bienes/BienFicha.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import BienEdicionDialog from 'components/bienes/BienEdicionDialog.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import CentroDialog from 'components/centros/CentroDialog.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { ambientePorId, bienPorId, db, ambientesDeCar, ubicacionDeBien } from 'src/services/datos'
import { antecesoresDeNodo, arbolDeCentros, idsExpandibles, nodoAmbienteId, nodoCentroId, resolverNodo, rutaHasta } from 'src/services/bienes'
import { anularBien, cerrarRevision, dependenciasDeBien, desasociarBien, reactivarBien } from 'src/services/acciones'
import { TODOS } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'

const $q = useQuasar()
const route = useRoute()
const { carsDelAmbito, enAmbitoCar, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const movil = computed(() => $q.screen.lt.md)

// En escritorio la página ocupa el alto visible y cada columna se desplaza por separado; en móvil se desplaza la página.
const altoPagina = (offset) => (movil.value ? {} : { height: `calc(100vh - ${offset}px)`, overflow: 'hidden' })

// ---------- Enlaces profundos ----------
// ?bien= | ?ambiente= | ?novedad= | ?car= seleccionan el nodo; ?registrar=1 (con ?ambiente= y ?asociar=) abre el modo registro.
// Lo pedido solo se acepta dentro del ámbito del perfil; si no existe se avisa y no se elige otro registro.
const bienPedido = parametro(route.query.bien)
const novedadPedida = parametro(route.query.novedad)
const ambienteDeNovedad = novedadPedida ? db.ambientes.find((a) => a.novedades?.some((n) => n.id === novedadPedida)) : null
const ambientePedido = ambienteDeNovedad?.id ?? parametro(route.query.ambiente)
const carPedido = parametro(route.query.car)
const asociarPedido = parametro(route.query.asociar)
const registrarPedido = parametro(route.query.registrar) === '1' && puedeHacer('bien.registrar')

function inicial () {
  if (bienPedido) {
    const b = bienPorId(bienPedido)
    return b && enAmbitoCar(ubicacionDeBien(b).car.id) ? { id: b.id } : { noDisponible: { entidad: 'El bien', id: bienPedido } }
  }
  if (novedadPedida || ambientePedido) {
    const a = ambientePorId(ambientePedido)
    if (a && enAmbitoCar(a.carId)) return { id: nodoAmbienteId(a.id) }
    return { noDisponible: novedadPedida ? { entidad: 'La novedad', id: novedadPedida } : { entidad: 'El ambiente', id: ambientePedido } }
  }
  if (carPedido) {
    return enAmbitoCar(carPedido) ? { id: nodoCentroId(carPedido) } : { noDisponible: { entidad: 'El centro', id: carPedido } }
  }
  const primero = carsDelAmbito()[0]
  return { id: primero ? nodoCentroId(primero.id) : null }
}

const pedido = inicial()
const pedidoNoDisponible = ref(pedido.noDisponible ?? null)
const seleccion = ref(pedido.id ?? null)
const tabInicial = novedadPedida && !pedidoNoDisponible.value ? 'novedades' : null
const novedadResaltada = pedidoNoDisponible.value ? null : novedadPedida

// Registros anulados pedidos por enlace: se muestran activando «Mostrar inactivos» y el filtro de situación correspondiente.
const nodoPedido = resolverNodo(seleccion.value)
const ambienteDelNodo = !nodoPedido || nodoPedido.tipo === 'centro' ? null : nodoPedido.tipo === 'ambiente' ? nodoPedido.registro : ambientePorId(nodoPedido.registro.ambienteId)
const novedadAnulada = !!ambienteDeNovedad?.novedades.find((n) => n.id === novedadPedida)?.anulacion
const anuladoPedido = !!(ambienteDelNodo?.anulacion || novedadAnulada || (nodoPedido?.tipo === 'centro' && nodoPedido.registro.anulacion))

const texto = ref('')
const situacion = ref(nodoPedido?.registro.situacion === 'anulado' ? 'anulado' : TODOS)
const inactivos = ref(anuladoPedido)
const vista = ref('detalle')
const nuevos = ref([])

// ---------- Árbol ----------
const arbol = computed(() => arbolDeCentros(
  carsDelAmbito(inactivos.value).map((c) => c.id),
  { texto: texto.value ?? '', situacion: situacion.value, inactivos: inactivos.value }
))

// Con búsqueda se expande todo; si no, se conserva lo abierto y se suman los centros y la ruta del nodo seleccionado.
const expandidos = ref([])
watch(arbol, (nodos) => {
  if (texto.value) {
    expandidos.value = idsExpandibles(nodos)
    return
  }
  const ruta = seleccion.value ? rutaHasta(nodos, seleccion.value) ?? antecesoresDeNodo(seleccion.value) : []
  expandidos.value = [...new Set([...expandidos.value, ...nodos.map((n) => n.id), ...ruta])]
}, { immediate: true })

// Abre los antecesores del nodo; con `incluirNodo`, también el propio nodo (al elegir un centro o ambiente se ven sus hijos).
function expandirHasta (id, { incluirNodo = false } = {}) {
  const ruta = rutaHasta(arbol.value, id) ?? antecesoresDeNodo(id)
  expandidos.value = [...new Set([...expandidos.value, ...ruta, ...(incluirNodo ? [id] : [])])]
}

// ---------- Selección ----------
// Solo se muestra un nodo del ámbito del perfil.
const nodo = computed(() => {
  const n = resolverNodo(seleccion.value)
  if (!n) return null
  const carId = n.tipo === 'centro' ? n.registro.id : n.tipo === 'ambiente' ? n.registro.carId : ubicacionDeBien(n.registro).car.id
  return enAmbitoCar(carId) ? n : null
})

const bien = computed(() => (nodo.value && (nodo.value.tipo === 'bien' || nodo.value.tipo === 'componente') ? nodo.value.registro : null))

const modo = ref('detalle')
const registroRef = ref(null)

// Cambiar de nodo con un registro a medias pide confirmación antes de descartarlo.
async function seleccionar (id) {
  if (!id) return
  if (modo.value === 'registro' && !(await registroRef.value?.confirmarDescarte())) return
  pedidoNoDisponible.value = null
  modo.value = 'detalle'
  seleccion.value = id
  expandirHasta(id, { incluirNodo: true })
  vista.value = 'detalle'
}

// ---------- Modo registro ----------
const registro = reactive({ ambienteId: null, asociarA: null })
const ambienteRegistro = computed(() => (registro.ambienteId ? ambientePorId(registro.ambienteId) : null))

function iniciarRegistro (ambienteId, asociarA = null) {
  if (!puedeHacer('bien.registrar')) return
  Object.assign(registro, { ambienteId, asociarA })
  modo.value = 'registro'
  vista.value = 'detalle'
}

function alRegistrar (nuevo) {
  nuevos.value.push(nuevo.id)
  expandirHasta(nuevo.id)
}

function alTerminarRegistro (nuevo) {
  modo.value = 'detalle'
  seleccion.value = nuevo.id
}

// ?registrar=1: abre el registro en el ambiente indicado (o en el bien del que será componente).
if (registrarPedido && !pedidoNoDisponible.value) {
  const padre = asociarPedido ? bienPorId(asociarPedido) : null
  const padreValido = padre && padre.situacion === 'activo' && !padre.asociadoA && enAmbitoCar(ubicacionDeBien(padre).car.id)
  const ambienteId = padreValido ? padre.ambienteId : ambientePedido ?? ambientesDeCar(carPedido ?? carsDelAmbito()[0]?.id)[0]?.id
  if (ambienteId && ambientePorId(ambienteId) && enAmbitoCar(ambientePorId(ambienteId).carId)) {
    seleccion.value = padreValido ? padre.id : nodoAmbienteId(ambienteId)
    Object.assign(registro, { ambienteId, asociarA: padreValido ? padre.id : null })
    modo.value = 'registro'
  }
}

// ---------- Acciones del bien ----------
const accion = reactive({ abierta: false, modo: 'verificacion' })
const edicion = reactive({ abierta: false, modo: 'datos' })
const incidente = reactive({ abierto: false })

function abrirAccion (tipo) {
  const actual = bien.value
  if (tipo === 'registrarComponente') {
    iniciarRegistro(actual.ambienteId, actual.id)
    return
  }
  if (tipo === 'desasociar') {
    $q.dialog({
      title: 'Quitar asociación',
      message: `${actual.nombre} ${actual.id} dejará de ser componente. La relación anterior queda en sus antecedentes.`,
      persistent: true,
      cancel: { flat: true, label: 'Cancelar', color: 'secondary' },
      ok: { unelevated: true, label: 'Quitar asociación', color: 'primary' }
    }).onOk(() => {
      desasociarBien(actual)
      $q.notify({ type: 'positive', message: 'El bien deja de ser componente. La relación queda en sus antecedentes.' })
    })
    return
  }
  if (tipo === 'incidente') {
    incidente.abierto = true
    return
  }
  if (tipo === 'anular') {
    pedirAnulacion({
      titulo: 'Anular registro del bien',
      subtitulo: `${actual.nombre} · ${actual.id}`,
      dependencias: dependenciasDeBien(actual),
      aviso: 'Anular corrige un registro erróneo: el bien deja de contar en necesidades y avisos. Para retirar un bien que existió, use «Dar de baja».',
      mensaje: 'Registro del bien anulado.',
      ejecutar: (datos) => anularBien(actual, datos)
    })
    return
  }
  if (tipo === 'reactivar') {
    pedirReactivacion({ entidad: 'bien', registro: actual, nombre: 'Bien', accion: reactivarBien })
    return
  }
  if (tipo === 'datos' || tipo === 'componente' || tipo === 'trasladar') {
    edicion.modo = tipo === 'trasladar' ? 'traslado' : tipo
    edicion.abierta = true
    return
  }
  accion.modo = tipo
  accion.abierta = true
}

function mantener () {
  cerrarRevision(bien.value)
  $q.notify({ type: 'positive', message: 'Situación revisada: el bien se mantiene activo.' })
}

const dialogoCentro = ref(false)
</script>
