<template>
  <q-drawer
    :model-value="modelValue"
    show-if-above
    :width="300"
    :breakpoint="1024"
    bordered
    class="sg-drawer"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <nav id="menu-principal" class="sg-nav" aria-label="Menú principal">
      <q-list dense>
        <!-- Árbol de SRH (SPEC 039), como educalle-app: módulo › menú › submenú. -->
        <div v-for="modulo in menuOrdenado" :key="modulo.descripcion">
          <q-item-label v-if="!ocultarTituloModulo(modulo)" header class="text-bold">{{ modulo.descripcion }}</q-item-label>

          <template v-for="menu in modulo.subitems" :key="menu.descripcion">
            <q-expansion-item
              v-if="menu.subitems.length"
              dense
              :label="menu.descripcion"
              :icon="menu.icono"
              :disable="menu.flgDeshabilitado === 1"
              :default-opened="menu.modFlgMenuAbiertoDefecto === 1 || menu.subitems.some((s) => rutaActual === s.enlace)"
              :header-class="['sg-nav__group-header', { 'sg-nav__group-header--open': menu.subitems.some((s) => rutaActual === s.enlace) }]"
            >
              <q-item
                v-for="item in menu.subitems"
                :key="item.descripcion"
                clickable
                dense
                :disable="item.flgDeshabilitado === 1"
                :active="rutaActual === item.enlace"
                active-class="sg-nav__item--active"
                class="sg-nav__item sg-nav__item--leaf"
                @click="irA(item.enlace)"
              >
                <q-item-section avatar><q-icon :name="item.icono || 'chevron_right'" size="20px" aria-hidden="true" /></q-item-section>
                <q-item-section>{{ obtenerDescripcionVisible(item.descripcion) }}</q-item-section>
              </q-item>
            </q-expansion-item>

            <q-item
              v-else
              clickable
              dense
              :disable="menu.flgDeshabilitado === 1"
              :active="rutaActual === menu.enlace"
              active-class="sg-nav__item--active"
              class="sg-nav__item"
              :class="{ 'sg-nav__item--root': menu.enlace === 'inicio' }"
              @click="irA(menu.enlace)"
            >
              <q-item-section avatar><q-icon :name="menu.icono || 'chevron_right'" size="24px" aria-hidden="true" /></q-item-section>
              <q-item-section>{{ obtenerDescripcionVisible(menu.descripcion) }}</q-item-section>
            </q-item>
          </template>
        </div>
      </q-list>
    </nav>
  </q-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesionIntranet } from 'src/composables/useSesionIntranet'
// El menú es navegación principal: la pantalla a la que lleva no ofrece «Volver».
import { marcarNavegacionPrincipal } from 'src/router/retorno'

defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const { menuOrdenado, ocultarTituloModulo, obtenerDescripcionVisible } = useSesionIntranet()

// Igual que educalle-app: el `enlace` de SRH es la ruta sin la barra inicial.
const rutaActual = computed(() => route.path.replace(/^\/+/, ''))

function irA (enlace) {
  if (!enlace || enlace === '#') return
  marcarNavegacionPrincipal()
  router.push('/' + enlace.replace(/^\/+/, ''))
}
</script>
