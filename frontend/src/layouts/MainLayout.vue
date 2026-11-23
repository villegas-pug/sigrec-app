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
      <q-page v-else-if="cargandoDatos" class="flex flex-center">
        <q-spinner color="primary" size="3em" aria-label="Cargando datos" />
      </q-page>
      <!-- La clave por URL completa vuelve a montar la página cuando solo cambia la consulta (?bien=, ?vehiculo=…). -->
      <router-view v-else-if="permitido" :key="route.name === 'manual' ? 'manual' : route.fullPath" />
      <sin-acceso v-else />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from 'components/layout/AppHeader.vue'
import AppDrawer from 'components/layout/AppDrawer.vue'
import SinAcceso from 'components/layout/SinAcceso.vue'
import { INTRANET } from 'src/config/intranet'
import { usePerfil } from 'src/composables/usePerfil'
import { useSesionIntranet } from 'src/composables/useSesionIntranet'
import { asegurarDatos, faltanDatos } from 'src/services/cargaDatos'

const drawerAbierto = ref(false)
const route = useRoute()
const router = useRouter()
const { puedeAcceder, rutaInicial } = usePerfil()
const { usuario, iniciarSesionIntranet } = useSesionIntranet()

const anioActual = new Date().getFullYear()
const urlIntranet = INTRANET.urlIntranet
const sesionResuelta = ref(false)
const cargandoDatos = ref(false)
let preparacionActual = 0

// El mismo criterio gobierna el menú y la vista: una ruta fuera del menú de SRH no muestra su contenido.
const permitido = computed(() => puedeAcceder(route.name))

// SPEC 041: cada pantalla trae lo suyo antes de mostrarse (las pantallas leen ?bien=, ?vehiculo=… al crearse).
const gruposDeRuta = () => ['catalogos', ...(route.meta?.datos ?? [])]

async function prepararDatos () {
  const preparacion = ++preparacionActual
  // SPEC 042: Inicio muestra su estructura y gestiona sus propios estados de carga.
  if (route.name === 'inicio') return
  const grupos = gruposDeRuta()
  if (!usuario.value || !permitido.value || !faltanDatos(grupos)) return
  cargandoDatos.value = true
  try {
    await asegurarDatos(grupos)
  } catch (error) {
    if (preparacion === preparacionActual) {
      console.error(error)
      Notify.create({ type: 'negative', message: error.message || 'No se pudieron cargar los datos.' })
    }
  } finally {
    if (preparacion === preparacionActual) cargandoDatos.value = false
  }
}

// Síncrono: marca «cargando» antes de que la pantalla nueva se monte con datos incompletos.
watch(() => route.fullPath, () => {
  preparacionActual++
  if (route.name === 'inicio') {
    cargandoDatos.value = false
    return
  }
  if (!sesionResuelta.value || !usuario.value || !permitido.value || !faltanDatos(gruposDeRuta())) {
    cargandoDatos.value = false
    return
  }
  cargandoDatos.value = true
  prepararDatos()
}, { flush: 'sync' })

onBeforeMount(async () => {
  const traiaToken = !!(route.query.p || window.location.search.includes('p='))
  await iniciarSesionIntranet(route)
  if (usuario.value && (traiaToken || route.name === 'raiz')) {
    // Igual que educalle: tras el ingreso se va a la primera pantalla; se quita `p` de la dirección.
    const { p, ...consulta } = route.query
    await router.replace(route.name === 'raiz' ? { name: rutaInicial.value } : { path: route.path, query: consulta, hash: route.hash })
  }
  sesionResuelta.value = true
  await prepararDatos()
})
</script>
