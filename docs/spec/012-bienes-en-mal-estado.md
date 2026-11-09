# SPEC 012 — Identificar los bienes en mal estado desde Inicio

- **Fecha:** 2026-11-09
- **Estado:** Implementado tras especificar el contrato. Validación funcional pendiente de autorización.

## Summary

El indicador «Bienes en mal estado» abre Inventario con `?vista=mal_estado`, en una tercera pestaña que lista los registros afectados sin interponer el resumen. Se conservan las otras vistas y los cambios locales de navegación.

## Contract

- Solo bienes activos en condición `malo` o `inservible`, de ambientes vigentes y centros vigentes dentro del ámbito del perfil y del filtro de centro. Los componentes activos cuentan incluso si el principal está de baja.
- `bienesEnMalEstado({ carIds })` devuelve `{ bien, car, ambiente, principal }`, ordenados por centro, ambiente, nombre e identificador. `carIds` procede del ámbito autorizado.
- Cabecera: unidades afectadas sobre unidades activas del mismo ámbito y número de registros. Cantidad por registro: `cantidad ?? 1`.
- Tabla en escritorio y tarjetas en móvil: nombre, identificador, código patrimonial (o «Sin código patrimonial»), centro, ambiente, cantidad, condición textual, deterioro (o «Sin deterioro informado») y principal si es componente.
- «Ver ficha» abre `centros?bien=<id>` solo con permiso. El historial conserva pestaña, centro y registro resaltado al volver. «Volver al resumen» mantiene el centro.
- Exportación CSV de esta vista: únicamente registros visibles y sus datos de identificación, en el mismo orden.
- Sin coincidencias: «No hay bienes activos en mal estado en este ámbito».
- Sin backend, migraciones ni cambios en permisos. No se alteran las reglas de las otras vistas.

## Acceptance

- Inicio abre directamente 6 unidades en 6 registros sobre 65 unidades activas con los datos iniciales: AMA-D1-C02-S, AMA-D1-M01-S2, AMA-D2-C04-I, HOR-COC-RF01, HOR-COC-EX01 y HOR-COC-MS01.
- Filtrar centro actualiza lista, numerador, denominador y CSV. No aparecen registros ajenos al ámbito.
- Cubrir cantidades mayores a uno, componentes con principal de baja, campos opcionales ausentes, estados excluidos, ambientes anulados y lista vacía.
- Revisar ficha y regreso, acceso directo, recarga, Atrás/Adelante, teclado y móvil. Si cambia la condición del registro consultado, desaparece de la lista sin mantener una fila obsoleta.
- Se permite revisión estática; pruebas, builds, servidores y validación funcional requieren autorización explícita.

## Validation

- Revisión estática: sintaxis de los tres componentes Vue involucrados y del servicio válida mediante parsers, sin compilar ni ejecutar la aplicación. `git diff --check` sin errores.
- Validación funcional, interacción en navegador y exportación real pendientes de autorización; no se ejecutaron pruebas, builds ni servidores.
