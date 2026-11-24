<template>
  <q-layout view="lHh Lpr lFf">
    <app-header :drawer-abierto="drawerAbierto" @alternar-menu="drawerAbierto = !drawerAbierto" />

    <app-drawer v-model="drawerAbierto" />

    <q-footer class="sg-footer">
      <p class="sg-footer__text">
        © {{ anioActual }} INABIF | Todos los derechos reservados
        <span class="sg-footer__version">(Integración de centros · etapa 1)</span>
      </p>
    </q-footer>

    <q-page-container>
      <!-- Ingreso en curso: igual que educalle-app, la pantalla espera a que SRH valide al usuario y entregue su menú. -->
      <q-page v-if="!sesionResuelta" class="flex flex-center">
        <div class="column items-center q-gutter-sm" role="status">
          <q-spinner color="primary" size="3em" />
          <span>Validando acceso…</span>
        </div>
      </q-page>
      <!-- Sin identidad de la intranet: SIGREC no tiene inicio de sesión propio. -->
      <q-page v-else-if="!usuario" class="sg-page">
        <section class="sg-card q-pa-lg" style="max-width: 560px; margin: 48px auto 0">
          <q-icon name="lock" size="40px" color="grey-7" aria-hidden="true" />
          <h1 class="text-h6 text-weight-bold q-mt-sm q-mb-sm">Ingrese desde la intranet</h1>
          <p class="sg-muted">SIGREC no tiene inicio de sesión propio: abra el sistema desde la intranet del INABIF.</p>
          <q-btn v-if="urlIntranet" unelevated color="primary" no-caps icon="arrow_back" label="Ir a la intranet" :href="urlIntranet" />
        </section>
      </q-page>
      <template v-else-if="permitido">
        <!-- SPEC 052: fuera del `:key`, para que la barra no se vuelva a montar al cambiar de pantalla. -->
        <div v-if="route.meta?.filtros" ref="zonaCabecera">
          <div id="sg-cabecera-pagina" class="sg-page sg-cabecera-pagina" />
          <filtros-cabecera :recargando="recargando" />
        </div>
        <q-page v-if="cargandoDatos" class="flex flex-center">
          <q-spinner color="primary" size="3em" aria-label="Cargando datos" />
        </q-page>
        <!-- La clave por URL completa vuelve a montar la página cuando solo cambia la consulta (?bien=, ?vehiculo=…). -->
        <router-view v-else :key="route.name === 'manual' ? 'manual' : route.fullPath" />
      </template>
      <sin-acceso v-else />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from 'components/layout/AppHeader.vue'
import AppDrawer from 'components/layout/AppDrawer.vue'
import SinAcceso from 'components/layout/SinAcceso.vue'
import FiltrosCabecera from 'components/layout/FiltrosCabecera.vue'
import { INTRANET } from 'src/config/intranet'
import { usePerfil } from 'src/composables/usePerfil'
import { useSesionIntranet } from 'src/composables/useSesionIntranet'
import { claveFiltros, consultaGrupo, fijarCentro } from 'src/composables/useFiltrosCabecera'
import { alRecargarPantalla, asegurarDatos, faltanDatos } from 'src/services/cargaDatos'
import { parametro } from 'src/utils/navegacion'

const drawerAbierto = ref(false)
const route = useRoute()
const router = useRouter()
const { puedeAcceder, rutaInicial } = usePerfil()
const { usuario, iniciarSesionIntranet } = useSesionIntranet()

const anioActual = new Date().getFullYear()
const urlIntranet = INTRANET.urlIntranet
const sesionResuelta = ref(false)
const cargandoDatos = ref(false)
// SPEC 052: recarga por cambio de filtros; la pantalla sigue montada y la barra muestra el progreso.
const recargando = ref(false)
const zonaCabecera = ref(null)
let observadorCabecera = null
watch(zonaCabecera, (elemento) => {
  observadorCabecera?.disconnect()
  if (!elemento) {
    document.documentElement.style.removeProperty('--sg-filtros-alto')
    return
  }
  observadorCabecera = new ResizeObserver(() => document.documentElement.style.setProperty('--sg-filtros-alto', `${Math.ceil(elemento.getBoundingClientRect().height)}px`))
  observadorCabecera.observe(elemento)
}, { flush: 'post' })
onBeforeUnmount(() => {
  observadorCabecera?.disconnect()
  document.documentElement.style.removeProperty('--sg-filtros-alto')
})
let preparacionActual = 0
// Filtros con los que se pidieron los datos de la pantalla actual.
let filtrosCargados = null

// El mismo criterio gobierna el menú y la vista: una ruta fuera del menú de SRH no muestra su contenido.
const permitido = computed(() => puedeAcceder(route.name))

// SPEC 041: cada pantalla trae lo suyo antes de mostrarse (las pantallas leen ?bien=, ?vehiculo=… al crearse).
const gruposDeRuta = () => ['catalogos', ...(route.meta?.datos ?? [])]

// SPEC 052: un enlace profundo con ?car= fija el centro de los filtros de cabecera.
function aplicarCentroDeEnlace () {
  const car = parametro(route.query.car)
  // `?car=todos` (enlaces que conservan «todos los centros») no cambia el filtro; solo se aceptan códigos de centro.
  if (route.meta?.filtros && /^[A-Z0-9]{3}$/.test(car ?? '')) fijarCentro(car)
}

// `progreso` es la marca que se enciende mientras dura la carga: `cargandoDatos` oculta la pantalla, `recargando` no.
async function prepararDatos (progreso = cargandoDatos) {
  const preparacion = ++preparacionActual
  // SPEC 042: Inicio muestra su estructura y gestiona sus propios estados de carga.
  if (route.name === 'inicio') return
  const grupos = gruposDeRuta()
  if (!usuario.value || !permitido.value || !faltanDatos(grupos)) return
  const config = route.meta?.filtros
  filtrosCargados = claveFiltros()
  progreso.value = true
  try {
    await asegurarDatos(grupos, (grupo) => consultaGrupo(grupo, config))
  } catch (error) {
    if (preparacion === preparacionActual) {
      console.error(error)
      Notify.create({ type: 'negative', message: error.message || 'No se pudieron cargar los datos.' })
    }
  } finally {
    if (preparacion === preparacionActual) {
      cargandoDatos.value = false
      recargando.value = false
    }
  }
  // Los filtros cambiaron mientras la pantalla cargaba: se vuelve a pedir con los vigentes.
  if (preparacion === preparacionActual && config && claveFiltros() !== filtrosCargados) recargarPantalla()
}

// Vuelve a pedir los datos de la pantalla sin desmontarla (cambio de filtros o cierre del buscador global).
function recargarPantalla () {
  if (!sesionResuelta.value || cargandoDatos.value) return
  return prepararDatos(recargando)
}
alRecargarPantalla(recargarPantalla)

// Síncrono: marca «cargando» antes de que la pantalla nueva se monte con datos incompletos.
watch(() => route.fullPath, () => {
  preparacionActual++
  recargando.value = false
  if (route.name === 'inicio') {
    cargandoDatos.value = false
    return
  }
  aplicarCentroDeEnlace()
  if (!sesionResuelta.value || !usuario.value || !permitido.value || !faltanDatos(gruposDeRuta())) {
    cargandoDatos.value = false
    return
  }
  cargandoDatos.value = true
  prepararDatos()
}, { flush: 'sync' })

// Un cambio en los filtros de cabecera vuelve a pedir los datos; se ignora si ya se pidieron con esos mismos filtros.
watch(claveFiltros, (clave) => {
  if (route.meta?.filtros && clave !== filtrosCargados) recargarPantalla()
})

onBeforeMount(async () => {
  const traiaToken = !!(route.query.p || window.location.search.includes('p='))
  await iniciarSesionIntranet(route)
  if (usuario.value && (traiaToken || route.name === 'raiz')) {
    // Igual que educalle: tras el ingreso se va a la primera pantalla; se quita `p` de la dirección.
    const { p, ...consulta } = route.query
    await router.replace(route.name === 'raiz' ? { name: rutaInicial.value } : { path: route.path, query: consulta, hash: route.hash })
  }
  sesionResuelta.value = true
  aplicarCentroDeEnlace()
  await prepararDatos()
})
</script>
