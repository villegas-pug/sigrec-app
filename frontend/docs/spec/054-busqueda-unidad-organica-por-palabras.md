# SPEC 054 — Búsqueda de unidades orgánicas por palabras y filtro por unidad padre

Complementa las SPEC 045, 047 y 050. Donde difieran, prevalece esta.

## Problema

`GET /api/v1/centros/unidades-organicas` buscaba la **frase completa contigua** (`INSTR`). Un nombre como
«UNIDAD DE SERVICIOS DE PROTECCIÓN DE NIÑAS, NIÑOS Y ADOLESCENTES» existente en `UORNOMBRE` no se encontraba si la
frase escrita difería en comas, espacios dobles o NBSP.

## Decisiones

- El término se divide en palabras: cualquier carácter que no sea letra o dígito separa (espacios, NBSP, comas,
  puntos, paréntesis…). Una unidad coincide si **todas** las palabras aparecen en `UORNOMBRE`, en cualquier orden.
- Sin distinción de mayúsculas ni tildes (`UPPER` + `COMPOSE` + `TRANSLATE`, como antes). La Ñ sigue siendo una letra distinta.
- Los extremos se recortan (`strip`); la UI ya recorta y no cambia mayúsculas. El mínimo (3) y el máximo (240) se validan sobre el texto recortado.
- Un término sin letras ni dígitos (p. ej. «...») devuelve una página vacía.
- Nuevo parámetro opcional `padre` (id numérico ≥ 1): filtra por `UOR_UNIDAD_PADRE = :padre` (dependientes directos). Sin él, no se filtra.
- La respuesta de cada coincidencia incluye `padre` (valor de `UOR_UNIDAD_PADRE`, nulo si no depende de otra).
- `UnidadOrganicaSelector.vue` acepta la prop `padre` y la envía solo si está definida.

## Criterios de aceptación

1. `q=unidad de servicios de protección de niñas, niños y adolescentes` (con cualquier combinación de mayúsculas y espacios en los extremos) devuelve la unidad.
2. `q=protección niñas` la devuelve (por palabras).
3. `padre=<id>` limita los resultados a las unidades cuyo `UOR_UNIDAD_PADRE` es ese id; `padre=0` responde 400.
4. Cada ítem incluye `padre`.
5. Sin `padre` el comportamiento previo (centro, paginación de 5, elegibilidad) se mantiene.

## Riesgos

- El tipo de `UOR_UNIDAD_PADRE` no está versionado (tabla externa); se asume numérico. Confirmarlo en Oracle.
- Una unidad con `UORESTADO <> 1` o `UORELIMINADO <> 0` nunca aparece, sea cual sea el término.

## Validación

- Revisión estática y `git diff --check`; pruebas del tokenizador (`TextoOracleTest`) y del controller (`Stage1SecurityTest`).
- Prueba manual contra Oracle de los criterios 1–3. No ejecutar pruebas, builds ni servidores sin autorización explícita.
