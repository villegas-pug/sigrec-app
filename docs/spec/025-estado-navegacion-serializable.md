# SPEC 025 — Estado de navegación serializable

## Problema

Durante la grabación del manual, el explorador lanzó `DataCloneError` al guardar su estado con `history.replaceState`. Sus campos incluyen arrays reactivos de Vue, cuyos proxies no admite la clonación del historial. El fallo interrumpe la actualización de la interfaz, incluso después de registrar un centro.

## Comportamiento requerido

Conservar filtros, selección y expansiones del explorador como datos JSON independientes de los proxies de Vue. Mantener el resto de `history.state`, la clave por pantalla y la restauración existente. No cambiar permisos, datos de negocio ni rutas.

## Implementación

Convertir los valores observados a una copia JSON antes de asignarlos a la entrada `sigrec`. El contrato del composable admite datos JSON: textos, números, booleanos, arrays y objetos de esos valores.

El recorrido posterior también reprodujo el mismo `DataCloneError` en `router/retorno.js`: reutilizar `origen.value` entrega un proxy al historial. Aplicar la misma copia JSON al origen calculado antes de escribir `sigrecOrigen`, preservando la función pura y el comportamiento de retorno.

## Verificación autorizada

Comprobación estática de sintaxis e inspección del diff. Repetir en la interfaz el registro de centro, módulo y ambiente durante la grabación, observando su selección y las notificaciones. No ejecutar builds ni suites de pruebas.

## Resultado observado

El 11/11/2026 se completaron en la interfaz los registros de centro, módulo y ambiente y sus posteriores acciones. También se siguió el recorrido IT-0240 desde la consulta del ámbito, se informó un rendimiento de 8 km/L en Vehículos y se volvió a Itinerarios conservando la selección: 20 km / 8 km/L = 2,5 L estimados, frente a 3 L declarados. La navegación dejó de reproducir el error de clonación en estos flujos. Pasaron `node --check` sobre ambos archivos y `git diff --check`. No se ejecutaron builds ni suites de pruebas.
