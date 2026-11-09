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
      <router-link :to="{ name: rutaInicial }" class="sg-header__home" aria-label="Ir al inicio">
        <span class="sg-logo" role="img" aria-label="Logo INABIF (archivo oficial pendiente)">Logo INABIF</span>
      </router-link>
      <div class="sg-header__identity">
        <span class="sg-header__name">
          <span class="gt-xs">SIGREC · Sistema Integrado de Gestión de Recursos de Centros</span>
          <span class="lt-sm">SIGREC</span>
        </span>
        <span class="sg-header__unit">USPNNA – INABIF</span>
      </div>
      <q-space />
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
        :aria-label="`Atención requerida: ${plural(pendientes, 'aviso', 'avisos')}`"
      >
        <q-badge v-if="pendientes" color="negative" floating rounded>{{ pendientes > 99 ? '99+' : pendientes }}</q-badge>
        <q-tooltip>{{ pendientes ? `Atención requerida: ${plural(pendientes, 'aviso', 'avisos')}` : 'Sin avisos pendientes' }}</q-tooltip>
      </q-btn>
    </q-toolbar>
    <buscador-global v-model="buscador" />
  </q-header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BuscadorGlobal from 'components/layout/BuscadorGlobal.vue'
import { usePerfil } from 'src/composables/usePerfil'
import { useAtencion } from 'src/composables/useAtencion'
import { plural } from 'src/utils/formato'

defineProps({
  drawerAbierto: { type: Boolean, default: false }
})

defineEmits(['alternar-menu'])

const { rutaInicial, puedeAcceder } = usePerfil()
const { avisos } = useAtencion()
// Solo cuenta lo que requiere atención ahora; los próximos vencimientos se ven en Inicio.
const pendientes = computed(() => (puedeAcceder('inicio') ? avisos.value.ahora.length : 0))

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
