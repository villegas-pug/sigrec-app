package pe.gob.inabif.sigrec.foto.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.hibernate.engine.jdbc.BlobProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pe.gob.inabif.sigrec.bien.service.ReglasBien;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.centro.repository.CentroRepository;
import pe.gob.inabif.sigrec.centro.service.CentroService;
import pe.gob.inabif.sigrec.foto.dtos.*;
import pe.gob.inabif.sigrec.foto.mappers.*;
import pe.gob.inabif.sigrec.foto.model.Foto;
import pe.gob.inabif.sigrec.foto.repository.FotoRepository;
import pe.gob.inabif.sigrec.security.Acceso;
import pe.gob.inabif.sigrec.shared.model.Hoy;
import pe.gob.inabif.sigrec.usuario.model.Usuario;

import static pe.gob.inabif.sigrec.bien.service.ReglasBien.*;

@Service
@Transactional
@RequiredArgsConstructor
public class FotoServiceImpl implements FotoService {
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private final FotoRepository fotos;
    private final CentroRepository centrosRepo;
    private final CentroService centros;
    private final ReglasBien bienes;
    private final Acceso acceso;
    private final FotoCreateMapper createMapper;
    private final FotoUpdateMapper updateMapper;
    private final FotoEntityMapper entityMapper;
    private final FotoResponseMapper responseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<FotoResponse> listar() {
        var grants = acceso.consultaCentros();
        var filas = grants.stream().anyMatch(Acceso.Asignacion::global) ? fotos.findAllByOrderById()
                : fotos.listarAmbito(grants.stream().map(a -> a.centro().codigo()).distinct().toList());
        return filas.stream().map(responseMapper::toResponse).toList();
    }

    @Override
    public FotoResponse crear(CreateFotoRequest request, MultipartFile archivo) {
        var datos = updateMapper.toModel(createMapper.toModel(request));
        var foto = new Foto();
        if (request.bienId() != null) {
            if (request.carId() != null || datos.ambienteId() != null) throw invalido("Indique un solo objetivo.");
            var bien = bienes.bloquear("centro.foto", request.bienId());
            bienes.exigirActivo(bien);
            bienes.exigirAmbienteVigente(bien.getAmbiente());
            foto.setBien(bien);
        } else {
            if (request.carId() == null) throw invalido("Indique el centro de la fotografía.");
            acceso.accionCentro("centro.foto", request.carId());
            var centro = centros.bloquear(request.carId());
            if (!centro.vigente()) throw conflicto("El centro está anulado.");
            asignarObjetivo(foto, centro, datos.ambienteId());
        }
        incorporar(foto, archivo);
        foto.asignarCodigo("FOT-");
        foto.setFecha(Hoy.fecha());
        entityMapper.fromModelToEntity(datos, foto);
        foto.registrar(acceso.actor());
        return responseMapper.toResponse(fotos.save(foto));
    }

    @Override
    public FotoResponse editar(String codigo, UpdateFotoRequest request, MultipartFile archivo) {
        var foto = buscar(codigo);
        var centro = bloquear(foto, "foto.actualizar");
        if (!foto.vigente() || !centro.vigente()) throw conflicto("La fotografía o su centro está anulado.");
        var datos = updateMapper.toModel(request);
        if (foto.getBien() == null) asignarObjetivo(foto, centro, datos.ambienteId());
        else if (datos.ambienteId() != null) throw invalido("La fotografía conserva su bien.");
        if (archivo != null && !archivo.isEmpty()) incorporar(foto, archivo);
        entityMapper.fromModelToEntity(datos, foto);
        foto.actualizar(acceso.actor());
        return responseMapper.toResponse(foto);
    }

    @Override
    public FotoResponse cambiarEstado(String codigo, String motivo) {
        var foto = buscar(codigo);
        bloquear(foto, "foto.anular");
        if (motivo == null && !foto.vigente()) foto.reactivar(acceso.actor());
        else if (motivo != null && foto.vigente()) foto.anular(acceso.actor(), motivo.strip());
        return responseMapper.toResponse(foto);
    }

    @Override
    @Transactional(readOnly = true)
    public FotoResponse.Contenido contenido(String codigo) {
        var grants = acceso.consultaCentros();
        var foto = buscar(codigo);
        if (grants.stream().noneMatch(a -> a.cubreCentro(foto.titular().codigo())) || foto.getContenido() == null) throw noDisponible();
        try {
            return new FotoResponse.Contenido(foto.getTipoMime(), foto.getContenido().getBytes(1, (int) foto.getContenido().length()));
        } catch (SQLException e) {
            throw new IllegalStateException("No se pudo leer la fotografía.", e);
        }
    }

    private Foto buscar(String codigo) {
        return fotos.findByCodigo(codigo).orElseThrow(() -> noDisponible());
    }

    private Centro bloquear(Foto foto, String permiso) {
        var codigo = foto.titular().codigo();
        acceso.accionCentro(permiso, codigo);
        return centros.bloquear(codigo);
    }

    private void asignarObjetivo(Foto foto, Centro centro, String ambienteId) {
        var ambiente = ambienteId == null ? null : bienes.ambiente(ambienteId);
        if (ambiente != null) {
            if (!bienes.centro(ambiente).id().equals(centro.id())) throw noDisponible();
            bienes.exigirAmbienteVigente(ambiente);
        }
        foto.setCentro(ambiente == null ? centro : null);
        foto.setAmbiente(ambiente);
    }

    private void incorporar(Foto foto, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty() || archivo.getSize() > MAX_BYTES) throw invalido("Seleccione una imagen de hasta 5 MB.");
        try {
            var bytes = archivo.getBytes();
            var tipo = mime(bytes);
            if (tipo == null) throw invalido("Seleccione una imagen JPEG, PNG, GIF, WebP, BMP o AVIF.");
            var nombre = Optional.ofNullable(archivo.getOriginalFilename()).orElse("imagen").replace('\\', '/');
            nombre = nombre.substring(nombre.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").strip();
            if (nombre.isEmpty()) nombre = "imagen";
            foto.setNombreArchivo(nombre.substring(0, Math.min(nombre.length(), 255)));
            foto.setTipoMime(tipo);
            foto.setContenido(BlobProxy.generateProxy(bytes));
        } catch (IOException e) {
            throw invalido("No se pudo leer la imagen seleccionada.");
        }
    }

    private String mime(byte[] bytes) {
        if (bytes.length < 12) return null;
        var firma = new String(bytes, 0, 12, StandardCharsets.ISO_8859_1);
        if (firma.startsWith("GIF87a") || firma.startsWith("GIF89a")) return "image/gif";
        if (firma.startsWith("RIFF") && firma.endsWith("WEBP")) return "image/webp";
        if (firma.startsWith("BM")) return "image/bmp";
        if (firma.substring(4).equals("ftypavif") || firma.substring(4).equals("ftypavis")) return "image/avif";
        if (firma.startsWith("\u0089PNG\r\n\u001a\n")) return "image/png";
        if ((bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255) return "image/jpeg";
        return null;
    }
}
