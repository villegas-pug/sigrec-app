package pe.gob.inabif.sigrec;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.repository.UnidadOrganicaRepository;
import pe.gob.inabif.sigrec.centro.repository.CentroBusquedaRepository;
import pe.gob.inabif.sigrec.centro.dtos.UnidadOrganicaResponse;
import pe.gob.inabif.sigrec.elemento.repository.ElementoRepository;
import pe.gob.inabif.sigrec.modulo.repository.ModuloRepository;
import pe.gob.inabif.sigrec.perfil.model.Perfil;
import pe.gob.inabif.sigrec.perfil.model.PerfilPermiso;
import pe.gob.inabif.sigrec.perfil.repository.PerfilPermisoRepository;
import pe.gob.inabif.sigrec.perfil.repository.PerfilRepository;
import pe.gob.inabif.sigrec.permiso.model.Permiso;
import pe.gob.inabif.sigrec.permiso.repository.PermisoRepository;
import pe.gob.inabif.sigrec.precio.model.Precio;
import pe.gob.inabif.sigrec.precio.repository.PrecioRepository;
import pe.gob.inabif.sigrec.servicio.repository.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import pe.gob.inabif.sigrec.vehiculo.repository.VehiculoRepository;
import pe.gob.inabif.sigrec.itinerario.repository.ItinerarioRepository;
import pe.gob.inabif.sigrec.combustible.repository.CombustibleRepository;
import pe.gob.inabif.sigrec.foto.repository.FotoRepository;
import pe.gob.inabif.sigrec.intervencion.repository.IntervencionRepository;
import pe.gob.inabif.sigrec.mantenimiento.repository.MantenimientoRepository;
import org.springframework.mock.web.MockMultipartFile;
import pe.gob.inabif.sigrec.shared.model.Hoy;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import pe.gob.inabif.sigrec.usuario.model.UsuarioPerfil;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioPerfilRepository;
import pe.gob.inabif.sigrec.usuario.repository.UsuarioRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Stage1SecurityTest {
    private static final String API = "/api/v1";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockBean UsuarioRepository usuarios;
    @MockBean UsuarioPerfilRepository asignaciones;
    @MockBean PerfilRepository perfiles;
    @MockBean PerfilPermisoRepository permisosPorPerfil;
    @MockBean PermisoRepository permisos;
    @MockBean CatalogoRepository catalogos;
    @MockBean CentroRepository centros;
    @MockBean UnidadOrganicaRepository unidades;
    @MockBean CentroBusquedaRepository busquedaCentros;
    @MockBean ModuloRepository modulos;
    @MockBean AmbienteRepository ambientes;
    @MockBean ElementoRepository elementos;
    @MockBean BienRepository bienRepository;
    @MockBean InventarioPrevioRepository inventarioPrevioRepository;
    @MockBean HistorialBienRepository historialBienRepository;
    @MockBean IncidenteRepository incidenteRepository;
    @MockBean AtencionRepository atencionRepository;
    @MockBean BajaRepository bajaRepository;
    @MockBean ReposicionRepository reposicionRepository;
    @MockBean BienImplicadoRepository bienImplicadoRepository;
    @MockBean PrecioRepository precios;
    @MockBean ServicioRepository servicios;
    @MockBean PeriodoRepository periodos;
    @MockBean HechoServicioRepository hechosServicio;
    @MockBean VehiculoRepository vehiculos;
    @MockBean ItinerarioRepository itinerarios;
    @MockBean CombustibleRepository combustible;
    @MockBean FotoRepository fotos;
    @MockBean IntervencionRepository intervenciones;
    @MockBean MantenimientoRepository mantenimientos;

    private static final String USUARIO = "X-Usuario-Id";
    private Usuario cuenta;

    @AfterEach
    void restablecerReloj() {
        Hoy.restablecer();
    }

    @BeforeEach
    void preparar() {
        // SPEC 040: el «hoy» del backend es la fecha real; las pruebas lo fijan para ser deterministas.
        Hoy.usarReloj(Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), ZoneId.of("America/Lima")));
        cuenta = new Usuario();
        ReflectionTestUtils.setField(cuenta, "id", 7L);
        cuenta.setNombre("Cuenta de pruebas");
        cuenta.setTipo("HUMANO");
        when(usuarios.findByProveedorAndSujeto("INTRANET", "demo")).thenReturn(Optional.of(cuenta));
        when(usuarios.findById(7L)).thenReturn(Optional.of(cuenta));
    }

    @Test
    void consultaSoloSuCentroYNoConcedeGestionDeUsuarios() throws Exception {
        var centro = new Centro();
        ReflectionTestUtils.setField(centro, "id", 3L);
        centro.setCodigo("AMA");
        centro.setNombre("Centro de alcance");
        centro.setCondicionInmueble("PROPIO");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(centros.findByCodigoInOrderById(List.of("AMA"))).thenReturn(List.of(centro));
        mvc.perform(get(API + "/centros/jerarquia").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cars[0].id").value("AMA"));
        verify(centros, never()).findAllByOrderById();
        mvc.perform(get(API + "/usuarios").header(USUARIO, "demo")).andExpect(status().isForbidden());
    }

    @Test
    void alcanceVehicularNoAbreLaJerarquia() throws Exception {
        var centro = new Centro();
        centro.setCodigo("AMA");
        centro.setNombre("Centro de alcance");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        mvc.perform(get(API + "/centros/jerarquia").header(USUARIO, "demo")).andExpect(status().isForbidden());
    }

    @Test
    void inventarioFiltradoYOperacionSinPermiso() throws Exception {
        var centro = new Centro();
        ReflectionTestUtils.setField(centro, "id", 3L);
        centro.setCodigo("AMA");
        centro.setNombre("Centro de alcance");
        prepararPerfil("VERIFICA", UsuarioPerfil.Alcance.CENTRO, centro, null);
        var ambiente = ambiente(centro);
        var bien = bien(ambiente);
        when(bienRepository.findByRotulo("AMA-D1-C01")).thenReturn(Optional.of(bien));
        mvc.perform(get(API + "/bienes/datos").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eventos").isArray()).andExpect(jsonPath("$.data.bienes").isArray());
        verify(bienRepository).findByAmbienteModuloCentroCodigoInOrderById(List.of("AMA"));
        mvc.perform(post(API + "/bienes/AMA-D1-C01/anular").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Prueba de autorización\"}"))
                .andExpect(status().isForbidden());
        verify(bienRepository, never()).save(any());
    }

    @Test
    void rechazaIncidenciaConOrigenInvalidoEInventarioVehicular() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Demo");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        mvc.perform(get(API + "/bienes/datos").header(USUARIO, "demo")).andExpect(status().isForbidden());
        mvc.perform(post(API + "/incidencias").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"datos\":{\"origen\":{\"tipo\":\"modulo\",\"id\":\"AMA-M01\"},\"tipo\":\"dano\",\"titulo\":\"Prueba\"}}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.data['datos.origen.tipo']").exists());
    }

    @Test
    void consultaPreciosVigentesSinEntregarHistorialNiAmpliarElAmbito() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        var precio = precioInicial(tipoCamarote());
        when(precios.listarActuales()).thenReturn(List.of(precio));

        mvc.perform(get(API + "/precios").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].tipoId").value("camarote"))
                .andExpect(jsonPath("$.data[0].precio").value(1100))
                .andExpect(jsonPath("$.data[0].historial").isEmpty());
        verify(precios, never()).listarConHistorial();
        mvc.perform(get(API + "/bienes/datos").header(USUARIO, "demo")).andExpect(status().isOk());
        verify(bienRepository).findByAmbienteModuloCentroCodigoInOrderById(List.of("AMA"));
        mvc.perform(put(API + "/precios/camarote").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":200}"))
                .andExpect(status().isForbidden());
        verify(precios, never()).save(any());
    }

    @Test
    void deniegaPreciosAlAmbitoVehicularInclusoConUnPermisoDeCentro() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        mvc.perform(get(API + "/precios")).andExpect(status().isUnauthorized());
        mvc.perform(get(API + "/precios").header(USUARIO, "demo")).andExpect(status().isForbidden());
        verifyNoInteractions(precios);
    }

    @Test
    void serviciosUsaElCentroDeLaAsignacionYValidaElContratoDePago() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "servicios"), permiso("ACCION", "servicio.periodo")));
        when(servicios.centroDe("SRV-HOR-LUZ")).thenReturn(Optional.of("HOR"));
        mvc.perform(get(API + "/servicios").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        verify(servicios).findByCentroCodigoInOrderById(List.of("AMA"));
        mvc.perform(put(API + "/servicios/SRV-AMA-LUZ/periodos/2026/5").header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"pagado\",\"pago\":{\"importe\":0}}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(API + "/servicios/SRV-HOR-LUZ/periodos/2026/5").header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"pendiente\"}"))
                .andExpect(status().isNotFound());
        verifyNoInteractions(periodos);
    }

    @Test
    void choferSoloConsultaYEscribeDentroDeSuVehiculo() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        var v = vehiculos.findByCodigo("AMA-V01").orElseThrow();
        when(vehiculos.listarAmbito(List.of(), List.of("AMA-V01"))).thenReturn(List.of(v));
        var otro = new Vehiculo(); otro.setCodigo("HOR-V01"); otro.setCentro(centro);
        when(vehiculos.bloquear("HOR-V01")).thenReturn(Optional.of(otro));
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "itinerarios"), permiso("ACCION", "itinerario.registrar")));
        mvc.perform(get(API + "/itinerarios").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        verify(itinerarios).findByVehiculoIdInOrderById(List.of(36L));
        mvc.perform(post(API + "/itinerarios").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"vehiculoId":"HOR-V01","datos":{"fecha":"2026-10-30","proposito":"Traslado","destinos":["Origen"]}}
                                """))
                .andExpect(status().isNotFound());
        verify(itinerarios, never()).save(any());
    }

    @Test
    void fotosRespetaAmbitoDelCentro() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "centros"), permiso("ACCION", "centro.foto")));
        mvc.perform(get(API + "/fotos").header(USUARIO, "demo")).andExpect(status().isOk());
        verify(fotos).listarAmbito(List.of("AMA"));

        var datos = new MockMultipartFile("datos", "", "application/json", """
                {"carId":"HOR","datos":{"titulo":"Foto de la ficha"}}
                """.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var imagen = new MockMultipartFile("archivo", "foto.png", "image/png", new byte[] {1, 2, 3});
        mvc.perform(multipart(API + "/fotos").file(datos).file(imagen).header(USUARIO, "demo"))
                .andExpect(status().isNotFound());
        verify(fotos, never()).save(any());
    }

    @Test
    void choferVeSoloMantenimientoDelVehiculoAsignado() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(permiso("RUTA", "vehiculos")));
        var vehiculo = vehiculos.findByCodigo("AMA-V01").orElseThrow();
        when(vehiculos.listarAmbito(List.of(), List.of("AMA-V01"))).thenReturn(List.of(vehiculo));
        mvc.perform(get(API + "/mantenimientos").header(USUARIO, "demo")).andExpect(status().isOk());
        verify(mantenimientos).listarAmbito(List.of(), List.of(36L));
        verify(mantenimientos, never()).findAllByOrderById();
    }

    @Test
    void conservaHistoricoAlCambiarSoloLaFuenteYRepiteElPutSinDuplicar() throws Exception {
        prepararPerfil("CENTRAL", UsuarioPerfil.Alcance.GLOBAL, null, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "precios"), permiso("ACCION", "precio.informar")));
        var tipo = tipoCamarote();
        var anterior = precioInicial(tipo);
        var filas = new ArrayList<>(List.of(anterior));
        when(catalogos.bloquear("TIPO_BIEN", "CAMAROTE")).thenReturn(Optional.of(tipo));
        when(precios.buscarActual(4L)).thenAnswer(call -> filas.stream().filter(Precio::esActual).findFirst());
        when(precios.listarPorTipo(4L)).thenAnswer(call -> filas);
        when(precios.listarConHistorial()).thenAnswer(call -> filas);
        when(precios.save(any())).thenAnswer(call -> {
            var fila = call.<Precio>getArgument(0);
            filas.addFirst(fila);
            return fila;
        });
        var cuerpo = "{\"precio\":1100.00,\"fechaPrecio\":\"2026-09\",\"procedencia\":\"Nueva fuente\"}";
        mvc.perform(put(API + "/precios/camarote")
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andExpect(status().isUnauthorized());
        mvc.perform(put(API + "/precios/camarote").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":0.011}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(API + "/precios/camarote").header(USUARIO, "demo")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":50,\"fechaPrecio\":\"2026-11\"}"))
                .andExpect(status().isBadRequest());
        for (int intento = 0; intento < 2; intento++) {
            mvc.perform(put(API + "/precios/camarote").header(USUARIO, "demo")
                            .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.procedencia").value("Nueva fuente"))
                    .andExpect(jsonPath("$.data.historial.length()").value(1))
                    .andExpect(jsonPath("$.data.historial[0].reemplazadoEl").value("2026-10-30"))
                    .andExpect(jsonPath("$.data.historial[0].por").value("Cuenta de pruebas"));
        }
        mvc.perform(get(API + "/precios").header(USUARIO, "demo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].historial[0].procedencia").value("Cotización inicial"));
        verify(precios, times(1)).save(any());
        verify(precios, times(1)).flush();
    }

    @Test
    void buscaUnidadesPaginadasConPermisoDeEdicion() throws Exception {
        var centro = new Centro();
        centro.setCodigo("AMA");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "centros"), permiso("ACCION", "centro.actualizar")));
        var ocupada = new UnidadOrganicaResponse.Coincidencia(8L, "Unidad Áncash", "AN", "Dirección oficial", 3L, true);
        when(unidades.buscar("Ánc", 2, "AMA", 3L)).thenReturn(new UnidadOrganicaResponse.Pagina(List.of(ocupada), 6));
        var ruta = API + "/centros/unidades-organicas";
        mvc.perform(get(ruta).header(USUARIO, "demo").param("q", "An").param("centro", "AMA"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(ruta).header(USUARIO, "demo").param("q", "Ánc").param("centro", "OTR"))
                .andExpect(status().isNotFound());
        mvc.perform(get(ruta).header(USUARIO, "demo").param("q", "Ánc").param("centro", "AMA").param("padre", "0"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(ruta).header(USUARIO, "demo").param("q", " Ánc ").param("centro", "AMA").param("pagina", "2")
                        .param("padre", "3"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(6))
                .andExpect(jsonPath("$.data.items[0].ocupada").value(true))
                .andExpect(jsonPath("$.data.items[0].padre").value(3));
        verify(unidades).buscar("Ánc", 2, "AMA", 3L);
        verifyNoMoreInteractions(unidades);
    }

    @Test
    void exigeUnidadEnAltaYConservaHistoricoAlEditar() throws Exception {
        prepararPerfil("CENTRAL", UsuarioPerfil.Alcance.GLOBAL, null, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "centros"), permiso("ACCION", "centro.actualizar"), permiso("ACCION", "centro.registrar")));
        var centro = new Centro();
        ReflectionTestUtils.setField(centro, "id", 3L);
        centro.setCodigo("AMA");
        when(centros.bloquear("AMA")).thenReturn(Optional.of(centro));
        var inactiva = new UnidadOrganicaResponse(8L, "Unidad histórica", null, null, false);
        var activa = new UnidadOrganicaResponse(9L, "Unidad activa", "ACT", "Dirección oficial", true);
        when(unidades.porId(8L)).thenReturn(inactiva);
        when(unidades.porId(9L)).thenReturn(activa);
        when(unidades.vinculada(9L)).thenReturn(true, false);
        var alta = """
                {"id":"XYZ","nombre":"Centro SIGREC","inmueble":{"condicion":"propio","direccion":"Dirección SIGREC"}}
                """;
        mvc.perform(post(API + "/centros").header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(alta))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.data.unidadOrganicaId").exists());

        var edicion = """
                {"nombre":"Centro SIGREC","inmueble":{"condicion":"propio","direccion":"Dirección SIGREC"}}
                """.strip();
        var ruta = API + "/centros/AMA";
        mvc.perform(put(ruta).header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(edicion))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.registro.unidadOrganica").doesNotExist());
        var conUnidad = edicion.substring(0, edicion.length() - 1) + ",\"unidadOrganicaId\":%d}";
        mvc.perform(put(ruta).header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(conUnidad.formatted(8)))
                .andExpect(status().isBadRequest());
        centro.setUnidadOrganicaId(8L);
        mvc.perform(put(ruta).header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(edicion))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.registro.unidadOrganica.elegible").value(false));
        mvc.perform(put(ruta).header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(conUnidad.formatted(9)))
                .andExpect(status().isConflict());
        assertThat(centro.getUnidadOrganicaId()).isEqualTo(8L);
        mvc.perform(put(ruta).header(USUARIO, "demo").contentType(MediaType.APPLICATION_JSON).content(conUnidad.formatted(9)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.registro.unidadOrganica.nombre").value("Unidad activa"))
                .andExpect(jsonPath("$.data.registro.inmueble.direccion").value("Dirección SIGREC"));
        assertThat(centro.getUnidadOrganicaId()).isEqualTo(9L);
    }

    private Catalogo tipoCamarote() {
        var tipo = new Catalogo();
        ReflectionTestUtils.setField(tipo, "id", 4L);
        tipo.setCodigo("CAMAROTE");
        return tipo;
    }

    private Precio precioInicial(Catalogo tipo) {
        var precio = new Precio();
        precio.setTipo(tipo);
        precio.setPrecio(new BigDecimal("1100"));
        precio.setFechaPrecio(java.time.LocalDate.of(2026, 9, 1));
        precio.setProcedencia("Cotización inicial");
        return precio;
    }

    private Ambiente ambiente(Centro centro) {
        var modulo = new Modulo(); modulo.setCentro(centro);
        var ambiente = new Ambiente(); ambiente.setModulo(modulo);
        return ambiente;
    }

    private Bien bien(Ambiente ambiente) {
        var bien = new Bien(); bien.setAmbiente(ambiente);
        return bien;
    }

    private void prepararPerfil(String codigo, UsuarioPerfil.Alcance alcance, Centro centro, String vehiculo) {
        if (vehiculo != null) {
            var v = new Vehiculo();
            ReflectionTestUtils.setField(v, "id", 36L);
            v.setCodigo(vehiculo);
            v.setCentro(centros.findByCodigo("AMA").orElseThrow());
            when(vehiculos.findByCodigo(vehiculo)).thenReturn(Optional.of(v));
        }
        var perfil = new Perfil();
        ReflectionTestUtils.setField(perfil, "id", 5L);
        perfil.setCodigo(codigo);
        perfil.setNombre(codigo);
        var asignado = new UsuarioPerfil();
        ReflectionTestUtils.setField(asignado, "id", 1L);
        asignado.setPerfil(perfil);
        asignado.setUsuario(cuenta);
        asignado.setAlcance(alcance);
        asignado.setCentro(centro);
        asignado.setVehiculo(vehiculo);
        when(asignaciones.findByUsuarioIdOrderById(7L)).thenReturn(List.of(asignado));
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(permiso("RUTA", "centros")));
    }

    private PerfilPermiso permiso(String tipo, String codigo) {
        var permiso = new Permiso();
        permiso.setTipo(tipo);
        permiso.setCodigo(codigo);
        var otorgado = new PerfilPermiso();
        otorgado.setPermiso(permiso);
        return otorgado;
    }
}
