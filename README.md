# Raízes do Sertão — site do clube

Site do Clube de Desbravadores **Raízes do Sertão** (Vila Eduardo — Região 13, 4º Distrito, APeC): apresentação do clube, nossa história em linha do tempo, mídia (fotos/vídeos), campanha do Campori DSA 2027, cadastro do Lava Jato, redes sociais, e painéis de login para a liderança e para cada unidade.

HTML/CSS/JS puro (sem build, sem framework), publicado de graça no **GitHub Pages**. Os dados (desbravadores, atividades, cadastros do Lava Jato, pastas de mídia, data do Campori) ficam sincronizados entre todos os aparelhos em tempo real, usando o **Firebase** (Firestore + Authentication) no plano gratuito do Google.

## 📝 O que mudou na última atualização

- **Lava-Jato voltou a ter agenda**: a página mostra os próximos domingos num grid — cinza com o número de vagas livres, laranja quando lota (só aceitamos **5 carros por domingo**), vermelho quando a liderança fecha o dia. Quem for se cadastrar escolhe o domingo (só aparecem datas com vaga). No painel da liderança, clicar num domingo aberto fecha ele (com um motivo opcional, tipo "sem lavagem esse domingo") — e clicar de novo reabre. Isso já empurra o pessoal a se agendar pro próximo domingo em vez do que foi fechado.
- **Desbravadores podem ter o tipo sanguíneo registrado** (campo opcional no cadastro, dentro do painel da unidade) — bom ter à mão, mas não é obrigatório preencher.
- **Mídia agora mostra as fotos direto no site**: a liderança continua só colando o link da pasta do Google Drive, mas a página pública busca e exibe as fotos da pasta automaticamente (numa grade, com uma foto ampliada ao clicar e um botão de baixar) — não depende mais de abrir o Drive pra ver. Isso exige uma chave de API gratuita do Google (passo 1.5 abaixo); sem ela, a pasta cai de volta pra só um link "Abrir no Drive".

### Mudanças de rodadas anteriores

- **Menu reduzido a 7 itens**: Início, Nossa História, Mídia, Campori DSA 2027, Lava-Jato, Nossas Redes, Login.
- **Página inicial** agora é só sobre o clube (nome, apresentação) + duas chamadas rápidas ("Quero fazer parte" e "Campori DSA 2027").
- **Nossa História** virou uma página própria com uma **linha do tempo visual**, cada marco mostrando o período, o diretor responsável e o acontecimento — sem fotos de diretores.
- **Campori DSA 2027 — Versão Ômega**: página com explicação da campanha, um **cronômetro regressivo** (a liderança configura a data pelo painel) e um botão direto pro WhatsApp.
- **Unidades**: são 6 — Preá, Carcará, Tarântula, Andorinha, Raposa e Beija-Flor.
- A antiga "avaliação semanal com notas de 0 a 10" virou um **histórico de requisitos por desbravador**: dentro do painel da unidade, cada desbravador cadastrado tem sua própria lista de registros (Bíblia/Lição, Uniforme, Pontualidade, Participação, Comportamento ou outro requisito digitado à mão), cada um com a data em que foi cumprido — dá pra lançar quantos registros quiser, inclusive retroativos. A liderança vê o histórico de cada desbravador de todas as unidades.
- **Login**: existe uma página `login.html` que serve como ponto de entrada único ("Sou de uma unidade" / "Sou da liderança").

## 🔧 Resolver problemas no Firebase (checklist)

Se alguma coisa não estiver funcionando depois de você mexer na configuração, comece por aqui:

**"O site inteiro parou de responder — botões, login, tudo."**
→ Quase sempre é um erro de sintaxe em `assets/js/firebase.js`. A causa mais comum: colar a configuração nova **por cima** do arquivo (sem apagar o conteúdo antigo primeiro), duplicando `firebaseConfig`, `app`, `auth`, `db`. Abra o arquivo e confira se cada um desses aparece **uma única vez**. Se tiver duplicado, apague tudo e cole de novo — o conteúdo novo deve **substituir** o arquivo inteiro, não ser adicionado no topo dele.

**"Consigo abrir o site, mas o login não aparece / os botões não fazem nada."**
→ Mesma causa acima na maioria das vezes: algum arquivo `.js` com erro de sintaxe quebra o carregamento de todos os outros (eles dependem uns dos outros). Abra o site, aperte F12 (ferramentas do desenvolvedor) → aba **Console** → veja se aparece algo em vermelho tipo "Uncaught SyntaxError" e em qual arquivo.

**"Faço login mas o painel fica em branco, ou volta pro login sozinho."**
→ Confira no Firebase Console → **Authentication → Users** se a conta existe com o e-mail **exato**: `lideranca@raizesdosertao.app` (liderança) ou `<id-da-unidade>@raizesdosertao.app` (ex.: `carcara@raizesdosertao.app`). Confira também se o provedor **E-mail/senha** está ativado em **Authentication → Sign-in method**.

**"Uma unidade nova (Preá ou Beija-Flor) não consegue entrar."**
→ Essas duas contas ainda não existiam no seu projeto Firebase — você precisa criá-las manualmente uma vez (veja a tabela de contas abaixo e o passo 1.2).

**"Dá erro ao cadastrar/salvar alguma coisa (Lava Jato, membro, mídia...)."**
→ As regras do Firestore não foram publicadas, ou estão desatualizadas. Vá em **Firestore Database → Regras**, apague tudo e cole de novo o conteúdo atual do arquivo [`firestore.rules`](./firestore.rules) → **Publicar**.

**"O Firebase Console recusa publicar as regras (`firestore.rules`), ou dá um erro de sintaxe ao colar."**
→ Mesmo problema do `firebase.js` acima, só que no arquivo de regras: alguém colou um conteúdo novo **por cima** do antigo, em vez de apagar tudo e colar de novo — isso duplica o bloco `service cloud.firestore { ... }`, e regras do Firestore só aceitam **um** bloco desses por arquivo. Se isso acontecer, abra o arquivo e confira se a palavra `service` aparece **uma única vez**; se aparecer duas vezes, o arquivo está com conteúdo duplicado e precisa ser substituído inteiro pela versão certa (a que está neste repositório).

**"As fotos da Mídia não aparecem, só o link 'Abrir no Drive'."**
→ Confira três coisas, nessa ordem: (1) a chave `RS_GOOGLE_DRIVE_API_KEY` em `assets/js/data.js` está preenchida (veja o passo 1.5 abaixo); (2) a pasta do Drive está compartilhada como **"Qualquer pessoa com o link" → Leitor**, não só com pessoas específicas; (3) a **Google Drive API** está ativada no mesmo projeto do Google Cloud da sua chave. Sem isso, o site cai de volta pro link — não é um erro, é o comportamento esperado quando a busca não funciona.

**"O Lava Jato diz que um domingo está lotado/fechado e não deixa cadastrar."**
→ Isso é esperado: só aceitamos 5 carros por domingo, e a liderança pode fechar um domingo específico pelo painel. A pessoa pode escolher outro domingo em aberto na mesma agenda.

**Testar antes de publicar de verdade:** rode o site localmente (veja "Testando localmente" mais abaixo) e olhe o console do navegador (F12) — é o jeito mais rápido de achar o erro exato antes de fazer commit e esperar o GitHub Pages atualizar.

## 1. Configurar o Firebase (uma vez só)

O site precisa de um projeto Firebase gratuito pra funcionar. Leva uns 10-15 minutos:

### 1.1. Criar o projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e entre com uma conta Google.
2. **Adicionar projeto** → dê um nome (ex.: `raizes-do-sertao`) → pode desativar o Google Analytics (não é necessário) → **Criar projeto**.

### 1.2. Ativar o Authentication

1. No menu lateral: **Compilação → Authentication → Introdução**.
2. Na aba **Sign-in method**, ative o provedor **E-mail/senha**.
3. Na aba **Users**, clique **Add user** e crie estas 7 contas (uma de cada vez):

   | Papel | E-mail | Senha (troque depois pelo painel) |
   |---|---|---|
   | Liderança | `lideranca@raizesdosertao.app` | `raizes2026` |
   | Unidade Preá | `prea@raizesdosertao.app` | `sertao123` |
   | Unidade Carcará | `carcara@raizesdosertao.app` | `sertao123` |
   | Unidade Tarântula | `tarantula@raizesdosertao.app` | `sertao123` |
   | Unidade Andorinha | `andorinha@raizesdosertao.app` | `sertao123` |
   | Unidade Raposa | `raposa@raizesdosertao.app` | `sertao123` |
   | Unidade Beija-Flor | `beijaflor@raizesdosertao.app` | `sertao123` |

   Esses e-mails não recebem nada de verdade — são só identificadores de conta. Assim que o site estiver no ar, troque essas senhas pela opção "Trocar senha" dentro de cada painel.

### 1.3. Ativar o Firestore

1. No menu lateral: **Compilação → Firestore Database → Criar banco de dados**.
2. Escolha uma localização (qualquer uma próxima do Brasil, ex. `southamerica-east1`) → **Modo de produção** → Criar.
3. Vá na aba **Regras (Rules)**, apague o conteúdo e cole o conteúdo do arquivo [`firestore.rules`](./firestore.rules) deste repositório → **Publicar**.

### 1.4. Pegar as chaves do site

1. No menu lateral: ⚙️ (ícone de engrenagem) → **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone `</>` (Web) → dê um nome (ex.: `site`) → **Registrar app** (não precisa do Firebase Hosting).
3. Copie o objeto `firebaseConfig` que aparece na tela.
4. Abra o arquivo [`assets/js/firebase.js`](./assets/js/firebase.js) deste projeto e **substitua o arquivo inteiro** (não cole por cima) pelos valores que você copiou.
5. Salve, faça commit e push — pronto, o site está conectado ao seu Firebase.

Essas chaves **não são segredo** — é normal elas aparecerem no código de um app Firebase. Quem protege os dados de verdade são as regras do Firestore (passo 1.3), não esconder essas chaves.

### 1.5. (Opcional) Ativar a exibição automática das fotos da Mídia

Sem esse passo o site continua funcionando normalmente — só que a página de Mídia mostra um link "Abrir no Drive" em vez das fotos. Pra mostrar as fotos direto no site:

1. No [Google Cloud Console](https://console.cloud.google.com/apis/library/drive.googleapis.com), selecione o **mesmo projeto** que você criou no Firebase (Firebase e Google Cloud são o mesmo projeto por trás) e clique **Ativar** na Drive API.
2. Vá em **APIs e Serviços → Credenciais → Criar credenciais → Chave de API**.
3. (Recomendado) Clique na chave criada → em **Restrições do aplicativo**, escolha **Sites** e adicione o endereço do seu site (ex.: `https://seu-usuario.github.io/*`) — assim ninguém mais consegue usar sua chave. Em **Restrições de API**, marque só a **Google Drive API**.
4. Copie a chave e cole no arquivo [`assets/js/data.js`](./assets/js/data.js), na linha `export const RS_GOOGLE_DRIVE_API_KEY = ""`, entre as aspas.
5. Toda pasta que a liderança cadastrar em Mídia precisa estar compartilhada no Drive como **"Qualquer pessoa com o link" → Leitor** — senão a API não consegue ler o conteúdo dela.
6. Salve, faça commit e push.

Essa chave também não é segredo (é só de leitura pública, e dá pra restringir por site como no passo 3) — mas mesmo assim vale restringir pra evitar que outra pessoa gaste a sua cota gratuita da API.

## 2. Publicar no GitHub Pages

1. Suba este projeto para um repositório no GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`.
3. Em alguns minutos o site fica no ar em `https://<seu-usuario>.github.io/<repositorio>/`.

## Mídia (fotos e vídeos)

O site não guarda arquivos (isso não caberia num site gratuito sem servidor de armazenamento) — as fotos continuam morando no Google Drive, mas aparecem direto na página do site:

1. Suba as fotos/vídeos do evento numa pasta do **Google Drive** (gratuito).
2. Compartilhe a pasta como **"Qualquer pessoa com o link" → Leitor**.
3. No painel da liderança → **Mídia**, coloque o nome da pasta + o link.
4. A pasta aparece automaticamente na página pública de **Mídia**, com uma grade das fotos de dentro dela — dá pra ampliar cada uma e baixar, sem precisar abrir o Drive. Isso só funciona com a chave de API configurada (passo 1.5); sem ela, aparece um botão "Abrir no Drive" no lugar.

## Contas de acesso (login)

| Papel | Usuário no login | Senha padrão |
|---|---|---|
| Liderança | `lideranca` | `raizes2026` |
| Cada unidade | `prea`, `carcara`, `tarantula`, `andorinha`, `raposa`, `beijaflor` | `sertao123` |

**Troque essas senhas** assim que o site estiver no ar — cada painel tem uma opção "Configurações → Trocar senha".

## O que dá pra fazer em cada painel

**Painel da liderança** (`painel-lideranca.html`)
- Abrir/fechar domingos na agenda do Lava Jato (com motivo opcional) e ver, em tempo real e de qualquer aparelho, todos os cadastros — avisada (notificação + contador no menu) quando alguém cancela.
- Ver os desbravadores (inclusive tipo sanguíneo) e o histórico de requisitos de cada uma das 6 unidades.
- Publicar/remover pastas de Mídia.
- Configurar a data do Campori DSA 2027 (alimenta o cronômetro da página pública).
- Baixar um backup completo em `.json`.

**Painel da unidade** (`painel-unidade.html`)
- Cadastrar os desbravadores da unidade (inclusive o tipo sanguíneo, opcional).
- Abrir o nome de cada desbravador e lançar quantos registros de requisito quiser (Bíblia/Lição, Uniforme, Pontualidade, Participação, Comportamento ou outro), cada um com a data em que foi cumprido — e excluir um registro se precisar corrigir.

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
- ✅ Cronômetro regressivo pro Campori DSA 2027
- ✅ Aviso de cancelamento do Lava Jato pra liderança (toast + notificação do navegador, enquanto o painel estiver aberto)
- ✅ Backup em `.json`
- ✅ Página 404 personalizada
- ✅ Estilo de impressão

Boas próximas adições, se quiser evoluir o site:
- Notificação por e-mail/WhatsApp de verdade quando alguém cancela o Lava Jato (precisaria de uma Cloud Function do Firebase — ainda gratuita nesse volume, mas exige habilitar o plano "Blaze" com cartão cadastrado, mesmo ficando em R$ 0).
- Upload direto de fotos pelo painel (hoje é só link) usando o Firebase Storage, que já está disponível no mesmo projeto gratuito.
- QR code na entrada do clube apontando pro site, pra facilitar o acesso de visitantes ao Lava Jato.
