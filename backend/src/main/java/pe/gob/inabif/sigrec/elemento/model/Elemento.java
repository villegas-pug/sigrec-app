package pe.gob.inabif.sigrec.elemento.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.hibernate.annotations.Check;

@Getter
@Setter
@Entity
@Table(name = "SGR_ELEMENTO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_ELEMENTO_OBJ", columnNames = {"ID_CENTRO","ID_MODULO","ID_AMBIENTE","CLAVE_NORMALIZADA"}))
@Check(name = "SGR_CK_ELEMENTO_OBJ", constraints = """
    ((case when ID_CENTRO is null then 0 else 1 end)
    + (case when ID_MODULO is null then 0 else 1 end)
    + (case when ID_AMBIENTE is null then 0 else 1 end)) = 1
    and ((ID_ELEMENTO_BASE is not null and NOMBRE is null and ID_CONDICION is not null)
    or (ID_ELEMENTO_BASE is null and NOMBRE is not null and ID_AMBIENTE is null))
    """)
public class Elemento extends Auditable {
    @Column(name = "NOMBRE", length = 40)
    private String nombre;
    @Column(name = "CLAVE_NORMALIZADA", length = 80, nullable = false)
    private String clave;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CENTRO")
    private Centro centro;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_MODULO")
    private Modulo modulo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_AMBIENTE")
    private Ambiente ambiente;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ELEMENTO_BASE")
    private Catalogo base;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONDICION")
    private Catalogo condicion;

}
