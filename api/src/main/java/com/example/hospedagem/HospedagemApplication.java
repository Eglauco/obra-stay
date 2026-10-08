package com.example.hospedagem;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HospedagemApplication {

	public static void main(String[] args) {
		// Operação multi-fuso (SP = UTC-3, MS = UTC-4): guardamos TUDO em UTC no banco e cada
		// usuário vê no fuso do próprio navegador. Fixar a JVM em UTC garante que os horários
		// automáticos (LocalDateTime.now(): logs, último login, notificações, auto check-in)
		// sejam gravados em UTC independente do fuso do host.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(HospedagemApplication.class, args);
	}

}
