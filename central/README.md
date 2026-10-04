# Central Forte Atacarejo

Entrada pública: `/sistemas.html`. O atalho `/central.html` abre a mesma tela. O menu e o rodapé do site dão acesso à Central.

Desde 04/10/2026, a Central **não solicita CPF, senha, sessão nem aprovação para mostrar os ícones**. Os oito cartões estão no HTML: Vendas, Financeiro, Fiscal, Frete, Venda Externa, Carga Direta, Operador de Pátio e Site. Aparecem imediatamente, inclusive sem JavaScript, sem sessão e com falha no script de instalação. Não há importação de Supabase nem de bibliotecas externas.

Cada cartão abre somente o endereço aprovado do aplicativo em nova aba, com `noopener noreferrer`. A Central não envia credenciais, não concede acesso, não faz login automático e não redireciona automaticamente para o Vendas. Cada aplicativo permanece responsável pelo login e pela aprovação do cadastro pelo master/admin. Nenhuma política, perfil, permissão ou banco de aplicativos foi alterado por esta atualização. O site institucional permanece público.

Instalar a Central cria um ponto de entrada com todos os atalhos. O manifesto preserva o mesmo identificador e abre `/sistemas.html`. Não instala automaticamente oito aplicativos nativos nem publica nas lojas. O botão oferece a instalação do navegador quando disponível e as instruções correspondentes para Safari, Chrome ou Edge.

A versão `20261004-1` atualiza o cache anterior automaticamente. O service worker guarda apenas a estrutura pública e os ícones da Central; ignora outros domínios e arquivos do site fora da lista. Não armazena dados ou sessões dos sistemas. A tela pode abrir sem conexão depois da primeira visita; os sistemas exigem internet. A antiga sessão exclusiva da Central é removida do sessionStorage local, sem chamadas de Auth e sem desconectar os outros aplicativos.

Os dados fixos dos cartões em `core.mjs` são usados na verificação contra o HTML. Os testes executam o HTML, scripts, manifesto e service worker reais com um servidor local; a abertura dos aplicativos é simulada sem acessar bancos nem enviar mensagens.

Execute `node --test --test-timeout=45000 tests/central-browser-simulation.mjs` a partir deste diretório. Requer Playwright e Chromium; instalações existentes podem ser informadas por `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` e `PLAYWRIGHT_CHROMIUM_ARGS` (array JSON). `CENTRAL_SCREENSHOT_DIR` ativa capturas de revisão.

Verificação em 04/10/2026: 15 cenários aprovados no Chromium, incluindo acesso anônimo, oito cartões, abas independentes, ausência de chamadas de Auth, sessão antiga, atalho da Central, larguras 320/390/768/1440, fonte ampliada, instruções Chrome/Edge/iPhone, prompt após clique, manifesto, JavaScript indisponível, falha de script e atualização do cache com abertura sem internet.

Os testes verificam a Central pública, navegação, atualização e instalação. Não certificam login real ou homologação fiscal/bancária dos aplicativos.
