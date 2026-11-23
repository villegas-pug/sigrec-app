package pe.gob.inabif.sigrec.foto.model;

import jakarta.persistence.*;
import java.sql.Blob;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import pe.gob.inabif.sigrec.ambiente.model.Ambiente;
import pe.gob.inabif.sigrec.bien.model.Bien;
import pe.gob.inabif.sigrec.centro.model.Centro;
import pe.gob.inabif.sigrec.shared.model.HechoAuditable;

@Getter
@Setter
@Entity
@Table(name = "SGR_FOTO", uniqueConstraints = @UniqueConstraint(name = "UK_CTR_FOT_CODIGO", columnNames = "CODIGO"))
@Check(name = "CK_CTR_FOT_OBJETIVO", constraints = "CASE WHEN ID_CENTRO IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN ID_AMBIENTE IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN ID_BIEN IS NOT NULL THEN 1 ELSE 0 END = 1")
@Check(name = "CK_CTR_FOT_ARCHIVO", constraints = "(NOMBRE_ARCHIVO IS NULL AND TIPO_MIME IS NULL) OR (NOMBRE_ARCHIVO IS NOT NULL AND TIPO_MIME IS NOT NULL)")
public class Foto extends HechoAuditable {
    @Column(name = "TITULO", nullable = false, length = 180)
    private String titulo;
    @Column(name = "FEC_FOTO", nullable = false)
    private LocalDate fecha;
    @Column(name = "NOTA", length = 1000)
    private String nota;
    @Column(name = "NOMBRE_ARCHIVO", length = 255)
    private String nombreArchivo;
    @Column(name = "TIPO_MIME", length = 100)
    private String tipoMime;
    @Lob
    @Column(name = "CONTENIDO")
    private Blob contenido;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CENTRO", foreignKey = @ForeignKey(name = "FK_CTR_FOT_CTR_CEN"))
    private Centro centro;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_AMBIENTE", foreignKey = @ForeignKey(name = "FK_CTR_FOT_CTR_AMB"))
    private Ambiente ambiente;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_BIEN", foreignKey = @ForeignKey(name = "FK_CTR_FOT_INV_BIE"))
    private Bien bien;

    public Centro titular() {
        if (centro != null) return centro;
        return (bien == null ? ambiente : bien.getAmbiente()).modulo().centro();
    }
}
