package pe.gob.inabif.sigrec.auth.model;

import pe.gob.inabif.sigrec.usuario.model.Usuario;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.*;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "SGR_SESION", indexes = @Index(name = "SGR_IX_SESION_USUARIO", columnList = "ID_USUARIO"))
public class Sesion {
    @Id
    @Column(name = "JTI_HASH", length = 64)
    private String hash;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    private Usuario usuario;
    @Column(name = "FEC_EXPIRA", nullable = false)
    private Instant expira;
    @Column(name = "FEC_REVOCA")
    private Instant revocada;
}
