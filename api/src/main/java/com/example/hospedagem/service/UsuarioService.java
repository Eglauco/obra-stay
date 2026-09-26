package com.example.hospedagem.service;

import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.dto.RegisterRequest;
import com.example.hospedagem.dto.TrocarSenhaRequest;
import com.example.hospedagem.dto.UsuarioResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Regras de negócio de usuários e autenticação. */
@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    /** Valida e-mail + senha; lança 401 em qualquer falha (sem revelar qual campo). */
    @Transactional(readOnly = true)
    public Usuario autenticar(String email, String senha) {
        Usuario usuario = repository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        if (!encoder.matches(senha, usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }
        return usuario;
    }

    @Transactional
    public UsuarioResponse registrar(RegisterRequest req) {
        if (!req.senha().equals(req.repetirSenha())) {
            throw new RegraNegocioException("repetirSenha", "As senhas não conferem.");
        }
        String email = req.email().trim().toLowerCase();
        if (repository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("email", "Já existe um usuário com este e-mail.");
        }
        Usuario usuario = Usuario.builder()
                .nome(req.nome().trim())
                .email(email)
                .senha(encoder.encode(req.senha()))
                .criadoEm(LocalDateTime.now())
                .build();
        return toResponse(repository.save(usuario));
    }

    @Transactional
    public void trocarSenha(String emailAtual, TrocarSenhaRequest req) {
        if (!req.senhaNova().equals(req.repetirSenha())) {
            throw new RegraNegocioException("repetirSenha", "As senhas não conferem.");
        }
        Usuario usuario = repository.findByEmailIgnoreCase(emailAtual)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        if (!encoder.matches(req.senhaAtual(), usuario.getSenha())) {
            throw new RegraNegocioException("senhaAtual", "A senha atual está incorreta.");
        }
        usuario.setSenha(encoder.encode(req.senhaNova()));
        repository.save(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse me(String email) {
        return toResponse(repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado.")));
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void excluir(Long id, String emailAtual) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        if (usuario.getEmail().equalsIgnoreCase(emailAtual)) {
            throw new RegraNegocioException(null, "Você não pode excluir o próprio usuário.");
        }
        repository.delete(usuario);
    }

    private UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getCriadoEm());
    }
}
