# SPEC 044 — Resumen de Inicio calculado en el backend

Sustituye, para Inicio, la «Una sola llamada para Inicio» de la SPEC 041 y el «Pendiente» de la SPEC 042. Donde difieran, prevalece esta.

## Problema

Inicio descargaba `GET /api/v1/inicio/datos` (medido el 23/11/2026: 853 KB, ≈2,3 s) para calcular **en el navegador** los 8 indicadores, el banner de totales, la tabla «Situación por centro» y los avisos de atención. Ese cálculo exigía hidratar nueve colecciones en `db` y ejecutar ≈1.000 líneas de reglas antes de pintar la primera cifra. La experiencia de la primera carga era mala y la descarga era innecesaria para lo que la pantalla muestra.

## Decisión

Las reglas se calculan en el backend y Inicio recibe solo el resultado.

- `GET /api/v1/inicio/resumen` (`ResumenInicioResponse`) devuelve:
  - `filas[]`: una por centro vigente, con la forma de `resumenPorCentro` (`services/situacion.js`): `car{id,nombre,inmueble{condicion}}`, `necesidades{cantidad,importeConocido,sinValorar,infraestructura,atendidas}`, `estadoGeneral`, `ambientesCriticos`, `modulosCriticos`, `elementosCriticosInmueble`, `elementosCriticos`, `novedadesAbiertas`, `bienesActivos`, `bienesMalos`, `registrosActivos`, `verificados`, `controles{vencidos,porVencer,extintoresFaltantes}`, `fumigacion`, `vehiculos{…}`, `servicios{pendientes,interrupciones,sinInfo,renovaciones,recurrentes}`.
  - `jerarquia{centros,modulos,ambientes}` y `recorridos{total,noComparables}` (indicadores 1 y 8).
  - `avisos{ahora[],proximos[]}`: avisos **sin texto**: `{id, categoria, carId, horizonte, dias?, tono, clase, tipoAviso?, datos}`. `clase` identifica la regla y `datos` trae lo necesario para redactarla; solo se incluyen los valores presentes.
- El backend decide **qué** avisos existen, su horizonte, tono, orden y los valores; la SPA conserva **cómo se presentan**: totales (`services/totalesInicio.js`), chips y enlaces (`InicioPage.vue`) y el texto, los destinos y la acción de cada aviso (`services/avisosResumen.js`, con los helpers exportados de `services/atencion.js`). Así Java no porta formatos (`plural`, `soles`, `fecha`) ni etiquetas de catálogo.
- El cálculo es Java puro, sin Spring ni base de datos (`inicio/calculo/`, `CalculoInicio.calcular(datos, elementosBase, hoy)`). `ResumenInicio` reúne las colecciones con los servicios que ya existen (cada uno con su acceso y ámbito, vía `InicioService`) en una sola transacción de solo lectura y no las serializa. Las entradas son, por tanto, las mismas que recibía el navegador.
- Inicio ya no carga colecciones: pide `catalogos` (etiquetas) y el resumen. Las acciones de «Atención requerida» siguen asegurando los grupos que su diálogo necesita antes de abrirse (SPEC 041).
- El resumen se conserva por sesión (`services/resumenInicio.js`): al volver a Inicio se muestra de inmediato y solo se vuelve a pedir si hubo escrituras (`despuesDeEscribir`), también con Inicio abierto. La campana cuenta `avisos.ahora` del último resumen; sigue sin precargarlo (SPEC 042).
- Se retira `GET /inicio/datos` y el grupo compuesto `inicio` de `cargaDatos.js`. `InicioServiceImpl` y `InicioDatosResponse` quedan como entrada interna del cálculo. Los resúmenes parciales `/resumen-jerarquia` y `/resumen-vehiculos` (SPEC 042) quedan sin uso en la SPA; la prueba de equivalencia que los cubre se conserva hasta decidir su retiro.

## Reglas portadas (espejo de la SPA)

Umbrales en `ReglasInicio` (30 días «por vencer», 60 de «próximos» y de renovación, ≥3 interrupciones en 12 meses). La fecha es `shared.model.Hoy`; el año de revisión es el siguiente y el de servicios, el actual.

- **Universos distintos, a propósito**: las necesidades recorren todos los bienes activos de los centros vigentes, sin exigir ambiente ni módulo vigente; los conteos de bienes y de verificados usan los ambientes vigentes del centro; `vehiculosEnAmbito` incluye centros anulados (indicador 8 y avisos de recorridos), pero el aviso de vehículos solo los de centros vigentes.
- **Eventos**: `baja` y `verificacion` se derivan de los eventos vigentes que no son novedades; la carga inicial cuenta como verificación pero no como hecho registrado. La atención de un evento es su sola presencia.
- Las fechas se comparan como texto ISO; `restarMeses` acota el día al fin de mes (`LocalDate.minusMonths`).
- **Nulos**: donde la SPA fallaba por una referencia ausente (`inmueble`, ambiente o centro inexistente, `bienAnteriorId` desconocido), el cálculo omite el elemento o deja el valor nulo, sin lanzar.
- **Diferencia deliberada**: el aviso «Problema recurrente» muestra siempre el nombre del tipo de servicio; antes mostraba el código crudo (`luz`) cuando el servicio no tenía otros avisos.

## Riesgos

- Las cifras podrían divergir de las pantallas de detalle: se controla con la prueba de equivalencia (abajo) y con el contraste manual sobre la BD real.
- El coste del servidor sigue dominado por las consultas (`bienes/datos` ≈1,2 s, `servicios` ≈0,5 s, N+1 en inventario y servicios, `Acceso.concesiones()` invocado ≈8 veces). Esta SPEC elimina la transferencia, la hidratación y el cálculo en el navegador; la reducción del tiempo de servidor se mide y trata aparte.
- `application-dev.yml` contiene credenciales; no se versiona con estos cambios.

## Validación

- `EquivalenciaInicioTest` (backend) calcula el resumen de los casos de `src/test/resources/resumen-inicio-casos.json` y escribe `target/resumen-inicio-resultados.json`. `frontend/e2e/equivalencia-inicio.cjs` carga los mismos casos con los aplicadores REST de la SPA, calcula con las reglas anteriores (`resumenPorCentro`, `avisosDeAtencion`) y compara fila a fila y aviso a aviso con el resultado de Java una vez redactado por `avisoDesdeCrudo`.
- Orden: `mvn -Dtest=EquivalenciaInicioTest test` en `backend/` y luego `node e2e/equivalencia-inicio.cjs` en `frontend/` con Playwright disponible. No valida Oracle ni rendimiento.
- `frontend/e2e/intranet-carga.cjs` simula `inicio/resumen` en lugar de `inicio/datos` y comprueba que Inicio no pide colecciones.
