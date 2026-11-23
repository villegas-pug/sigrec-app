package pe.gob.inabif.sigrec.mantenimiento.repository;

import java.util.*;
import pe.gob.inabif.sigrec.mantenimiento.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface MantenimientoJpaRepository extends JpaRepository<Mantenimiento, Long> {
    Optional<Mantenimiento> findByCodigo(String codigo);
    List<Mantenimiento> findAllByOrderById();
    @Query("select m from Mantenimiento m left join m.centro c left join m.bien b left join b.ambiente a left join a.modulo mo left join mo.centro bc left join m.vehiculo v where c.codigo in :centros or bc.codigo in :centros or v.id in :vehiculos order by m.id")
    List<Mantenimiento> listarAmbito(Collection<String> centros, Collection<Long> vehiculos);
}
