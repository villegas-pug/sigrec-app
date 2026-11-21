// Conserva filtros y selección de una pantalla en la entrada actual del historial (`history.state`).
// Al volver con «Atrás» se restauran; al entrar desde el menú la pantalla abre limpia.
// No usa router.replace: MainLayout monta cada página con :key="route.fullPath" y cambiar la URL la reiniciaría.
import { watch } from 'vue'

const CLAVE = 'sigrec'

// `campos` es un objeto { nombre: ref }. Los valores deben ser datos JSON (también arrays y objetos).
export function useEstadoNavegacion (clave, campos) {
  const nombres = Object.keys(campos)

  const previo = window.history.state?.[CLAVE]?.[clave]
  if (previo) {
    for (const nombre of nombres) {
      if (nombre in previo) campos[nombre].value = previo[nombre]
    }
  }

  watch(
    () => Object.fromEntries(nombres.map((n) => [n, campos[n].value])),
    (valores) => {
      const estado = window.history.state ?? {}
      // El historial no admite proxies de Vue: guardar una copia de sus datos, incluidas las expansiones del árbol.
      const serializables = JSON.parse(JSON.stringify(valores))
      window.history.replaceState({ ...estado, [CLAVE]: { ...estado[CLAVE], [clave]: serializables } }, '')
    },
    { deep: true }
  )
}
