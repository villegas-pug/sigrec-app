package pe.gob.inabif.sigrec.modulo.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.centro.model.Centro;
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
@Table(name = "SGR_MODULO", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_MODULO_COD", columnNames = "CODIGO"))
@Check(name = "SGR_CK_MODULO_TIPO", constraints = "TIPO in ('CASA', 'COMUN') and (TIPO = 'CASA' or CANT_CAPACIDAD is null)")
public class Modulo extends Auditable {
    @Column(name = "CODIGO", length = 40, nullable = false)
    private String codigo;
    @Column(name = "NOMBRE", length = 180, nullable = false)
    private String nombre;
    @Column(name = "TIPO", length = 8, nullable = false)
    private String tipo;
    @Column(name = "CANT_CAPACIDAD")
    private Integer capacidad;
    @Column(name = "CANT_PISO")
    private Integer pisos;
    @Column(name = "AREA_M2", precision = 12, scale = 2)
    private BigDecimal areaM2;
    @Column(name = "UBICACION", length = 1000)
    private String ubicacion;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CENTRO", nullable = false)
    private Centro centro;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CONDICION", nullable = false)
    private Catalogo condicion;

    public String codigo() { return codigo; }
    public Centro centro() { return centro; }
}
