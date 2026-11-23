package pe.gob.inabif.sigrec.bien.service;

import lombok.RequiredArgsConstructor;
import pe.gob.inabif.sigrec.bien.dtos.*;
import pe.gob.inabif.sigrec.bien.mappers.*;
import pe.gob.inabif.sigrec.bien.model.*;
import pe.gob.inabif.sigrec.bien.repository.*;
import pe.gob.inabif.sigrec.catalogo.service.CatalogoService;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.usuario.model.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@RequiredArgsConstructor
@Transactional
public class BienServiceImpl implements BienService {
    private final BienRepository bienes;
    private final InventarioPrevioRepository previos;
    private final HistorialBienRepository historial;
    private final CatalogoService catalogos;
    private final pe.gob.inabif.sigrec.catalogo.repository.CatalogoRepository catalogoRepository;
    private final BienCreateMapper createMapper;
    private final BienUpdateMapper updateMapper;
    private final BienEntityMapper entityMapper;
    private final BienResponseMapper responseMapper;
    private final ReglasBien reglas;
    private final Acceso acceso;

    @Override
    public BienResponse crear(CreateBienRequest request) {
        var datos = createMapper.toModel(request);
        var ambiente = reglas.ambiente(datos.ambienteId());
        var permiso = datos.asociadoA() == null ? "bien.registrar" : "bien.componente";
        var centro = reglas.bloquear(permiso, reglas.centro(ambiente));
        if (!centro.vigente()) throw conflicto("El centro no está vigente.");
        reglas.exigirAmbienteVigente(ambiente);

        var rotulo = datos.id().strip();
        if (bienes.findByRotulo(rotulo).isPresent()) throw conflicto("Ya existe un bien con ese rótulo.");
        if (datos.condicion() == null || datos.condicion().isBlank()) throw invalido("Indique la condición constatada del bien.");
        var bien = new Bien();
        var actor = acceso.actor();
        bien.setRotulo(rotulo);
        bien.setAmbiente(ambiente);
        bien.setTipo(catalogoRepository.bloquear("TIPO_BIEN", codigo(datos.tipoId())).filter(pe.gob.inabif.sigrec.catalogo.model.Catalogo::vigente)
                .orElseThrow(() -> invalido("El tipo de bien no está disponible.")));
        bien.setCategoria(catalogos.obtener("CATEGORIA_BIEN", datos.categoria()));
        bien.setCondicion(catalogos.obtener("CONDICION", datos.condicion()));
        copiarFicha(datos, bien);
        if (datos.asociadoA() != null) {
            reglas.cambiarPrincipal(bien, reglas.buscar(datos.asociadoA().bienId()), datos.asociadoA().posicion());
        }
        bien.registrar(actor);
        bienes.save(bien);
        if (request.inventarioPrevioId() != null) {
            var previo = previos.findByCodigo(request.inventarioPrevioId()).orElseThrow(ReglasBien::noDisponible);
            if (!previo.vigente() || previo.getBien() != null || !previo.getCentro().id().equals(centro.id())
                    || !previo.getTipo().id().equals(bien.getTipo().id()) || request.verificacion() == null) {
                throw conflicto("El antecedente de inventario no está disponible para este bien.");
            }
            previo.setBien(bien);
            previo.actualizar(actor);
            agregarVerificacion(bien, request.verificacion(), actor);
        } else if (request.verificacion() != null) {
            acceso.accionCentro("bien.verificar", centro.codigo());
            agregarVerificacion(bien, request.verificacion(), actor);
        }
        return responseMapper.toResponse(bien);
    }

    @Override
    public BienResponse editar(String rotulo, UpdateBienRequest request) {
        var bien = reglas.bloquear("bien.actualizar", rotulo);
        reglas.exigirActivo(bien);
        var actor = acceso.actor();
        var datos = updateMapper.toModel(request);
        if (!bien.getRotulo().equals(datos.id()) || !bien.getAmbiente().codigo().equals(datos.ambienteId())
                || !bien.getTipo().codigo().equals(datos.tipoId()) || !bien.getCategoria().codigo().equals(datos.categoria())) {
            throw invalido("La ficha no permite cambiar el rótulo, la ubicación, el tipo ni la categoría.");
        }
        copiarFicha(datos, bien);
        reglas.cambiarCondicion(bien, datos.condicion(), datos.deterioro(), null, null, actor);
        bien.actualizar(actor);
        return responseMapper.toResponse(bien);
    }

    private void copiarFicha(BienDatos datos, Bien bien) {
        entityMapper.fromModelToEntity(datos, bien);
        bien.setNombre(datos.nombre().strip());
        var adq = FechaAdquisicion.interpretar(datos.adquisicion() == null ? null : datos.adquisicion().fecha());
        bien.setFechaAdquisicion(adq.fecha());
        bien.setPrecisionAdquisicion(adq.precision());
    }

    @Override
    public void verificar(String rotulo, BienOperaciones.Verificacion request) {
        var bien = reglas.bloquear("bien.verificar", rotulo);
        reglas.exigirActivo(bien);
        agregarVerificacion(bien, request, acceso.actor());
    }

    @Override
    public void verificarLote(BienOperaciones.LoteVerificacion request) {
        var ambiente = reglas.ambiente(request.ambienteId());
        reglas.bloquear("bien.verificar", reglas.centro(ambiente));
        var actor = acceso.actor();
        for (var registro : request.registros().entrySet()) {
            var bien = reglas.buscar(registro.getKey());
            if (!bien.getAmbiente().id().equals(ambiente.id())) throw noDisponible();
            reglas.exigirActivo(bien);
            agregarVerificacion(bien, registro.getValue(), actor);
        }
    }

    private void agregarVerificacion(Bien bien, BienOperaciones.Verificacion request, Usuario actor) {
        var coincide = "coincide".equals(request.resultado());
        var hecho = reglas.evento(bien, "VERIFICACION", coincide ? "Coincide con lo informado" : "Se informan diferencias",
                request.nota(), request.fecha(), actor);
        hecho.setResultado(codigo(request.resultado()));
        historial.save(hecho);
    }

    @Override
    public void asociar(String rotulo, BienOperaciones.Asociacion request) {
        var bien = reglas.bloquear("bien.componente", rotulo);
        reglas.exigirActivo(bien);
        var anterior = bien.getPrincipal();
        var posicionAnterior = bien.getPosicion();
        var padre = request.padreId() == null ? null : reglas.buscar(request.padreId());
        if (anterior == null && padre == null) return;
        var actor = acceso.actor();
        reglas.cambiarPrincipal(bien, padre, request.posicion());
        bien.actualizar(actor);
        reglas.resolverRevision(bien, padre == null ? "DESASOCIACION" : "ASOCIACION", null, actor);
        var hecho = reglas.evento(bien, "ASOCIACION",
                padre == null ? "Deja de ser componente de " + anterior.getRotulo() : "Componente de " + padre.getNombre() + " " + padre.getRotulo(),
                padre == null ? "La relación anterior se conserva como antecedente." : "Posición: " + bien.getPosicion() + ".",
                null, actor);
        hecho.setPrincipalAnterior(anterior);
        hecho.setPrincipalNuevo(padre);
        hecho.setPosicionAnterior(posicionAnterior);
        hecho.setPosicionNueva(bien.getPosicion());
        historial.save(hecho);
    }

    @Override
    public void trasladar(String rotulo, BienOperaciones.Traslado request) {
        var bien = reglas.bloquear("bien.trasladar", rotulo);
        reglas.exigirActivo(bien);
        var origen = bien.getAmbiente();
        var destino = reglas.ambiente(request.ambienteId());
        if (origen.id().equals(destino.id()) || !reglas.centro(origen).id().equals(reglas.centro(destino).id())) {
            throw invalido("Traslado no permitido.");
        }
        reglas.exigirAmbienteVigente(destino);
        var actor = acceso.actor();
        var padre = bien.getPrincipal();
        var hijos = reglas.componentes(bien);
        if (padre != null) {
            reglas.cambiarPrincipal(bien, null, null);
            reglas.resolverRevision(bien, "TRASLADO", request.fecha(), actor);
        }
        var titulo = "Traslado: " + reglas.etiquetaAmbiente(origen) + " → " + reglas.etiquetaAmbiente(destino);
        var detalle = padre != null ? "Deja de ser componente de " + padre.getRotulo() + "."
                : hijos.size() == 1 ? "Se traslada también 1 componente."
                : hijos.isEmpty() ? null : "Se trasladan también " + hijos.size() + " componentes.";
        var grupo = reglas.evento(bien, "TRASLADO", titulo, detalle, request.fecha(), actor);
        grupo.setDestino(destino);
        grupo.setPrincipalAnterior(padre);
        historial.save(grupo);

        for (var hijo : hijos) {
            var entrada = reglas.evento(hijo, "TRASLADO", titulo, null, request.fecha(), actor);
            entrada.setDestino(destino);
            entrada.setTrasladoPrincipal(grupo);
            historial.save(entrada);
        }

        var movidos = new ArrayList<>(hijos);
        movidos.add(bien);
        for (var movido : movidos) {
            movido.setAmbiente(destino);
            movido.actualizar(actor);
        }
    }

    @Override
    public void cerrarRevision(String rotulo) {
        var bien = reglas.bloquear("bien.baja", rotulo);
        reglas.resolverRevision(bien, "CIERRE", null, acceso.actor());
    }

    @Override
    public void cambiarEstado(String rotulo, String motivo) {
        var bien = reglas.bloquear("bien.anular", rotulo);
        var actor = acceso.actor();
        if (motivo == null) {
            reglas.exigirAmbienteVigente(bien.getAmbiente());
            if (!bien.vigente()) bien.reactivar(actor);
        } else if (bien.vigente()) {
            if (reglas.componentes(bien).stream().anyMatch(reglas::activo)) {
                throw conflicto("Resuelva primero los componentes activos del bien.");
            }
            bien.anular(actor, motivo.strip());
        }
    }
}
