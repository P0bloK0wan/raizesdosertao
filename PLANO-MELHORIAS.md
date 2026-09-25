# Evolução do site — Raízes do Sertão

## Entregue na primeira etapa (v67)
- Páginas públicas para agenda, unidades, diário de aventuras, projetos sociais e participação.
- Acesso pelas navegações e pela nova seção da página inicial.
- CSS responsivo compartilhado e atualização do cache do PWA.
- Testes estáticos de páginas, navegação, cache e integrações existentes.
- Páginas de agenda, projetos e diário exibem apenas conteúdo de apresentação até que a liderança aprove conteúdo real. Não há eventos ou resultados inventados.

## Próximas dependências
1. **Conteúdo público:** decidir quem publica eventos, relatos e projetos. Criar coleções separadas para conteúdo aprovado, com regras de leitura pública e escrita exclusiva da liderança. Não expor dados das coleções internas.
2. **Segurança:** revisar e testar regras no Firebase Emulator, especialmente dados pessoais de menores, permissões de unidade, exclusões e lava-jato. Não publicar regras novas sem testes de regressão.
3. **Auditoria:** definir ações auditadas e retenção. Para trilha resistente a adulterações, gravar eventos por backend confiável, não apenas pelo navegador.
4. **Painéis:** modularizar o JavaScript e redesenhar as telas por etapas sem migrar ou sobrescrever documentos existentes.
5. **Galeria:** usar apenas fotos autorizadas; adicionar metadados e acessibilidade. Confirmar identidade visual e emblema correto de Beija-Flor.
6. **Campori:** definir fonte confiável da meta e dos valores efetivamente recebidos antes de exibir progresso. Não usar valores apenas informados pelo navegador.
7. **Lava-jato:** testar concorrência e lotação no emulador; preservar agendamentos e token de cancelamento.
8. **Qualidade:** adicionar testes E2E mobile, contraste claro/escuro e fluxo real de Firebase em ambiente de homologação.

## Executar
`node tests/site-smoke.mjs`

Testes estáticos não substituem publicação, teste em Safari ou integração com Firebase.
