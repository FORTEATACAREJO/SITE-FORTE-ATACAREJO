// A Central é pública. A autenticação e a autorização pertencem a cada aplicativo.
try {
  sessionStorage.removeItem('forte-central-auth');
  sessionStorage.removeItem('forte-central-auth-code-verifier');
} catch {}

const installButton=document.getElementById('install-central'),dialog=document.getElementById('install-help'),instructions=document.getElementById('install-instructions');
let prompt;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;});
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
installButton.hidden=standalone();
window.addEventListener('appinstalled',()=>{installButton.hidden=true;prompt=null;});
window.matchMedia('(display-mode: standalone)').addEventListener('change',()=>{installButton.hidden=standalone();});
const iphoneLink=new URLSearchParams(location.search).get('instalar')==='iphone';
const androidLink=new URLSearchParams(location.search).get('instalar')==='android';
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const iphoneHelp='<div style="display:flex;align-items:center;gap:16px;margin:22px 0"><img src="/central/icons/central-aprovada-192.png?v=20261004-4" width="72" height="72" alt="Ícone aprovado da Central Forte Atacarejo" style="border-radius:14px"><div><strong>Central Forte Atacarejo</strong><p style="margin:5px 0 0;font-size:.875rem">Todos os aplicativos na tela inicial.</p></div></div><p>Abra este link no <strong>Safari do iPhone</strong> e siga os passos:</p><ol><li>Toque em <strong>Compartilhar</strong> no Safari. Dependendo da versão, essa opção fica no menu da página.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Confira o nome <strong>Central Forte</strong>. Se aparecer <strong>Abrir como App da Web</strong>, deixe ativado.</li><li>Toque em <strong>Adicionar</strong> para concluir.</li></ol><p>Se abriu pelo WhatsApp ou por outro aplicativo, use a opção de abrir no navegador e escolha o Safari, ou copie o link para ele.</p><p>Depois, toque no ícone da Central na tela inicial para acessar os oito aplicativos.</p><button class="primary-button" type="button" data-close-install>Ver aplicativos</button>';
const androidHelp='<div style="display:flex;align-items:center;gap:16px;margin:22px 0"><img src="/central/icons/central-aprovada-192.png?v=20261004-4" width="72" height="72" alt="Ícone aprovado da Central Forte Atacarejo" style="border-radius:14px"><div><strong>Central Forte Atacarejo</strong><p style="margin:5px 0 0;font-size:.875rem">Este é o ícone da Central.</p></div></div><p>No <strong>Chrome ou Edge</strong>, abra o menu e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>. Confira o nome Central Forte e o ícone acima.</p><p><strong>Já está instalada com o logo antigo?</strong> No menu do aplicativo, procure <strong>Analisar atualização do app</strong> e confirme a troca do ícone. Se essa opção não aparecer, desinstale a Central antiga e instale novamente por este endereço.</p><p>A reinstalação da Central não exclui os cadastros dos sistemas. Cada aplicativo continua com seu próprio acesso.</p><button class="primary-button" type="button" data-native-install>Instalar Central</button> <button type="button" data-close-install>Ver aplicativos</button>';
function showInstallHelp(iphone=ios){
  document.getElementById('install-title').textContent=iphone?'Instalar Central no iPhone':'Instalar Central Forte';
  instructions.innerHTML=iphone?iphoneHelp:androidHelp;
  instructions.querySelector('[data-native-install]')?.addEventListener('click',()=>installButton.click());
  instructions.querySelector('[data-close-install]')?.addEventListener('click',()=>dialog.close());
  if(!dialog.open)dialog.showModal();
}
installButton.onclick=async()=>{
  if(prompt&&!iphoneLink){const event=prompt;prompt=null;await event.prompt();await event.userChoice;return;}
  showInstallHelp(iphoneLink||ios);
};
if(iphoneLink&&!standalone())showInstallHelp(true);
if(androidLink)showInstallHelp(false);
document.getElementById('close-install').onclick=()=>dialog.close();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/central-sw.js',{scope:'/'}).catch(()=>{});
