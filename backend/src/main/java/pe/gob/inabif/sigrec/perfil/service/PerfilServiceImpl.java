package pe.gob.inabif.sigrec.perfil.service;

import pe.gob.inabif.sigrec.perfil.model.Perfil;
import pe.gob.inabif.sigrec.perfil.dtos.PerfilResponse;
import pe.gob.inabif.sigrec.perfil.repository.PerfilRepository;
import pe.gob.inabif.sigrec.perfil.mappers.PerfilResponseMapper;
import pe.gob.inabif.sigrec.security.Acceso;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerfilServiceImpl implements PerfilService {
    private final PerfilRepository repository;
    private final PerfilResponseMapper mapper;
    private final Acceso acceso;

    @Override
    public List<PerfilResponse> listar() {
        acceso.global("usuario.asignar");
        return repository.findAll().stream().filter(Perfil::vigente)
                .map(p -> mapper.toResponse(p, switch (p.getCodigo()) {
                    case "CENTRAL" -> "GLOBAL";
                    case "CHOFER" -> "VEHICULO";
                    default -> "CENTRO";
                })).toList();
    }
}
