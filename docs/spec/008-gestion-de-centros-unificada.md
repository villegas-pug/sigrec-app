# SPEC 008 — Gestión de centros unificada (explorador jerárquico)

- **Estado:** implementado en el prototipo. La verificación en navegador está pendiente de autorización.
- **Fecha:** 2026-11-03
- **Origen:** propuesta de centralizar los submenús de «Gestión de centros» en una sola pantalla, con detalle y acciones por nivel y sin scroll de página.
- **Complementa:** SPEC 002 (jerarquía), SPEC 003 (mantenedores) y SPEC 005 (navegación). Donde difieran, prevalece esta SPEC.

## 0. Contrato

- SIGREC sigue siendo un **prototipo con datos ficticios**; el estado vive en memoria y los permisos por perfil son controles de interfaz.
- Esta SPEC **reemplaza** el punto «Rediseño de menús» de la SPEC 005 §5 únicamente para «Gestión de centros», y la ubicación del alta breve de la SPEC 005 L02 (ahora es un modal).
- No cambian las reglas de negocio salvo la de componentes (§3).

## 1. Decisiones confirmadas

| # | Decisión |
| --- | --- |
| 1 | «Gestión de centros» es **una sola entrada de menú**, sin submenú. |
| 2 | El registro de bienes y componentes se abre en un **modal** sobre el detalle seleccionado. |
| 3 | Los componentes tienen **un solo nivel**: un componente no admite componentes. |
| 4 | Los enlaces de otros módulos abren el explorador en el nodo exacto. Las URL antiguas siguen funcionando como alias. |

## 2. Pantalla

- Las fichas de centro, ambiente, bien y componente muestran un resumen visual con datos principales y secciones de detalle adaptables. Se conservan valores, notas, avisos y acciones existentes.

- **Árbol** (izquierda): Centro › Ambiente › Bien › Componente. Todos los niveles se pueden seleccionar. Filtros: búsqueda, situación del bien y «Mostrar inactivos».
- **Detalle** (derecha): cabecera con estado y acciones, y pestañas con scroll propio.
- En escritorio la página ocupa el alto visible y cada columna se desplaza por separado. En móvil y tableta se muestra la lista o el detalle a pantalla completa, con «Volver al árbol».

| Nivel | Pestañas | Acciones |
| --- | --- | --- |
| Centro | Ficha, Fotografías, Ambientes | Registrar ambiente, Actualizar ficha; ⋮ Anular/Reactivar. «Registrar centro» está en la cabecera de la página. |
| Ambiente | Ficha, Fotografías, Bienes, Novedades, Intervenciones | **Registrar bien**, Actualizar ambiente; ⋮ Anular/Reactivar. «Registrar novedad» e «Registrar intervención» están en su pestaña. |
| Bien | Ficha, Componentes, Fotografías, Antecedentes | Las de la ficha del bien; **Registrar componente** en la pestaña Componentes. |
| Componente | Ficha, Forma parte de, Fotografías, Antecedentes | Las de la ficha del bien; «Quitar asociación». Sin «Registrar componente». |

### Modal de registro

- «Registrar bien» (ambiente), «Registrar componente» (bien) y los enlaces directos abren el formulario de alta breve en un modal con el inventario previo y su contraste.
- El contexto (centro y ambiente) es el nodo seleccionado; ya no hay selectores de contexto.
- «Guardar y registrar otro» conserva el ambiente. «Guardar» cierra el modal y selecciona el bien creado.
- Los bienes registrados en la sesión se marcan en el árbol con el chip «Nuevo» (sustituye a la tabla «Registrados en esta sesión»).
- Con datos escritos, cerrar el modal o salir de la página pide «Seguir editando / Descartar» (`useBorrador › confirmarDescarte`). La cabecera y las acciones permanecen fijas.

## 3. Regla de componentes

| Regla | Implementación |
| --- | --- |
| El padre de un componente no puede ser componente, y un bien con componentes no puede pasar a serlo. | `services/acciones.js › puedeAsociar` |
| Registrar un bien como componente de otro componente se rechaza. | `services/acciones.js › registrarBien` |
| La interfaz solo ofrece como padre a bienes activos del mismo ambiente que no son componentes. | `RegistroBienPanel`, `BienEdicionDialog` |

Los datos de demostración ya tienen un solo nivel; no requieren migración.

## 4. Rutas, accesos y enlaces profundos

- Ruta única `centros`. Alias que conservan la consulta: `/locales`, `/ambientes`, `/bienes` y `/bienes/registro` (este último abre el modal de registro).
- Parámetros: `?car=`, `?ambiente=`, `?bien=`, `?novedad=` (abre la pestaña Novedades y resalta la novedad), `?registrar=1` con `?ambiente=` o `?asociar=`.
- Un id inexistente o fuera del ámbito muestra «Registro no disponible» y no se elige otro registro (SPEC 005 L01).
- Accesos: el perfil `car` conserva `centros`; `verifica` pasa de `bienes` a `centros`. Las acciones siguen gobernadas por `puedeHacer`.

## 5. ⚠️ Por validar con el jefe de proyecto

- **Verificación física** ve ahora las fichas de centro y ambiente, solo en lectura, porque comparten la pantalla con la ficha del bien.
- **Un solo nivel de componentes.** Casos como camarote › cama › colchón requerirían modelarse como bienes del ambiente.

## 6. Verificación pendiente (requiere autorización para ejecutar `quasar dev`)

1. El menú muestra solo «Gestión de centros»; `/ambientes?car=AMA&ambiente=…`, `/bienes?bien=…`, `/bienes/registro?ambiente=…` y `/locales` abren el nodo o modo correctos.
2. Centro, ambiente, bien y componente muestran sus pestañas y acciones; a 1280×720 y 1920×1080 no hay scroll de página.
3. «Registrar bien»: no cambia la URL; «Guardar y registrar otro» conserva el ambiente y el árbol muestra «Nuevo»; «Guardar» selecciona el bien.
4. Con datos escritos, Cerrar o cambiar de nodo pide confirmación.
5. «Registrar componente» precarga el bien padre. Un componente no la ofrece ni se ofrece como padre.
6. Los enlaces de Inicio (novedad), Necesidades e Incidencias abren el nodo exacto.
7. Perfiles: `verifica` no ve acciones de mantenimiento; `chofer` no ve la entrada.
8. Móvil 390 px: lista → detalle → «Volver al árbol», sin desbordamiento horizontal.
9. SPEC 001 §8 sin cambios (9 necesidades, S/ 11 090).
