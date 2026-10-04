# Central Forte Atacarejo

Entrada pública: `/sistemas.html`. O atalho `/central.html` abre a mesma tela. O menu e o rodapé do site dão acesso à Central.

Desde 04/10/2026, a Central **não solicita CPF, senha, sessão nem aprovação para mostrar os ícones**. Os oito cartões estão no HTML: Vendas, Financeiro, Fiscal, Frete, Venda Externa, Carga Direta, Operador de Pátio e Site. Aparecem imediatamente, inclusive sem JavaScript, sem sessão e com falha no script de instalação. Não há importação de Supabase nem de bibliotecas externas.

Cada cartão abre somente o endereço aprovado do aplicativo em nova aba, com `noopener noreferrer`. A Central não envia credenciais, não concede acesso, não faz login automático e não redireciona automaticamente para o Vendas. Cada aplicativo permanece responsável pelo login e pela aprovação do cadastro pelo master/admin. Nenhuma política, perfil, permissão ou banco de aplicativos foi alterado por esta atualização. O site institucional permanece público.

Instalar a Central cria um ponto de entrada com todos os atalhos. O manifesto preserva o mesmo identificador e abre `/sistemas.html`. Não instala automaticamente oito aplicativos nativos nem publica nas lojas. O botão oferece a instalação do navegador quando disponível e as instruções correspondentes para Safari, Chrome ou Edge.

A versão `20261004-3` atualiza o cache anterior automaticamente. O service worker guarda apenas a estrutura pública e os ícones da Central; ignora outros domínios e arquivos do site fora da lista. Não armazena dados ou sessões dos sistemas. A tela pode abrir sem conexão depois da primeira visita; os sistemas exigem internet. A antiga sessão exclusiva da Central é removida do sessionStorage local, sem chamadas de Auth e sem desconectar os outros aplicativos.

Os dados fixos dos cartões em `core.mjs` são usados na verificação contra o HTML. Os testes executam o HTML, scripts, manifesto e service worker reais com um servidor local; a abertura dos aplicativos é simulada sem acessar bancos nem enviar mensagens.

Execute `node --test --test-timeout=45000 tests/central-browser-simulation.mjs` a partir deste diretório. Requer Playwright e Chromium; instalações existentes podem ser informadas por `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE` e `PLAYWRIGHT_CHROMIUM_ARGS` (array JSON). `CENTRAL_SCREENSHOT_DIR` ativa capturas de revisão.

Verificação em 04/10/2026: 19 cenários aprovados no Chromium, incluindo acesso anônimo, oito cartões, abas independentes, ausência de chamadas de Auth, sessão antiga, atalho da Central, larguras 320/390/768/1440, fonte ampliada, instruções Chrome/Edge/iPhone, prompt após clique, manifesto, JavaScript indisponível, falha de script e atualização do cache com abertura sem internet.

Os testes verificam a Central pública, navegação, atualização e instalação. Não certificam login real ou homologação fiscal/bancária dos aplicativos.

## Ícones aprovados

A Central possui arte própria: `central-aprovada-*`, usada no cabeçalho, destaque, favicon, instalação e ícone do iPhone. É diferente do ícone corporativo do site. Os oito cartões usam as imagens originais aprovadas, inclusive o Pátio com empilhadeira vermelha e o Carga Direta com caminhão branco e seta verde. As imagens foram apenas reduzidas para uso na web, mantendo composição, textos, cores e proporção; não houve geração de novas artes.

`icons/artes-aprovadas.json` registra origem, dimensão e SHA-256 de cada exportação. Arquivos locais versionados permitem exibir todos os ícones sem depender de imagens de outros aplicativos. A versão de cache `20261004-3` inclui as doze imagens e substitui o cache antigo da Central. O identificador da instalação permanece o mesmo.

A revisão dos ícones verifica também o carregamento das oito imagens, a identidade própria da Central, as dimensões reais dos PNGs da instalação e os ícones completos após atualização do cache e abertura sem internet.

## Link de instalação para iPhone

O endereço `/sistemas.html?instalar=iphone` abre a Central pública com o passo a passo de instalação no Safari, o ícone aprovado e o botão “Ver aplicativos”. O usuário conclui a instalação no menu do iPhone: Compartilhar → Adicionar à Tela de Início → Adicionar. Se houver a opção “Abrir como App da Web”, deve permanecer ativada. A página orienta quem recebeu o link pelo WhatsApp a abri-lo no Safari.

A confirmação do iOS é feita pelo próprio usuário. O link não baixa um aplicativo da App Store nem instala um perfil de configuração. O manifesto continua com o mesmo identificador e endereço inicial `/sistemas.html`, e o `apple-touch-icon` continua usando a arte própria aprovada de 180×180. Uma Central já aberta como aplicativo não mostra as instruções automaticamente. Sem JavaScript, as instruções continuam no HTML. O compartilhamento também possui a imagem própria da Central na marcação Open Graph.

Referência Apple: https://support.apple.com/pt-br/guide/iphone/iph42ab2f3a7/ios

O fluxo do link, o modo já instalado e a regressão do catálogo foram verificados em Chromium com cenários de navegador móvel. Esses testes não acionam a tela de instalação do iOS de um iPhone físico.

Verificação deste link: 19 cenários passaram, incluindo a instalação guiada no endereço específico, retorno aos oito ícones, ausência de consultas externas, orientação sem JavaScript, link sem internet após atualização do cache e abertura de uma Central já instalada.
