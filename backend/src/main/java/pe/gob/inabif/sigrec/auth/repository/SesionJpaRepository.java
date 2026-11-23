package pe.gob.inabif.sigrec.auth.repository;

import pe.gob.inabif.sigrec.auth.model.Sesion;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

@org.springframework.stereotype.Repository
public interface SesionJpaRepository extends JpaRepository<Sesion, String> {
    @EntityGraph(attributePaths = "usuario")
    Optional<Sesion> findByHashAndRevocadaIsNull(String hash);

    @Modifying
    @Query("update Sesion s set s.revocada = :ahora where s.usuario.id = :usuario and s.revocada is null")
    void revocarTodas(@Param("usuario") Long usuario, @Param("ahora") Instant ahora);

    @Modifying
    @Query("update Sesion s set s.revocada = :ahora where s.hash = :hash and s.revocada is null")
    void revocar(@Param("hash") String hash, @Param("ahora") Instant ahora);
}
