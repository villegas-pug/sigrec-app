package pe.gob.inabif.sigrec.perfil.repository;

import pe.gob.inabif.sigrec.perfil.model.Perfil;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

@org.springframework.stereotype.Repository
public interface PerfilJpaRepository extends JpaRepository<Perfil, Long> {
    Optional<Perfil> findByCodigo(String codigo);
}
