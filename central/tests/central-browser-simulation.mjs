import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {APPS} from '../core.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=fileURLToPath(new URL('../../',import.meta.url));
const files=['sistemas.html','central.html','central.css','central.webmanifest','central-sw.js','central/loader.js','central/main.js','central/core.mjs','icons/forte-atacarejo.svg','central/icons/central-192.png','central/icons/central-512.png'];
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
   assert.equal(await link.locator('svg').count(),1);
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
  await offline.evaluate(async()=>{await (await caches.open('forte-central-20261003-1')).put('/sistemas.html',new Response('central antiga'));await caches.open('outro-aplicativo-preservado');});
  await offline.unroute('**/central-sw.js');
  await offline.reload();
  await offline.evaluate(()=>navigator.serviceWorker.ready);
  await offline.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const keys=await offline.evaluate(()=>caches.keys());
  assert.equal(keys.includes('forte-central-20261003-1'),false);
  assert.equal(keys.includes('outro-aplicativo-preservado'),true);
  const urls=await offline.evaluate(async()=>{const cache=await caches.open('forte-central-20261004-1');return (await cache.keys()).map(request=>request.url);});
  assert.ok(urls.length>=8);
  assert.ok(urls.every(url=>new URL(url).origin===locationOrigin(urls[0])));
  assert.ok(urls.every(url=>!url.includes('supabase')&&!url.includes('/auth/')&&!url.includes('onrender')));
  await pwa.setOffline(true);
  await offline.reload();
  assert.equal(await offline.locator('.app-card').count(),8);
  assert.equal(await offline.locator('input,form').count(),0);
  assert.equal(new URL(offline.url()).pathname,'/sistemas.html');
  await pwa.close();
 });
 await test('Central termina sem erro de execução',()=>assert.deepEqual(errors,[]));
 if(process.env.CENTRAL_SCREENSHOT_DIR){
  await page.screenshot({path:process.env.CENTRAL_SCREENSHOT_DIR+'/central-publica-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:process.env.CENTRAL_SCREENSHOT_DIR+'/central-publica-mobile.png',fullPage:true});
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
function locationOrigin(url){return new URL(url).origin;}
