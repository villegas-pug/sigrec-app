# SPEC 051 — Elementos de infraestructura por ficha

Sustituye las listas obligatorias de las SPEC 010 y 022. Cada centro, módulo y ambiente administra sus propios elementos; las fichas nuevas comienzan sin elementos.

## Comportamiento

- El usuario agrega, edita y elimina elementos desde la ficha. Cada elemento tiene nombre, icono Material y condición opcional. El selector ofrece un icono predeterminado.
- Los nombres no se repiten dentro de la misma ficha. La clave de un elemento es estable aunque cambie su nombre o icono; la condición se conserva al editarlo.
- Los cambios se guardan junto con la ficha. La eliminación es lógica y conserva la trazabilidad.
- Los detalles, el resumen de inicio y los contadores consideran únicamente los elementos vigentes de cada ficha.

## Persistencia y compatibilidad

- `SGR_ELEMENTO` almacena el icono y permite elementos propios de ambientes, incluso sin condición. Los contratos de los tres niveles transmiten todos los elementos de la ficha.
- Una migración convierte en elementos editables las evaluaciones base existentes y conserva sus condiciones y los elementos adicionales. No crea filas para elementos base que no fueron evaluados.
- La migración se prepara para aplicarse antes del despliegue; su ejecución requiere autorización explícita.

## Criterios de aceptación

1. En los tres niveles es posible agregar, editar y retirar elementos, seleccionar su icono y guardar sin condición.
2. Al cambiar nombre o icono se conserva la condición; se rechazan nombres repetidos en una misma ficha.
3. Las evaluaciones previas y sus condiciones permanecen disponibles tras la migración.
4. Los contadores y resúmenes reflejan los elementos vigentes realmente guardados.
