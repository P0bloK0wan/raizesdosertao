# Plano de implantação — Raízes do Sertão

## Princípios
- Preservar os documentos do Firestore, IDs, autenticação e fluxos já usados.
- Não publicar nomes completos, contatos, presença ou dados de menores.
- Não inventar datas de eventos, resultados de campanhas nem valores arrecadados.
- Toda funcionalidade nova com dados deve passar por testes em ambiente isolado antes da produção.

## Etapa 1 — base pública (iniciada)
- [x] Página inicial com acessos às novas áreas.
- [x] Páginas de unidades, agenda, aventuras, projetos e participação.
- [x] Navegação compartilhada e layout adaptável.
- [x] Agenda com estado honesto enquanto não houver eventos públicos aprovados.
- [ ] Conferir em iPhone Safari, Android Chrome e desktop; revisar contraste dos dois temas.
- [ ] Publicar fotos autorizadas e conteúdo real revisado pela direção.

## Etapa 2 — dados públicos seguros
- [ ] Criar coleção separada para eventos públicos aprovados, sem expor o planejamento interno.
- [ ] Criar fluxo de publicação de relatos e projetos com revisão e autorização de imagens.
- [ ] Campori: meta e arrecadação verificadas; nunca calcular progresso com doações não confirmadas.
- [ ] Testar regras do Firestore no emulador com visitante, unidade e liderança.

## Etapa 3 — painéis e lava-jato
- [ ] Painel da unidade: atalhos e indicadores a partir dos registros existentes.
- [ ] Painel da liderança: pendências, filtros e visão consolidada.
- [ ] Histórico de alterações: registrar ator, ação, data e referência sem copiar dados pessoais desnecessários.
- [ ] Lava-jato: revisar agendamento, concorrência por vagas, cancelamento e confirmação.
- [ ] Testar todos os fluxos com dados fictícios e contas de teste.

## Etapa 4 — qualidade
- [ ] Modularizar JavaScript dos painéis e revisar inserções de HTML dinâmico.
- [ ] Testes automatizados de integridade de páginas, rotas, regras e operações críticas.
- [ ] Testes reais de acessibilidade, cache PWA, conexão lenta e ambos os temas.
- [ ] Aprovar implantação e verificar versão no domínio público.

**Importante:** alterações no arquivo firestore.rules do GitHub não publicam automaticamente as regras no Firebase.
