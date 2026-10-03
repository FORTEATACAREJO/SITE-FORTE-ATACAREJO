# Central Forte Atacarejo

Entrada: `/sistemas.html`. O atalho `/central.html` leva para a mesma Central. Há entrada no menu e no rodapé do site.

A Central reúne Vendas, Financeiro, Fiscal, Frete, Venda Externa, Carga Direta, Operador de Pátio e Site. Consulta o perfil atual e a view `central_meus_acessos` no projeto operacional Vendas; só mostra sistemas ativos com autorização individual aprovada. Não compartilha credenciais por URL e não conecta os bancos Fiscal e Frete. Cada aplicativo continua responsável por autenticação e autorização próprias. Entrar na Central não entra automaticamente nos outros domínios.

Login CPF e senha numérica de pelo menos seis dígitos. A senha é enviada somente ao endpoint existente `login-cpf`, nunca gravada pela Central. A sessão fica no `sessionStorage` da Central. Sair usa escopo local e limpa essa sessão, sem desconectar os demais dispositivos. Primeiro acesso e recuperação levam aos fluxos existentes do Vendas; esta entrega não certifica entrega de e-mail ou WhatsApp.

As listas são reconstruídas após cada consulta. Erros, perfil inativo/pendente, troca obrigatória de senha, identidade divergente e endereço de aplicativo fora do domínio aprovado bloqueiam a exibição. Respostas atrasadas são descartadas após sair. O código antigo de acesso do site foi preservado para a administração; a Central usa seu próprio módulo e não tenta importar o arquivo do Pátio.

O manifesto e os ícones 192/512 permitem adicionar a Central como aplicativo web quando o navegador oferece instalação. O botão também explica os passos no Safari, Chrome e Edge. Não é uma publicação na Play Store ou Apple Store. O service worker guarda apenas a estrutura pública da Central e seus ícones; não armazena respostas de Auth, dados de usuário, permissões ou dados dos sistemas. A operação exige internet.

Biblioteca de cliente: Supabase JS 2.57.4, fixada no endereço do import, como no acesso anterior. Uma falha no carregamento mostra mensagem em português com opção de tentar novamente.

## Verificação de 03/10/2026

- 18 cenários aprovados no Chromium usando o componente real, serviços/sessão simulados e nenhuma senha real.
- 8 links responderam HTTP 200 e identificaram os aplicativos esperados.
- A view real, consultada com identidade e papel autenticado do master principal, retornou as oito autorizações APROVADO/permitido=true. A consulta foi encerrada com ROLLBACK.
- A view é `security_invoker=true`; suas tabelas têm RLS. Não foram concedidas novas permissões nem alterados cadastros.
- Visualização conferida em desktop e celular; largura 320/390/768/1440 e texto ampliado a 200% sem rolagem horizontal.

Executar `node --test --test-timeout=30000 tests/central-browser-simulation.mjs` a partir deste diretório. Requer Playwright/Chromium; instalações existentes podem ser informadas por `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` e `PLAYWRIGHT_CHROMIUM_ARGS` (array JSON). `CENTRAL_SCREENSHOT_DIR` ativa as capturas de revisão.

Esses testes cobrem a Central e seus limites de acesso. Não homologam todos os fluxos dos aplicativos, emissão fiscal nem comunicação bancária.
