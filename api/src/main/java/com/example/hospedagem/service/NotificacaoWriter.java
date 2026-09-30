package com.example.hospedagem.service;

import com.example.hospedagem.domain.Notificacao;
import com.example.hospedagem.repository.NotificacaoRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grava a notificação em uma transação SEPARADA (REQUIRES_NEW), para que uma eventual falha
 * ao notificar nunca reverta a ação principal (entrada/saída/solicitação). Fica em um bean
 * próprio porque REQUIRES_NEW só é aplicado quando chamado através do proxy (cross-bean).
 */
@Component
public class NotificacaoWriter {

    private final NotificacaoRepository repository;

    public NotificacaoWriter(NotificacaoRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void salvar(Notificacao notificacao) {
        repository.save(notificacao);
    }
}
