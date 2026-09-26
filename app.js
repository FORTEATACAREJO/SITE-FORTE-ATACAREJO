const q=document.getElementById('q');q?.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();document.querySelectorAll('#catalogo article').forEach(x=>x.style.display=x.innerText.toLowerCase().includes(v)||x.dataset.name.includes(v)?'block':'none')});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));}
let deferredInstallPrompt=null;
const installBtn=document.getElementById('installApp'),help=document.getElementById('installHelp'),iosHelp=document.getElementById('iosHelp'),genericHelp=document.getElementById('genericHelp');
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(isStandalone){installBtn?.setAttribute('hidden','');}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;if(!isStandalone)installBtn?.removeAttribute('hidden');});
installBtn?.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return;}if(iosHelp)iosHelp.hidden=!isIOS;if(genericHelp)genericHelp.hidden=isIOS;if(help)help.hidden=false;});
document.getElementById('closeInstall')?.addEventListener('click',()=>{if(help)help.hidden=true;});
help?.addEventListener('click',e=>{if(e.target===help)help.hidden=true;});
window.addEventListener('appinstalled',()=>{installBtn?.setAttribute('hidden','');if(help)help.hidden=true;deferredInstallPrompt=null;});