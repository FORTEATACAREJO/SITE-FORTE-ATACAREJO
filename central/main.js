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
const iphoneHelp='<div style="display:flex;align-items:center;gap:16px;margin:22px 0"><img src="/central/icons/central-aprovada-192.png?v=20261004-4" width="72" height="72" alt="Ícone aprovado da Central Forte Atacarejo" style="border-radius:14px"><div><strong>Central Forte Atacarejo</strong><p style="margin:5px 0 0;font-size:.875rem">Todos os aplicativos na tela inicial.</p></div></div><p>Abra este link no <strong>Safari do iPhone</strong> e siga os passos:</p><ol><li>Toque em <strong>Compartilhar</strong> no Safari. Dependendo da versão, essa opção fica no menu da página.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Confira o nome <strong>Central Forte</strong>. Se aparecer <strong>Abrir como App da Web</strong>, deixe ativado.</li><li>Toque em <strong>Adicionar</strong> para concluir.</li></ol><p>Se abriu pelo WhatsApp ou por outro aplicativo, use a opção de abrir no navegador e escolha o Safari, ou copie o link para ele.</p><p>Depois, toque no ícone da Central na tela inicial para acessar os aplicativos da Central.</p><button class="primary-button" type="button" data-close-install>Ver aplicativos</button>';
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

const notificationButton=document.getElementById('notification-center'),notificationTotal=document.getElementById('notification-total'),notificationSummary=document.getElementById('notification-summary');
const notificationState=new Map();
function renderCentralNotifications(){
 let total=0,items=[];
 document.querySelectorAll('.app-card').forEach(card=>{
  const code=card.dataset.system,badge=card.querySelector('.app-notification'),entry=notificationState.get(code)||{count:0,items:[]},count=Math.max(0,Number(entry.count)||0);
  total+=count;badge.textContent=String(count);badge.hidden=count===0;badge.setAttribute('aria-label',count?count+' pendência'+(count===1?'':'s'):'Sem pendências');
  if(count)items.push('<a href="'+card.href+'" target="_blank" rel="noopener noreferrer"><strong>'+card.querySelector('h3').textContent+'</strong><span>'+count+' pendência'+(count===1?'':'s')+' para verificar</span></a>');
 });
 notificationTotal.textContent=String(total);notificationButton.classList.toggle('has-notifications',total>0);
 notificationSummary.innerHTML=items.length?items.join(''):'<p>Nenhuma pendência informada. Entre nos aplicativos para sincronizar seus avisos.</p>';
 try{if(total)navigator.setAppBadge?.(total)?.catch(()=>{});else navigator.clearAppBadge?.()?.catch(()=>{});}catch{}
 try{window.ForteNotifications?.setCount(total);}catch{}
}
const notificationFrames=new Map();
function receiveCentralNotifications(event){
 const data=event?.data;if(!data||data.type!=='FORTE_NOTIFICATION_STATUS'||!data.app)return;
 const code=String(data.app),frame=notificationFrames.get(code);if(!frame||event.origin!==frame.origin||event.source!==frame.element.contentWindow)return;
 const count=Number(data.count);if(!Number.isSafeInteger(count)||count<0)return;
 notificationState.set(code,{count,items:[],updatedAt:Date.now()});renderCentralNotifications();
 navigator.serviceWorker?.controller?.postMessage({type:"FORTE_CENTRAL_COUNT",app:({VENDAS:"vendas",FINANCEIRO:"financeiro",FRETE:"frete",FISCAL:"fiscal",VENDA_EXTERNA:"venda-externa",CARGA_DIRETA:"carga-direta",PATIO:"patio",SITE:"site"})[code],count});
}
window.addEventListener('message',receiveCentralNotifications);
for(const card of document.querySelectorAll('.app-card')){
 const origin=new URL(card.href).origin,element=document.createElement('iframe');
 element.hidden=true;element.title='Contador de '+card.querySelector('h3').textContent;element.src=origin+'/notification-bridge.html';element.setAttribute('aria-hidden','true');
 notificationFrames.set(card.dataset.system,{origin,element});document.body.append(element);
}
setInterval(()=>{for(const [code,entry] of notificationState){if(Date.now()-entry.updatedAt>120000)notificationState.delete(code);}renderCentralNotifications();},30000);
notificationButton?.addEventListener('click',()=>{notificationSummary.hidden=!notificationSummary.hidden;});
renderCentralNotifications();

const centralPushButton=document.createElement('button');centralPushButton.type='button';centralPushButton.className='primary-button';centralPushButton.textContent='ATIVAR NOTIFICAÇÕES';
const notificationHost=notificationButton?.parentElement;if(notificationHost)notificationHost.append(centralPushButton);
let centralSubscription=null;
async function connectCentralPush(){
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
 const reg=await navigator.serviceWorker.ready;centralSubscription=await reg.pushManager.getSubscription();if(!centralSubscription)return;
 for(const frame of notificationFrames.values())frame.element.contentWindow?.postMessage({type:'FORTE_CENTRAL_SUBSCRIBE',subscription:centralSubscription.toJSON()},frame.origin);
}
centralPushButton.onclick=async()=>{
 try{if(!('Notification' in window)||!('PushManager' in window))throw Error('No iPhone, instale a Central pelo Safari para receber notificações.');
  const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Permita as notificações da Central nas configurações do celular.');
  const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(!sub){const key="BHHE54tQM8mn-B5GN9L6k3BBd2J7q_7KbJu-KAx7H9eCvXs6zbQdVAP97l7EWlHBf6Bgy4XbCckXa7yx6ORjXaI";const raw=atob(key.replace(/-/g,'+').replace(/_/g,'/'));sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(raw,c=>c.charCodeAt(0))});}
  centralSubscription=sub;await connectCentralPush();centralPushButton.textContent='NOTIFICAÇÕES ATIVADAS';
  notificationSummary.hidden=false;notificationSummary.insertAdjacentHTML('beforeend','<p>Receberá avisos dos aplicativos em que estiver conectado neste navegador.</p>');
 }catch(error){notificationSummary.hidden=false;const p=document.createElement('p');p.textContent=error.message||'Não foi possível ativar. Tente novamente.';notificationSummary.append(p);}
};
for(const frame of notificationFrames.values())frame.element.addEventListener('load',()=>connectCentralPush());
connectCentralPush().catch(()=>{});
setInterval(()=>connectCentralPush().catch(()=>{}),60000);

navigator.serviceWorker?.addEventListener('message',event=>{
 const data=event.data;if(data?.type!=='FORTE_CENTRAL_PUSH')return;
 const code=({vendas:'VENDAS',financeiro:'FINANCEIRO',frete:'FRETE',fiscal:'FISCAL','venda-externa':'VENDA_EXTERNA','carga-direta':'CARGA_DIRETA',patio:'PATIO',site:'SITE'})[data.app];
 if(!code||!Number.isSafeInteger(Number(data.count))||Number(data.count)<0)return;
 notificationState.set(code,{count:Number(data.count),items:[],updatedAt:Date.now()});renderCentralNotifications();
});

