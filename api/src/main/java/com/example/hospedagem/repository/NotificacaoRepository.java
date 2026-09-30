package com.example.hospedagem.repository;

import com.example.hospedagem.domain.Notificacao;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    /** Notificações visíveis ao usuário (telas permitidas), exceto as que ele mesmo gerou. */
    @Query("select n from Notificacao n "
            + "where n.tela in :telas and (n.autorUsuarioId is null or n.autorUsuarioId <> :uid) "
            + "order by n.dataHora desc")
    List<Notificacao> feed(@Param("telas") Collection<String> telas,
                           @Param("uid") Long uid,
                           Pageable pageable);

    /** Quantidade de não-lidas: mais novas que a marca geral e sem leitura individual. */
    @Query("select count(n) from Notificacao n "
            + "where n.tela in :telas and (n.autorUsuarioId is null or n.autorUsuarioId <> :uid) "
            + "and n.dataHora > :lidasEm "
            + "and n.id not in (select l.notificacaoId from NotificacaoLeitura l where l.usuarioId = :uid)")
    long contarNaoLidas(@Param("telas") Collection<String> telas,
                        @Param("uid") Long uid,
                        @Param("lidasEm") LocalDateTime lidasEm);
}
