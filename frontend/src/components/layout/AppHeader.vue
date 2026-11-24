<template>
  <q-header class="sg-header">
    <q-toolbar>
      <q-btn
        flat
        round
        dense
        icon="menu"
        class="sg-header__menu"
        :aria-label="drawerAbierto ? 'Cerrar menú' : 'Abrir menú'"
        :aria-expanded="drawerAbierto ? 'true' : 'false'"
        aria-controls="menu-principal"
        @click="$emit('alternar-menu')"
      />
      <router-link :to="{ name: rutaInicial }" class="sg-header__home" aria-label="Ir al inicio" @click="marcarNavegacionPrincipal">
        <img
          class="sg-logo"
          src="https://srvapp02.inabif.gob.pe/intranet/Img/LOGO_INABIF_2020.png"
          alt="Logo institucional del INABIF"
        />
      </router-link>
      <div class="sg-header__identity">
        <span class="sg-header__name">
          <span class="gt-xs">SIGREC · Sistema Integrado de Gestión de Recursos de Centros</span>
          <span class="lt-sm">SIGREC</span>
        </span>
        <span class="sg-header__unit">USPNNA – INABIF</span>
      </div>
      <q-space />
      <!-- Identidad que entregó la intranet (SPEC 039), igual que educalle-app. -->
      <div v-if="usuario" class="sg-header__user gt-xs">
        <strong class="sg-header__user-name">{{ usuario.nombre }}</strong>
        <span class="sg-header__user-unit">{{ usuario.unidad }}</span>
      </div>
      <!-- Buscador global (SPEC 011, Ola 3): botón y atajo Ctrl + K. -->
      <q-btn flat round dense icon="search" aria-label="Buscar (Ctrl + K)" @click="buscador = true">
        <q-tooltip>Buscar (Ctrl + K)</q-tooltip>
      </q-btn>
      <!-- Contador de «Atención requerida» (SPEC 011): visible desde cualquier pantalla para los perfiles con Inicio. -->
      <q-btn
        v-if="puedeAcceder('inicio')"
        flat
        round
        dense
        icon="notifications"
        :to="{ name: 'inicio', hash: '#atencion' }"
        :aria-label="avisosDisponibles ? `Atención requerida: ${plural(pendientes, 'aviso', 'avisos')}` : 'Atención requerida: avisos no cargados'"
      >
        <q-badge v-if="pendientes" color="negative" floating rounded>{{ pendientes > 99 ? '99+' : pendientes }}</q-badge>
        <q-tooltip>{{ !avisosDisponibles ? 'Avisos no cargados; abra Inicio para consultarlos' : pendientes ? `Atención requerida: ${plural(pendientes, 'aviso', 'avisos')}` : 'Sin avisos pendientes' }}</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="exit_to_app" aria-label="Regresar a la intranet" @click="salir">
        <q-tooltip>REGRESAR</q-tooltip>
      </q-btn>
    </q-toolbar>
    <buscador-global v-if="buscador" v-model="buscador" />
  </q-header>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useSesionIntranet } from 'src/composables/useSesionIntranet'
import { inicioListo } from 'src/services/cargaDatos'
import { plural } from 'src/utils/formato'
// El logo es navegación principal; la lupa y la campana sí permiten volver a la pantalla en la que se estaba.
import { marcarNavegacionPrincipal } from 'src/router/retorno'

const BuscadorGlobal = defineAsyncComponent(() => import('components/layout/BuscadorGlobal.vue'))

defineProps({
  drawerAbierto: { type: Boolean, default: false }
})

defineEmits(['alternar-menu'])

const { rutaInicial, puedeAcceder } = usePerfil()
const { usuario, salir } = useSesionIntranet()
const avisos = shallowRef(null)
watch(inicioListo, async (listo) => {
  if (!listo) {
    avisos.value = null
    return
  }
  try {
    const { useAtencion } = await import('src/composables/useAtencion')
    if (inicioListo.value) avisos.value = useAtencion().avisos
  } catch (error) {
    console.error(error)
  }
}, { immediate: true })
const avisosDisponibles = computed(() => inicioListo.value && !!avisos.value)
// Solo cuenta lo que requiere atención ahora; los próximos vencimientos se ven en Inicio.
const pendientes = computed(() => (puedeAcceder('inicio') && avisosDisponibles.value ? avisos.value.value.ahora.length : 0))

const buscador = ref(false)
const atajo = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    buscador.value = true
  }
}
onMounted(() => window.addEventListener('keydown', atajo))
onBeforeUnmount(() => window.removeEventListener('keydown', atajo))
</script>
