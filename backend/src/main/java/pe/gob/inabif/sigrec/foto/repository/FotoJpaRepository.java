package pe.gob.inabif.sigrec.foto.repository;

import java.util.*;
import pe.gob.inabif.sigrec.foto.model.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface FotoJpaRepository extends JpaRepository<Foto, Long> {
    Optional<Foto> findByCodigo(String codigo);
    List<Foto> findAllByOrderById();
    @Query("select f from Foto f left join f.centro c left join f.ambiente a left join a.modulo am left join am.centro ac left join f.bien b left join b.ambiente ba left join ba.modulo bm left join bm.centro bc where c.codigo in :centros or ac.codigo in :centros or bc.codigo in :centros order by f.id")
    List<Foto> listarAmbito(Collection<String> centros);
}
