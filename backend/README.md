# Backend de SIGREC

La SPEC 037 documenta las funcionalidades, los permisos y el contrato REST de SIGREC. [SPEC 037](../frontend/docs/spec/037-backend-sigrec-integracion-vue.md)

Configura las variables indicadas en `.env.example` en el proceso antes de iniciar Java. El archivo es una plantilla. Spring Boot usa el entorno del proceso para obtener los valores.

```powershell
mvn -f backend/pom.xml test
mvn -f backend/pom.xml package
java -jar backend/target/sigrec-0.1.0-SNAPSHOT.jar
npm --prefix frontend run dev
```

El backend de desarrollo escucha en `127.0.0.1:8080` y el frontend usa el proxy local de Quasar. El perfil `test` omite el datasource. Los arranques ordinarios contra Oracle 19c validan el esquema y dejan desactivada la carga de semillas.
