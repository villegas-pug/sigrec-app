package pe.gob.inabif.sigrec.vehiculo.repository;

import java.util.*;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface VehiculoJpaRepository extends JpaRepository<Vehiculo, Long> {
    Optional<Vehiculo> findByCodigo(String codigo);
    List<Vehiculo> findAllByOrderById();
    @Query("select v from Vehiculo v where v.centro.codigo in :centros or v.codigo in :codigos order by v.id")
    List<Vehiculo> listarAmbito(Collection<String> centros, Collection<String> codigos);
    boolean existsByCodigo(String codigo);
    boolean existsByCentroIdAndEstadoAndEliminado(Long centroId, int estado, int eliminado);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehiculo v where v.codigo = :codigo")
    Optional<Vehiculo> bloquear(String codigo);
    @Query("select case when count(v) > 0 then true else false end from Vehiculo v where v.placa = :placa and v.estado = 1 and v.eliminado = 0 and (:id is null or v.id <> :id)")
    boolean placaOcupada(String placa, Long id);
}
