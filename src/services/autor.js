// Autor de los registros creados desde la interfaz: el perfil activo (lo fija usePerfil).
// Es estado de módulo para que las acciones de acciones.js no dependan de la interfaz.
let autor = 'Usuario de demostración'

export const fijarAutor = (nombre) => {
  autor = nombre
}

export const autorActual = () => autor
