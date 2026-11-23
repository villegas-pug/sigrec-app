package pe.gob.inabif.sigrec.auth.repository;

import pe.gob.inabif.sigrec.auth.model.Sesion;
import java.util.*;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class SesionRepositoryImpl implements SesionRepository {
    private final SesionJpaRepository jpaRepository;

    @Override
    public Optional<Sesion> findByHashAndRevocadaIsNull(String hash) {
        return jpaRepository.findByHashAndRevocadaIsNull(hash);
    }

    @Override
    public void revocarTodas(Long usuario, Instant ahora) {
        jpaRepository.revocarTodas(usuario, ahora);
    }

    @Override
    public void revocar(String hash, Instant ahora) {
        jpaRepository.revocar(hash, ahora);
    }

    @Override
    public Sesion save(Sesion sesion) {
        return jpaRepository.save(sesion);
    }
}
