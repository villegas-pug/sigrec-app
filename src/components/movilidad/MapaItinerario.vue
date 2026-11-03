<template>
  <div class="column q-gutter-sm">
    <template v-if="!soloLectura">
      <q-select v-model="resultadoElegido" outlined dense clearable use-input hide-selected fill-input
        input-debounce="500" :options="resultados" :loading="buscando" label="Buscar dirección o lugar"
        @filter="filtrar" @update:model-value="seleccionarResultado">
        <template #no-option><q-item><q-item-section class="text-grey">{{ mensajeBusqueda }}</q-item-section></q-item></template>
      </q-select>
      <div class="row items-center q-gutter-sm">
        <q-btn outline color="secondary" icon="my_location" label="Mi ubicación" :loading="ubicando" @click="localizar(false)" />
        <q-btn v-if="previsualizacion" unelevated color="primary" icon="add_location" label="Añadir punto" @click="anadirPunto" />
        <span v-if="previsualizacion" class="sg-muted">{{ previsualizacion.nombre }}</span>
      </div>
      <div v-if="avisoUbicacion" role="status" class="sg-muted">{{ avisoUbicacion }}</div>
      <div class="sg-muted">Seleccione una dirección o haga clic en el mapa y pulse «Añadir punto». Arrastre los puntos para ajustarlos.</div>
    </template>
    <div class="row q-col-gutter-md">
    <div class="col-12 col-md-7"><div ref="contenedor" style="height: 320px; width: 100%" aria-label="Mapa del itinerario" /></div>
    <div v-if="!soloLectura" class="col-12 col-md-5 column q-gutter-sm">
      <div v-for="(p, i) in puntos" :key="p.id" class="row items-center q-gutter-xs no-wrap">
        <span>{{ i + 1 }}</span>
        <q-input v-model="p.nombre" dense outlined class="col" :label="i === 0 ? 'Origen' : i === puntos.length - 1 ? 'Destino' : 'Parada'" />
        <q-btn flat dense icon="arrow_upward" :disable="i === 0" aria-label="Subir punto" @click="mover(i, -1)" />
        <q-btn flat dense icon="arrow_downward" :disable="i === puntos.length - 1" aria-label="Bajar punto" @click="mover(i, 1)" />
        <q-btn flat dense icon="delete" aria-label="Eliminar punto" @click="puntos.splice(i, 1)" />
      </div>
      <q-btn v-if="puntos.length" flat color="secondary" label="Volver al origen" @click="volver" />
      <div role="status">{{ estadoTexto }}</div>
      <q-btn v-if="estado === 'error'" outline color="secondary" label="Reintentar" @click="calcular" />
    </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buscarLugares, ubicacionActual } from 'src/services/geolocalizacion'

const props = defineProps({ modelValue: { type: Object, default: null }, soloLectura: { type: Boolean, default: false }, visible: { type: Boolean, default: true }, nuevo: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'modificado'])
const contenedor = ref(null)
let secuencia = 0
const puntos = ref((props.modelValue?.puntos ?? []).map((p) => ({ ...p, id: ++secuencia })))
const estado = ref(props.modelValue?.geometry ? 'listo' : 'incompleto')
const estadoTexto = ref(props.modelValue?.geometry ? `Ruta calculada: ${(props.modelValue.distanciaM / 1000).toFixed(2)} km` : 'Seleccione al menos dos puntos.')
let mapa, capa, capaVista, temporizador, version = 0, ultimaPeticion = 0, controlador
let versionUbicacion = 0, versionBusqueda = 0, controlBusqueda, intentoInicial = false, desmontado = false
const previsualizacion = ref(null)
const resultadoElegido = ref(null)
const resultados = ref([])
const buscando = ref(false)
const ubicando = ref(false)
const avisoUbicacion = ref('')
const mensajeBusqueda = ref('Escriba al menos tres caracteres.')
const cache = new Map()
const proveedor = import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org'
function pintar (geometry = null) {
  if (!mapa) return
  capa.clearLayers()
  if (geometry) L.geoJSON(geometry, { style: { color: '#1769aa', weight: 5 } }).addTo(capa)
  puntos.value.forEach((p, i) => {
    const icon = L.divIcon({ className: 'sg-map-marker', html: `<span style="display:block;background:#1769aa;color:white;border-radius:50%;width:26px;height:26px;text-align:center;line-height:26px">${i + 1}</span>`, iconSize: [26, 26] })
    const marcador = L.marker([p.lat, p.lng], { icon, draggable: !props.soloLectura }).addTo(capa)
    marcador.on('dragend', () => { const pos = marcador.getLatLng(); p.lat = pos.lat; p.lng = pos.lng })
  })
}
onMounted(() => {
  mapa = L.map(contenedor.value).setView([-9.19, -75.015], 5)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(mapa)
  capa = L.layerGroup().addTo(mapa)
  capaVista = L.layerGroup().addTo(mapa)
  mapa.on('click', (e) => { if (!props.soloLectura) mostrarVista({ nombre: `Punto ${puntos.value.length + 1}`, lat: e.latlng.lat, lng: e.latlng.lng }, false) })
  pintar(props.modelValue?.geometry)
  if (puntos.value.length) mapa.fitBounds(puntos.value.map(p => [p.lat, p.lng]), { padding: [25, 25], maxZoom: 15 })
  if (props.visible) iniciarUbicacion()
})
onBeforeUnmount(() => { desmontado = true; versionUbicacion++; versionBusqueda++; controlBusqueda?.abort(); version++; clearTimeout(temporizador); controlador?.abort(); mapa?.remove() })
watch(() => props.visible, (visible) => {
  if (visible) { setTimeout(() => mapa?.invalidateSize(), 100); iniciarUbicacion() }
  else { versionUbicacion++; ubicando.value = false }
})
function iniciarUbicacion () {
  if (!mapa || !props.visible || props.soloLectura || !props.nuevo || intentoInicial || puntos.value.length) return
  intentoInicial = true
  localizar(true)
}
async function localizar (automatica) {
  const actual = ++versionUbicacion
  ubicando.value = true; avisoUbicacion.value = ''
  try {
    const posicion = await ubicacionActual()
    if (desmontado || actual !== versionUbicacion || !props.visible) return
    if (automatica && (puntos.value.length || previsualizacion.value)) return
    if (automatica) {
      puntos.value.push({ id: ++secuencia, nombre: 'Mi ubicación actual', ...posicion })
      mapa.setView([posicion.lat, posicion.lng], 16)
    } else mostrarVista({ nombre: 'Mi ubicación actual', ...posicion })
  } catch {
    if (!desmontado && actual === versionUbicacion) avisoUbicacion.value = 'No se pudo obtener la ubicación. Busque una dirección o seleccione un punto en el mapa.'
  } finally { if (!desmontado && actual === versionUbicacion) ubicando.value = false }
}
function mostrarVista (lugar, centrar = true) {
  previsualizacion.value = lugar
  capaVista.clearLayers()
  L.circleMarker([lugar.lat, lugar.lng], { radius: 9, color: '#ad6500', fillOpacity: 0.8 }).addTo(capaVista)
  if (centrar) mapa.setView([lugar.lat, lugar.lng], 16)
}
function anadirPunto () {
  if (!previsualizacion.value) return
  puntos.value.push({ id: ++secuencia, ...previsualizacion.value })
  previsualizacion.value = null; resultadoElegido.value = null; capaVista.clearLayers()
}
function seleccionarResultado (resultado) {
  if (resultado && mapa) mostrarVista({ nombre: resultado.label, lat: resultado.lat, lng: resultado.lng })
}
async function filtrar (valor, actualizar, cancelar) {
  const actual = ++versionBusqueda
  controlBusqueda?.abort()
  if (valor.trim().length < 3) { buscando.value = false; mensajeBusqueda.value = 'Escriba al menos tres caracteres.'; actualizar(() => { resultados.value = [] }); return }
  controlBusqueda = new AbortController(); buscando.value = true; mensajeBusqueda.value = 'Buscando…'
  try {
    const lista = await buscarLugares(valor.trim(), mapa?.getCenter(), controlBusqueda.signal)
    if (desmontado || actual !== versionBusqueda) { cancelar(); return }
    actualizar(() => { resultados.value = lista; mensajeBusqueda.value = lista.length ? '' : 'No se encontraron lugares.' })
  } catch {
    if (desmontado || actual !== versionBusqueda) { cancelar(); return }
    actualizar(() => { resultados.value = []; mensajeBusqueda.value = 'No se pudo realizar la búsqueda. Inténtelo nuevamente.' })
  } finally { if (!desmontado && actual === versionBusqueda) buscando.value = false }
}
function mover (i, cambio) { const j = i + cambio; [puntos.value[i], puntos.value[j]] = [puntos.value[j], puntos.value[i]] }
function volver () { const p = puntos.value[0]; puntos.value.push({ ...p, id: ++secuencia }) }
watch(puntos, () => {
  if (props.soloLectura) return
  emit('modificado')
  version++; controlador?.abort(); clearTimeout(temporizador)
  emit('update:modelValue', null)
  pintar()
  if (puntos.value.length < 2 || puntos.value.some(p => !p.nombre.trim())) { estado.value = 'incompleto'; estadoTexto.value = 'Seleccione y nombre al menos dos puntos.'; return }
  estado.value = 'calculando'; estadoTexto.value = 'Calculando ruta…'
  temporizador = setTimeout(calcular, 1000)
}, { deep: true, flush: 'sync' })
async function calcular () {
  clearTimeout(temporizador)
  const actual = ++version
  const datos = puntos.value.map(({ nombre, lat, lng }) => ({ nombre: nombre.trim(), lat, lng }))
  if (datos.length < 2 || datos.some(p => !p.nombre)) return
  const clave = datos.map(p => `${p.lng},${p.lat}`).join(';')
  estado.value = 'calculando'; estadoTexto.value = 'Calculando ruta…'
  try {
    let resultado = cache.get(clave)
    if (!resultado) {
      const espera = Math.max(0, 1000 - (Date.now() - ultimaPeticion))
      if (espera) await new Promise(resolve => { temporizador = setTimeout(resolve, espera) })
      if (actual !== version) return
      ultimaPeticion = Date.now(); controlador = new AbortController()
      const limite = setTimeout(() => controlador.abort(), 10000)
      try {
        const respuesta = await fetch(`${proveedor}/route/v1/driving/${clave}?overview=full&geometries=geojson`, { signal: controlador.signal })
        const json = await respuesta.json()
        if (!respuesta.ok || json.code !== 'Ok' || !json.routes?.length) throw new Error('Sin ruta')
        resultado = { geometry: json.routes[0].geometry, distanciaM: json.routes[0].distance }
        cache.set(clave, resultado)
      } finally { clearTimeout(limite) }
    }
    if (actual !== version) return
    const ruta = { puntos: datos, ...resultado, proveedor: 'OSRM' }
    emit('update:modelValue', ruta); pintar(ruta.geometry)
    estado.value = 'listo'; estadoTexto.value = `Ruta calculada: ${(ruta.distanciaM / 1000).toFixed(2)} km`
  } catch {
    if (actual !== version) return
    estado.value = 'error'; estadoTexto.value = 'No se pudo calcular la ruta. Reintente o use el ingreso manual.'
  }
}
</script>
