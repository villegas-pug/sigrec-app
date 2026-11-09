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
        <template v-for="entrada in menuVisible" :key="entrada.key">
          <q-item
            v-if="!entrada.items"
            clickable
            :to="{ name: entrada.key }"
            :active="rutaActiva === entrada.key"
            active-class="sg-nav__item--active"
            class="sg-nav__item"
            :class="{ 'sg-nav__item--root': entrada.key === 'inicio' }"
            @click="marcarNavegacionPrincipal"
          >
            <q-item-section avatar>
              <q-icon :name="entrada.icon" size="24px" aria-hidden="true" />
            </q-item-section>
            <q-item-section>{{ entrada.label }}</q-item-section>
          </q-item>

          <q-expansion-item
            v-else
            dense
            :model-value="estaAbierto(entrada)"
            :icon="entrada.icon"
            :label="entrada.label"
            :header-class="['sg-nav__group-header', { 'sg-nav__group-header--open': estaAbierto(entrada) }]"
            @update:model-value="(valor) => (abiertos[entrada.key] = valor)"
          >
            <q-item
              v-for="hoja in entrada.items"
              :key="hoja.key"
              clickable
              :to="{ name: hoja.key }"
              :active="rutaActiva === hoja.key"
              active-class="sg-nav__item--active"
              class="sg-nav__item sg-nav__item--leaf"
              @click="marcarNavegacionPrincipal"
            >
              <q-item-section avatar>
                <q-icon :name="hoja.icon" size="20px" aria-hidden="true" />
              </q-item-section>
              <q-item-section>{{ hoja.label }}</q-item-section>
            </q-item>
          </q-expansion-item>
        </template>
      </q-list>
    </nav>

    <div class="sg-perfil">
      <q-select
        v-model="perfilId"
        :options="opcionesPerfil"
        emit-value
        map-options
        dense
        outlined
        bg-color="white"
        label="Perfil de demostración">
        <template #append><boton-dictado v-model="perfilId" tipo="opcion" :opciones="opcionesPerfil" emit-value /></template>
      </q-select>
      <p class="sg-perfil__texto">Ámbito: {{ perfil.ambito.descripcion }}</p>
      <p class="sg-perfil__texto">Accesos por perfil provisionales, por validar.</p>
    </div>
  </q-drawer>
</template>

<script setup>
import BotonDictado from 'components/common/BotonDictado.vue'
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { MENU } from 'src/config/menu'
import { usePerfil } from 'src/composables/usePerfil'
// El menú es navegación principal: la pantalla a la que lleva no ofrece «Volver».
import { marcarNavegacionPrincipal } from 'src/router/retorno'

defineProps({
  modelValue: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const route = useRoute()
const { perfiles, perfilId, perfil, puedeAcceder } = usePerfil()

const opcionesPerfil = perfiles.map((p) => ({ label: p.nombre, value: p.id }))
const rutaActiva = computed(() => route.name)

// Solo se muestran las entradas a las que el perfil tiene acceso; un grupo sin hojas visibles desaparece.
const menuVisible = computed(() =>
  MENU.map((entrada) =>
    entrada.items ? { ...entrada, items: entrada.items.filter((h) => puedeAcceder(h.key)) } : entrada
  ).filter((entrada) => (entrada.items ? entrada.items.length > 0 : puedeAcceder(entrada.key)))
)

// Un grupo se abre por defecto si contiene la ruta activa; luego respeta lo que elija la persona.
const abiertos = reactive({})
const estaAbierto = (entrada) => abiertos[entrada.key] ?? entrada.items.some((h) => h.key === rutaActiva.value)
</script>
