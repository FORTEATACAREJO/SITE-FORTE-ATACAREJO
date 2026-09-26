const q=document.getElementById('q');q?.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();document.querySelectorAll('#catalogo article').forEach(x=>x.style.display=x.innerText.toLowerCase().includes(v)||x.dataset.name.includes(v)?'block':'none')});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));}
let deferredInstallPrompt=null;
const installBtn=document.getElementById('installApp'),help=document.getElementById('installHelp'),iosHelp=document.getElementById('iosHelp'),genericHelp=document.getElementById('genericHelp');
const ua=navigator.userAgent;
const isIOS=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isSafari=isIOS&&/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const showInstallHelp=()=>{if(iosHelp)iosHelp.hidden=!isIOS;if(genericHelp)genericHelp.hidden=isIOS;if(help)help.hidden=false;};
if(isStandalone){installBtn?.setAttribute('hidden','');}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;if(!isStandalone)installBtn?.removeAttribute('hidden');});
installBtn?.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return;}showInstallHelp();});
document.getElementById('closeInstall')?.addEventListener('click',()=>{if(help)help.hidden=true;try{sessionStorage.setItem('forteInstallHelpSeen','1')}catch{}});
help?.addEventListener('click',e=>{if(e.target===help){help.hidden=true;try{sessionStorage.setItem('forteInstallHelpSeen','1')}catch{}}});
window.addEventListener('appinstalled',()=>{installBtn?.setAttribute('hidden','');if(help)help.hidden=true;deferredInstallPrompt=null;});
window.addEventListener('load',()=>{if(!isSafari||isStandalone)return;let seen=false;try{seen=sessionStorage.getItem('forteInstallHelpSeen')==='1'}catch{}if(!seen){setTimeout(()=>{showInstallHelp();try{sessionStorage.setItem('forteInstallHelpSeen','1')}catch{}},900);}});