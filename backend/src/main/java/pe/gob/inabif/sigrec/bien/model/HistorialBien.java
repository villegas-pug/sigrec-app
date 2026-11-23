package pe.gob.inabif.sigrec.bien.model;

import pe.gob.inabif.sigrec.shared.model.HechoAuditable;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.catalogo.model.Catalogo;
import pe.gob.inabif.sigrec.incidencia.model.Incidente;
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
@Table(name = "SGR_HISTORIAL_BIEN", uniqueConstraints = {
    @UniqueConstraint(name = "SGR_UK_BIE_HIS_COD", columnNames = {"CODIGO"}),
    @UniqueConstraint(name = "SGR_UK_BIE_HIS_V1", columnNames = {"V_UNICO_1_1", "V_UNICO_1_2"})
}, indexes = {
    @Index(name = "IX_BIE_HIS_BIE_BIE", columnList = "ID_BIEN"),
    @Index(name = "IX_BIE_HIS_CTR_AMB", columnList = "ID_AMBIENTE"),
    @Index(name = "IX_BIE_HIS_AMB_DES", columnList = "ID_DESTINO_AMBIENTE"),
    @Index(name = "IX_BIE_HIS_COND_ANT", columnList = "ID_ANTERIOR_CONDICION"),
    @Index(name = "IX_BIE_HIS_COND_NUE", columnList = "ID_NUEVA_CONDICION"),
    @Index(name = "IX_BIE_HIS_INC_INC", columnList = "ID_INCIDENTE"),
    @Index(name = "IX_BIE_HIS_PADRE_ANT", columnList = "ID_ANTERIOR_BIEN"),
    @Index(name = "IX_BIE_HIS_PADRE_NUE", columnList = "ID_NUEVO_BIEN"),
    @Index(name = "IX_BIE_HIS_TRASLADO", columnList = "ID_TRASLADO")
})
@Check(name = "CK_BIE_HIS_TIPO", constraints = "TIPO IN ('VERIFICACION', 'CONDICION', 'ASOCIACION', 'TRASLADO')")
@Check(name = "CK_BIE_HIS_RESULTADO", constraints = "RESULTADO IN ('COINCIDE', 'DIFERENCIAS')")
@Check(name = "CK_BIE_HIS_VERIFICACION", constraints = "TIPO = 'VERIFICACION' OR RESULTADO IS NULL")
@Check(name = "CK_BIE_HIS_CONDICION", constraints = "TIPO = 'CONDICION' OR (ID_ANTERIOR_CONDICION IS NULL AND ID_NUEVA_CONDICION IS NULL AND ID_INCIDENTE IS NULL)")
@Check(name = "CK_BIE_HIS_COND", constraints = "ID_ANTERIOR_CONDICION <> ID_NUEVA_CONDICION")
@Check(name = "CK_BIE_HIS_ASOCIACION", constraints = "(TIPO = 'ASOCIACION' AND (ID_ANTERIOR_BIEN IS NOT NULL OR ID_NUEVO_BIEN IS NOT NULL)) OR (TIPO <> 'ASOCIACION' AND ID_NUEVO_BIEN IS NULL AND POSICION_ANTERIOR IS NULL AND POSICION_NUEVA IS NULL)")
@Check(name = "CK_BIE_HIS_TRASLADO", constraints = "(TIPO = 'TRASLADO' AND ID_DESTINO_AMBIENTE IS NOT NULL) OR (TIPO <> 'TRASLADO' AND ID_DESTINO_AMBIENTE IS NULL AND ID_TRASLADO IS NULL)")
@Check(name = "CK_BIE_HIS_PRINCIPAL", constraints = "TIPO IN ('ASOCIACION', 'TRASLADO') OR ID_ANTERIOR_BIEN IS NULL")
@Check(name = "CK_BIE_HIS_AMBIENTE", constraints = "ID_AMBIENTE <> ID_DESTINO_AMBIENTE")
@Check(name = "CK_BIE_HIS_ANTERIOR", constraints = "ID_BIEN <> ID_ANTERIOR_BIEN")
@Check(name = "CK_BIE_HIS_NUEVO", constraints = "ID_BIEN <> ID_NUEVO_BIEN")
@Check(name = "CK_BIE_HIS_ACOMPANA", constraints = "ID_TRASLADO IS NULL OR (ID_TRASLADO <> ID AND ID_ANTERIOR_BIEN IS NULL)")
public class HistorialBien extends HechoAuditable {
    @Column(name = "TIPO", length = 15, nullable = false)
    private String tipo;

    @Column(name = "FEC_EVENTO", nullable = false)
    private LocalDate fecha;

    @Column(name = "RESULTADO", length = 15)
    private String resultado;

    @Column(name = "DETALLE", length = 1000)
    private String detalle;

    @Column(name = "POSICION_ANTERIOR", length = 180)
    private String posicionAnterior;

    @Column(name = "POSICION_NUEVA", length = 180)
    private String posicionNueva;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_BIEN", nullable = false)
    private Bien bien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_AMBIENTE")
    private Ambiente ambiente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_DESTINO_AMBIENTE")
    private Ambiente destino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ANTERIOR_CONDICION")
    private Catalogo condicionAnterior;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_NUEVA_CONDICION")
    private Catalogo condicionNueva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_INCIDENTE")
    private Incidente incidente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ANTERIOR_BIEN")
    private Bien principalAnterior;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_NUEVO_BIEN")
    private Bien principalNuevo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_TRASLADO")
    private HistorialBien trasladoPrincipal;

    @Column(name = "TITULO_HIST", length = 1000)
    private String titulo;

    @Column(name = "CARGA_INICIAL", nullable = false)
    private boolean cargaInicial;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_TRASLADO IS NOT NULL THEN ID_TRASLADO END")
    @Column(name = "V_UNICO_1_1")
    private Long unico1_1;

    @GeneratedColumn("CASE WHEN ESTADO = 1 AND ELIMINADO = 0 AND ID_TRASLADO IS NOT NULL THEN ID_BIEN END")
    @Column(name = "V_UNICO_1_2")
    private Long unico1_2;
}
