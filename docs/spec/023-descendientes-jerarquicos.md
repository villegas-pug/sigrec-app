# SPEC 023 — Descendientes jerárquicos en Gestión

- **Fecha:** 2026-11-11
- **Estado:** Implementado después de especificar el contrato; revisión estática completada. Complementa SPEC 020.

## Contract

- Grupos desplegables Centro → Módulo → Ambiente → Bien → Componente. Hijos directos visibles y descendientes inicialmente cerrados, con botones independientes para desplegar y abrir ficha.
- Mantener casas y módulos comunes separados. Reutilizar la agrupación en las fichas de centro, módulo y ambiente; conservar componentes en bien y padre/hermanos separados en componente.
- Identificar nombre, id, nivel, condición y situación. Respetar ámbito, situación e inactivos. Un principal fuera del filtro se muestra solo como referencia si tiene componentes visibles, sin sumarlo al conteo.
- Contar registros principales y componentes por separado, sin confundirlos con unidades; usar los mismos conteos en filas de ambientes y explorador. Contar módulos y ambientes separadamente.
- Conservar ids, selección, retorno y permisos. No cambiar cálculos de inventario, necesidades ni presupuesto.

## Validation

- Revisión estática inicialmente. Validación funcional de todos los niveles, componentes con principal de baja, inactivos, cantidades, teclado y móvil pendiente de autorización.
- No ejecutar pruebas, builds ni servidores sin autorización explícita.

- Revisión estática conjunta de diez archivos: JavaScript, estructura Vue, expresiones de plantilla, estilos, imports y exports locales, sin errores. `git diff --check` sin errores. No se ejecutó ni compiló la aplicación.
- Validación visual y funcional pendiente de autorización explícita.
