import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {APPS} from '../core.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=fileURLToPath(new URL('../../',import.meta.url));
const files=['sistemas.html','central.html','central.css','central.webmanifest','central-sw.js','central/loader.js','central/main.js','central/core.mjs','icons/forte-atacarejo.svg',...(await readdir(base+'central/icons')).filter(name=>name.endsWith('.png')).map(name=>'central/icons/'+name)];
const contents=new Map(await Promise.all(files.map(async path=>['/'+path,await readFile(base+path)])));
const types={html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};
const server=createServer((request,response)=>{
 const path=new URL(request.url,'http://localhost').pathname,body=contents.get(path);
 if(!body){response.writeHead(404);response.end();return;}
 response.writeHead(200,{'Content-Type':types[path.split('.').pop()]||'application/octet-stream','Cache-Control':'no-cache'});
 response.end(body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:process.env.PLAYWRIGHT_CHROMIUM_ARGS?JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS):['--no-sandbox']});
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1100}});
const page=await context.newPage(),errors=[],externalRequests=[];
page.setDefaultTimeout(6000);
page.on('pageerror',error=>errors.push(error.message));
context.on('request',request=>{if(new URL(request.url()).origin!==origin)externalRequests.push(request.url());});
await context.route('https://*.onrender.com/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><h1>Login separado do aplicativo</h1>'}));
await page.goto(origin+'/sistemas.html');
try{
 await test('visitante sem sessão vê todos os oito ícones sem formulário',async()=>{
  assert.equal(await page.locator('.app-card').count(),8);
  assert.equal(await page.locator('input,form').count(),0);
  assert.equal(await page.locator('#workspace').isVisible(),true);
  assert.equal(await page.locator('#app-count').innerText(),'8');
  assert.match(await page.locator('body').innerText(),/Acesso livre à Central/);
  assert.equal(await page.locator('#install-help').isVisible(),false);
 });
 await test('a Central não consulta Auth, permissões ou CDN para abrir',async()=>{
  assert.deepEqual(externalRequests,[]);
  assert.equal(await page.evaluate(()=>location.pathname),'/sistemas.html');
  assert.equal(await page.locator('script[src*="supabase"]').count(),0);
 });
 await test('links e nomes correspondem a cada aplicativo sem credenciais',async()=>{
  for(const app of APPS){
   const link=page.locator('[data-system="'+app.code+'"]');
   const url=new URL(await link.getAttribute('href'));
   assert.equal(url.href,new URL(app.url).href);
   assert.equal(url.search,'');assert.equal(url.hash,'');
   assert.equal(url.username,'');assert.equal(url.password,'');
   assert.equal(await link.getAttribute('target'),'_blank');
   assert.match(await link.getAttribute('rel'),/noopener noreferrer/);
   assert.equal(await link.locator('h3').innerText(),app.name);
   assert.equal(await link.locator('.app-icon img').count(),1);
   assert.equal(await link.locator('.app-icon img').getAttribute('src'),app.icon);
   assert.equal(await link.locator('.app-icon img').evaluate(image=>image.complete&&image.naturalWidth===320&&image.naturalHeight===320),true,app.code+' — arte carregada');
  }
  assert.equal(await page.locator('.brand img').evaluate(image=>image.naturalWidth>0),true);
 });
 await test('cada cartão abre sua própria aba sem desviar a Central',async()=>{
  for(const app of APPS){
   const popupPromise=page.waitForEvent('popup');
   await page.locator('[data-system="'+app.code+'"]').click();
   const popup=await popupPromise;await popup.waitForLoadState();
   assert.equal(new URL(popup.url()).origin,new URL(app.url).origin);
   assert.equal(page.url(),origin+'/sistemas.html');
   assert.equal(await page.locator('.app-card').count(),8);
   await popup.close();
  }
 });
 await test('sessão antiga da Central não oculta cartões e é removida localmente',async()=>{
  await page.evaluate(()=>{sessionStorage.setItem('forte-central-auth','expired-synthetic-session');sessionStorage.setItem('forte-central-auth-code-verifier','synthetic');sessionStorage.setItem('unrelated-preference','preserve');});
  await page.reload();await page.waitForFunction(()=>sessionStorage.getItem('forte-central-auth')===null);
  assert.equal(await page.locator('.app-card').count(),8);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('forte-central-auth-code-verifier')),null);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('unrelated-preference')),'preserve');
 });
 await test('atalho central.html retorna ao catálogo, sem ir ao Vendas',async()=>{
  await page.goto(origin+'/central.html');await page.waitForURL(origin+'/sistemas.html');
  assert.equal(await page.locator('.app-card').count(),8);
 });
 await test('celular, computador e texto ampliado preservam os ícones sem rolagem horizontal',async()=>{
  for(const [width,font] of [[1440,'16px'],[768,'16px'],[390,'16px'],[320,'16px'],[390,'32px']]){
   await page.setViewportSize({width,height:1100});await page.evaluate(font=>document.documentElement.style.fontSize=font,font);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,width+'px / '+font);
   assert.equal(await page.locator('.app-card').count(),8);
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  await page.setViewportSize({width:1440,height:1100});
 });
 await test('instalação manual explica Chrome e Edge e pode ser fechada',async()=>{
  await page.getByRole('button',{name:'Instalar Central',exact:true}).click();
  assert.match(await page.locator('#install-instructions').innerText(),/Chrome ou Edge/);
  await page.getByRole('button',{name:'Fechar instruções',exact:true}).click();
  assert.equal(await page.locator('#install-help').isVisible(),false);
 });
 await test('prompt de instalação é oferecido somente após clique do usuário',async()=>{
  await page.evaluate(()=>{window.installCalls=0;const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.installCalls++};event.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(event);});
  assert.equal(await page.evaluate(()=>window.installCalls),0);
  await page.getByRole('button',{name:'Instalar Central',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.installCalls),1);
 });
 await test('manifesto instala a Central e preserva seu próprio endereço',()=>{
  const manifest=JSON.parse(contents.get('/central.webmanifest').toString());
  assert.equal(manifest.id,'/sistemas.html');assert.equal(manifest.start_url,'/sistemas.html');
  assert.equal(manifest.display,'standalone');assert.equal(manifest.icons.length,2);
  assert.equal(manifest.start_url.includes('vendas'),false);
 });
 await test('sem JavaScript o catálogo completo e seus links continuam disponíveis',async()=>{
  const noJs=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
  const fallback=await noJs.newPage();await fallback.goto(origin+'/sistemas.html');
  assert.equal(await fallback.locator('.app-card').count(),8);
  assert.equal(await fallback.locator('input,form').count(),0);
  assert.equal(await fallback.locator('.app-icon img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth===320)),true);
  assert.match(await fallback.locator('body').innerText(),/Safari do iPhone/);
  assert.match(await fallback.locator('body').innerText(),/Adicionar à Tela de Início/);
  await noJs.close();
 });
 await test('falha do script de instalação mantém todos os aplicativos na tela',async()=>{
  const failed=await browser.newContext({serviceWorkers:'block'});
  await failed.route('**/central/main.js*',route=>route.abort());
  const fallback=await failed.newPage();await fallback.goto(origin+'/sistemas.html');
  await fallback.locator('#central-status').waitFor({state:'visible'});
  assert.match(await fallback.locator('#central-status').innerText(),/aplicativos continuam disponíveis/);
  assert.equal(await fallback.locator('.app-card').count(),8);
  await failed.close();
 });
 await test('iPhone recebe instruções do Safari para instalar a Central',async()=>{
  const ios=await browser.newContext({serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const iphone=await ios.newPage();await iphone.goto(origin+'/sistemas.html');
  await iphone.getByRole('button',{name:'Instalar Central',exact:true}).click();
  assert.match(await iphone.locator('#install-instructions').innerText(),/Safari do iPhone/);
  assert.match(await iphone.locator('#install-instructions').innerText(),/Adicionar à Tela de Início/);
  await ios.close();
 });
 await test('worker atualiza cache antigo e abre catálogo público sem internet',async()=>{
  const pwa=await browser.newContext();
  const offline=await pwa.newPage();
  await offline.route('**/central-sw.js',route=>route.abort());
  await offline.goto(origin+'/sistemas.html');
  await offline.evaluate(async()=>{await (await caches.open('forte-central-20261003-1')).put('/sistemas.html',new Response('central antiga'));await (await caches.open('forte-central-20261004-1')).put('/sistemas.html',new Response('central com desenhos genéricos'));await (await caches.open('forte-central-20261004-2')).put('/sistemas.html',new Response('central sem link de instalacao'));await caches.open('outro-aplicativo-preservado');});
  await offline.unroute('**/central-sw.js');
  await offline.reload();
  await offline.evaluate(()=>navigator.serviceWorker.ready);
  await offline.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const keys=await offline.evaluate(()=>caches.keys());
  assert.equal(keys.includes('forte-central-20261003-1'),false);
  assert.equal(keys.includes('forte-central-20261004-1'),false);
  assert.equal(keys.includes('forte-central-20261004-2'),false);
  assert.equal(keys.includes('outro-aplicativo-preservado'),true);
  const urls=await offline.evaluate(async()=>{const cache=await caches.open('forte-central-20261004-4');return (await cache.keys()).map(request=>request.url);});
  assert.ok(urls.length>=17);
  for(const app of APPS)assert.ok(urls.some(url=>new URL(url).pathname===app.icon),app.code+' no cache');
  assert.ok(urls.every(url=>new URL(url).origin===locationOrigin(urls[0])));
  assert.ok(urls.every(url=>!url.includes('supabase')&&!url.includes('/auth/')&&!url.includes('onrender')));
  await pwa.setOffline(true);
  await offline.reload();
  assert.equal(await offline.locator('.app-card').count(),8);
  assert.equal(await offline.locator('input,form').count(),0);
  assert.equal(new URL(offline.url()).pathname,'/sistemas.html');
  for(const app of APPS)assert.equal(await offline.locator('[data-system="'+app.code+'"] img').evaluate(image=>image.complete&&image.naturalWidth===320),true,app.code+' visível sem internet');
  assert.equal(await offline.locator('.central-emblem').evaluate(image=>image.complete&&image.naturalWidth===512),true);
  await offline.goto(origin+'/sistemas.html?instalar=iphone');
  assert.equal(await offline.locator('#install-help').isVisible(),true);
  assert.equal(await offline.locator('#install-title').innerText(),'Instalar Central no iPhone');
  await pwa.close();
 });
 await test('Central usa sua arte própria no destaque, cabeçalho e favicon',async()=>{
  const siteIcon=APPS.find(app=>app.code==='SITE').icon;
  for(const selector of ['.central-emblem','.brand img']){
   const src=await page.locator(selector).getAttribute('src');
   assert.notEqual(src,siteIcon);
   assert.match(src,/central-aprovada-/);
   assert.equal(await page.locator(selector).evaluate(image=>image.complete&&image.naturalWidth>0),true);
  }
  assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),'/central/icons/central-aprovada-48.png?v=20261004-4');
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'),'/central/icons/central-aprovada-180.png?v=20261004-4');
  assert.equal(await page.locator('.app-icon svg').count(),0);
  assert.equal(new Set(await page.locator('.app-icon img').evaluateAll(images=>images.map(image=>image.src))).size,8);
 });
 await test('ícones da instalação possuem as dimensões PNG declaradas e não reutilizam o site',()=>{
  const manifest=JSON.parse(contents.get('/central.webmanifest').toString());
  const site=contents.get(APPS.find(app=>app.code==='SITE').icon);
  for(const icon of manifest.icons){
   assert.match(icon.src,/central-aprovada-/);
   const png=contents.get(new URL(icon.src,origin).pathname);
   assert.equal(png.subarray(1,4).toString(),'PNG');
   assert.equal(icon.sizes,png.readUInt32BE(16)+'x'+png.readUInt32BE(20));
   assert.equal(png.equals(site),false);
  }
 });
 await test('link para iPhone abre instalação guiada, com ícone aprovado e retorno aos oito aplicativos',async()=>{
  const iphone=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1'});
  const mobile=await iphone.newPage(),requests=[];
  mobile.on('pageerror',error=>errors.push(error.message));
  iphone.on('request',request=>{if(new URL(request.url()).origin!==origin)requests.push(request.url());});
  await mobile.goto(origin+'/sistemas.html?instalar=iphone');
  await mobile.locator('#install-help').waitFor({state:'visible'});
  assert.equal(await mobile.locator('#install-title').innerText(),'Instalar Central no iPhone');
  assert.match(await mobile.locator('#install-instructions').innerText(),/Safari do iPhone/);
  assert.match(await mobile.locator('#install-instructions').innerText(),/Adicionar à Tela de Início/);
  assert.match(await mobile.locator('#install-instructions').innerText(),/Abrir como App da Web/);
  assert.match(await mobile.locator('#install-instructions').innerText(),/WhatsApp/);
  assert.equal(await mobile.locator('#install-instructions img').getAttribute('src'),'/central/icons/central-aprovada-192.png?v=20261004-4');
  assert.equal(await mobile.locator('#install-instructions img').evaluate(image=>image.complete&&image.naturalWidth===192),true);
  assert.equal(await mobile.locator('input,form').count(),0);
  assert.equal(await mobile.locator('link[rel="apple-touch-icon"]').getAttribute('href'),'/central/icons/central-aprovada-180.png?v=20261004-4');
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(requests,[]);
  await mobile.getByRole('button',{name:'Ver aplicativos',exact:true}).click();
  assert.equal(await mobile.locator('#install-help').isVisible(),false);
  assert.equal(await mobile.locator('.app-card').count(),8);
  assert.equal(mobile.url(),origin+'/sistemas.html?instalar=iphone');
  await iphone.close();
 });
 await test('Central já aberta como aplicativo não repete a orientação de instalar no iPhone',async()=>{
  const installed=await browser.newContext({serviceWorkers:'block'});
  await installed.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
  const mobile=await installed.newPage();mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.goto(origin+'/sistemas.html?instalar=iphone');
  await mobile.waitForFunction(()=>document.getElementById('install-central').hidden);
  assert.equal(await mobile.locator('#install-help').isVisible(),false);
  assert.equal(await mobile.locator('.app-card').count(),8);
  await installed.close();
 });
 await test('link Android mostra a arte aprovada e permite atualizar o ícone antigo',async()=>{
  const android=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  const mobile=await android.newPage();await mobile.goto(origin+'/sistemas.html?instalar=android');
  await mobile.locator('#install-help').waitFor({state:'visible'});
  assert.match(await mobile.locator('#install-instructions').innerText(),/Analisar atualização do app/);
  assert.equal(await mobile.locator('#install-instructions img').evaluate(image=>image.complete&&image.naturalWidth===192),true);
  await mobile.evaluate(()=>{window.installCalls=0;const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.installCalls++};event.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(event);});
  await mobile.locator('#install-help').getByRole('button',{name:'Instalar Central',exact:true}).click();
  assert.equal(await mobile.evaluate(()=>window.installCalls),1);
  await mobile.getByRole('button',{name:'Ver aplicativos',exact:true}).click();
  assert.equal(await mobile.locator('.app-card').count(),8);assert.equal(mobile.url(),origin+'/sistemas.html?instalar=android');
  await android.close();
 });
 await test('URLs dos ícones de instalação mudaram sem alterar a identidade da Central',()=>{
  const manifest=JSON.parse(contents.get('/central.webmanifest').toString());
  assert.equal(manifest.id,'/sistemas.html');assert.equal(manifest.start_url,'/sistemas.html');
  for(const icon of manifest.icons)assert.equal(new URL(icon.src,origin).search,'?v=20261004-4');
 });
 await test('Central termina sem erro de execução',()=>assert.deepEqual(errors,[]));
 if(process.env.CENTRAL_SCREENSHOT_DIR){
  await page.screenshot({path:process.env.CENTRAL_SCREENSHOT_DIR+'/central-publica-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:process.env.CENTRAL_SCREENSHOT_DIR+'/central-publica-mobile.png',fullPage:true});
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
function locationOrigin(url){return new URL(url).origin;}
