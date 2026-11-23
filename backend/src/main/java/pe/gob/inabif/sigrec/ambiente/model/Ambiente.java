package pe.gob.inabif.sigrec.ambiente.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
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
@Table(name = "SGR_AMBIENTE", uniqueConstraints = @UniqueConstraint(name = "SGR_UK_AMBIENTE_COD", columnNames = "CODIGO"))
public class Ambiente extends Auditable {
    @Column(name = "CODIGO", length = 40, nullable = false)
    private String codigo;
    @Column(name = "NOMBRE", length = 180, nullable = false)
    private String nombre;
    @Column(name = "NUM_PISO")
    private Integer piso;
    @Column(name = "BLOQUE", length = 80)
    private String bloque;
    @Column(name = "UBICACION", length = 1000)
    private String ubicacion;
    @Column(name = "AREA_M2", precision = 12, scale = 2)
    private BigDecimal areaM2;
    @Column(name = "CANT_PUERTA")
    private Integer puertas;
    @Column(name = "CANT_VENTANA")
    private Integer ventanas;
    @Column(name = "FEC_PINTADO_INFORMADO")
    private LocalDate ultimoPintado;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_MODULO", nullable = false)
    private Modulo modulo;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CONDICION", nullable = false)
    private Catalogo condicion;

    public String codigo() { return codigo; }
    public Modulo modulo() { return modulo; }
}
