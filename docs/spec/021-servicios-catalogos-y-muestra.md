# SPEC 021 — Servicios básicos: catálogos ampliados y servicio de muestra

- **Fecha:** 2026-11-11
- **Estado:** Especificado antes de implementar; validación visual y funcional pendiente de autorización.
- **Complementa:** RF-13, RF-14 y RF-15 (servicios básicos y pagos).

## Contract

- Datos de demostración: un solo servicio registrado de muestra, `SRV-AMA-LUZ`, con sus períodos y hechos de 2026.
- Combo Servicio: Luz, Agua, Internet, Cable, Gas natural, Gas balón, Extintores, Fumigación y Arbitrios. Gas natural (`gas_natural`) sustituye al genérico `gas`, sin registros que lo usen.
- Combo Periodicidad: Mensual, Bimestral, Trimestral, Cuatrimestral, Semestral y Anual; todas dividen el año en meses enteros y caben en la grilla anual.
- Etiquetas de período: «Ene», «Ene–Feb», «1.er trimestre», «1.er cuatrimestre», «1.er semestre» y «Anual». Mensual y trimestral conservan sus textos actuales.

## Acceptance

- Registro de servicios con cada tipo y cada periodicidad; grilla con 12, 6, 4, 3, 2 y 1 celdas que ocupan el año completo.
- Informe de pago y corrección en períodos bimestrales y anuales con textos de hechos legibles.
- Centros sin servicios muestran las filas «Sin servicio registrado · Registrar»; Inicio y alertas sin errores con un solo servicio.
- Etiquetas largas sin desborde en tabla y tarjetas móviles.

## Validation

- Revisión estática: catálogos y `PERIODOS_POR_ANIO` con las seis periodicidades; `nombrePeriodo` conserva los textos mensual y trimestral; `servicios.json` con un único registro válido. Las celdas ya envuelven texto (columna flexible), por lo que no se cambió CSS.
- No se ejecutaron pruebas, builds, servidores ni validación visual o funcional; quedan pendientes de autorización.
