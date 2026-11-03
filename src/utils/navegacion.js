// Ayudas para enlaces profundos: los parámetros de la URL solo identifican un registro dentro de lo que el perfil ya puede ver.

// Un parámetro repetido llega como arreglo; se usa el primero.
export const parametro = (valor) => (Array.isArray(valor) ? valor[0] : valor) ?? null

// Busca el registro pedido en una lista ya filtrada por ámbito.
// `noDisponible` solo es verdadero si se pidió un id y no existe o está fuera del ámbito: en ese caso no se elige otro registro.
export function registroSolicitado (id, lista, clave = 'id') {
  const pedido = parametro(id)
  if (!pedido) return { registro: null, noDisponible: false }
  const registro = lista.find((r) => r[clave] === pedido) ?? null
  return { registro, noDisponible: !registro }
}
