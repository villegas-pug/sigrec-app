# SPEC 007 — Dictado por voz en campos de texto libre

- Estado: implementada. Prototipo en memoria con datos ficticios.
- Objetivo: agilizar el registro desde dispositivos móviles dictando en lugar de escribir.
- Motor: Web Speech API del navegador, en `es-PE`. Sin backend ni dependencias nuevas.

## Contrato

- El dictado es una mejora progresiva. Si el navegador no ofrece `SpeechRecognition` o el contexto no es seguro (`window.isSecureContext`), el botón no aparece y el campo funciona como antes.
- Ninguna validación ni flujo depende del dictado. El texto dictado se puede corregir con el teclado.
- Cada pulsación es un tramo de dictado (`continuous = false`). El texto se añade al final del ya escrito, con espacio y mayúscula inicial si empieza una oración, y se ve en vivo mientras se habla.
- Una sola sesión activa: iniciar en otro campo detiene la anterior. Al cerrar el diálogo o cambiar de página se libera el micrófono.
- Si no hay texto final (error o cancelación) el campo recupera su valor previo.
- El texto dictado cuenta como modificación: la protección de borradores (SPEC 005) sigue funcionando.

## Privacidad

- El audio lo procesa el servicio de voz del navegador (Google en Chrome, Apple en Safari). SIGREC no graba ni guarda audio.
- En el primer uso de la sesión se avisa: «El audio se procesa en el servicio de voz del navegador. No dicte datos personales de residentes.»
- ⚠️ Por validar: para producción, conformidad con protección de datos personales.

## Campos incluidos

Detalles, observaciones, deterioro, motivos, sustentos, notas, títulos de novedad, incidente y foto, intervención, características, litigios, contratación, propósito del itinerario.

## Campos excluidos

- Identificadores y códigos validados (rótulo, código patrimonial, serie, placa, nombres únicos): un error de transcripción rompe la unicidad.
- Números, fechas, horas y teléfonos.
- Direcciones que van al geocodificador.
- Nombres de personas (chofer, arrendador, contacto).
- Búsquedas.

## Entorno

- Requiere HTTPS (o `localhost`), conexión a internet en Chrome para Android y permiso de micrófono.
- Pruebas desde un teléfono: reenvío de puerto por USB (`chrome://inspect`) o `devServer.https` de Quasar con certificado autofirmado. La configuración del proyecto no se modifica.

## Fuera de alcance

Rellenar formularios por voz con comandos, reconocimiento sin conexión (Whisper) y puntuación por voz.

## Implementación

`src/composables/useDictado.js`, `src/components/common/BotonDictado.vue` (slot `#append` de `q-input`) y estilos `.sg-dictado*` en `src/css/app.scss`.

## Verificación pendiente (requiere autorización para `quasar dev`)

1. En un navegador sin soporte el botón no aparece y los campos funcionan igual.
2. El primer uso muestra el aviso y pide el permiso de micrófono.
3. El texto parcial se ve en vivo y el final se añade tras el existente.
4. Iniciar otro campo detiene el anterior; cerrar el diálogo libera el micrófono.
5. Permiso denegado, sin voz o sin red: mensaje en español y el campo conserva su texto.
6. Con texto dictado, cancelar el diálogo pide confirmación de descarte.
7. A 390 px el botón no tapa el texto y es fácil de pulsar.
