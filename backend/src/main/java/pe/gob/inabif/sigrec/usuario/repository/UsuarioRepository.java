package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import java.util.*;

public interface UsuarioRepository {
    Optional<Usuario> findByCodigo(String codigo);
    Optional<Usuario> findByProveedorAndSujeto(String proveedor, String sujeto);
    List<Usuario> findAllByOrderById();
    Optional<Usuario> bloquear(String codigo);
    Optional<Usuario> findById(Long id);
    Usuario save(Usuario usuario);
}
