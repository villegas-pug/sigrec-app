package pe.gob.inabif.sigrec.incidencia.mappers;

import org.mapstruct.Mapper;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.bien.model.HistorialBien;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.config.BaseMapStructConfig;
import pe.gob.inabif.sigrec.incidencia.dtos.IncidenciaResponse;
import pe.gob.inabif.sigrec.incidencia.model.*;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;

import java.time.LocalDate;
import java.util.*;

@Mapper(config = BaseMapStructConfig.class)
public interface IncidenciaResponseMapper {
    default IncidenciaResponse resumen(Incidente hecho) {
        return new IncidenciaResponse(hecho.getCodigo(), hecho.getTitulo());
    }

    default Map<String,Object> toResponse(Incidente h, List<BienImplicado> implicados, Atencion atencion) {
        var ids = implicados.stream().map(a -> a.getBien().getRotulo()).toList();
        var tipoOrigen = menor(h.getOrigen());
        var ambiente = h.getAmbiente() == null ? null : h.getAmbiente().codigo();
        var origen = h.getBienOrigen() == null
                ? (ambiente == null ? h.getCentro().codigo() : ambiente) : h.getBienOrigen().getRotulo();
        var vista = base(h, h.getTipo().codigo(), h.getFecha(), h.getTitulo(), h.getDetalle(), ambiente, ids);
        vista.put("carId", h.getCentro().codigo());
        vista.put("origen", Map.of("tipo", tipoOrigen, "id", origen));
        vista.put("contextoOrigen", contexto(h, ambiente));
        vista.put("requiereEvaluacion", h.getRequiereEvaluacion() == 1);
        if (h.getUbicacion() != null) vista.put("ubicacion", h.getUbicacion());
        if ("NOVEDAD".equals(h.getClase())) vista.put("clase", "novedad");
        var evaluaciones = new LinkedHashMap<String, Object>();
        implicados.forEach(a -> evaluaciones.put(a.getBien().getRotulo(), Map.of(
                "requiereReposicion", a.getRequiereReposicion() == 1, "unidades", a.getCantidad())));
        vista.put("evaluaciones", evaluaciones);
        if (atencion != null) {
            var datos = new LinkedHashMap<String,Object>();
            datos.put("fecha", atencion.getFecha());
            datos.put("detalle", atencion.getDetalle());
            datos.put("por", atencion.getAutorReferencia() == null ? atencion.autorRegistro() : atencion.getAutorReferencia());
            vista.put("atencion", datos);
        }
        return vista;
    }

    default Map<String,Object> toResponse(Baja h, List<BienImplicado> implicados) {
        var bien = h.getBien();
        var ambiente = h.getAmbiente() == null ? bien.getAmbiente() : h.getAmbiente();
        var vista = base(h, "baja", h.getFecha(), h.getTitulo(), h.getDetalle(), ambiente.codigo(), List.of(bien.getRotulo()));
        vista.put("componentes", implicados.stream().map(this::componente).toList());
        return vista;
    }

    default Map<String,Object> toResponse(Reposicion h, List<BienImplicado> implicados) {
        var anterior = h.getBaja().getBien();
        var nuevo = h.getBienNuevo();
        var ambiente = h.getBaja().getAmbiente() == null ? anterior.getAmbiente() : h.getBaja().getAmbiente();
        var vista = base(h, "reposicion", h.getFecha(), h.getTitulo(), h.getDetalle(),
                ambiente.codigo(), List.of(anterior.getRotulo(), nuevo.getRotulo()));
        vista.put("bienAnteriorId", anterior.getRotulo());
        vista.put("bienNuevoId", nuevo.getRotulo());
        vista.put("trasladados", implicados.stream().map(x -> x.getBien().getRotulo()).toList());
        return vista;
    }

    default Map<String,Object> toResponse(HistorialBien h, List<HistorialBien> hijos) {
        var ids = new ArrayList<String>();
        ids.add(h.getBien().getRotulo());
        if (h.getPrincipalNuevo() != null) ids.add(h.getPrincipalNuevo().getRotulo());
        hijos.forEach(x -> ids.add(x.getBien().getRotulo()));
        var ambiente = h.getDestino() == null ? h.getAmbiente() : h.getDestino();
        var vista = base(h, menor(h.getTipo()), h.getFecha(), h.getTitulo(), h.getDetalle(),
                ambiente == null ? null : ambiente.codigo(), ids);
        if (h.getResultado() != null) vista.put("resultado", menor(h.getResultado()));
        if ("CONDICION".equals(h.getTipo())) {
            vista.put("condicionAnterior", codigo(h.getCondicionAnterior()));
            vista.put("condicionNueva", codigo(h.getCondicionNueva()));
        }
        if (h.isCargaInicial()) vista.put("cargaInicial", true);
        return vista;
    }

    private Map<String,Object> base(HechoAuditable h, String tipo, LocalDate fecha, String titulo, String detalle, String ambiente, List<String> ids) {
        var vista = new LinkedHashMap<String,Object>();
        vista.put("id", h.getCodigo());
        vista.put("tipo", tipo);
        vista.put("fecha", fecha);
        vista.put("titulo", titulo);
        vista.put("detalle", detalle);
        vista.put("ambienteId", ambiente);
        vista.put("bienIds", ids);
        vista.put("informadoPor", h.getAutorReferencia() == null ? h.autorRegistro() : h.getAutorReferencia());
        if (h.getOrdenImportacion() == null) vista.put("registradoEl", h.fechaRegistro().toLocalDate());
        if (h.actualizacion() != null) vista.put("modificado", h.actualizacion());
        if (h.anulacion() != null) vista.put("anulacion", h.anulacion());
        return vista;
    }

    private Map<String,Object> componente(BienImplicado i) {
        var r = new LinkedHashMap<String,Object>();
        r.put("bienId", i.getBien().getRotulo());
        r.put("posicion", i.getPosicion());
        if (i.getResolucion() != null) {
            r.put("resolucion", menor(i.getResolucion()));
            r.put("fechaResolucion", i.getFechaResolucion());
        }
        return r;
    }

    private Map<String,Object> contexto(Incidente h, String ambiente) {
        var r = new LinkedHashMap<String,Object>();
        r.put("carId", h.getCentro().codigo());
        r.put("ambienteId", ambiente);
        r.put("nombre", h.getNombreOrigen());
        if (h.getNombrePadre() != null) {
            Bien principal = h.getPrincipalOrigen();
            var tipo = principal != null ? "bien" : h.getBienOrigen() != null ? "ambiente" : "modulo";
            var id = principal != null ? principal.getRotulo() : "ambiente".equals(tipo) ? ambiente
                    : h.getModulo() == null ? null : h.getModulo().codigo();
            if (id != null) r.put("padre", Map.of("tipo", tipo, "id", id, "nombre", h.getNombrePadre()));
        }
        return r;
    }

    private String menor(String v) { return v.toLowerCase(Locale.ROOT); }
    private String codigo(Catalogo c) { return c == null ? null : c.codigo(); }
}
