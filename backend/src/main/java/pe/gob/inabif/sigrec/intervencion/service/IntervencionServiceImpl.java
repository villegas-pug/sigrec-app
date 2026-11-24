package pe.gob.inabif.sigrec.intervencion.service;

import pe.gob.inabif.sigrec.shared.model.FiltroConsulta;

import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.intervencion.dtos.*;
import pe.gob.inabif.sigrec.intervencion.mappers.*;
import pe.gob.inabif.sigrec.intervencion.model.Intervencion;
import pe.gob.inabif.sigrec.intervencion.repository.IntervencionRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@Transactional
@RequiredArgsConstructor
public class IntervencionServiceImpl implements IntervencionService {
    private final IntervencionRepository intervenciones;
    private final ReglasBien bienes;
    private final Acceso acceso;
    private final IntervencionEntityMapper entityMapper;
    private final IntervencionCreateMapper createMapper;
    private final IntervencionUpdateMapper updateMapper;
    private final IntervencionResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<IntervencionResponse> listar(FiltroConsulta filtro) {
        var grants = acceso.consultaCentros();
        var filas = grants.stream().anyMatch(Acceso.Asignacion::global) ? intervenciones.findAllByOrderById()
                : intervenciones.findByAmbienteModuloCentroCodigoInOrderById(grants.stream().map(a -> a.centro().codigo()).distinct().toList());
        return filas.stream().filter(i -> filtro.admite(i.getAmbiente().modulo().centro().codigo(), i.fechaRegistro())).sorted(Comparator.comparing(Intervencion::getOrdenImportacion,
                Comparator.nullsFirst(Comparator.naturalOrder())).thenComparing(Intervencion::id, Comparator.reverseOrder()))
                .map(responseMapper::toResponse).toList();
    }

    @Override
    public IntervencionResponse.Cambio crear(CreateIntervencionRequest request) {
        var ambiente = bienes.ambiente(request.ambienteId());
        bienes.bloquear("intervencion.registrar", bienes.centro(ambiente));
        bienes.exigirAmbienteVigente(ambiente);
        var actor = acceso.actor();
        var registro = new Intervencion();
        registro.asignarCodigo("INT-");
        registro.setAmbiente(ambiente);
        copiar(registro, createMapper.toModel(request));
        registro.registrar(actor);
        modificarUltimoPintado(registro, ambiente, actor);
        return responseMapper.cambio(intervenciones.save(registro));
    }

    @Override
    public IntervencionResponse.Cambio editar(String codigo, UpdateIntervencionRequest request) {
        var registro = bloquear(codigo, "intervencion.actualizar");
        if (!registro.vigente()) throw conflicto("La intervención está anulada.");
        bienes.exigirAmbienteVigente(registro.getAmbiente());
        var actor = acceso.actor();
        copiar(registro, request);
        registro.actualizar(actor);
        modificarUltimoPintado(registro, registro.getAmbiente(), actor);
        return responseMapper.cambio(registro);
    }

    @Override
    public IntervencionResponse.Cambio cambiarEstado(String codigo, String motivo) {
        var registro = bloquear(codigo, "intervencion.anular");
        if (motivo == null && !registro.vigente()) registro.reactivar(acceso.actor());
        else if (motivo != null && registro.vigente()) registro.anular(acceso.actor(), motivo.strip());
        return responseMapper.cambio(registro);
    }

    private Intervencion bloquear(String codigo, String permiso) {
        var registro = intervenciones.findByCodigo(codigo).orElseThrow(() -> noDisponible());
        bienes.bloquear(permiso, bienes.centro(registro.getAmbiente()));
        return registro;
    }

    private void copiar(Intervencion i, UpdateIntervencionRequest request) {
        var mes = updateMapper.mes(request);
        if (mes != null) {
            if (mes.getYear() < 1) throw invalido("Indique un mes de intervención válido.");
            fecha(mes);
        }
        entityMapper.fromModelToEntity(request.datos(), i);
        i.setFecha(mes);
        i.setPintado(request.datos().esPintado() ? 1 : 0);
    }

    private void modificarUltimoPintado(Intervencion i, Ambiente a, Usuario actor) {
        var mes = i.getFecha();
        if (i.getPintado() == 1 && mes != null && (a.getUltimoPintado() == null || mes.isAfter(a.getUltimoPintado()))) {
            a.setUltimoPintado(mes);
            a.actualizar(actor);
        }
    }
}
