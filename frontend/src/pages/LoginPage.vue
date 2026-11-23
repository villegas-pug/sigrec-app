<template>
  <main class="sg-login q-pa-lg">
    <q-card class="sg-login__card q-pa-lg">
      <h1 class="text-h5 text-weight-bold q-mt-none q-mb-xs">Iniciar sesión en SIGREC</h1>
      <p class="sg-muted q-mb-lg">USPNNA – INABIF</p>
      <q-form class="column q-gutter-y-md" @submit="enviar">
        <q-input v-model="usuario" outlined name="username" label="Usuario" autocomplete="username" :rules="[requerido]" />
        <q-input v-model="password" outlined name="password" type="password" label="Contraseña" autocomplete="current-password" :rules="[requerido]" />
        <p v-if="error || errorSesion" class="text-negative q-mb-none" role="alert">{{ error || errorSesion }}</p>
        <q-btn unelevated color="primary" no-caps label="Iniciar sesión" type="submit" :loading="ocupado" />
      </q-form>
    </q-card>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePerfil } from 'src/composables/usePerfil'
import { requerido } from 'src/utils/validaciones'

const route = useRoute()
const router = useRouter()
const { iniciarSesion, rutaInicial, errorSesion } = usePerfil()
const usuario = ref('')
const password = ref('')
const error = ref('')
const ocupado = ref(false)

async function enviar () {
  if (ocupado.value) return
  ocupado.value = true
  error.value = ''
  try {
    await iniciarSesion(usuario.value, password.value)
    const destino = route.query.siguiente
    const interno = typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//')
    await router.replace(interno && router.resolve(destino).name !== 'login' ? destino : { name: rutaInicial.value })
  } catch (err) {
    error.value = err.message
  } finally {
    password.value = ''
    ocupado.value = false
  }
}
</script>

<style scoped>
.sg-login {
  display: grid;
  min-height: 100vh;
  place-items: center;
}
.sg-login__card {
  max-width: 410px;
  width: 100%;
}
</style>
