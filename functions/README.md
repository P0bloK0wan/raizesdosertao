# Pix do Lava Jato — ativação pelo celular

O site permite **reservar sem pagar**. O Pix é opcional e usa o Mercado Pago. Valor: R$ 50,00.

## Antes de ativar
1. Acesse o Mercado Pago do clube pelo navegador do celular e crie uma aplicação de pagamentos com Pix. A conta deve estar habilitada para receber Pix.
2. Acesse o console Firebase do projeto `raizes-do-sertao-7d82c` pelo navegador do celular. O deploy das Cloud Functions exige plano Blaze (pode haver cobrança). **Não cole tokens no GitHub nem no chat.**
3. Configure o secret `MERCADO_PAGO_ACCESS_TOKEN` no ambiente de implantação das Functions.
4. Instale dependências da pasta `functions/` e implante as funções `criarPixLavaJato`, `statusPixLavaJato` e `webhookPixLavaJato` na região `us-central1`.
5. No painel de Webhooks do Mercado Pago, configure `https://us-central1-raizes-do-sertao-7d82c.cloudfunctions.net/webhookPixLavaJato` para notificações de pagamentos. O webhook não confia no corpo recebido: busca a transação autenticada na API oficial e confere ID, valor e reserva.
6. Implante o site e as regras atualizadas de Firestore. Teste com uma reserva de teste e uma transação de pequeno valor antes de disponibilizar o Pix ao público.

**Importante:** GitHub Pages não executa Cloud Functions. Apenas enviar estes arquivos ao GitHub NÃO ativa cobranças. Enquanto não houver deploy e credencial, o cadastro continua funcionando sem Pix e o botão informa indisponibilidade.

O backend só aceita solicitações de reserva com o token de cancelamento armazenado no navegador do cliente. O cliente deve informar um e-mail para gerar o Pix. O token privado do Mercado Pago permanece exclusivamente no servidor.

**Operação:** Se um cliente pagar e depois pedir cancelamento, a liderança precisa conferir e processar eventual reembolso pelo Mercado Pago. Não reembolse automaticamente apenas porque uma reserva foi cancelada.
