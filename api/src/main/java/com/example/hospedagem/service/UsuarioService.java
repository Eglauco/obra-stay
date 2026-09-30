package com.example.hospedagem.service;

import com.example.hospedagem.domain.Perfil;
import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.dto.AtualizarUsuarioRequest;
import com.example.hospedagem.dto.PermissaoDto;
import com.example.hospedagem.dto.RegisterRequest;
import com.example.hospedagem.dto.TrocarSenhaRequest;
import com.example.hospedagem.dto.UsuarioResponse;
import com.example.hospedagem.exception.RegraNegocioException;
import com.example.hospedagem.exception.ResourceNotFoundException;
import com.example.hospedagem.repository.PerfilRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import com.example.hospedagem.security.PermissaoService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Regras de negócio de usuários e autenticação. */
@Service
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository repository,
                          PerfilRepository perfilRepository,
                          PasswordEncoder encoder) {
        this.repository = repository;
        this.perfilRepository = perfilRepository;
        this.encoder = encoder;
    }

    /** Valida e-mail + senha; lança 401 em qualquer falha (sem revelar qual campo). */
    @Transactional
    public Usuario autenticar(String email, String senha) {
        Usuario usuario = repository.findComPermissoesByEmail(email == null ? "" : email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
        if (!encoder.matches(senha, usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }
        // Auditoria: registra a data/hora deste login.
        usuario.setUltimoLogin(LocalDateTime.now());
        return repository.save(usuario);
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
        Perfil perfil = buscarPerfil(req.perfilId());
        garantirPodeConceder(perfil);
        Usuario usuario = Usuario.builder()
                .nome(req.nome().trim())
                .email(email)
                .senha(encoder.encode(req.senha()))
                .perfil(perfil)
                .criadoEm(LocalDateTime.now())
                .build();
        return toResponse(repository.save(usuario));
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, AtualizarUsuarioRequest req) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        Perfil novoPerfil = buscarPerfil(req.perfilId());
        garantirPodeConceder(novoPerfil);

        // Impede que o último usuário administrador seja rebaixado (evita ficar sem admin).
        if (usuario.getPerfil().isAcessoTotal() && !novoPerfil.isAcessoTotal()) {
            garantirNaoUltimoAdmin();
        }
        usuario.setNome(req.nome().trim());
        usuario.setPerfil(novoPerfil);
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
        return toResponse(repository.findComPermissoesByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado.")));
    }

    /**
     * Monta a resposta completa (com permissões) de um usuário já carregado com o perfil.
     * Usada no login, onde o {@link Usuario} vem do {@link #autenticar} com as permissões
     * já inicializadas via join fetch.
     */
    public UsuarioResponse resposta(Usuario usuario) {
        return toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obter(Long id) {
        return toResponseResumo(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado.")));
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome")).stream()
                .map(this::toResponseResumo)
                .toList();
    }

    @Transactional
    public void excluir(Long id, String emailAtual) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        if (usuario.getEmail().equalsIgnoreCase(emailAtual)) {
            throw new RegraNegocioException(null, "Você não pode excluir o próprio usuário.");
        }
        if (usuario.getPerfil().isAcessoTotal()) {
            garantirNaoUltimoAdmin();
        }
        repository.delete(usuario);
    }

    // ----- auxiliares -----

    private Perfil buscarPerfil(Long perfilId) {
        return perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RegraNegocioException("perfilId", "Perfil não encontrado."));
    }

    /**
     * Conceder um perfil de acesso total é privilégio de quem já tem acesso total.
     * Evita que um usuário com apenas usuarios:CRIAR/EDITAR se auto-promova a administrador.
     */
    private void garantirPodeConceder(Perfil perfil) {
        if (perfil.isAcessoTotal() && !solicitanteTemAcessoTotal()) {
            throw new RegraNegocioException("perfilId",
                    "Apenas um administrador pode conceder o perfil de acesso total.");
        }
    }

    private boolean solicitanteTemAcessoTotal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> PermissaoService.ACESSO_TOTAL.equals(a.getAuthority()));
    }

    private void garantirNaoUltimoAdmin() {
        if (repository.countByPerfil_AcessoTotalTrue() <= 1) {
            throw new RegraNegocioException(null,
                    "Deve existir ao menos um usuário com perfil de acesso total.");
        }
    }

    /** Resposta completa (com permissões): usada no login e no /me. */
    private UsuarioResponse toResponse(Usuario u) {
        Perfil p = u.getPerfil();
        List<PermissaoDto> permissoes = (p == null || p.isAcessoTotal())
                ? List.of()
                : p.getPermissoes().stream()
                        .map(pp -> new PermissaoDto(pp.getTela().getChave(), pp.getAcao().name()))
                        .toList();
        return montar(u, permissoes);
    }

    /** Resposta enxuta (sem a lista de permissões): usada na listagem de usuários. */
    private UsuarioResponse toResponseResumo(Usuario u) {
        return montar(u, List.of());
    }

    private UsuarioResponse montar(Usuario u, List<PermissaoDto> permissoes) {
        Perfil p = u.getPerfil();
        return new UsuarioResponse(
                u.getId(), u.getNome(), u.getEmail(), u.getCriadoEm(), u.getUltimoLogin(),
                p == null ? null : p.getId(),
                p == null ? null : p.getNome(),
                p != null && p.isAcessoTotal(),
                permissoes);
    }
}
