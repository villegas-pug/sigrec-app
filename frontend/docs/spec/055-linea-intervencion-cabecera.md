# SPEC 055 — Filtro «Línea de intervención» en la cabecera

Complementa la SPEC 052 (filtros de cabecera) y la 045 (unidades orgánicas).

## Decisiones

- Nuevo endpoint `GET /api/v1/centros/unidades-organicas/{id}`: devuelve `UnidadOrganicaResponse` (`id`, `nombre`, `codigo`, `direccion`, `elegible`).
  - `id < 1` → 400; id inexistente → 404 «Registro no disponible.».
  - Es lectura de referencia: no exige permiso de acción (como `/centros/buscar` y `/catalogos`), pero sí identidad (`X-Usuario-Id`).
- La barra de filtros añade, **antes** de Centro, un select de solo lectura «Línea de intervención» que muestra la unidad con `ID = 73` (`LINEA_INTERVENCION_ID` en `composables/useFiltrosCabecera.js`).
- El label «Centro» pasa a «Centro de Acogida Residencial» (solo el texto visible; el estado y los parámetros no cambian).
- El filtro es informativo: no modifica el estado de filtros, la URL ni las consultas.
- La unidad se pide una vez por sesión (`composables/useLineaIntervencion.js`) y se reinicia con `reiniciarCargaDatos`. Si falla, el campo muestra «No disponible» sin bloquear la pantalla.
- Layout de la segunda fila: Línea (3fr), Centro (3fr), Año (1fr), Mes (1fr); una columna en pantallas estrechas.

## Criterios de aceptación

1. `GET /centros/unidades-organicas/73` responde 200 con el nombre de la unidad; `0` responde 400 y un id inexistente 404.
2. La cabecera muestra «Línea de intervención» (no editable) antes de «Centro de Acogida Residencial».
3. Cambiar de pantalla o de filtros no vuelve a pedir la unidad en la misma sesión.

## Riesgos

- El id 73 está fijo en el cliente y debe existir en `TGUNIDADORGANICA` de cada entorno.
- La unidad se muestra aunque no esté vigente (`elegible = false`).

## Validación

- Revisión estática y `git diff --check`; test `consultaUnidadPorIdParaLaCabecera` en `Stage1SecurityTest`.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.
