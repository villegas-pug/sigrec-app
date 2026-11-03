// Elección del motor de dictado (SPEC 007): navegador si sirve y, si no, Whisper en el dispositivo.
import { crear as crearNavegador, motorNavegadorSoportado } from './motorNavegador'
import { motorWhisperSoportado } from './motorWhisper'

// El micrófono solo está disponible en contextos seguros (HTTPS o localhost), con cualquier motor.
export const dictadoDisponible = typeof window !== 'undefined' && window.isSecureContext && (motorNavegadorSoportado || motorWhisperSoportado)

export const whisperDisponible = motorWhisperSoportado

// Tras un fallo del servicio de voz del navegador se usa Whisper durante el resto de la sesión.
let navegadorFallo = false
export const marcarFalloNavegador = () => { if (motorWhisperSoportado) navegadorFallo = true }

// Safari instalado en la pantalla de inicio (iOS) tiene un reconocimiento poco fiable.
const iosInstalado = () => typeof navigator !== 'undefined' && navigator.standalone === true

export function nombreDeMotor ({ local = false } = {}) {
  const navegadorUtil = motorNavegadorSoportado && !local && !navegadorFallo && navigator.onLine && !iosInstalado()
  if (navegadorUtil || !motorWhisperSoportado) return 'navegador'
  return 'whisper'
}

// Whisper se carga bajo demanda para que transformers.js no entre en el paquete inicial.
export async function crearMotor (nombre) {
  if (nombre === 'whisper') return (await import('./motorWhisper')).crear()
  return crearNavegador()
}
