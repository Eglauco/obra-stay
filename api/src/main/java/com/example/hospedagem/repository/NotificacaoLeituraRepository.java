package com.example.hospedagem.repository;

import com.example.hospedagem.domain.NotificacaoLeitura;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacaoLeituraRepository extends JpaRepository<NotificacaoLeitura, Long> {

    boolean existsByUsuarioIdAndNotificacaoId(Long usuarioId, Long notificacaoId);

    List<NotificacaoLeitura> findByUsuarioIdAndNotificacaoIdIn(Long usuarioId, Collection<Long> notificacaoIds);

    void deleteByUsuarioId(Long usuarioId);
}
