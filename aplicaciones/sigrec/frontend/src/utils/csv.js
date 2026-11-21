// Exportación a CSV compartida por los reportes. Separador «;» y BOM para que Excel abra bien los acentos.
import { exportFile } from 'quasar'

const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`

/**
 * Descarga un CSV.
 * `columnas` es una lista de { titulo, valor: (fila) => dato }. Devuelve true si el navegador permitió la descarga.
 */
export function exportarCsv (nombreArchivo, columnas, filas) {
  const lineas = [
    columnas.map((c) => c.titulo),
    ...filas.map((fila) => columnas.map((c) => c.valor(fila)))
  ]
  const csv = '﻿' + lineas.map((linea) => linea.map(escapar).join(';')).join('\r\n')
  return exportFile(nombreArchivo, csv, 'text/csv;charset=utf-8') === true
}
