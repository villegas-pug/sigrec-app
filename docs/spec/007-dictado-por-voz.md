# SPEC 007 — Dictado por voz en todo el proyecto y en todo dispositivo

- Estado: implementada, pendiente de verificar en navegador. Prototipo en memoria con datos ficticios.
- Objetivo: agilizar el registro desde dispositivos móviles dictando en lugar de escribir.
- Dependencia nueva: `@huggingface/transformers@4.3.1` (solo se carga dentro de un Web Worker).

## Alcance

- **Con dictado:** todo `q-input` (texto, área de texto, número, fecha, mes, hora, teléfono) y todo `q-select`, además de los campos internos de `CampoAdquisicion`, el buscador de lugares del mapa y la selección de centro, ambiente y bien.
- **Sin dictado:** controles de un solo toque (`q-checkbox`, `q-toggle`, `q-option-group`, `CondicionSelector`, `q-file`) y botones.

## Motores

| Motor | Cuándo se usa | Características |
| --- | --- | --- |
| Navegador (Web Speech API, `es-PE`) | Si existe, hay conexión, no es iOS instalado en pantalla de inicio y el campo no es `local` | Texto parcial en vivo. El audio lo procesa el servicio de voz del navegador. |
| Whisper en el dispositivo (`whisper-tiny`, transformers.js, WASM) | En los demás casos | Sin conexión tras la primera descarga (~40 MB, en caché). El audio no sale del dispositivo. Sin texto parcial; límite de 30 s por tramo. |

- Si el servicio de voz del navegador falla (`network`, `service-not-allowed`), el resto de la sesión usa Whisper.
- Whisper se carga bajo demanda; antes de la primera descarga se pide confirmación.
- Campos con datos personales (chofer, arrendador, contacto) llevan `local`: siempre usan Whisper.
- Una sola sesión de dictado a la vez; al cerrar el diálogo o cambiar de página se libera el micrófono.

## Interpretación por tipo de campo

- `texto`: se añade al final de lo escrito, con espacio y mayúscula inicial si empieza una oración.
- `numero`, `anio`: cifras o palabras («tres coma cinco», «dos mil diecinueve»). Respeta si el valor del campo es texto o número.
- `fecha`, `mes`: «15 de marzo de 2024», «quince de marzo» (año de la fecha de corte), «hoy», «ayer», «anteayer», «15/03/2024», «marzo de 2019».
- `hora`: «tres y media de la tarde», «nueve y cuarto», «diez menos cuarto», «mediodía», «14:20».
- `telefono`, `codigo`: dígitos dictados en palabras, «guion», mayúsculas (rótulo, placa, serie, código patrimonial, suministro).
- `opcion` (listas): se elige la opción más parecida a lo dictado (exacta, que empiece, que contenga, palabras en común). Si no hay una clara, no se elige ninguna. En selección múltiple se añade el bien dictado a los elegidos.
- Los tipos distintos de texto **reemplazan** el valor, muestran «Se entendió «…» → valor» con la acción **Deshacer**, y si no se entiende nada el campo no cambia.

## Privacidad

- SIGREC no graba ni guarda audio.
- Motor del navegador: aviso en el primer uso («El audio se procesa en el servicio de voz del navegador. No dicte datos personales de residentes»).
- Whisper: el audio se procesa en el dispositivo; el modelo se descarga del CDN de Hugging Face (coordinadas externas, como OSRM y Photon en la SPEC 006).
- ⚠️ Por validar: conformidad con protección de datos personales para producción.

## Entorno

- El micrófono requiere HTTPS (o `localhost`) con cualquier motor. En un contexto inseguro o sin `getUserMedia` el botón no aparece y el campo funciona como antes.
- Pruebas desde un teléfono: reenvío de puerto por USB (`chrome://inspect`) o `devServer.https` de Quasar con certificado autofirmado. La configuración del proyecto no se modifica.
- ⚠️ Por validar: calidad de `whisper-tiny` en español de Perú. Alternativa: `whisper-base` (~80 MB) cambiando `MODELO_WHISPER` en `whisper.worker.js`.

## Fuera de alcance

Comandos de voz que rellenen varios campos a la vez y puntuación hablada.

## Implementación

`src/services/voz/` (motores y elección), `src/utils/interpretacionVoz.js` (funciones puras), `src/composables/useDictado.js`, `src/components/common/BotonDictado.vue` (slot `#append`) y estilos `.sg-dictado*` en `src/css/app.scss`.

## Verificación pendiente (requiere autorización para `quasar dev`)

1. Chrome: usa el motor del navegador. Firefox o sin conexión: pide confirmación de descarga, muestra el progreso y transcribe con Whisper.
2. Fecha, hora, número y opción dictados se aplican, muestran «Deshacer» y, si no se entienden, no cambian el campo.
3. Dictar en un `q-select` elige la opción sin abrir la lista.
4. En el buscador del mapa, el texto dictado lanza las sugerencias.
5. Los campos `local` usan Whisper incluso en Chrome.
6. Texto parcial en vivo, sesión única, mensajes de error, confirmación de descarte con texto dictado y uso cómodo a 390 px.
