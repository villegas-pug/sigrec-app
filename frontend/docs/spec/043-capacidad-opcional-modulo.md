# SPEC 043: capacidad opcional en módulos

## Contexto

La SPEC 020 define `capacidad` como un dato no obligatorio para módulos tipo `casa`, admite enteros desde cero y la oculta para módulos de uso común. El formulario Vue ya permite omitirla, pero el backend rechazaba casas con `capacidad: null` y sus DTO rechazaban el valor cero.

## Alcance

- Alinear las validaciones de alta y actualización de módulos en backend con la SPEC 020.
- Aceptar `capacidad` nula o un entero mayor o igual a cero para `casa`.
- Mantener `capacidad` nula para `comun`, independientemente de los datos recibidos.
- Mantener obligatorio el número de pisos (entero desde 1), el nombre, el tipo y la condición.
- No modificar el esquema de Oracle ni realizar migraciones.

## Criterios de aceptación

1. Crear o actualizar un módulo `casa` sin capacidad no devuelve error de validación.
2. Crear o actualizar un módulo `casa` con capacidad cero es válido; los valores negativos y no enteros se rechazan.
3. Los módulos `comun` siguen guardándose con capacidad nula.
4. La interfaz mantiene capacidad opcional y la persistencia Oracle queda cubierta por E2E con los datos del diario recuperable.
