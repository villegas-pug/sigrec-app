// Elección del motor de dictado (SPEC 007): navegador si sirve y, si no, Whisper en el dispositivo.
import { crear as crearNavegador, motorNavegadorSoportado } from './motorNavegador'
import { motorWhisperSoportado } from './motorWhisper'

// iPadOS puede identificarse como Mac; el multitáctil permite reconocer esa señal sin solicitar permisos.
const dispositivoAdmitido = () => {
  if (typeof navigator === 'undefined') return false
  const agente = navigator.userAgent || ''
  if (/CrOS/i.test(agente)) return false
  return /Android|iPhone|iPad|iPod/i.test(agente) ||
    (/Macintosh/i.test(agente) && navigator.maxTouchPoints > 1)
}

// Se conserva la comprobación de contexto seguro y soporte de motor para ambos puntos de uso.
export const dictadoDisponible = typeof window !== 'undefined' && window.isSecureContext && dispositivoAdmitido() && (motorNavegadorSoportado || motorWhisperSoportado)

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
// El motor del navegador se crea síncronamente para conservar el gesto del usuario en móviles.
export function crearMotor (nombre) {
  if (nombre === 'whisper') return import('./motorWhisper').then(({ crear }) => crear())
  return crearNavegador()
}
