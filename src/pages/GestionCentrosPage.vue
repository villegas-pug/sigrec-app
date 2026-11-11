<template>
  <q-page class="sg-page" :class="{ 'sg-page--explorador': !esConsulta }" :style-fn="altoPagina">
    <div class="sg-page__inner">
      <div class="sg-page-head">
        <div class="sg-page-head__titulo">
          <volver-origen />
          <h1 class="sg-page-title">Gestión de centros</h1>
          <manual-help />
        </div>
        <q-btn v-if="puedeHacer('centro.registrar')" outline color="secondary" icon="add_business" label="Registrar centro" @click="dialogoCentro = true" />
      </div>

      <consulta-infraestructura v-if="['ambientes_criticos', 'elementos_criticos', 'novedades'].includes(parametro(route.query.consulta))" />
      <template v-else>
      <registro-no-disponible v-if="pedidoNoDisponible" :entidad="pedidoNoDisponible.entidad" :id="pedidoNoDisponible.id" :volver="{ name: 'centros' }" etiqueta-volver="Ver todos los centros" />

      <div class="sg-explorer">
        <arbol-centros
          ref="arbolRef"
          v-if="!movil || vista === 'arbol'"
          v-model:texto="texto"
          v-model:situacion="situacion"
          v-model:inactivos="inactivos"
          v-model:expandidos="expandidos"
          :nodos="arbol"
          :seleccionado="seleccion"
          :nuevos="nuevos"
          @seleccionar="seleccionarDesdeArbol"
        />

        <div v-if="!movil || vista === 'detalle'" class="sg-explorer__col">
          <!-- Tras saltar de una ficha a otra por un enlace del contenido, se ofrece volver a la ficha anterior (SPEC 011, Ola 5). -->
          <div v-if="nodo && anteriorInterno" class="sg-recorrido-anterior">
            <q-btn flat dense no-caps color="secondary" icon="undo" :label="`Volver a ${anteriorInterno.etiqueta}`" @click="regresarAnterior" />
          </div>
          <div v-if="fueraDelFiltro" class="sg-box q-ma-sm" role="status">
            <span>La ficha abierta no coincide con los filtros del explorador.</span>
            <q-btn flat dense no-caps color="secondary" label="Mostrar en el árbol" @click="mostrarEnArbol" />
          </div>
          <template v-if="nodo">
            <detalle-centro
              v-if="nodo.tipo === 'centro'"
              :key="seleccion"
              :centro="nodo.registro"
              :inactivos="inactivos"
              :situacion="situacion"
              :tab-inicial="tabInicialCentro"
              :mantenimiento-resaltado="mantenimientoResaltado"
              :hecho-inicial="seleccion === pedido.id ? hechoPedido : null"
              @hecho="abrirHecho"
              @registrar-bien="(ambienteId, tipoId) => iniciarRegistro(ambienteId, null, tipoId)"
              :con-volver="movil"
              @seleccionar="irA"
              @volver="vista = 'arbol'"
            />
            <detalle-modulo
              v-else-if="nodo.tipo === 'modulo'"
              :key="seleccion"
              :modulo="nodo.registro"
              :inactivos="inactivos"
              :situacion="situacion"
              :tab-inicial="tabPedida"
              :con-volver="movil"
              @seleccionar="irA"
              @volver="vista = 'arbol'"
            />
            <detalle-ambiente
              v-else-if="nodo.tipo === 'ambiente'"
              :key="seleccion"
              :ambiente="nodo.registro"
              :inactivos="inactivos"
              :situacion="situacion"
              :tab-inicial="tabInicial"
              :novedad-resaltada="novedadResaltada"
              :hecho-inicial="seleccion === pedido.id ? hechoPedido : null"
              :con-volver="movil"
              @seleccionar="irA"
              @hecho="abrirHecho"
              @registrar-bien="iniciarRegistro"
              @volver="vista = 'arbol'"
            />
            <bien-ficha
              v-else
              :key="seleccion"
              :bien="nodo.registro"
              :situacion="situacion"
              :tab-inicial="hechoPedido && seleccion === pedido.id ? 'antecedentes' : tabPedida"
              :hecho-inicial="seleccion === pedido.id ? hechoPedido : null"
              :con-volver="movil"
              @accion="abrirAccion"
              @seleccionar="irA"
              @mantener="mantener"
              @volver="vista = 'arbol'"
            />
          </template>
          <div v-else class="q-pa-lg sg-muted">Seleccione un centro, módulo, ambiente, bien o componente del árbol para ver su detalle y sus acciones.</div>
        </div>
      </div>
      </template>
    </div>

    <registro-bien-panel
      v-if="modo === 'registro' && ambienteRegistro"
      ref="registroRef"
      :key="`${registro.ambienteId}|${registro.asociarA}|${registro.tipoId}`"
      :ambiente="ambienteRegistro"
      :asociar-a="registro.asociarA"
      :tipo-inicial="registro.tipoId"
      :con-retorno="registro.conRetorno"
      @registrado="alRegistrar"
      @terminar="alTerminarRegistro"
      @cerrar="modo = 'detalle'"
    />
    <centro-dialog v-model="dialogoCentro" @hecho="(id) => irA(nodoCentroId(id))" />
    <bien-accion-dialog v-if="bien" v-model="accion.abierta" :modo="accion.modo" :bien="bien" @hecho="irA" />
    <bien-edicion-dialog v-if="bien" v-model="edicion.abierta" :modo="edicion.modo" :bien="bien" @hecho="irA" />
    <incidente-dialog v-model="incidente.abierto" :bien="bien" @hecho="abrirHecho" />
    <anular-dialog v-model="anulacion.abierto" v-bind="anulacion.datos" @confirmar="confirmarAnulacion" />
  </q-page>
</template>

<script setup>
import ManualHelp from 'components/common/ManualHelp.vue'
import ConsultaInfraestructura from 'components/gestion/ConsultaInfraestructura.vue'
// «Gestión de centros»: explorador Centro › Módulo › Ambiente › Bien › Componente (SPEC 020). Elegir un nodo muestra su detalle y sus acciones;
// el registro de bienes se abre en un modal sobre el detalle seleccionado.
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ArbolCentros from 'components/gestion/ArbolCentros.vue'
import DetalleCentro from 'components/gestion/DetalleCentro.vue'
import DetalleModulo from 'components/gestion/DetalleModulo.vue'
import DetalleAmbiente from 'components/gestion/DetalleAmbiente.vue'
import RegistroBienPanel from 'components/gestion/RegistroBienPanel.vue'
import BienFicha from 'components/bienes/BienFicha.vue'
import BienAccionDialog from 'components/bienes/BienAccionDialog.vue'
import BienEdicionDialog from 'components/bienes/BienEdicionDialog.vue'
import IncidenteDialog from 'components/bienes/IncidenteDialog.vue'
import CentroDialog from 'components/centros/CentroDialog.vue'
import AnularDialog from 'components/common/AnularDialog.vue'
import RegistroNoDisponible from 'components/common/RegistroNoDisponible.vue'
import VolverOrigen from 'components/layout/VolverOrigen.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAnulacion } from 'src/composables/useAnulacion'
import { useEstadoNavegacion } from 'src/composables/useEstadoNavegacion'
import { useRecorridoInterno } from 'src/composables/useRecorridoInterno'
import { primeraVisita } from 'src/router/retorno'
import { ambientePorId, bienPorId, db, ambientesDeCar, mantenimientoPorId, moduloPorId, ordenarPorModulo, ubicacionDeBien } from 'src/services/datos'
import { antecesoresDeNodo, arbolDeCentros, idsExpandibles, nodoAmbienteId, nodoCentroId, nodoModuloId, resolverNodo, rutaHasta } from 'src/services/bienes'
import { anularBien, cerrarRevision, dependenciasDeBien, desasociarBien, reactivarBien } from 'src/services/acciones'
import { TIPOS_HECHO, origenIncidencia, ubicacionHecho } from 'src/services/incidencias'
import { TODOS } from 'src/config/catalogos'
import { parametro } from 'src/utils/navegacion'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const { carsDelAmbito, enAmbitoCar, puedeHacer } = usePerfil()
const { anulacion, pedirAnulacion, confirmarAnulacion, pedirReactivacion } = useAnulacion()

const movil = computed(() => $q.screen.lt.md)

// En escritorio la página ocupa el alto visible y cada columna se desplaza por separado; en móvil se desplaza la página.
const esConsulta = ['ambientes_criticos', 'elementos_criticos', 'novedades'].includes(parametro(route.query.consulta))
const altoPagina = (offset) => (movil.value || esConsulta ? {} : { height: `calc(100vh - ${offset}px)`, overflow: 'hidden' })

// ---------- Enlaces profundos ----------
// ?bien= | ?ambiente= | ?novedad= | ?modulo= | ?car= | ?mantenimiento= seleccionan el nodo (con ?tab= para la pestaña); ?registrar=1 (con ?ambiente=,
// ?asociar= y ?tipo=) abre el modo registro.
// Lo pedido solo se acepta dentro del ámbito del perfil; si no existe se avisa y no se elige otro registro.
const bienPedido = parametro(route.query.bien)
const novedadPedida = parametro(route.query.novedad)
const ambienteDeNovedad = novedadPedida ? db.ambientes.find((a) => a.novedades?.some((n) => n.id === novedadPedida)) : null
const ambientePedido = ambienteDeNovedad?.id ?? parametro(route.query.ambiente)
const moduloPedido = parametro(route.query.modulo)
const carPedido = parametro(route.query.car)
const asociarPedido = parametro(route.query.asociar)
const registrarPedido = parametro(route.query.registrar) === '1' && puedeHacer('bien.registrar')
// ?mantenimiento= abre la pestaña «Seguridad y mantenimiento» del centro y resalta el registro.
// ?tab= elige la pestaña del centro (ficha | incidencias | fotos | seguridad | ambientes = «Módulos y ambientes»), del módulo
// (ficha | ambientes) o del ambiente (ficha | fotos | bienes | novedades | intervenciones); una pestaña desconocida se ignora. ?seguridad=1 se conserva como alias de ?tab=seguridad (SPEC 011).
const mantenimientoPedido = parametro(route.query.mantenimiento)
const tabPedida = parametro(route.query.tab) ?? (parametro(route.query.seguridad) === '1' ? 'seguridad' : null)
const hechoPedido = parametro(route.query.hecho)
const hechoSolicitado = hechoPedido ? db.eventos.find((e) => e.id === hechoPedido && TIPOS_HECHO.includes(e.tipo)) : null
const contextoHechoValido = () => {
  if (!hechoSolicitado) return false
  const u = ubicacionHecho(hechoSolicitado)
  const o = origenIncidencia(hechoSolicitado)
  const b = bienPedido ? bienPorId(bienPedido) : ['bien', 'componente'].includes(o.tipo) ? bienPorId(o.id) : null
  return !!u.car && enAmbitoCar(u.car.id) && (!carPedido || carPedido === u.car.id) &&
    (!ambientePedido || (o.tipo === 'ambiente' && ambientePedido === o.id)) &&
    (!bienPedido || (!!b && hechoSolicitado.bienIds.includes(b.id))) &&
    (!b || enAmbitoCar(ubicacionDeBien(b).car.id)) &&
    (!['bien', 'componente'].includes(o.tipo) || !!b) && !mantenimientoPedido && !novedadPedida
}
const mantenimientoSolicitado = mantenimientoPedido ? mantenimientoPorId(mantenimientoPedido) : null

function inicial () {
  if (hechoPedido) {
    if (!contextoHechoValido()) return { noDisponible: { entidad: 'El hecho', id: hechoPedido } }
    if (bienPedido) return { id: bienPedido }
    const o = origenIncidencia(hechoSolicitado)
    return { id: o.tipo === 'centro' ? nodoCentroId(o.id) : o.tipo === 'ambiente' ? nodoAmbienteId(o.id) : o.id }
  }
  if (mantenimientoPedido) {
    return mantenimientoSolicitado && enAmbitoCar(mantenimientoSolicitado.carId)
      ? { id: nodoCentroId(mantenimientoSolicitado.carId) }
      : { noDisponible: { entidad: 'El mantenimiento', id: mantenimientoPedido } }
  }
  if (bienPedido) {
    const b = bienPorId(bienPedido)
    return b && enAmbitoCar(ubicacionDeBien(b).car.id) ? { id: b.id } : { noDisponible: { entidad: 'El bien', id: bienPedido } }
  }
  if (novedadPedida || ambientePedido) {
    const a = ambientePorId(ambientePedido)
    if (a && enAmbitoCar(a.carId)) return { id: nodoAmbienteId(a.id) }
    return { noDisponible: novedadPedida ? { entidad: 'La novedad', id: novedadPedida } : { entidad: 'El ambiente', id: ambientePedido } }
  }
  if (moduloPedido) {
    const m = moduloPorId(moduloPedido)
    return m && enAmbitoCar(m.carId) ? { id: nodoModuloId(m.id) } : { noDisponible: { entidad: 'El módulo', id: moduloPedido } }
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
const tabInicial = pedidoNoDisponible.value ? null : hechoPedido ? 'incidencias' : novedadPedida ? 'novedades' : tabPedida
const novedadResaltada = pedidoNoDisponible.value ? null : novedadPedida
const tabInicialCentro = pedidoNoDisponible.value ? null : hechoPedido ? 'incidencias' : mantenimientoPedido ? 'seguridad' : tabPedida
const mantenimientoResaltado = pedidoNoDisponible.value ? null : mantenimientoPedido

// Registros anulados pedidos por enlace: se muestran activando «Mostrar inactivos» y el filtro de situación correspondiente.
const nodoPedido = resolverNodo(seleccion.value)
const ambienteDelNodo = !nodoPedido || nodoPedido.tipo === 'centro' || nodoPedido.tipo === 'modulo' ? null : nodoPedido.tipo === 'ambiente' ? nodoPedido.registro : ambientePorId(nodoPedido.registro.ambienteId)
const moduloDelNodo = nodoPedido?.tipo === 'modulo' ? nodoPedido.registro : ambienteDelNodo ? moduloPorId(ambienteDelNodo.moduloId) : null
const novedadAnulada = !!ambienteDeNovedad?.novedades.find((n) => n.id === novedadPedida)?.anulacion
const anuladoPedido = !!(ambienteDelNodo?.anulacion || moduloDelNodo?.anulacion || novedadAnulada || mantenimientoSolicitado?.anulacion || (nodoPedido?.tipo === 'centro' && nodoPedido.registro.anulacion))

const texto = ref('')
const situacion = ref(nodoPedido?.registro.situacion === 'anulado' ? 'anulado' : TODOS)
const inactivos = ref(anuladoPedido)
const vista = ref('detalle')
const nuevos = ref([])

// Al volver con «Atrás» o con «Volver a…» se recuperan el nodo elegido y los filtros del árbol (SPEC 011, Ola 4).
// Lo guardado en esta entrada del historial refleja lo que el usuario eligió después del enlace, así que prevalece.
useEstadoNavegacion('centros', { seleccion, texto, situacion, inactivos })
const seleccionRestaurada = seleccion.value !== (pedido.id ?? null)
if (seleccionRestaurada) pedidoNoDisponible.value = null

// Fichas visitadas por enlaces del contenido, para «Volver a ‹ficha anterior›» (SPEC 011, Ola 5).
const recorrido = useRecorridoInterno('centros')
const anteriorInterno = recorrido.anterior

// ---------- Árbol ----------
const arbol = computed(() => arbolDeCentros(
  carsDelAmbito(inactivos.value).map((c) => c.id),
  { texto: texto.value ?? '', situacion: situacion.value, inactivos: inactivos.value }
))

// Con búsqueda se expande todo; si no, se conserva lo abierto y se suman los centros, sus módulos (para ver los ambientes como
// antes de SPEC 020) y la ruta del nodo seleccionado.
const expandidos = ref([])
watch(arbol, (nodos) => {
  if (texto.value) {
    expandidos.value = idsExpandibles(nodos)
    return
  }
  const ruta = seleccion.value ? rutaHasta(nodos, seleccion.value) ?? antecesoresDeNodo(seleccion.value) : []
  expandidos.value = [...new Set([...expandidos.value, ...nodos.flatMap((n) => [n.id, ...(n.children ?? []).map((m) => m.id)]), ...ruta])]
}, { immediate: true })

// Abre los antecesores del nodo; con `incluirNodo`, también el propio nodo (al elegir un centro, módulo o ambiente se ven sus hijos).
function expandirHasta (id, { incluirNodo = false } = {}) {
  const ruta = rutaHasta(arbol.value, id) ?? antecesoresDeNodo(id)
  expandidos.value = [...new Set([...expandidos.value, ...ruta, ...(incluirNodo ? [id] : [])])]
}

// ---------- Selección ----------
// Solo se muestra un nodo del ámbito del perfil.
const nodo = computed(() => {
  const n = resolverNodo(seleccion.value)
  if (!n) return null
  const carId = n.tipo === 'centro' ? n.registro.id : n.tipo === 'modulo' || n.tipo === 'ambiente' ? n.registro.carId : ubicacionDeBien(n.registro).car.id
  return enAmbitoCar(carId) ? n : null
})

const arbolRef = ref(null)
const fueraDelFiltro = computed(() => !!nodo.value && rutaHasta(arbol.value, seleccion.value) === null)
async function mostrarEnArbol () {
  texto.value = ''
  const n = nodo.value
  if (!n) return
  situacion.value = n.registro.situacion === 'anulado' ? 'anulado' : TODOS
  if ([...antecesoresDeNodo(seleccion.value), seleccion.value].some((id) => resolverNodo(id)?.registro.anulacion)) inactivos.value = true
  expandirHasta(seleccion.value)
  if (movil.value) vista.value = 'arbol'
  await nextTick()
  arbolRef.value?.mostrar(seleccion.value)
}
function abrirHecho (id) { if (id) router.push({ name: 'centros', query: { hecho: id } }) }
const bien = computed(() => (nodo.value && (nodo.value.tipo === 'bien' || nodo.value.tipo === 'componente') ? nodo.value.registro : null))

const modo = ref('detalle')
const registroRef = ref(null)

// Nombre de la ficha para «Volver a ‹ficha›».
const etiquetaNodo = (n) => (['centro', 'modulo', 'ambiente'].includes(n.tipo) ? n.registro.nombre : `${n.registro.nombre} · ${n.registro.id}`)

// Cambiar de nodo con un registro a medias pide confirmación antes de descartarlo. Devuelve si se cambió.
// `apilar`: salto desde el contenido de una ficha (se recuerda la anterior). `vaciar`: navegación principal (árbol).
async function seleccionar (id, { apilar = false, vaciar = false } = {}) {
  if (!id) return false
  if (modo.value === 'registro' && !(await registroRef.value?.confirmarDescarte())) return false
  if (vaciar) recorrido.vaciar()
  else if (apilar && nodo.value && seleccion.value !== id) recorrido.apilar(seleccion.value, etiquetaNodo(nodo.value))
  pedidoNoDisponible.value = null
  modo.value = 'detalle'
  seleccion.value = id
  expandirHasta(id, { incluirNodo: true })
  vista.value = 'detalle'
  return true
}

const seleccionarDesdeArbol = (id) => seleccionar(id, { vaciar: true })
const irA = (id) => seleccionar(id, { apilar: true })

async function regresarAnterior () {
  const previo = anteriorInterno.value
  if (previo && (await seleccionar(previo.valor))) recorrido.regresar()
}

// ---------- Modo registro ----------
// `conRetorno`: el registro lo abrió un enlace desde otra pantalla; al terminar se ofrece volver a ella (SPEC 011, Ola 5).
const registro = reactive({ ambienteId: null, asociarA: null, tipoId: null, conRetorno: false })
const ambienteRegistro = computed(() => (registro.ambienteId ? ambientePorId(registro.ambienteId) : null))

function iniciarRegistro (ambienteId, asociarA = null, tipoId = null) {
  if (!puedeHacer('bien.registrar')) return
  Object.assign(registro, { ambienteId, asociarA, tipoId, conRetorno: false })
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
// Solo la primera vez que se muestra esta entrada: al volver a ella se conserva la ficha (la restaurada, si el usuario eligió
// otra) pero no se reabre el formulario (SPEC 011, Ola 5).
if (registrarPedido && !pedidoNoDisponible.value) {
  const padre = asociarPedido ? bienPorId(asociarPedido) : null
  const padreValido = padre && padre.situacion === 'activo' && !padre.asociadoA && enAmbitoCar(ubicacionDeBien(padre).car.id)
  const ambienteId = padreValido ? padre.ambienteId : ambientePedido ?? ordenarPorModulo(ambientesDeCar(carPedido ?? carsDelAmbito()[0]?.id))[0]?.id
  if (ambienteId && ambientePorId(ambienteId) && enAmbitoCar(ambientePorId(ambienteId).carId)) {
    if (!seleccionRestaurada) seleccion.value = padreValido ? padre.id : nodoAmbienteId(ambienteId)
    if (primeraVisita()) {
      // ?tipo= preselecciona el tipo de bien (p. ej. ?registrar=1&car=AMA&tipo=extintor).
      Object.assign(registro, { ambienteId, asociarA: padreValido ? padre.id : null, tipoId: parametro(route.query.tipo), conRetorno: true })
      modo.value = 'registro'
    }
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
      cancel: { flat: true, icon: 'close', label: 'Cancelar', color: 'secondary' },
      ok: { unelevated: true, icon: 'link_off', label: 'Quitar asociación', color: 'primary' }
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
      ejecutar: (datos) => anularBien(actual, datos),
      deshacer: () => reactivarBien(actual)
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
