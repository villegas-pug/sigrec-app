// Convierte los errores de captura y reconocimiento en códigos estables para la interfaz.
export function normalizarErrorVoz (error) {
  const codigo = typeof error === 'string' ? error : error?.name

  if (['not-allowed', 'NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(codigo)) {
    return 'permiso-denegado'
  }
  if (['NotFoundError', 'DevicesNotFoundError', 'audio-capture'].includes(codigo)) return 'audio-capture'
  if (['NotReadableError', 'TrackStartError', 'AbortError'].includes(codigo)) return 'microfono-ocupado'
  if (['service-not-allowed', 'network', 'no-speech', 'aborted'].includes(codigo)) return codigo

  return 'microfono-no-disponible'
}
