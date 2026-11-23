package pe.gob.inabif.sigrec.permiso.service;

import pe.gob.inabif.sigrec.permiso.model.Permiso;
import pe.gob.inabif.sigrec.permiso.dtos.PermisoResponse;
import pe.gob.inabif.sigrec.permiso.repository.PermisoRepository;
import pe.gob.inabif.sigrec.permiso.mappers.PermisoResponseMapper;
import pe.gob.inabif.sigrec.security.Acceso;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermisoServiceImpl implements PermisoService {
    private final PermisoRepository repository;
    private final PermisoResponseMapper mapper;
    private final Acceso acceso;

    @Override
    public List<PermisoResponse> listar() {
        acceso.global("usuario.asignar");
        return repository.findAll().stream().filter(Permiso::vigente)
                .map(mapper::toResponse).toList();
    }
}
