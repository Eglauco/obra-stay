package com.example.hospedagem.config;

import com.example.hospedagem.domain.Acao;
import com.example.hospedagem.domain.Perfil;
import com.example.hospedagem.domain.PerfilPermissao;
import com.example.hospedagem.domain.Tela;
import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.repository.PerfilPermissaoRepository;
import com.example.hospedagem.repository.PerfilRepository;
import com.example.hospedagem.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Bootstrap idempotente no start: garante os perfis padrão (com as permissões de Gestor e
 * Consulta derivadas do catálogo) e cria o usuário admin inicial se ainda não houver usuários.
 * As tabelas e os 3 perfis são criados pela migration V30; aqui só semeamos as permissões.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String PERFIL_ADMIN = "Administrador";
    private static final String PERFIL_GESTOR = "Gestor";
    private static final String PERFIL_CONSULTA = "Consulta";

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PerfilPermissaoRepository permissaoRepository;
    private final PasswordEncoder encoder;
    private final String nome;
    private final String email;
    private final String senha;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           PerfilRepository perfilRepository,
                           PerfilPermissaoRepository permissaoRepository,
                           PasswordEncoder encoder,
                           @Value("${app.admin.nome:Administrador}") String nome,
                           @Value("${app.admin.email:admin@obrastay.com.br}") String email,
                           @Value("${app.admin.senha:Admin@123}") String senha) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.permissaoRepository = permissaoRepository;
        this.encoder = encoder;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments args) {
        Perfil admin = garantirPerfil(PERFIL_ADMIN, "Acesso total ao sistema.", true, true);
        Perfil gestor = garantirPerfil(PERFIL_GESTOR,
                "Operação completa, exceto gestão de usuários e perfis.", false, false);
        Perfil consulta = garantirPerfil(PERFIL_CONSULTA, "Somente leitura e exportação.", false, false);

        semearGestor(gestor);
        semearConsulta(consulta);
        criarAdminInicial(admin);
    }

    /** Busca o perfil pelo nome; cria (defensivo) caso a migration não o tenha semeado. */
    private Perfil garantirPerfil(String nome, String descricao, boolean acessoTotal, boolean sistema) {
        return perfilRepository.findByNomeIgnoreCase(nome).orElseGet(() -> {
            Perfil p = Perfil.builder()
                    .nome(nome).descricao(descricao).acessoTotal(acessoTotal).sistema(sistema)
                    .build();
            return perfilRepository.save(p);
        });
    }

    /** Gestor: todas as ações de todas as telas, exceto Usuários e Perfis. */
    private void semearGestor(Perfil gestor) {
        if (permissaoRepository.existsByPerfilId(gestor.getId())) {
            return;
        }
        List<PerfilPermissao> permissoes = new ArrayList<>();
        for (Tela tela : Tela.values()) {
            if (tela == Tela.USUARIOS || tela == Tela.PERFIS || tela == Tela.LOGS_ACESSO) {
                continue;
            }
            for (Acao acao : tela.getAcoes()) {
                permissoes.add(permissao(gestor, tela, acao));
            }
        }
        try {
            permissaoRepository.saveAll(permissoes);
            log.info("Permissões do perfil Gestor semeadas ({} itens).", permissoes.size());
        } catch (DataIntegrityViolationException e) {
            log.warn("Permissões do perfil Gestor já semeadas (provável boot concorrente); ignorando.");
        }
    }

    /** Consulta: somente leitura (Ver) e exportação (quando a tela permitir), em todas as telas. */
    private void semearConsulta(Perfil consulta) {
        if (permissaoRepository.existsByPerfilId(consulta.getId())) {
            return;
        }
        List<PerfilPermissao> permissoes = new ArrayList<>();
        for (Tela tela : Tela.values()) {
            if (tela == Tela.LOGS_ACESSO) {
                continue; // logs de auditoria são admin-only por padrão
            }
            permissoes.add(permissao(consulta, tela, Acao.VER));
            if (tela.permite(Acao.EXPORTAR)) {
                permissoes.add(permissao(consulta, tela, Acao.EXPORTAR));
            }
        }
        try {
            permissaoRepository.saveAll(permissoes);
            log.info("Permissões do perfil Consulta semeadas ({} itens).", permissoes.size());
        } catch (DataIntegrityViolationException e) {
            log.warn("Permissões do perfil Consulta já semeadas (provável boot concorrente); ignorando.");
        }
    }

    private void criarAdminInicial(Perfil admin) {
        if (usuarioRepository.count() > 0) {
            return;
        }
        Usuario usuario = Usuario.builder()
                .nome(nome)
                .email(email.trim().toLowerCase())
                .senha(encoder.encode(senha))
                .perfil(admin)
                .criadoEm(LocalDateTime.now())
                .build();
        try {
            usuarioRepository.save(usuario);
            log.info("Usuário admin inicial criado: {} (troque a senha após o primeiro login)", usuario.getEmail());
        } catch (DataIntegrityViolationException e) {
            log.warn("Usuário admin inicial já criado (provável boot concorrente); ignorando.");
        }
    }

    private PerfilPermissao permissao(Perfil perfil, Tela tela, Acao acao) {
        return PerfilPermissao.builder().perfil(perfil).tela(tela).acao(acao).build();
    }
}
