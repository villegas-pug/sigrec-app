// Búsqueda paginada en el servidor para los diálogos de selección (SPEC 045, 052): mínimo tres caracteres,
// espera de 400 ms y descarte de respuestas antiguas. `solicitar(texto, pagina)` devuelve `{ items, total }`.
import { computed, ref, watch } from 'vue'

export function useBusquedaPaginada (abierto, solicitar, tamano = 5) {
  const consulta = ref('')
  const texto = computed(() => consulta.value.trim())
  const textoValido = computed(() => Array.from(texto.value).length >= 3)
  const filas = ref([])
  const buscando = ref(false)
  const error = ref('')
  const paginacion = ref({ page: 1, rowsPerPage: tamano, rowsNumber: 0 })
  let solicitud = 0

  // SPEC 045: al cambiar el texto o cerrar, se invalidan inmediatamente las respuestas anteriores.
  watch([abierto, texto], ([visible], _, limpiar) => {
    filas.value = []
    error.value = ''
    paginacion.value = { page: 1, rowsPerPage: tamano, rowsNumber: 0 }
    buscando.value = visible && textoValido.value
    if (!buscando.value) return
    const espera = setTimeout(() => buscar(1), 400)
    limpiar(() => { clearTimeout(espera); solicitud += 1 })
  }, { flush: 'sync' })

  async function buscar (pagina) {
    const actual = ++solicitud
    buscando.value = true
    error.value = ''
    filas.value = []
    paginacion.value = { ...paginacion.value, page: pagina }
    try {
      const { items, total } = await solicitar(texto.value, pagina)
      if (actual !== solicitud) return
      const ultima = Math.max(1, Math.ceil(total / tamano))
      paginacion.value = { page: Math.min(pagina, ultima), rowsPerPage: tamano, rowsNumber: total }
      if (total > 0 && pagina > ultima) return buscar(ultima)
      filas.value = items
    } catch (e) {
      if (actual === solicitud) error.value = e.message
    } finally {
      if (actual === solicitud) buscando.value = false
    }
  }

  return { consulta, textoValido, filas, buscando, error, paginacion, buscar }
}
