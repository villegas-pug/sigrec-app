package pe.gob.inabif.sigrec.itinerario.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.vehiculo.model.Vehiculo;

@Getter
@Setter
@Entity
@Table(name = "SGR_ITINERARIO", uniqueConstraints = @UniqueConstraint(name = "UK_MOV_ITI_CODIGO", columnNames = "CODIGO"))
@Check(name = "CK_MOV_ITI_PREVISTO", constraints = "MIN_SALIDA BETWEEN 0 AND 1439 AND MIN_LLEGADA BETWEEN 0 AND 1439 AND MIN_LLEGADA >= MIN_SALIDA AND DISTANCIA_KM >= 0")
@Check(name = "CK_MOV_ITI_REAL", constraints = "(EJECUTADO = 1 OR (EJECUTADO = 0 AND MIN_SALIDA_REAL IS NULL AND MIN_LLEGADA_REAL IS NULL AND DISTANCIA_KM_REAL IS NULL)) AND MIN_SALIDA_REAL BETWEEN 0 AND 1439 AND MIN_LLEGADA_REAL BETWEEN 0 AND 1439 AND MIN_LLEGADA_REAL >= MIN_SALIDA_REAL AND DISTANCIA_KM_REAL >= 0")
@Check(name = "CK_MOV_ITI_RUTA", constraints = "MODO_RUTA IN ('MANUAL', 'MAPA') AND (MODO_RUTA = 'MANUAL' OR DISTANCIA_KM IS NULL) AND ((PROVEEDOR_RUTA IS NULL AND DISTANCIA_RUTA_M IS NULL AND GEOMETRIA_RUTA IS NULL) OR (MODO_RUTA = 'MAPA' AND PROVEEDOR_RUTA IS NOT NULL AND DISTANCIA_RUTA_M >= 0 AND GEOMETRIA_RUTA IS NOT NULL))")
@Check(name = "CK_MOV_ITI_GEOMETRIA_RUTA", constraints = "GEOMETRIA_RUTA IS JSON")
@Check(name = "CK_MOV_ITI_DESTINOS", constraints = "DESTINOS IS JSON")
public class Itinerario extends Auditable {
    @Column(name = "CODIGO", nullable = false, length = 40)
    private String codigo;
    @Column(name = "FEC_ITINERARIO", nullable = false)
    private LocalDate fecha;
    @Column(name = "PROPOSITO", nullable = false, length = 500)
    private String proposito;
    @Column(name = "MODO_RUTA", nullable = false, length = 6)
    private String modoRuta;
    @Column(name = "MIN_SALIDA")
    private Integer salida;
    @Column(name = "MIN_LLEGADA")
    private Integer llegada;
    @Column(name = "DISTANCIA_KM", precision = 12, scale = 2)
    private BigDecimal km;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_VEHICULO", nullable = false, foreignKey = @ForeignKey(name = "FK_MOV_ITI_MOV_VEH"))
    private Vehiculo vehiculo;
    @Column(name = "EJECUTADO", nullable = false)
    private int ejecutado;
    @Column(name = "MIN_SALIDA_REAL")
    private Integer salidaReal;
    @Column(name = "MIN_LLEGADA_REAL")
    private Integer llegadaReal;
    @Column(name = "DISTANCIA_KM_REAL", precision = 12, scale = 2)
    private BigDecimal kmReal;
    @Column(name = "PROVEEDOR_RUTA", length = 60)
    private String proveedorRuta;
    @Column(name = "DISTANCIA_RUTA_M", precision = 14, scale = 3)
    private BigDecimal distanciaRuta;
    @Lob
    @Column(name = "GEOMETRIA_RUTA")
    private String geometria;
    @Lob
    @Column(name = "DESTINOS")
    private String destinos;
}
