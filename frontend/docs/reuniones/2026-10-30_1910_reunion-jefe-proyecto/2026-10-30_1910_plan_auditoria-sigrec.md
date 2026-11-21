# SIGREC: diagnóstico ejecutivo y plan priorizado

**Base de revisión:** http://localhost:9000/#/ · 03/11/2026. Este documento sustituye el plan basado en la versión remota. Fuentes: comportamiento observado en local, [transcripción de trabajo](2026-10-30_1910_transcripcion_reunion-jefe-proyecto.md) de la reunión (audio fuente no versionado) y precisión posterior del usuario sobre inactivación de ambientes.

## 1. Diagnóstico ejecutivo

La principal fricción es la discontinuidad entre consultar un pendiente y actuar sobre él. Inicio pierde el registro de destino; Necesidades pierde filtros al regresar y obliga a buscar de nuevo dónde atender el caso. El alta de bienes y las fichas de ambiente todavía no materializan la captura rápida descrita en la reunión. Servicios carece de datos expresamente solicitados: contacto del proveedor y motivo del pendiente.

**Ya resuelto en la interfaz local de Incidencias:** Centro → Ambiente → Bien; herencia del centro al registrar incidente; condiciones mediante opciones únicas y alternativa por bien; fecha independiente de reposición; explicación de elegibilidad; selección individual de componentes trasladados; resumen de bien saliente y entrante; filtros de ambiente y necesidad; limpiar filtros y estados más claros. Reutilizar estos comportamientos. No volver a implementarlos como si siguieran pendientes. La fecha 30/10/2026 se explica allí como corte de demostración.

**Decisión expresa del usuario:** antes de inactivar un ambiente se deben reubicar o resolver sus bienes. No dar de baja bienes automáticamente ni borrar antecedentes. No se ejecutó una inactivación para comprobar la implementación actual de esa regla.

No se comprobó ningún defecto crítico. La autorización del servidor, persistencia de operaciones y efectos posteriores al guardado no se certifican mediante esta revisión de interfaz.

## 2. Hallazgos priorizados

**E:** error comprobado · **I:** inconsistencia o brecha funcional verificada · **R:** riesgo o control no verificado · **M:** mejora propuesta. Las brechas frente al audio no se presentan como botones averiados.

| ID | Severidad / tipo | Módulo, evidencia e impacto | Cambio requerido |
|---|---|---|---|
| L01 | Alto · E | Inicio: alerta de incendio abre la baja del camarote; alerta IT-0233 abre IT-0232; pendiente de Luz abre ficha de Internet. Se pierde el caso que motivó la navegación. | Enlaces al registro y período exactos, con selección y detalle correspondientes. |
| L02 | Alto · I | Registro de bienes: formulario extenso; adquisición exige mes; no presenta el precio referencial como dato central del alta. La reunión pide captura breve con año, condición y referencia económica (05:32–06:55). | Alta rápida contextual; datos adicionales desplegables; admitir año conocido sin inventar mes. |
| L03 | Alto · I | Ambientes: hay novedades e intervenciones, pero no galería propia; el alta no ofrece bloque ni ubicación libre. La reunión solicita galería por ambiente y ubicación por piso/bloque (01:25–04:30). | Ficha contextual con datos, fotos y bienes; bloque y ubicación opcionales, sin nivel adicional Local. |
| L04 | Alto · I | Servicios: ficha editable sin teléfono del proveedor; período pendiente sin motivo; estado Pagado sin fecha, importe o sustento. Contrasta con el historial y con lo solicitado (11:53–13:18). | Contacto del proveedor y detalle del período, manteniendo información desconocida y pago independiente del restablecimiento. |
| L05 | Alto · I | Necesidades: las filas llevan al bien, pero no permiten continuar directamente la atención o valoración. Incidencias ya ofrece «Siguiente paso». | Reutilizar acciones contextuales y mostrar el requisito pendiente según permisos. |
| L06 | Medio · E | Necesidades: filtrar Reposición → abrir silla AMA-D1-M01-S2 → Atrás devuelve Todas. | Conservar año, centro, tipo, selección y posición de retorno. |
| L07 | Medio · E | Alta de bienes: escribir un nombre → pulsar Inicio → regresar descarta el valor sin advertencia. No se guardó ningún registro. | Protección común para formularios modificados. |
| L08 | Medio · I | Necesidades: AMA-D1-C02-S tiene vida útil cumplida y daño, pero no aparece en Renovación por vida útil; se clasifica como reposición. La prioridad de clasificación no se explica. | Identificar el filtro como clasificación principal y explicar la precedencia vigente; mantener todos los motivos y un solo conteo por bien. |
| L09 | Medio · I | Tablas anchas en móvil: Ambientes, Precios, Vehículos, Itinerarios y Combustible. En tableta persiste en Vehículos e Itinerarios. Servicios e Incidencias tienen mejor adaptación. | Extender tarjetas o vistas compactas con acciones visibles; evitar desplazamiento horizontal de página. |
| L10 | Medio · I | Combustible: Consumo declarado para AMA-V01 deja Recorrido obligatorio vacío, sin mensaje específico ni siguiente paso. IT-0240 informa falta de rendimiento, pero no ofrece completarlo desde el caso. | Estados vacíos explicados y enlaces contextuales a ejecución o datos del vehículo. |
| L11 | Bajo · I | Reposición muestra «Dormitorio 1 (0 bienes)», aunque el inventario tiene 11 activos: el contador se refiere a elegibles. En otras pantallas persiste «1 bienes activos». | Etiquetar «bienes elegibles» y corregir plurales. |
| L12 | Alto · R | Fotografías declara conservación solo durante la sesión; permisos y reglas se presentan como provisionales. No son fallos de persistencia o acceso comprobados por guardado. | Mantener límites visibles en el prototipo y cerrar persistencia y autorización antes de uso operativo. |
| L13 | Alto · R / requisito aprobado | El usuario exige resolver los bienes antes de inactivar el ambiente. Se inspeccionó el menú Anular ambiente, sin ejecutar la operación. | Aplicar el bloqueo y la resolución contextual; verificar también el control de persistencia cuando se autoricen pruebas de escritura. |

## 3. Plan de implementación y aceptación

### P0 — Contrato funcional antes de editar

- Actualizar la especificación y criterios existentes con L01–L13, los comportamientos ya resueltos y la regla expresa de inactivación.
- Mantener Centro → Ambiente → Bien; reservar «componentes asociados» para piezas de otro bien y usar «bienes del ambiente» para su inventario directo.
- Conservar reglas y permisos vigentes. Las tablas oficiales de vida útil, indicadores gerenciales concretos, integración SGD y gestión de personal no quedan aprobados por los ejemplos del audio.

**Aceptación:** especificación trazable por ID de hallazgo; ninguna modificación mezcla una propuesta nueva con un acuerdo ya confirmado.

### P1 — Navegación y conservación de contexto: L01, L06, L07

- Extender enlaces y estado de navegación con el identificador del hecho, servicio/período o itinerario. Reutilizar `car`, `ambiente`, `bien` y `vehiculo`; admitir parámetros opcionales para los destinos que hoy faltan.
- Guardar filtros de Necesidades en el estado de navegación o URL; restaurarlos al volver desde fichas y catálogo. Mantener rutas existentes compatibles.
- Para recursos inexistentes o fuera del ámbito, mostrar «Registro no disponible» y retorno seguro; evitar seleccionar silenciosamente otro registro.
- Incorporar protección de formulario modificado: seguir editando o descartar. Continuar editando conserva los valores.

**Aceptación:** las tres alertas L01 abren su caso exacto; volver de la silla conserva Reposición; salir del alta exige decidir sobre el borrador. No se amplían permisos mediante parámetros de URL.

### P2 — Centro, ambiente y captura rápida: L02, L03, L13

- Desde el centro, ofrecer datos generales/infraestructura, galería y ambientes. Desde el ambiente, ofrecer datos, galería y bienes; reutilizar la misma disposición y acciones.
- Añadir bloque y ubicación como atributos opcionales. Mantener piso y datos existentes; no crear otra entidad Local.
- Ofrecer alta breve dentro del ambiente: tipo/nombre, condición explícita, adquisición con precisión año o mes y cantidad inicial 1. Obtener categoría y rótulo de las reglas actuales, con edición adicional cuando corresponda.
- Mostrar precio referencial del catálogo y su procedencia. El equipo central puede abrir la valoración contextual; otros perfiles ven quién debe completarla. No usar costo original como referencia de reposición.
- Agrupar marca, serie, patrimonio, costo original, vida útil y asociación en datos adicionales, sin perder valores existentes ni controles indispensables.
- Reutilizar la galería del centro para fotos del ambiente, con asociación explícita; conservar restricciones actuales sobre imágenes de personas. La persistencia definitiva se trata en P6.
- Bloquear inactivación mientras existan bienes activos o pendientes de resolución vinculados al ambiente, incluidos componentes asociados. Mostrar la lista y permitir reubicarlos o resolver individualmente su situación. Reubicar un conjunto debe mantener sus asociaciones válidas. Tras resolverlos, inactivar conservando historial y referencias.

**Aceptación:** registrar otro bien conserva el ambiente; un año conocido no se convierte en enero; las fotos del ambiente no se mezclan con otro ambiente; inactivar con pendientes informa qué falta y no cambia bienes ni relaciones.

### P3 — Necesidades y valoración accionables: L05, L08

- Añadir por fila Ver antecedente y Siguiente paso. Para Sin valorar, abrir el tipo exacto en el catálogo cuando el perfil lo permita; en otro caso indicar «Pendiente de valoración por equipo central».
- Reutilizar la elegibilidad y acciones ya implementadas en Incidencias. Explicar la baja previa cuando corresponda, sin ejecutarla automáticamente.
- Renombrar el filtro a «Clasificación principal» y explicar que reposición por incidente prevalece sobre renovación en el comportamiento actual. Conservar todos los motivos del bien y marcar la regla como provisional mientras no se valide formalmente.
- Hacer navegables los casos de infraestructura en evaluación y antecedentes insuficientes hacia su ambiente o bien exacto.
- Preservar el cálculo único por bien, la cantidad de unidades y la distinción entre desconocido y cero. No implementar aprobación presupuestal ni compras como consecuencia de una necesidad.

**Aceptación:** la silla sin precio llega al formulario de Silla de estudio sin nueva búsqueda; al regresar mantiene filtros; AMA-D1-C02-S cuenta una vez y muestra ambos motivos; el CSV refleja la misma selección.

### P4 — Servicios operativos: L04

- Añadir teléfono de contacto del proveedor y contacto descriptivo opcional; mostrarlos en ficha, sin simular una llamada o mensaje.
- Para Pendiente, ofrecer motivo, detalle y vencimiento conocido. Para Pagado, fecha, importe y sustento opcionales. Para Sin información, conservar esa condición sin convertirla en deuda confirmada.
- Consultar el detalle desde la celda del período y desde su alerta. Conservar la separación de interrupción/restablecimiento y pago.
- Dejar SGD como integración posterior: no añadir envíos, sincronización, acceso documental ni dependencias externas en esta fase.

**Aceptación:** cada celda muestra el centro, servicio y período; permite consultar por qué falta el pago y cómo contactar al proveedor; informar pago no restablece el servicio.

### P5 — Movilidad y patrones compartidos: L09, L10, L11

- Cuando no haya recorridos elegibles, explicar la causa, deshabilitar el registro de consumo y ofrecer ir a informar ejecución. Desde un recorrido ejecutado sin consumo, abrir el registro con ese recorrido seleccionado.
- Desde falta de rendimiento, abrir los datos del vehículo exacto. Mantener referencia orientativa, carga y consumo separados, y exclusión de consumos duplicados.
- Mantener vehículo y chofer relacionado; no convertir el campo de chofer en un módulo de personal sin requisitos aprobados.
- Extender el patrón adaptable existente a las cinco tablas señaladas; conservar datos esenciales y acceso a acciones sin desplazamiento lateral en móvil. En tablas de escritorio, contener el desplazamiento dentro de la tabla cuando sea necesario.
- Corregir contadores de elegibilidad, plurales y mensajes vacíos mediante utilidades compartidas.

**Aceptación:** cero recorridos elegibles tiene explicación y salida; HOR-V01 mantiene su contexto al completar rendimiento; no hay desbordamiento horizontal de página a 390, 768 y 1280 px; las acciones se encuentran sin explorar columnas ocultas.

### P6 — Persistencia, permisos y regresión antes de operar: L12, L13

- Extender los modelos existentes sin regenerar identificadores: ubicación del ambiente, precisión de adquisición, asociación de fotos y datos de contacto/período. Admitir registros históricos sin los nuevos campos.
- Conservar las fotos históricas a nivel centro si no tienen ambiente identificado. Antes de datos reales, reemplazar conservación de sesión por almacenamiento persistente mediante la infraestructura aprobada del proyecto.
- Verificar autorización por perfil y ámbito en la capa que persiste datos; ocultar botones no reemplaza esa autorización.
- Aplicar el bloqueo de inactivación también en persistencia y evitar cambios parciales en reubicaciones o reposiciones. Mantener antecedentes y asociaciones históricas.
- Reutilizar los componentes locales de Incidencias ya corregidos, sin duplicar reglas ni formularios.

**Aceptación:** registros anteriores siguen legibles; reabrir una sesión conserva fotos cuando se habilite persistencia definitiva; los accesos directos respetan ámbito; un fallo o cambio concurrente no deja un ambiente inactivo con bienes pendientes ni una reposición parcial.

**Dependencias:** P0 → P1 → P2/P3 → P4/P5. Las ampliaciones de datos de P6 acompañan a sus pantallas; los controles finales de persistencia y permisos deben cerrarse antes de uso operativo.

## 4. Validación transversal

### Comprobaciones realizadas en local

- Recorridos de interfaz de los 12 destinos: Inicio, Centros, Ambientes, Bienes, Registro, Incidencias, Necesidades, Precios, Servicios, Vehículos, Itinerarios y Combustible.
- Centros → Ambientes; Necesidades → bien → retorno; necesidad sin precio → catálogo → formulario; Incidencias → baja/reposición hasta formulario; vehículo → itinerario; período → estado del pago. Se cancelaron formularios sin guardar.
- CSV de renovación: una fila y S/ 650; CSV de Todas para Amanecer: tres filas, dos importes de S/ 650 y una fila Sin precio/Sin valorar. Consolidado central observado: nueve necesidades, S/ 11 090 conocidos y dos sin valorar; importes de las filas conciliados.
- Cuatro perfiles de demostración: ámbito central y Personal del CAR; menú de Verificación física; bloqueo de Precios para Chofer. Un bien de Horizonte no se mostró bajo Verificación física de Amanecer; la pantalla no explica por qué ese destino no está disponible.
- Revisión de ancho de los 12 destinos a 390×844, 768×1024 y 1280×900. En móvil sobresalen cinco módulos; en tableta, Vehículos e Itinerarios. La medición detecta exceso de ancho y la interfaz presenta tablas con desplazamiento; no equivale por sí sola a una operación bloqueada.
- Perfil original Personal del CAR y tamaño de navegador restaurados. Sin implementación, guardados, anulaciones, carga de fotos, builds, servidores o pruebas automatizadas.

### Escenarios de aceptación pendientes de ejecución autorizada

| Recorrido | Resultado exigido |
|---|---|
| Centro → ambiente → alta → verificación | Contexto conservado, adquisición con precisión real, comprobación independiente de datos previos. |
| Incidente → necesidad → valoración → baja cuando corresponda → reposición | Un solo pendiente por bien, motivos conservados, destino y componentes correctos, sin efectos parciales. |
| Novedad → evaluación/intervención → atención | Historial trazable; vinculación explícita y cierre confirmado, sin atención automática por registrar una intervención. |
| Ambiente con bienes → inactivación | Bloqueo, lista de pendientes y resolución/reubicación previa; conservación de asociaciones e historial. |
| Servicio → período → pago/interrupción/restablecimiento | Motivos y contactos consultables; sin convertir desconocidos en deuda ni pago en restablecimiento. |
| Vehículo → recorrido → ejecución → consumo | Vehículo/chofer coherentes, unidades explícitas, sin doble conteo ni conclusión de irregularidad por falta de datos. |
| Perfil, enlace directo, atrás/adelante, móvil y teclado | Ámbito respetado, filtros restaurados, destino exacto, foco y controles accesibles. |

## 5. Alcance confirmado

La reunión solicita simplicidad y operación contextual, no aprueba en detalle una arquitectura técnica, indicadores, gestión de personal o integración SGD. No se propone un rediseño completo de menús ni renombrar Presupuesto como requisito obligatorio. Priorizar acciones coherentes desde el centro y ambiente y corregir los destinos de navegación.

La transcripción de trabajo contiene pasajes poco claros señalados. No se asignan intervenciones a hablantes sin identificación fiable. La precisión posterior del usuario sobre inactivación prevalece sobre el fragmento ambiguo de la reunión.

Este plan está listo para revisión funcional. Antes de implementar, se deben traducir sus hallazgos y criterios a las especificaciones SDD existentes; este documento no atribuye cambios a archivos de código ni a contratos de API.
