package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.Perfil;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PerfilRepositoryImpl implements PerfilRepository {
    private final PerfilJpaRepository jpaRepository;

    @Override
    public Optional<Perfil> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public List<Perfil> findAll() {
        return jpaRepository.findAll();
    }
}
