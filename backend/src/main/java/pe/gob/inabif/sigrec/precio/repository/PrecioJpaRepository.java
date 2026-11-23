package pe.gob.inabif.sigrec.precio.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.gob.inabif.sigrec.precio.model.Precio;

@Repository
public interface PrecioJpaRepository extends JpaRepository<Precio, Long> {
    @Query("""
            select p from Precio p join fetch p.tipo
            where p.estado = 1 and p.eliminado = 0 and p.reemplazadoEl is null order by p.id desc
            """)
    List<Precio> listarActuales();

    @Query("""
            select p from Precio p join fetch p.tipo left join fetch p.reemplazadoPor
            where p.estado = 1 and p.eliminado = 0 order by p.id desc
            """)
    List<Precio> listarConHistorial();

    @Query("""
            select p from Precio p
            where p.tipo.id = :tipoId and p.estado = 1 and p.eliminado = 0 and p.reemplazadoEl is null
            """)
    Optional<Precio> buscarActual(Long tipoId);

    @Query("""
            select p from Precio p left join fetch p.reemplazadoPor
            where p.tipo.id = :tipoId and p.estado = 1 and p.eliminado = 0 order by p.id desc
            """)
    List<Precio> listarPorTipo(Long tipoId);

    boolean existsByTipoId(Long tipoId);
}
