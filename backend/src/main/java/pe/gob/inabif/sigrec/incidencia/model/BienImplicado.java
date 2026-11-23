package pe.gob.inabif.sigrec.incidencia.model;

import pe.gob.inabif.sigrec.shared.model.Auditable;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.GeneratedColumn;

@Getter
@Setter
@Entity
@Table(name = "SGR_BIEN_IMPLICADO", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_INC_BIM_V1", columnNames = {"V_UNICO_1_1", "V_UNICO_1_2"}),
    @UniqueConstraint(name = "SGR_UK_INC_BIM_V2", columnNames = {"V_UNICO_2_1", "V_UNICO_2_2"}),
    @UniqueConstraint(name = "SGR_UK_INC_BIM_V3", columnNames = {"V_UNICO_3_1", "V_UNICO_3_2"})
}, indexes = {
    @Index(name = "IX_INC_BIM_INC_INC", columnList = "ID_INCIDENTE"),
    @Index(name = "IX_INC_BIM_INC_BAJ", columnList = "ID_BAJA"),
    @Index(name = "IX_INC_BIM_BIE_BIE", columnList = "ID_BIEN"),
    @Index(name = "IX_INC_BIM_CAT_COND", columnList = "ID_CONDICION"),
    @Index(name = "IX_INC_BIM_INC_REP", columnList = "ID_REPOSICION")
})
@Check(name = "CK_INC_BIM_ROL", constraints = "ROL IN ('AFECTADO', 'COMPONENTE', 'REASIGNADO')")
@Check(name = "CK_INC_BIM_OBJETIVO", constraints = "(ROL = 'AFECTADO' AND ID_INCIDENTE IS NOT NULL AND ID_BAJA IS NULL AND ID_REPOSICION IS NULL) OR (ROL = 'COMPONENTE' AND ID_BAJA IS NOT NULL AND ID_INCIDENTE IS NULL AND ID_REPOSICION IS NULL) OR (ROL = 'REASIGNADO' AND ID_REPOSICION IS NOT NULL AND ID_INCIDENTE IS NULL AND ID_BAJA IS NULL)")
@Check(name = "CK_INC_BIM_AFECTADO", constraints = "ROL <> 'AFECTADO' OR (CANT_AFECTADA IS NOT NULL AND REQUIERE_REPOSICION IS NOT NULL AND FUENTE_EVALUACION IS NOT NULL AND POSICION IS NULL AND FEC_RESOLUCION IS NULL AND RESOLUCION IS NULL)")
@Check(name = "CK_INC_BIM_SIN_EVALUACION", constraints = "ROL = 'AFECTADO' OR (CANT_AFECTADA IS NULL AND REQUIERE_REPOSICION IS NULL AND FUENTE_EVALUACION IS NULL AND ID_CONDICION IS NULL)")
@Check(name = "CK_INC_BIM_REQUIERE_REPOSICION", constraints = "REQUIERE_REPOSICION IN (0, 1)")
@Check(name = "CK_INC_BIM_CANT_AFECTADA", constraints = "CANT_AFECTADA > 0")
@Check(name = "CK_INC_BIM_FUENTE_EVALUACION", constraints = "FUENTE_EVALUACION IN ('INDIVIDUAL', 'HISTORICA')")
@Check(name = "CK_INC_BIM_RESOLUCION", constraints = "RESOLUCION IN ('CIERRE', 'BAJA', 'ASOCIACION', 'DESASOCIACION', 'TRASLADO', 'REPOSICION')")
@Check(name = "CK_INC_BIM_REASIGNADO", constraints = "ROL <> 'REASIGNADO' OR (RESOLUCION IS NULL AND FEC_RESOLUCION IS NULL)")
public class BienImplicado extends Auditable {
    @Column(name = "ROL", length = 12, nullable = false)
    private String rol;

    @Column(name = "CANT_AFECTADA")
    private Integer cantidad;

    @Column(name = "REQUIERE_REPOSICION")
    private Integer requiereReposicion;

    @Column(name = "FUENTE_EVALUACION", length = 12)
    private String fuente;

    @Column(name = "POSICION", length = 180)
    private String posicion;

    @Column(name = "FEC_RESOLUCION")
    private LocalDate fechaResolucion;

    @Column(name = "RESOLUCION", length = 25)
    private String resolucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_INCIDENTE")
    private Incidente incidente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_BAJA")
    private Baja baja;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_REPOSICION")
    private Reposicion reposicion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_BIEN", nullable = false)
    private Bien bien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONDICION")
    private Catalogo condicion;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_INCIDENTE IS NOT NULL THEN ID_INCIDENTE END")
    @Column(name = "V_UNICO_1_1")
    private Long unico1_1;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_INCIDENTE IS NOT NULL THEN ID_BIEN END")
    @Column(name = "V_UNICO_1_2")
    private Long unico1_2;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_BAJA IS NOT NULL THEN ID_BAJA END")
    @Column(name = "V_UNICO_2_1")
    private Long unico2_1;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_BAJA IS NOT NULL THEN ID_BIEN END")
    @Column(name = "V_UNICO_2_2")
    private Long unico2_2;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_REPOSICION IS NOT NULL THEN ID_REPOSICION END")
    @Column(name = "V_UNICO_3_1")
    private Long unico3_1;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_REPOSICION IS NOT NULL THEN ID_BIEN END")
    @Column(name = "V_UNICO_3_2")
    private Long unico3_2;
}
