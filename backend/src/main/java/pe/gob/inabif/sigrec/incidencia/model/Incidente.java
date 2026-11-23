package pe.gob.inabif.sigrec.incidencia.model;

import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.modulo.model.Modulo;
import pe.gob.inabif.sigrec.bien.model.Bien;
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
@Table(name = "SGR_INCIDENTE", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_INC_INC_COD", columnNames = {"CODIGO"})
}, indexes = {
    @Index(name = "IX_INC_INC_CAT_TIN", columnList = "ID_TIPO_INCIDENCIA"),
    @Index(name = "IX_INC_INC_CTR_CEN", columnList = "ID_CENTRO"),
    @Index(name = "IX_INC_INC_CTR_AMB", columnList = "ID_AMBIENTE"),
    @Index(name = "IX_INC_INC_CTR_MOD", columnList = "ID_MODULO"),
    @Index(name = "IX_INC_INC_BIEN_ORI", columnList = "ID_ORIGEN_BIEN"),
    @Index(name = "IX_INC_INC_BIEN_PAD", columnList = "ID_PRINCIPAL_BIEN")
})
@Check(name = "CK_INC_INC_ORIGEN", constraints = "ORIGEN IN ('CENTRO', 'AMBIENTE', 'BIEN', 'COMPONENTE')")
@Check(name = "CK_INC_INC_REQUIERE_EVALUACION", constraints = "REQUIERE_EVALUACION IN (0, 1)")
@Check(name = "CK_INC_INC_ORIGEN_REF", constraints = "(ORIGEN = 'CENTRO' AND ID_AMBIENTE IS NULL AND ID_MODULO IS NULL AND ID_ORIGEN_BIEN IS NULL AND ID_PRINCIPAL_BIEN IS NULL) OR (ORIGEN = 'AMBIENTE' AND ID_AMBIENTE IS NOT NULL AND ID_ORIGEN_BIEN IS NULL AND ID_PRINCIPAL_BIEN IS NULL) OR (ORIGEN = 'BIEN' AND ID_AMBIENTE IS NOT NULL AND ID_ORIGEN_BIEN IS NOT NULL AND ID_PRINCIPAL_BIEN IS NULL) OR (ORIGEN = 'COMPONENTE' AND ID_AMBIENTE IS NOT NULL AND ID_ORIGEN_BIEN IS NOT NULL AND ID_PRINCIPAL_BIEN IS NOT NULL)")
@Check(name = "CK_INC_INC_PADRE", constraints = "ID_ORIGEN_BIEN <> ID_PRINCIPAL_BIEN")
@Check(name = "CK_INC_INC_EVALUACION", constraints = "REQUIERE_EVALUACION = 0 OR ORIGEN IN ('CENTRO', 'AMBIENTE')")
@Check(name = "CK_INC_INC_CLASE", constraints = "CLASE IN ('INCIDENCIA', 'NOVEDAD')")
@Check(name = "CK_INC_INC_NOVEDAD", constraints = "(CLASE = 'NOVEDAD' AND ORIGEN = 'AMBIENTE') OR (CLASE = 'INCIDENCIA' AND UBICACION IS NULL)")
public class Incidente extends HechoAuditable {
    @Column(name = "CLASE", length = 10, nullable = false)
    private String clase;

    @Column(name = "ORIGEN", length = 12, nullable = false)
    private String origen;

    @Column(name = "TITULO", length = 180, nullable = false)
    private String titulo;

    @Column(name = "FEC_INCIDENTE", nullable = false)
    private LocalDate fecha;

    @Column(name = "DETALLE", length = 1000)
    private String detalle;

    @Column(name = "REQUIERE_EVALUACION", nullable = false)
    private Integer requiereEvaluacion;

    @Column(name = "UBICACION", length = 1000)
    private String ubicacion;

    @Column(name = "NOMBRE_ORIGEN_HIST", length = 180)
    private String nombreOrigen;

    @Column(name = "NOMBRE_PADRE_HIST", length = 360)
    private String nombrePadre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_TIPO_INCIDENCIA", nullable = false)
    private Catalogo tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_CENTRO", nullable = false)
    private Centro centro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_AMBIENTE")
    private Ambiente ambiente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_MODULO")
    private Modulo modulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ORIGEN_BIEN")
    private Bien bienOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PRINCIPAL_BIEN")
    private Bien principalOrigen;
}
