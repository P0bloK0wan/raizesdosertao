# Raízes do Sertão — site do clube

Site do Clube de Desbravadores **Raízes do Sertão** (Vila Eduardo — Região 13, 4º Distrito, APeC): história do clube, unidades, agenda, campanha do Lava Jato (todo domingo até dezembro), "Adote um Desbravador", galeria de fotos/vídeos, e painéis de login para a liderança e para cada unidade.

100% HTML/CSS/JS puro — sem build, sem servidor, sem custo. Feito para publicar de graça no **GitHub Pages**.

## Como publicar no GitHub Pages

1. Suba este projeto para um repositório no GitHub (branch `main`).
2. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`.
3. Em alguns minutos o site fica no ar em `https://<seu-usuario>.github.io/<repositorio>/`.

## Como tudo funciona (sem servidor)

Os dados (desbravadores, avaliações, vagas do Lava Jato, meta de arrecadação) ficam salvos no **navegador de quem está usando** (`localStorage`) — não existe banco de dados nem servidor. Por isso:

- O ideal é que cada unidade e a liderança sempre usem o **mesmo aparelho/computador do clube** para lançar informações.
- Use os botões **Exportar / Importar** (painel da liderança e da unidade) para reunir os dados de todo mundo em um só lugar quando precisar — a unidade exporta um `.json` e manda pra liderança pelo WhatsApp, a liderança importa no aparelho dela.

### Fotos e vídeos

A galeria de fotos/vídeos **não guarda arquivos no site** (isso não caberia num site gratuito sem servidor). Em vez disso:

1. Suba as fotos/vídeos do evento num álbum do **Google Fotos** ou **Google Drive** (gratuito).
2. Compartilhe o álbum como "qualquer pessoa com o link pode ver".
3. No painel da liderança → **Fotos e vídeos**, cole o nome do evento + o link do álbum.
4. O álbum aparece automaticamente na aba **Fotos** do site, pra qualquer visitante.

## Contas de acesso (login)

| Papel | Usuário | Senha padrão |
|---|---|---|
| Liderança | `lideranca` | `raizes2026` |
| Cada unidade | `tarantula`, `andorinha`, `carcara`, `raposa` | `sertao123` |

**Troque essas senhas** assim que o site estiver no ar — cada painel tem uma opção "Configurações → Trocar senha". A nova senha fica salva no navegador de quem trocou.

⚠️ Importante: como o site não tem servidor, esse login é uma trava **organizacional** (para saber quem está lançando o quê), não um sistema de segurança bancária. Não reutilize senhas importantes aqui.

## O que dá pra fazer em cada painel

**Painel da liderança** (`painel-lideranca.html`)
- Ver todas as vagas do Lava Jato (todo domingo até dezembro) e quem já fechou cada uma.
- Ver os desbravadores cadastrados por cada unidade.
- Ver o desempenho semanal (ranking com a média das avaliações lançadas pelas unidades).
- Atualizar a meta de arrecadação (aparece na barra de progresso da home).
- Publicar álbuns de fotos/vídeos.
- Importar dados exportados por uma unidade / exportar um backup completo.

**Painel da unidade** (`painel-unidade.html`)
- Cadastrar os desbravadores da unidade.
- Lançar a avaliação semanal de cada desbravador (pontualidade, Bíblia/lição, uniforme, participação, comportamento — notas de 0 a 10).
- Fechar/liberar vagas do Lava Jato, escalando quais desbravadores vão trabalhar.
- Exportar os dados da unidade em `.json`.

## Ideias para ir além (sugestões)

Já estão implementadas no site:
- ✅ Modo claro/escuro
- ✅ Botão flutuante do WhatsApp
- ✅ PWA — dá pra "instalar" o site na tela inicial do celular e ele funciona offline depois da primeira visita
- ✅ Compartilhar a página (Web Share API)
- ✅ Contagem regressiva pro próximo domingo de Lava Jato
- ✅ Exportar/Importar dados em `.json`
- ✅ Página 404 personalizada
- ✅ Estilo de impressão (para imprimir a escala do Lava Jato, por exemplo)

Boas próximas adições, se quiser evoluir o site:
- Trocar o `localStorage` por um banco gratuito de verdade (ex.: Firebase/Firestore, plano gratuito) — assim os dados passam a ficar sincronizados entre todos os aparelhos automaticamente, não só no computador do clube.
- Um mural de recados/avisos que a liderança publica e todo mundo vê na home.
- Emitir um "certificado" ou resumo em PDF do desempenho de cada desbravador no fim do ano.
- QR code na entrada do clube apontando pro site, pra facilitar o acesso de visitantes ao Lava Jato.
