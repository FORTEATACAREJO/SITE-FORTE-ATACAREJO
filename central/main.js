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
installButton.onclick=async()=>{
  if(prompt){const event=prompt;prompt=null;await event.prompt();await event.userChoice;return;}
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  instructions.innerHTML=ios?'<p>No Safari do iPhone ou iPad:</p><ol><li>Toque em <strong>Compartilhar</strong>.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Confirme em <strong>Adicionar</strong>.</li></ol>':'<p>No Chrome ou Edge, abra o menu do navegador e procure <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</p><p>Se essa opção não estiver disponível, salve o endereço da Central nos favoritos.</p>';
  dialog.showModal();
};
document.getElementById('close-install').onclick=()=>dialog.close();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/central-sw.js',{scope:'/'}).catch(()=>{});
