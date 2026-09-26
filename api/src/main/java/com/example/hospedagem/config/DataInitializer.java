package com.example.hospedagem.config;

import com.example.hospedagem.domain.Usuario;
import com.example.hospedagem.repository.UsuarioRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Cria o usuário admin inicial no primeiro start (só se não houver nenhum usuário). */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final String nome;
    private final String email;
    private final String senha;

    public DataInitializer(UsuarioRepository repository,
                           PasswordEncoder encoder,
                           @Value("${app.admin.nome:Administrador}") String nome,
                           @Value("${app.admin.email:admin@obrastay.com.br}") String email,
                           @Value("${app.admin.senha:Admin@123}") String senha) {
        this.repository = repository;
        this.encoder = encoder;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            return;
        }
        Usuario admin = Usuario.builder()
                .nome(nome)
                .email(email.trim().toLowerCase())
                .senha(encoder.encode(senha))
                .criadoEm(LocalDateTime.now())
                .build();
        repository.save(admin);
        log.info("Usuário admin inicial criado: {} (troque a senha após o primeiro login)", admin.getEmail());
    }
}
