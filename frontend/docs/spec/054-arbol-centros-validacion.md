# SPEC 054 — Árbol compacto y validación de alta de centro

- El árbol comienza con los centros compactados, aunque exista un centro seleccionado por defecto.
- El buscador local del árbol y el botón «Registrar centro» están ocultos en Gestión de centros.
- Al seleccionar o expandir un centro se compactan los demás; sus módulos se muestran cerrados. Los niveles inferiores se abren a petición del usuario.
- Los enlaces directos y la navegación hacia un nodo abren únicamente sus antecesores.
- El alta de centro muestra los errores por campo devueltos por la API y conserva los datos introducidos. Los errores desconocidos se muestran en el formulario.
- La migración 046 y el despliegue del backend se verifican antes de registrar códigos alfanuméricos. No se ejecutan pruebas, compilaciones, servidores ni DDL sin autorización explícita.
