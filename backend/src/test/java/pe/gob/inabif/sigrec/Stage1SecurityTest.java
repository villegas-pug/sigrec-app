package pe.gob.inabif.sigrec;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import pe.gob.inabif.sigrec.ambiente.repository.AmbienteRepository;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.incidencia.repository.*;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.auth.model.Sesion;
import pe.gob.inabif.sigrec.auth.repository.SesionRepository;
import pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
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
    @Autowired PasswordEncoder bcrypt;
    @MockBean UsuarioRepository usuarios;
    @MockBean UsuarioPerfilRepository asignaciones;
    @MockBean PerfilRepository perfiles;
    @MockBean PerfilPermisoRepository permisosPorPerfil;
    @MockBean PermisoRepository permisos;
    @MockBean SesionRepository sesiones;
    @MockBean CatalogoRepository catalogos;
    @MockBean CentroRepository centros;
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

    private final Map<String, Sesion> sesionesActivas = new HashMap<>();
    private final String password = UUID.randomUUID().toString();
    private Usuario cuenta;

    @DynamicPropertySource
    static void jwt(DynamicPropertyRegistry properties) {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        properties.add("sigrec.security.jwt.secret", () -> HexFormat.of().formatHex(bytes));
    }

    @BeforeEach
    void preparar() {
        cuenta = new Usuario();
        ReflectionTestUtils.setField(cuenta, "id", 7L);
        cuenta.setNombre("Cuenta de pruebas");
        cuenta.setTipo("HUMANO");
        cuenta.setPasswordHash(bcrypt.encode(password));
        when(usuarios.findByProveedorAndSujeto("LOCAL", "demo")).thenReturn(Optional.of(cuenta));
        when(usuarios.findById(7L)).thenReturn(Optional.of(cuenta));
        when(sesiones.save(any())).thenAnswer(call -> {
            Sesion sesion = call.getArgument(0);
            sesionesActivas.put(sesion.getHash(), sesion);
            return sesion;
        });
        when(sesiones.findByHashAndRevocadaIsNull(anyString())).thenAnswer(call -> Optional
                .ofNullable(sesionesActivas.get(call.getArgument(0))).filter(s -> s.getRevocada() == null));
        doAnswer(call -> {
            Sesion sesion = sesionesActivas.get(call.getArgument(0));
            if (sesion != null) sesion.setRevocada(call.getArgument(1));
            return null;
        }).when(sesiones).revocar(anyString(), any(Instant.class));
    }

    @Test
    void restauraYRevocaUnaSesionReal() throws Exception {
        mvc.perform(get(API + "/auth/me")).andExpect(status().isUnauthorized());
        var cookie = login();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/api");
        assertThat(sesionesActivas).hasSize(1);
        assertThat(sesionesActivas.keySet().iterator().next()).matches("[a-f0-9]{64}");
        mvc.perform(get(API + "/auth/me").cookie(cookie)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nombre").value("Cuenta de pruebas"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        mvc.perform(post(API + "/auth/logout").cookie(cookie)).andExpect(status().isForbidden());
        var csrf = csrf();
        mvc.perform(get(API + "/auth/me").cookie(cookie, csrf.cookie())).andExpect(status().isOk())
                .andExpect(cookie().doesNotExist("XSRF-TOKEN"));
        mvc.perform(post(API + "/auth/logout").cookie(cookie, csrf.cookie()).header(csrf.header(), csrf.token()))
                .andExpect(status().isOk()).andExpect(cookie().maxAge("SIGREC_SESSION", 0));
        mvc.perform(get(API + "/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
    }

    @Test
    void verificaCsrfYContraseña() throws Exception {
        mvc.perform(post(API + "/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody(password)))
                .andExpect(status().isForbidden());
        var csrf = csrf();
        mvc.perform(post(API + "/auth/login").cookie(csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content(loginBody(UUID.randomUUID().toString())))
                .andExpect(status().isUnauthorized());
        assertThat(sesionesActivas).isEmpty();
    }

    @Test
    void bloqueaSesionExpiradaOUsuarioAnulado() throws Exception {
        var cookie = login();
        sesionesActivas.values().forEach(s -> s.setExpira(Instant.now().minusSeconds(1)));
        mvc.perform(get(API + "/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());

        cookie = login();
        cuenta.anular(cuenta, "Prueba de sesión");
        mvc.perform(get(API + "/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
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
        var cookie = login();
        mvc.perform(get(API + "/centros/jerarquia").cookie(cookie)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cars[0].id").value("AMA"));
        verify(centros, never()).findAllByOrderById();
        mvc.perform(get(API + "/usuarios").cookie(cookie)).andExpect(status().isForbidden());
    }

    @Test
    void alcanceVehicularNoAbreLaJerarquia() throws Exception {
        var centro = new Centro();
        centro.setCodigo("AMA");
        centro.setNombre("Centro de alcance");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        var cookie = login();
        mvc.perform(get(API + "/auth/me").cookie(cookie)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.asignaciones[0].vehiculo").value("AMA-V01"));
        mvc.perform(get(API + "/centros/jerarquia").cookie(cookie)).andExpect(status().isForbidden());
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
        var sesion = login();
        mvc.perform(get(API + "/bienes/datos").cookie(sesion)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eventos").isArray()).andExpect(jsonPath("$.data.bienes").isArray());
        verify(bienRepository).findByAmbienteModuloCentroCodigoInOrderById(List.of("AMA"));
        var csrf = csrf();
        mvc.perform(post(API + "/bienes/AMA-D1-C01/anular").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Prueba de autorización\"}"))
                .andExpect(status().isForbidden());
        verify(bienRepository, never()).save(any());
    }

    @Test
    void rechazaIncidenciaConOrigenInvalidoEInventarioVehicular() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Demo");
        when(centros.findByCodigo("AMA")).thenReturn(Optional.of(centro));
        prepararPerfil("CHOFER", UsuarioPerfil.Alcance.VEHICULO, null, "AMA-V01");
        var sesion = login();
        mvc.perform(get(API + "/bienes/datos").cookie(sesion)).andExpect(status().isForbidden());
        var csrf = csrf();
        mvc.perform(post(API + "/incidencias").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"datos\":{\"origen\":{\"tipo\":\"modulo\",\"id\":\"AMA-M01\"},\"tipo\":\"dano\",\"titulo\":\"Prueba\"}}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.data['datos.origen.tipo']").exists());
    }

    @Test
    void consultaPreciosVigentesSinEntregarHistorialNiAmpliarElAmbito() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        var precio = precioInicial(tipoCamarote());
        when(precios.listarActuales()).thenReturn(List.of(precio));
        var sesion = login();

        mvc.perform(get(API + "/precios").cookie(sesion)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].tipoId").value("camarote"))
                .andExpect(jsonPath("$.data[0].precio").value(1100))
                .andExpect(jsonPath("$.data[0].historial").isEmpty());
        verify(precios, never()).listarConHistorial();
        mvc.perform(get(API + "/bienes/datos").cookie(sesion)).andExpect(status().isOk());
        verify(bienRepository).findByAmbienteModuloCentroCodigoInOrderById(List.of("AMA"));
        var csrf = csrf();
        mvc.perform(put(API + "/precios/camarote").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
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
        mvc.perform(get(API + "/precios").cookie(login())).andExpect(status().isForbidden());
        verifyNoInteractions(precios);
    }

    @Test
    void serviciosUsaElCentroDeLaAsignacionYValidaElContratoDePago() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "servicios"), permiso("ACCION", "servicio.periodo")));
        when(servicios.centroDe("SRV-HOR-LUZ")).thenReturn(Optional.of("HOR"));
        var sesion = login();
        mvc.perform(get(API + "/servicios").cookie(sesion)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        verify(servicios).findByCentroCodigoInOrderById(List.of("AMA"));
        var csrf = csrf();
        mvc.perform(put(API + "/servicios/SRV-AMA-LUZ/periodos/2026/5").cookie(sesion, csrf.cookie())
                        .header(csrf.header(), csrf.token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"pagado\",\"pago\":{\"importe\":0}}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(API + "/servicios/SRV-HOR-LUZ/periodos/2026/5").cookie(sesion, csrf.cookie())
                        .header(csrf.header(), csrf.token()).contentType(MediaType.APPLICATION_JSON)
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
        var sesion = login();
        mvc.perform(get(API + "/itinerarios").cookie(sesion)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        verify(itinerarios).findByVehiculoIdInOrderById(List.of(36L));
        var csrf = csrf();
        mvc.perform(post(API + "/itinerarios").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"vehiculoId":"HOR-V01","datos":{"fecha":"2026-10-30","proposito":"Traslado","destinos":["Origen"]}}
                                """))
                .andExpect(status().isNotFound());
        verify(itinerarios, never()).save(any());
    }

    @Test
    void fotosExigeCsrfYRespetaAmbitoDelCentro() throws Exception {
        var centro = new Centro(); centro.setCodigo("AMA"); centro.setNombre("Amanecer");
        prepararPerfil("CAR", UsuarioPerfil.Alcance.CENTRO, centro, null);
        when(permisosPorPerfil.findByPerfilIdOrderByOrdenAscIdAsc(5L)).thenReturn(List.of(
                permiso("RUTA", "centros"), permiso("ACCION", "centro.foto")));
        var sesion = login();
        mvc.perform(get(API + "/fotos").cookie(sesion)).andExpect(status().isOk());
        verify(fotos).listarAmbito(List.of("AMA"));

        var datos = new MockMultipartFile("datos", "", "application/json", """
                {"carId":"HOR","datos":{"titulo":"Foto de la ficha"}}
                """.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var imagen = new MockMultipartFile("archivo", "foto.png", "image/png", new byte[] {1, 2, 3});
        mvc.perform(multipart(API + "/fotos").file(datos).file(imagen).cookie(sesion))
                .andExpect(status().isForbidden());
        var csrf = csrf();
        mvc.perform(multipart(API + "/fotos").file(datos).file(imagen).cookie(sesion, csrf.cookie())
                        .header(csrf.header(), csrf.token()))
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
        mvc.perform(get(API + "/mantenimientos").cookie(login())).andExpect(status().isOk());
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
        var sesion = login();
        var cuerpo = "{\"precio\":1100.00,\"fechaPrecio\":\"2026-09\",\"procedencia\":\"Nueva fuente\"}";
        mvc.perform(put(API + "/precios/camarote").cookie(sesion)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andExpect(status().isForbidden());

        var csrf = csrf();
        mvc.perform(put(API + "/precios/camarote").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":0.011}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(API + "/precios/camarote").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"precio\":50,\"fechaPrecio\":\"2026-11\"}"))
                .andExpect(status().isBadRequest());
        for (int intento = 0; intento < 2; intento++) {
            mvc.perform(put(API + "/precios/camarote").cookie(sesion, csrf.cookie()).header(csrf.header(), csrf.token())
                            .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isOk())
                    .andExpect(cookie().doesNotExist("XSRF-TOKEN"))
                    .andExpect(jsonPath("$.data.procedencia").value("Nueva fuente"))
                    .andExpect(jsonPath("$.data.historial.length()").value(1))
                    .andExpect(jsonPath("$.data.historial[0].reemplazadoEl").value("2026-10-30"))
                    .andExpect(jsonPath("$.data.historial[0].por").value("Cuenta de pruebas"));
        }
        mvc.perform(get(API + "/precios").cookie(sesion)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].historial[0].procedencia").value("Cotización inicial"));
        verify(precios, times(1)).save(any());
        verify(precios, times(1)).flush();
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

    private Cookie login() throws Exception {
        var csrf = csrf();
        return mvc.perform(post(API + "/auth/login").cookie(csrf.cookie()).header(csrf.header(), csrf.token())
                        .contentType(MediaType.APPLICATION_JSON).content(loginBody(password)))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SIGREC_SESSION");
    }

    private String loginBody(String clave) throws Exception {
        return json.writeValueAsString(Map.of("usuario", "demo", "password", clave));
    }

    private Csrf csrf() throws Exception {
        var response = mvc.perform(get(API + "/auth/csrf")).andExpect(status().isOk()).andReturn().getResponse();
        var data = json.readTree(response.getContentAsString()).path("data");
        return new Csrf(response.getCookie("XSRF-TOKEN"), data.path("header").asText(), data.path("token").asText());
    }

    private record Csrf(Cookie cookie, String header, String token) {}
}
