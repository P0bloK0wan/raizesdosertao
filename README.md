# Raízes do Sertão — site do clube

Site do Clube de Desbravadores **Raízes do Sertão** (Vila Eduardo — Região 13, 4º Distrito, APeC): história do clube, unidades, agenda, campanha do Lava Jato (todo domingo até dezembro), "Adote um Desbravador", galeria de fotos/vídeos, e painéis de login para a liderança e para cada unidade.

HTML/CSS/JS puro (sem build, sem framework), publicado de graça no **GitHub Pages**. Os dados (desbravadores, avaliações, vagas do Lava Jato, meta de arrecadação, galeria) ficam sincronizados entre todos os aparelhos em tempo real, usando o **Firebase** (Firestore + Authentication) no plano gratuito do Google.

## 1. Configurar o Firebase (uma vez só)

O site precisa de um projeto Firebase gratuito pra funcionar. Leva uns 10-15 minutos:

### 1.1. Criar o projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e entre com uma conta Google.
2. **Adicionar projeto** → dê um nome (ex.: `raizes-do-sertao`) → pode desativar o Google Analytics (não é necessário) → **Criar projeto**.

### 1.2. Ativar o Authentication

1. No menu lateral: **Compilação → Authentication → Introdução**.
2. Na aba **Sign-in method**, ative o provedor **E-mail/senha**.
3. Na aba **Users**, clique **Add user** e crie estas 5 contas (uma de cada vez):

   | E-mail | Senha (troque depois pelo painel) |
   |---|---|
   | `lideranca@raizesdosertao.app` | `raizes2026` |
   | `tarantula@raizesdosertao.app` | `sertao123` |
   | `andorinha@raizesdosertao.app` | `sertao123` |
   | `carcara@raizesdosertao.app` | `sertao123` |
   | `raposa@raizesdosertao.app` | `sertao123` |

   Esses e-mails não recebem nada de verdade — são só identificadores de conta. Assim que o site estiver no ar, troque essas senhas pela opção "Trocar senha" dentro de cada painel.

### 1.3. Ativar o Firestore

1. No menu lateral: **Compilação → Firestore Database → Criar banco de dados**.
2. Escolha uma localização (qualquer uma próxima do Brasil, ex. `southamerica-east1`) → **Modo de produção** → Criar.
3. Vá na aba **Regras (Rules)**, apague o conteúdo e cole o conteúdo do arquivo [`firestore.rules`](./firestore.rules) deste repositório → **Publicar**.

### 1.4. Pegar as chaves do site

1. No menu lateral: ⚙️ (ícone de engrenagem) → **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone `</>` (Web) → dê um nome (ex.: `site`) → **Registrar app** (não precisa do Firebase Hosting).
3. Copie o objeto `firebaseConfig` que aparece na tela.
4. Abra o arquivo [`assets/js/firebase.js`](./assets/js/firebase.js) deste projeto e substitua os valores de `firebaseConfig` pelos que você copiou.
5. Salve, faça commit e push — pronto, o site está conectado ao seu Firebase.

Essas chaves **não são segredo** — é normal elas aparecerem no código de um app Firebase. Quem protege os dados de verdade são as regras do Firestore (passo 1.3), não esconder essas chaves.

## 2. Publicar no GitHub Pages

1. Suba este projeto para um repositório no GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`.
3. Em alguns minutos o site fica no ar em `https://<seu-usuario>.github.io/<repositorio>/`.

## Fotos e vídeos

A galeria não guarda arquivos no site (isso não caberia num site gratuito sem servidor de armazenamento). Em vez disso:

1. Suba as fotos/vídeos do evento num álbum do **Google Fotos** ou **Google Drive** (gratuito).
2. Compartilhe o álbum como "qualquer pessoa com o link pode ver".
3. No painel da liderança → **Fotos e vídeos**, cole o nome do evento + o link do álbum.
4. O álbum aparece automaticamente na aba **Fotos** do site, pra qualquer visitante, na hora.

## Contas de acesso (login)

| Papel | Conta | Senha padrão |
|---|---|---|
| Liderança | `lideranca` | `raizes2026` |
| Cada unidade | `tarantula`, `andorinha`, `carcara`, `raposa` | `sertao123` |

**Troque essas senhas** assim que o site estiver no ar — cada painel tem uma opção "Configurações → Trocar senha".

## O que dá pra fazer em cada painel

**Painel da liderança** (`painel-lideranca.html`)
- Ver, em tempo real e de qualquer aparelho, todas as vagas do Lava Jato e quem já fechou cada uma.
- Ver os desbravadores cadastrados por cada unidade.
- Ver o desempenho semanal (ranking com a média das avaliações lançadas pelas unidades).
- Atualizar a meta de arrecadação (aparece na barra de progresso da home).
- Publicar álbuns de fotos/vídeos.
- Baixar um backup completo em `.json`.

**Painel da unidade** (`painel-unidade.html`)
- Cadastrar os desbravadores da unidade.
- Lançar a avaliação semanal de cada desbravador (pontualidade, Bíblia/lição, uniforme, participação, comportamento — notas de 0 a 10).
- Fechar/liberar vagas do Lava Jato, escalando quais desbravadores vão trabalhar.

Tudo isso sincroniza automaticamente — uma unidade pode cadastrar pelo celular no meio da reunião e a liderança já vê no computador dela, em outro lugar, na hora.

## Testando localmente

Se quiser rodar o site na sua máquina antes de publicar:

```bash
python3 -m http.server 8000
```

E abra `http://localhost:8000`. Como o site usa módulos JavaScript (`type="module"`), não dá pra abrir os arquivos `.html` direto com duplo clique — precisa de um servidor local (mesmo que simples) por causa das regras de CORS do navegador.

## Ideias para ir além (sugestões)

Já estão implementadas no site:
- ✅ Dados sincronizados em tempo real entre todos os aparelhos (Firebase)
- ✅ Modo claro/escuro
- ✅ Botão flutuante do WhatsApp
- ✅ PWA — dá pra "instalar" o site na tela inicial do celular
- ✅ Compartilhar a página (Web Share API)
- ✅ Contagem regressiva pro próximo domingo de Lava Jato
- ✅ Backup em `.json`
- ✅ Página 404 personalizada
- ✅ Estilo de impressão (pra imprimir a escala do Lava Jato, por exemplo)

Boas próximas adições, se quiser evoluir o site:
- Um mural de recados/avisos que a liderança publica e todo mundo vê na home.
- Emitir um "certificado" ou resumo em PDF do desempenho de cada desbravador no fim do ano.
- QR code na entrada do clube apontando pro site, pra facilitar o acesso de visitantes ao Lava Jato.
- Notificação por e-mail/WhatsApp quando uma vaga do Lava Jato é fechada (precisaria de uma Cloud Function, ainda no plano gratuito do Firebase).
