<template>
  <q-page class="sg-page">
    <div class="sg-page__inner">
      <page-header />
      <div class="row items-center justify-between q-mb-md q-gutter-sm">
        <p class="q-ma-none">Aprende a utilizar SIGREC, paso a paso.</p>
        <q-btn color="primary" icon="playlist_play" label="Ver todo" @click="playAll" />
      </div>
      <q-banner v-if="invalidChapter" class="bg-orange-1 q-mb-md" role="status">El capítulo solicitado no existe. Seleccione uno en el índice.</q-banner>
      <div class="manual-layout">
        <section class="manual-player" aria-label="Reproductor del manual">
          <div class="sg-muted">Capítulo {{ String(index + 1).padStart(2, '0') }} de {{ MANUAL_CHAPTERS.length }}</div>
          <h2 class="text-h6 q-mt-xs q-mb-md">{{ chapter.title }}</h2>
          <video ref="video" controls playsinline preload="metadata" :poster="chapter.poster ? asset(chapter.poster) : undefined" :aria-label="chapter.title" @loadedmetadata="seek" @error="loadError = true" @ended="ended">
            <track :key="chapter.id" kind="subtitles" :src="asset(chapter.subtitles)" srclang="es" label="Español" default />
          </video>
          <q-banner v-if="loadError" class="bg-orange-1 q-mt-sm" role="alert">
            No se pudo cargar este capítulo. Puede reintentar o elegir otro en el índice.
            <template #action><q-btn flat label="Reintentar" @click="load" /></template>
          </q-banner>
          <div class="row justify-between q-my-md">
            <q-btn outline color="secondary" icon="chevron_left" label="Anterior" :disable="index === 0" @click="choose(index - 1)" />
            <q-btn outline color="secondary" icon-right="chevron_right" label="Siguiente" :disable="index === MANUAL_CHAPTERS.length - 1" @click="choose(index + 1)" />
          </div>
          <p v-if="finished" role="status">{{ index === MANUAL_CHAPTERS.length - 1 ? 'Ha llegado al final del manual.' : 'Capítulo terminado. Puede continuar con Siguiente.' }}</p>
          <div class="row q-gutter-sm">
            <q-btn flat no-caps icon="link" label="Copiar enlace" @click="copyLink" />
            <q-btn flat no-caps icon="download" label="Descargar capítulo" :href="asset(chapter.video)" download />
            <q-btn v-if="destination" flat no-caps icon="open_in_new" label="Ir a esta pantalla" :to="{ name: destination }" />
          </div>
          <p v-if="copyStatus" class="sg-muted q-mt-sm" role="status">{{ copyStatus }}</p>
        </section>
        <section class="manual-index" aria-label="Índice del manual">
          <q-expansion-item :default-opened="!$q.screen.lt.md" label="Índice de capítulos" icon="list">
            <div class="q-pa-sm">
              <q-input v-model="search" outlined dense clearable label="Buscar una función" placeholder="Registrar, pagar, verificar…" />
            </div>
            <q-list>
              <q-item v-for="item in filtered" :key="item.id" clickable :active="item.id === chapter.id" active-class="bg-blue-1 text-primary" :aria-current="item.id === chapter.id ? 'true' : undefined" @click="choose(MANUAL_CHAPTERS.indexOf(item))">
                <q-item-section side>{{ String(MANUAL_CHAPTERS.indexOf(item) + 1).padStart(2, '0') }}</q-item-section>
                <q-item-section><q-item-label>{{ item.title }}</q-item-label></q-item-section>
                <q-item-section side>{{ duration(item.duration) }}</q-item-section>
              </q-item>
            </q-list>
            <p v-if="!filtered.length" class="q-pa-md sg-muted" role="status">No hay capítulos para esa búsqueda.</p>
          </q-expansion-item>
        </section>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from 'components/common/PageHeader.vue'
import { MANUAL_CHAPTERS } from 'src/config/manual'
import { usePerfil } from 'src/composables/usePerfil'
const route = useRoute()
const router = useRouter()
const { puedeAcceder } = usePerfil()
const video = ref(null)
const search = ref('')
const loadError = ref(false)
const finished = ref(false)
const continuous = ref(false)
const copyStatus = ref('')
const value = (v) => Array.isArray(v) ? v[0] : v
const index = computed(() => Math.max(0, MANUAL_CHAPTERS.findIndex(c => c.id === value(route.query.chapter))))
const chapter = computed(() => MANUAL_CHAPTERS[index.value])
const invalidChapter = computed(() => !!route.query.chapter && !MANUAL_CHAPTERS.some(c => c.id === value(route.query.chapter)))
const normalize = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filtered = computed(() => {
  const words = normalize(search.value).trim().split(/\s+/)
  return MANUAL_CHAPTERS.filter(c => words.every(word => normalize(c.title + ' ' + c.topics.join(' ')).includes(word)))
})
const destination = computed(() => chapter.value.routes.find(puedeAcceder))
const asset = (path) => `${import.meta.env.BASE_URL}${path}`
const duration = (seconds) => `${Math.floor(Math.round(seconds) / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}`
function seek () {
  loadError.value = false
  finished.value = false
  const raw = Number(value(route.query.t))
  const time = Number.isFinite(raw) ? Math.max(0, raw) : 0
  if (video.value && Number.isFinite(video.value.duration)) video.value.currentTime = Math.min(time, Math.max(0, video.value.duration - 0.1))
  const external = video.value?.querySelector('track')?.track
  if (external) for (const track of video.value.textTracks) track.mode = track === external ? 'showing' : 'disabled'
}
function load () {
  if (!video.value) return
  loadError.value = false
  finished.value = false
  video.value.pause()
  video.value.removeAttribute('src')
  video.value.load()
  video.value.src = asset(chapter.value.video)
  video.value.load()
}
function choose (position, keepPlaying = false) {
  if (!keepPlaying) continuous.value = false
  if (position === index.value) {
    finished.value = false
    if (video.value) { video.value.pause(); video.value.currentTime = 0 }
    if (route.query.t) router.push({ name: 'manual', query: { chapter: chapter.value.id } })
    return
  }
  router.push({ name: 'manual', query: { chapter: MANUAL_CHAPTERS[position].id } })
}
async function playAll () {
  continuous.value = true
  if (index.value !== 0) { choose(0, true); return }
  if (video.value) video.value.currentTime = 0
  try { await video.value?.play() } catch { continuous.value = false }
}
function ended () {
  finished.value = true
  if (continuous.value && index.value < MANUAL_CHAPTERS.length - 1) choose(index.value + 1, true)
  else continuous.value = false
}
async function copyLink () {
  const url = new URL(router.resolve({ name: 'manual', query: { chapter: chapter.value.id, t: Math.floor(video.value?.currentTime ?? 0) } }).href, window.location.href)
  try { await navigator.clipboard.writeText(url.href); copyStatus.value = 'Enlace copiado.' } catch { copyStatus.value = `Copie este enlace: ${url.href}` }
}
watch(() => chapter.value.id, async () => {
  copyStatus.value = ''
  await nextTick()
  load()
  if (continuous.value) { try { await video.value?.play() } catch { continuous.value = false } }
}, { immediate: true })
watch(() => route.query.t, seek)
onBeforeUnmount(() => { video.value?.pause(); video.value?.removeAttribute('src'); video.value?.load() })
</script>
<style scoped>
.manual-layout { display:grid; grid-template-columns:minmax(260px, 340px) minmax(0,1fr); gap:24px; align-items:start }
.manual-player { grid-column:2; grid-row:1; min-width:0 }
.manual-player video { width:100%; aspect-ratio:16/9; background:#151b28; display:block; border-radius:8px }
.manual-player video::cue { background:rgba(0,0,0,.85); color:white }
.manual-index { grid-column:1; grid-row:1; max-height:75vh; overflow:auto; border:1px solid #dce3ed; border-radius:8px }
@media(max-width:1023px) { .manual-layout { display:flex; flex-direction:column } .manual-player,.manual-index { width:100% } .manual-index { max-height:none } }
</style>
