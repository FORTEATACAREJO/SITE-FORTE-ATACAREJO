# Administração do site e atualização do ícone

A página `/admin.html` usa `site-admin.js` e mantém o login, recuperação e saída no endereço do site. O painel autorizado apresenta as quatro áreas de conferência do site publicado: catálogo, marcas, formulário de orçamento e contato. Não carrega o aplicativo Vendas e não encaminha o acesso administrativo para outros sistemas.

A autenticação continua usando o cadastro existente, CPF, senha numérica e perfil MASTER ativo e aprovado. Não amplia as permissões existentes. O painel confere as páginas publicadas; alterações de conteúdo continuam sendo publicadas pelo repositório. Não é apresentado como um editor de catálogo.

A função `recover-site-password` é exclusiva do site, confere CPF e contato e seleciona apenas MASTER ativo e aprovado. O retorno fixo é `https://site-forte-atacarejo.onrender.com/admin.html?recovery=1`, que deve constar nos Redirect URLs do Supabase Auth. A mudança preserva a função de recuperação dos outros aplicativos. O canal WhatsApp depende da configuração existente do provedor e retorna uma mensagem em português se ainda não estiver ativado.

A Central mantém a identidade `/sistemas.html` e a arte própria aprovada. O manifesto e os endereços dos ícones receberam a versão `20261004-4`, para que o navegador reconheça a atualização dos ícones. O endereço `/sistemas.html?instalar=android` mostra a arte correta e explica como revisar a atualização ou reinstalar uma Central antiga. O endereço para iPhone continua funcionando.

Testes locais: 21 cenários da Central e 8 da administração/recuperação. Os cenários administrativos usam usuários, tokens e chamadas de envio simulados. Não alteram senhas nem enviam e-mail/WhatsApp de usuários reais. Verificam separação dos links, barreira de autorização, saída, recuperação no site, validação de origem e destino fixo. A revisão do ícone é uma ação do navegador/dispositivo do usuário; não foi acionada em um Android ou iPhone físico.

Referência Chrome: https://developer.chrome.com/blog/improvements-to-web-app-updates?hl=pt-BR
