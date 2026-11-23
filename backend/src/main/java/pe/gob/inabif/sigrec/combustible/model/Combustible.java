package pe.gob.inabif.sigrec.combustible.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;
import pe.gob.inabif.sigrec.itinerario.model.Itinerario;
import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

@Getter
@Setter
@Entity
@Table(name = "SGR_COMBUSTIBLE", uniqueConstraints = {
    @UniqueConstraint(name = "UK_MOV_COM_CODIGO", columnNames = "CODIGO"),
    @UniqueConstraint(name = "IX_MOV_COM_ITI_VIG", columnNames = "ITINERARIO_VIGENTE")
})
@Check(name = "CK_MOV_COM_TIPO_OBJETIVO", constraints = "(TIPO = 'CARGA' AND ID_VEHICULO IS NOT NULL AND ID_ITINERARIO IS NULL) OR (TIPO = 'CONSUMO' AND ID_VEHICULO IS NULL AND ID_ITINERARIO IS NOT NULL)")
@Check(name = "CK_MOV_COM_CANT_LITRO", constraints = "CANT_LITRO > 0")
public class Combustible extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "TIPO", nullable = false, length = 7)
    private String tipo;
    @Column(name = "FEC_COMBUSTIBLE", nullable = false)
    private LocalDate fecha;
    @Column(name = "CANT_LITRO", nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;
    @Column(name = "SUSTENTO", length = 1000)
    private String sustento;
    @Column(name = "AUTOR_REFERENCIA", length = 180)
    private String autorReferencia;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_VEHICULO", foreignKey = @ForeignKey(name = "FK_MOV_COM_MOV_VEH"))
    private Vehiculo vehiculo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ITINERARIO", foreignKey = @ForeignKey(name = "FK_MOV_COM_MOV_ITI"))
    private Itinerario itinerario;
    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 THEN ID_ITINERARIO END")
    @Column(name = "ITINERARIO_VIGENTE")
    private Long itinerarioVigente;

    public Vehiculo titular() { return vehiculo == null ? itinerario.getVehiculo() : vehiculo; }
}
