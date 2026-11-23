<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <section class="sg-card q-pa-lg" style="max-width: 640px; margin: 48px auto 0">
        <q-icon name="lock" size="40px" color="grey-7" aria-hidden="true" />
        <h1 class="text-h6 text-weight-bold q-mt-sm q-mb-sm">
          Este módulo no está disponible para su usuario
        </h1>
        <p class="sg-muted">
          El menú muestra los módulos autorizados para este perfil.
        </p>
        <!-- Si se llegó por un enlace, primero se ofrece volver a la pantalla de origen (SPEC 011, Ola 5). -->
        <div class="row items-center q-gutter-sm">
          <volver-origen destacado />
          <q-btn v-if="rutaInicial !== 'sin-perfiles'" :unelevated="!destino" :outline="!!destino" color="primary" icon="arrow_forward" :to="{ name: rutaInicial }" :label="`Ir a ${nombreRutaInicial}`" />
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { MENU } from 'src/config/menu'
import { usePerfil } from 'src/composables/usePerfil'
import { useRetorno } from 'src/composables/useRetorno'
import VolverOrigen from 'components/layout/VolverOrigen.vue'

const { rutaInicial } = usePerfil()
const { destino } = useRetorno()

const nombreRutaInicial = computed(() => {
  const hojas = MENU.flatMap((e) => e.items ?? [e])
  return hojas.find((h) => h.key === rutaInicial.value)?.label ?? 'Inicio'
})
</script>
