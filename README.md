# Raízes do Sertão — site do clube

Site do Clube de Desbravadores **Raízes do Sertão** (Vila Eduardo — Região 13, 4º Distrito, APeC): apresentação do clube, nossa história em linha do tempo, mídia (fotos/vídeos), campanha do Campori DSA 2027, cadastro do Lava Jato, redes sociais, e painéis de login para a liderança e para cada unidade — com planejamento de atividades, especialidades, materiais e responsáveis dos desbravadores.

Não existe login individual por desbravador: quem quiser ver as especialidades/planejamento autorizado de um desbravador específico usa o login da própria unidade dele (a mesma senha que os líderes já usam).

HTML/CSS/JS puro (sem build, sem framework), publicado de graça no **GitHub Pages**. Os dados (desbravadores, atividades, cadastros do Lava Jato, pastas de mídia, data do Campori) ficam sincronizados entre todos os aparelhos em tempo real, usando o **Firebase** (Firestore + Authentication) no plano gratuito do Google.

## 📝 O que mudou na última atualização

- **Publicar o Cloudflare Worker do Mercado Pago agora pode ser feito sem computador** — um botão "Deploy to Cloudflare" que funciona direto no navegador do celular, sem precisar de terminal nem instalar nada. O caminho antigo por linha de comando (`wrangler`) continua disponível como alternativa pra quem tem computador. Veja "Configurar a API de pagamento do Mercado Pago" abaixo.
- **Mídia voltou a ser só link do Google Drive** — a liderança publica uma pasta com nome + link (compartilhado como "Qualquer pessoa com o link"), sem upload de fotos pelo site. O upload manual pelo Cloudinary (rodada anterior) foi abandonado pra Mídia — o Cloudinary continua sendo usado só pra logo das unidades (veja o item abaixo).
- **Logo, grito de guerra e cor de cada unidade agora só a liderança define**, numa nova seção "Identidade das Unidades" no painel dela (a seção "Minha Unidade", que existia no painel de cada unidade pra troca autoatendida, foi removida). A cor é escolhida numa paleta de cores prontas pra clicar (ou um seletor de cor pra uma escolha específica) e aparece nos botões principais e numa faixa no topo do painel daquela unidade — não no site inteiro nem no fundo da barra lateral.

### Rodada anterior

- **O botão "Quero ajudar" do Campori passou a usar a API de pagamento de verdade do Mercado Pago** (cartão, boleto ou **PIX**), em vez de um link fixo criado na mão. A pessoa digita (ou escolhe um valor sugerido: R$20/R$50/R$100) quanto quer doar, o site gera a cobrança na hora e ela paga; depois volta pro site com uma mensagem de agradecimento. Isso precisou de um servidor bem pequeno (**Cloudflare Worker**, gratuito, sem cartão) só pra guardar a chave secreta do Mercado Pago em segurança — ela nunca pode aparecer no código do navegador.
- O botão "Quero ajudar" tinha acabado de virar um link de pagamento fixo, criado na mão no painel do Mercado Pago — *substituído nessa rodada pela API de verdade (valor livre digitado na hora)*.
- Essa rodada juntou vários pedidos pequenos — mais controle pra liderança, mais identidade pras unidades, e a troca da Mídia pra um jeito que não depende de cartão de crédito:

- **Mídia trocou de Firebase Storage pra Cloudinary**: o Storage do Firebase passou a exigir plano pago (Blaze) pra ser ativado em projetos novos — mesmo sem cobrar nada dentro da cota grátis, ele pede cartão, o que não rolava pra esse projeto. A Mídia subiu a passar as fotos pro **Cloudinary** (outro serviço gratuito, sem cartão) — *depois revertido: veja o topo desta seção, a Mídia agora é só link do Google Drive de novo; o Cloudinary ficou só pra logo das unidades*.
- **Liderança agora pode apagar planejamentos de qualquer unidade** (antes só dava pra aprovar/recusar) — apagar pede um motivo, e a unidade recebe um aviso.
- **Liderança pode editar ou apagar o que uma unidade cadastrou**: desbravadores, especialidades e itens da lista de compras. Toda edição/exclusão feita pela liderança pede um motivo, e a unidade recebe uma notificação explicando o que mudou e por quê.
- **Planejamento do Clube agora aparece pras unidades também** (antes só a liderança via o calendário) — as unidades veem em modo só-leitura, sem poder editar.
- **Notificações ganharam um botão de excluir individual** (✕) — antes só dava pra marcar tudo como lido de uma vez; agora dá pra remover uma notificação específica da lista.
- **Troca de senha das unidades passou a depender de aprovação da liderança**: a unidade pede a troca (digita a senha nova), a liderança aprova ou recusa (com motivo). Se aprovar, a troca se aplica sozinha na próxima vez que a unidade entrar com a senha atual — ninguém precisa ficar repassando senha por mensagem. A senha não fica guardada em lugar nenhum depois de aplicada (nem a liderança consegue "consultar" a senha de uma unidade depois do fato).
- **Cada unidade podia configurar sua própria logo e grito de guerra** numa seção "Minha Unidade" no painel — *depois revertido: veja o topo desta seção, agora só a liderança define isso (que também passou a incluir a cor da unidade)*.
- **Cadastro de conselheiros por unidade**: nova seção no painel da unidade pra cadastrar os conselheiros dela (nome, idade, telefone) — a liderança vê a lista de conselheiros de cada unidade.
- **Campo de idade no cadastro do desbravador** (além da data de nascimento que já existia).
- **Animação nas telas de login** (entrada suave do card, pequenos efeitos ao passar o mouse) — só visual, não muda nenhum fluxo.

### Rodadas anteriores (mais recente primeiro)

- Liderança pode apagar planejamentos e editar/apagar o que uma unidade cadastrou (com motivo e aviso); Planejamento do Clube visível pras unidades; notificações com botão de excluir individual; troca de senha da unidade por aprovação da liderança; Mídia migrada do Firebase Storage pro Cloudinary; logo e grito de guerra por unidade; cadastro de conselheiros; campo de idade do desbravador; animação nas telas de login.
- O site tinha parado de novo: o arquivo `assets/js/firebase.js` tinha sido sobrescrito por engano com outro conteúdo que não é código válido, quebrando login, painéis e Mídia ao mesmo tempo. Corrigido.
- Mídia passou a ser upload manual, com download em resolução completa (nessa época ainda usando o Firebase Storage, depois substituído pelo Cloudinary).

Antes disso, uma atualização grande — 6 áreas novas, pensadas pra dar mais autonomia pras unidades e uma visão central pra liderança:

- **Planejamento das Unidades**: cada unidade cria propostas de planejamento (título, data, horário, local, objetivo, descrição, observações) e envia pra liderança aprovar. A liderança vê todas as propostas de todas as unidades, com filtros por unidade/status/data, e pode **Aprovar** ou **Recusar** (recusar exige escrever o motivo). A unidade recebe um aviso (sino de notificações) com o resultado — se for recusada, vê o motivo, corrige e reenvia (volta pra pendente); depois de aprovada, a proposta não pode mais ser editada.
- **Especialidades**: cada unidade cadastra as especialidades que os desbravadores estão fazendo (nome, instrutor, data de início, status, o que já foi concluído, o que falta, materiais necessários, observações), editável quantas vezes precisar. A liderança vê tudo isso de todas as unidades em tempo real, sem precisar perguntar unidade por unidade.
- **O que falta comprar**: dentro do cadastro de cada desbravador, a unidade lista os materiais que faltam pra ele concluir uma atividade ou especialidade, e marca como pendente/comprado. A liderança tem uma lista geral de compras juntando os itens de todo mundo.
- **Cadastro de responsáveis**: agora é obrigatório informar pelo menos um responsável (nome + telefone) pra cadastrar um desbravador, com grau de parentesco; dá pra adicionar um segundo responsável (opcional) e observações. A liderança tem uma aba só de contatos de responsáveis, de todas as unidades.
- **Planejamento do Clube**: um calendário privado (só liderança e unidades logadas veem — não aparece pra visitante) com os eventos do semestre, organizado por mês. A liderança adiciona, edita e exclui eventos (inclusive eventos de vários dias, tipo o acampamento), e pode carregar de uma vez o planejamento padrão do 2º semestre com um botão. Sempre aparece o aviso "sujeito a mudanças" no rodapé.
- **Dashboard da liderança**: o painel da liderança ganhou vários indicadores novos (unidades, desbravadores, planejamentos pendentes/aprovados/recusados, especialidades em andamento/concluídas, materiais a comprar, desbravadores sem especialidade cadastrada, cadastros incompletos, responsáveis sem telefone) — tudo num lugar só, sem precisar entrar unidade por unidade.
- **Notificações**: um sino no topo dos dois painéis mostra avisos (planejamento aprovado/recusado pra unidade, novo planejamento enviado pra liderança), com contador de não lidas. É só dentro do site (sem WhatsApp/e-mail de verdade — isso exigiria habilitar o plano pago do Firebase, o que sairia da promessa de "tudo de graça").

### Rodadas anteriores a essa

- **Lava-Jato voltou a ter agenda**: a página mostra os próximos domingos num grid — cinza com o número de vagas livres, laranja quando lota (só aceitamos **5 carros por domingo**), vermelho quando a liderança fecha o dia. Quem for se cadastrar escolhe o domingo (só aparecem datas com vaga). No painel da liderança, clicar num domingo aberto fecha ele (com um motivo opcional, tipo "sem lavagem esse domingo") — e clicar de novo reabre. Isso já empurra o pessoal a se agendar pro próximo domingo em vez do que foi fechado.
- **Desbravadores podem ter o tipo sanguíneo registrado** (campo opcional no cadastro, dentro do painel da unidade) — bom ter à mão, mas não é obrigatório preencher.
- **Mídia passou a mostrar as fotos direto no site** (buscando de uma pasta do Google Drive por link) — *substituído depois por upload manual direto no site (Cloudinary), veja "Mídia" mais abaixo*.

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
→ Quase sempre é um erro de sintaxe em `assets/js/firebase.js`. A causa mais comum: colar algum outro conteúdo **por cima** do arquivo (sem apagar o conteúdo antigo primeiro) em vez de substituí-lo inteiro. Isso já aconteceu de três formas diferentes neste projeto — todas com o mesmo sintoma e a mesma correção:
  - Duplicando `firebaseConfig`, `app`, `auth`, `db` (colou a config nova sem apagar a antiga).
  - Com o conteúdo do arquivo `firestore.rules` colado dentro dele por engano (`firebase.js` é **JavaScript** — as chaves do site; `firestore.rules` é a **linguagem de regras do Firestore** — nunca colar o conteúdo de um dentro do outro).
  - Com pedaços de um `git diff` colados dentro (sinal claro: linhas começando com `@@ -alguma coisa @@`, ou o mesmo trecho de código aparecendo repetido/fora de ordem no arquivo).

  Em qualquer um desses casos, abra `assets/js/firebase.js` e confira se `firebaseConfig`, `app`, `auth` e `db` aparecem **uma única vez** cada, e se o arquivo só tem JavaScript (nada de `service cloud.firestore`, nada de `@@`). Se estiver estranho, apague tudo e cole de novo o conteúdo do passo 1.4 abaixo — o conteúdo novo deve **substituir** o arquivo inteiro, não ser adicionado no topo dele.

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

**"Não consigo trocar a logo de uma unidade / dá erro dizendo que o Cloudinary não foi configurado."**
→ Confira se `RS_CLOUDINARY_CLOUD_NAME` e `RS_CLOUDINARY_UPLOAD_PRESET`, no arquivo `assets/js/data.js`, estão preenchidos (veja o passo 1.6 abaixo) e se o preset foi criado como **Unsigned** no painel do Cloudinary. Sem isso, só o upload da logo falha — o resto do site continua funcionando normalmente.

**"Pedi pra trocar a senha da unidade e a liderança aprovou, mas a senha antiga continua funcionando."**
→ Isso é esperado até a unidade **entrar de novo** com a senha atual — é só nesse momento (logo após o login) que o site aplica a troca sozinho. Se demorar demais, confira se a unidade realmente saiu e entrou de novo depois da aprovação.

**"O Lava Jato diz que um domingo está lotado/fechado e não deixa cadastrar."**
→ Isso é esperado: só aceitamos 5 carros por domingo, e a liderança pode fechar um domingo específico pelo painel. A pessoa pode escolher outro domingo em aberto na mesma agenda.

**"O botão 'Quero ajudar' do Campori continua abrindo o WhatsApp em vez de pedir pagamento."**
→ Isso é esperado até você configurar a API do Mercado Pago (Worker) — veja o passo 1.7. Sem `RS_API_DOACAO_CAMPORI` preenchido em `assets/js/data.js`, o botão cai de volta pro WhatsApp de propósito, pra nunca ficar quebrado.

**"Cliquei em 'Quero ajudar', digitei um valor, e apareceu uma mensagem de erro em vez de ir pro pagamento."**
→ Normalmente é o Cloudflare Worker que não está publicado, ou o `MP_ACCESS_TOKEN` não foi configurado como secret nele (veja o passo 1.7). Também pode ser o `SITE_ORIGIN` no `wrangler.toml` desatualizado — se não bater com o endereço real do site, o navegador bloqueia a chamada por segurança (CORS).

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

### 1.6. Configurar o Cloudinary (necessário pra logo das unidades)

A logo de cada unidade (configurada pela liderança em "Identidade das Unidades") fica guardada no **Cloudinary** (não no Firebase) — um serviço à parte, também gratuito e sem pedir cartão de crédito, feito justamente pra permitir que um site sem servidor próprio receba upload de imagens com segurança. *A Mídia (fotos de eventos) não usa mais isso — voltou a ser só link do Google Drive, veja "Mídia" mais abaixo.*

1. Crie uma conta grátis em [cloudinary.com](https://cloudinary.com) (não precisa cartão).
2. No painel do Cloudinary, anote o **Cloud name** que aparece no topo (ex.: `dxyz1234`).
3. Vá em **Settings → Upload → Upload presets → Add upload preset**.
4. Configure o preset:
   - **Signing Mode**: `Unsigned` (é isso que permite o site enviar imagens sem precisar de uma chave secreta escondida em algum lugar).
   - (Recomendado) **Folder**: algo como `raizes-do-sertao`, pra organizar.
   - (Recomendado) Em **Upload Manipulations**, limite o **tamanho máximo do arquivo** (ex.: 10MB, o mesmo limite já usado no site) e restrinja os **Allowed formats** a `jpg,png,webp` — assim, mesmo que alguém tente abusar do preset, ele não consegue subir nada fora disso.
   - Salve e anote o **nome do preset** que você deu a ele.
5. Abra o arquivo [`assets/js/data.js`](./assets/js/data.js) e preencha `RS_CLOUDINARY_CLOUD_NAME` (o Cloud name do passo 2) e `RS_CLOUDINARY_UPLOAD_PRESET` (o nome do preset do passo 4).
6. Salve, faça commit e push.

O Cloud name e o nome do preset **não são segredo** — um preset "unsigned" só permite enviar dentro do que foi configurado ali (tamanho, formato, pasta), nunca dá acesso de leitura ou exclusão da sua conta Cloudinary. É a mesma lógica das chaves do Firebase (passo 1.4): aparecem no código, mas não são a camada que protege de verdade.

**Sobre trocar a logo**: como o site não tem servidor próprio, trocar a logo de uma unidade tira a antiga do site, mas o arquivo pode continuar existindo na sua conta do Cloudinary (o plano gratuito tem espaço de sobra pra isso não ser um problema num clube pequeno).

### 1.7. Configurar a API de pagamento do Mercado Pago (opcional)

Sem esse passo, o botão **"Quero ajudar"** na página do Campori continua funcionando normalmente — só que abrindo uma conversa no WhatsApp, como já era antes.

Diferente de um link de pagamento fixo, aqui o site chama a **API de verdade** do Mercado Pago pra gerar a cobrança na hora, com o valor que a pessoa escolher. Isso exige uma chave secreta (Access Token) do Mercado Pago — e uma chave secreta **nunca pode aparecer no código do navegador** (qualquer pessoa que abrisse o site conseguiria roubá-la). Por isso essa chamada acontece num servidor bem pequeno e separado, feito só pra isso: um **Cloudflare Worker** — um serviço gratuito de verdade, sem pedir cartão de crédito. O código dele já está pronto na pasta [`cloudflare-worker/`](./cloudflare-worker) deste repositório; falta só publicar.

**Passo 1 — Pegar as credenciais do Mercado Pago:**
1. Crie uma conta **pessoal** grátis em [mercadopago.com.br](https://www.mercadopago.com.br) (pode pedir uma verificação de identidade simples — normal, gratuita, e é a mesma conta que recebe o dinheiro depois).
2. Acesse o [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel) e crie uma aplicação (qualquer nome, ex.: "Site Raízes do Sertão").
3. Na aba **Credenciais de produção**, copie o **Access Token** (começa com `APP_USR-...`) — é essa a chave secreta. Existem também "Credenciais de teste" (começam com `TEST-...`), úteis pra testar o fluxo inteiro sem mexer com dinheiro de verdade antes de divulgar pra valer.

**Passo 2 — Publicar o Cloudflare Worker:**

Tem dois jeitos de fazer isso. Escolha o que combina com o que você tem disponível.

**🔹 Não tenho computador (só celular) — 1 clique, sem terminal:**

1. Toque no botão abaixo (funciona no navegador do celular também):

   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/P0bloK0wan/raizesdosertao/tree/claude/car-wash-vacancy-management-7pfqy7/cloudflare-worker)

2. Faça login ou crie uma conta grátis na Cloudflare (não pede cartão).
3. Confirme a publicação — a Cloudflare lê o `wrangler.toml` deste repositório e publica o Worker sozinha, sem você precisar copiar/colar nenhum código.
4. Depois que publicar, vá em **Workers & Pages** → clique no Worker que acabou de ser criado (`raizes-doacao-campori`) → aba **Settings** → **Variables and Secrets** → **Add** → escolha o tipo **Secret** → nome `MP_ACCESS_TOKEN`, valor = o Access Token do Passo 1 → **Save and deploy**.
5. Pronto — nenhum outro passo manual é necessário. As variáveis `SITE_URL_CAMPORI`/`SITE_ORIGIN` já vêm preenchidas com o endereço certo deste site.

⚠️ **Atenção:** o link do botão aponta pro branch `claude/car-wash-vacancy-management-7pfqy7` deste repositório. Se um dia esse trabalho for mesclado pro branch principal (`main`) e este branch for apagado, o link do botão para de funcionar — nesse caso, troque `claude/car-wash-vacancy-management-7pfqy7` na URL do botão pelo nome do branch novo (ou `main`).

**🔹 Tenho computador — pelo terminal:**

1. Dentro da pasta `cloudflare-worker/` deste projeto, rode:
   ```
   npx wrangler login
   ```
   (abre o navegador pra você autorizar; instala o `wrangler`, ferramenta oficial da Cloudflare, na hora — não precisa instalar nada à parte).
2. Guarde o Access Token como segredo (nunca vai pro código):
   ```
   npx wrangler secret put MP_ACCESS_TOKEN
   ```
   (cola o Access Token do Passo 1 quando ele pedir).
3. Publique:
   ```
   npx wrangler deploy
   ```
   Ao final, ele mostra a URL do Worker (algo como `https://raizes-doacao-campori.SEU-USUARIO.workers.dev`).
4. Se o seu site tiver um endereço diferente do já preenchido em [`cloudflare-worker/wrangler.toml`](./cloudflare-worker/wrangler.toml) (`SITE_URL_CAMPORI`/`SITE_ORIGIN`), ajuste esses valores antes do passo 3 — ou depois, direto pelo painel (Settings → Variables and Secrets), sem precisar publicar de novo pelo terminal.

**Passo 3 — Ligar o site ao Worker:**
1. Depois de publicado (por qualquer um dos dois caminhos acima), copie a URL do Worker — no painel da Cloudflare ela aparece em **Workers & Pages** → o nome do Worker → topo da página (algo como `https://raizes-doacao-campori.SEU-USUARIO.workers.dev`).
2. Abra o arquivo [`assets/js/data.js`](./assets/js/data.js) e preencha `RS_API_DOACAO_CAMPORI` com essa URL.
3. Salve, faça commit e push.

**Antes de divulgar de verdade, teste com as "Credenciais de teste"** do Passo 1 (troque o Access Token do Worker por uma delas, gere um pagamento de teste, confira se o fluxo completo funciona), depois troque pelo Access Token de produção quando estiver tudo certo.

**Coisas importantes de saber:**
- O Mercado Pago cobra uma taxa por transação (o percentual varia por forma de pagamento — confira o valor atual direto no painel da sua conta antes de divulgar).
- O Cloudflare Worker é gratuito até 100.000 chamadas por dia — muito acima do que um clube pequeno usaria.
- Como o site não tem um servidor "de verdade" recebendo aviso direto do banco (webhook), a mensagem de "obrigado"/"pendente"/"não foi possível confirmar" depois do pagamento é baseada só no redirecionamento que o Mercado Pago faz de volta — não é uma confirmação criptograficamente à prova de fraude (tecnicamente, alguém poderia visitar a URL de "obrigado" na mão sem ter pago nada). Pra uma arrecadação voluntária de um clube pequeno isso é uma limitação aceitável, mas vale saber que ela existe.
- Pagamentos por **boleto** demoram (às vezes dias) pra confirmar — nesses casos a pessoa costuma cair na mensagem de "pagamento em processamento", não na de "obrigado" na hora.

## 2. Publicar no GitHub Pages

1. Suba este projeto para um repositório no GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, escolha a branch `main` e a pasta `/ (root)`.
3. Em alguns minutos o site fica no ar em `https://<seu-usuario>.github.io/<repositorio>/`.

## Mídia (fotos e vídeos)

O site não guarda arquivos — as fotos continuam morando no **Google Drive**, e o site só mostra um botão pra abrir a pasta:

1. Suba as fotos/vídeos do evento numa pasta do **Google Drive** (gratuito).
2. Compartilhe a pasta como **"Qualquer pessoa com o link" → Leitor**.
3. No painel da liderança → **Mídia** → **+ Nova pasta**, preencha o nome (ex.: "Acampamento 2026") e cole o link da pasta do Drive.
4. A pasta aparece automaticamente na página pública de **Mídia**, com um botão **"Abrir no Drive ↗"** pra qualquer visitante ver e baixar as fotos direto do Drive.
5. Pra remover uma pasta, use o botão de excluir no painel da liderança.

## Contas de acesso (login)

| Papel | Usuário no login | Senha padrão |
|---|---|---|
| Liderança | `lideranca` | `raizes2026` |
| Cada unidade | `prea`, `carcara`, `tarantula`, `andorinha`, `raposa`, `beijaflor` | `sertao123` |

**Troque essas senhas** assim que o site estiver no ar — cada painel tem uma opção "Configurações → Trocar senha".

## O que dá pra fazer em cada painel

**Painel da liderança** (`painel-lideranca.html`)
- Ver e filtrar (por unidade/status/data) todas as propostas de Planejamento das Unidades, aprovar, recusar ou **excluir** (tudo com motivo obrigatório, avisando a unidade).
- Ver as especialidades de todos os desbravadores de todas as unidades, com progresso, o que falta e materiais necessários — **editar o progresso ou excluir uma especialidade**, com motivo.
- Ver a lista geral de compras (materiais pendentes de todos os desbravadores), marcar como comprado ou **excluir um item**, com motivo.
- Ver os contatos de todos os responsáveis, de todas as unidades.
- Gerenciar o Planejamento do Clube: calendário privado por mês, adicionar/editar/excluir eventos, carregar o planejamento padrão do semestre com um clique.
- Abrir/fechar domingos na agenda do Lava Jato (com motivo opcional) e ver, em tempo real e de qualquer aparelho, todos os cadastros — avisada (notificação + contador no menu) quando alguém cancela.
- Ver os desbravadores (inclusive idade e tipo sanguíneo) e o histórico de requisitos de cada uma das 6 unidades — **editar o cadastro de um desbravador, excluir um desbravador ou um registro**, tudo com motivo obrigatório e aviso automático pra unidade.
- Configurar a logo, o grito de guerra e a cor de cada unidade em "Identidade das Unidades" (a cor aparece nos botões e numa faixa no topo do painel daquela unidade) — só a liderança define isso agora.
- Ver a lista de conselheiros de cada unidade.
- Aprovar ou recusar pedidos de troca de senha das unidades (a senha em si nunca fica salva depois de aplicada).
- Publicar/remover pastas de Mídia (nome + link do Google Drive).
- Configurar a data do Campori DSA 2027 (alimenta o cronômetro da página pública).
- Acompanhar um dashboard com os principais números do clube (planejamentos, especialidades, compras pendentes, cadastros incompletos etc.).
- Baixar um backup completo em `.json`.

**Painel da unidade** (`painel-unidade.html`)
- Ver a própria logo e o grito de guerra (definidos pela liderança, em "Identidade das Unidades") — só leitura.
- Cadastrar os desbravadores da unidade (com idade, responsável obrigatório com telefone, segundo responsável opcional e tipo sanguíneo opcional) e os conselheiros da unidade (nome, idade, telefone).
- Abrir o nome de cada desbravador e lançar quantos registros de requisito quiser (Bíblia/Lição, Uniforme, Pontualidade, Participação, Comportamento ou outro), cada um com a data em que foi cumprido — e excluir um registro se precisar corrigir.
- Cadastrar e atualizar as especialidades de cada desbravador (progresso, o que falta, materiais necessários).
- Listar o que falta comprar pra cada desbravador e marcar como comprado.
- Enviar propostas de Planejamento pra liderança aprovar, acompanhar o status e — se for recusada — corrigir e reenviar.
- Ver o Planejamento do Clube (calendário da liderança), só leitura.
- Pedir troca de senha (a liderança precisa aprovar — a troca se aplica sozinha no próximo login).
- Receber avisos (sino de notificações, com botão de excluir um aviso específico) quando a liderança aprova/recusa uma proposta, ou edita/exclui algo que a unidade cadastrou.

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
- ✅ Upload direto de fotos pelo painel (Cloudinary)
- ✅ Liderança editando/apagando o que uma unidade cadastrou, com aviso do motivo

Boas próximas adições, se quiser evoluir o site:
- Notificação por e-mail/WhatsApp de verdade quando alguém cancela o Lava Jato ou quando a liderança altera algo (precisaria de uma Cloud Function do Firebase — ainda gratuita nesse volume, mas exige habilitar o plano "Blaze" com cartão cadastrado, mesmo ficando em R$ 0).
- Mostrar a logo de cada unidade já na tela de login (hoje ela só aparece depois de entrar nos painéis).
- QR code na entrada do clube apontando pro site, pra facilitar o acesso de visitantes ao Lava Jato.
