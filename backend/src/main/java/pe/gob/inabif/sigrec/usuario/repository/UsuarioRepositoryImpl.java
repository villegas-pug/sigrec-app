package pe.gob.inabif.sigrec.usuario.repository;

import pe.gob.inabif.sigrec.usuario.model.Usuario;
import java.util.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UsuarioRepositoryImpl implements UsuarioRepository {
    private final UsuarioJpaRepository jpaRepository;

    @Override
    public Optional<Usuario> findByCodigo(String codigo) {
        return jpaRepository.findByCodigo(codigo);
    }

    @Override
    public Optional<Usuario> findByProveedorAndSujeto(String proveedor, String sujeto) {
        return jpaRepository.findByProveedorAndSujeto(proveedor, sujeto);
    }

    @Override
    public List<Usuario> findAllByOrderById() {
        return jpaRepository.findAllByOrderById();
    }

    @Override
    public Optional<Usuario> bloquear(String codigo) {
        return jpaRepository.bloquear(codigo);
    }

    @Override
    public Optional<Usuario> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Usuario save(Usuario usuario) {
        return jpaRepository.save(usuario);
    }
}
