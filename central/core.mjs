export const APPS = Object.freeze([
  {code:'VENDAS',name:'Forte Vendas',category:'Comercial',description:'Balcão, clientes, orçamentos e estoque operacional.',url:'https://forte-vendas.onrender.com',accent:'#c82333',tint:'#fff0f2',icon:'<path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6H19a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>'},
  {code:'FINANCEIRO',name:'Forte Financeiro',category:'Financeiro',description:'Contas a pagar e receber, caixa e conciliação bancária.',url:'https://forte-financeiro.onrender.com',accent:'#147050',tint:'#eaf7f0',icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 15h3m5 0h2"/>'},
  {code:'FISCAL',name:'Forte Fiscal',category:'Fiscal',description:'Documentos fiscais, XML, SPED e estoque por CNPJ.',url:'https://forte-fiscal.onrender.com',accent:'#1d64a7',tint:'#edf4fc',icon:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>'},
  {code:'FRETE',name:'Forte Frete',category:'Transporte',description:'Motoristas, veículos, documentos e acompanhamento de viagens.',url:'https://forte-frete.onrender.com',accent:'#a52c38',tint:'#fff1f3',icon:'<path d="M1 3h14v13H1zM15 8h4l3 4v4h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'},
  {code:'VENDA_EXTERNA',name:'Venda Externa',category:'Comercial',description:'Clientes, obras, propostas e acompanhamento das vendas.',url:'https://forte-venda-externa.onrender.com',accent:'#49649e',tint:'#f0f3fc',icon:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a30 30 0 0 0 18 0M10 12v3h4v-3"/>'},
  {code:'CARGA_DIRETA',name:'Carga Direta',category:'Logística',description:'Pedidos ao fornecedor, cargas diretas e pallets.',url:'https://forte-carga-direta.onrender.com',accent:'#2a716e',tint:'#edf7f6',icon:'<path d="m12 3 9 5v9l-9 5-9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v9M7.5 5.5l9 5"/>'},
  {code:'PATIO',name:'Operador de Pátio',category:'Estoque',description:'Contagem física, reservas e conferência para fechamento do caixa.',url:'https://forte-operador-patio.onrender.com',accent:'#a2670a',tint:'#fff6e7',icon:'<path d="M3 21V9l9-6 9 6v12M7 21v-9h10v9M3 21h18M7 16h10M7 12h10"/>'},
  {code:'SITE',name:'Site Forte Atacarejo',category:'Institucional',description:'Catálogo por marca, produtos e solicitações de orçamento.',url:'https://site-forte-atacarejo.onrender.com',accent:'#082b50',tint:'#edf2f8',icon:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a19 19 0 0 1 0 20 19 19 0 0 1 0-20"/>'}
]);
export function validCPF(input) {
  const cpf=String(input).replace(/\D/g,'');
  if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false;
  for(let length=9;length<11;length++){
    let sum=0;for(let i=0;i<length;i++)sum+=Number(cpf[i])*(length+1-i);
    const check=(sum*10)%11; if(Number(cpf[length])!==(check===10?0:check))return false;
  }return true;
}
export function approvedProfile(profile,userId){return Boolean(profile&&profile.user_id===userId&&profile.ativo===true&&profile.trocar_senha===false&&profile.status_aprovacao==='APROVADO');}
export function permittedApps(rows){
  const allowed=new Map();
  for(const row of rows||[]){
    const app=APPS.find(a=>a.code===row.codigo);
    if(!app||row.status!=='APROVADO'||row.permitido!==true)continue;
    let url;try{url=new URL(row.url);}catch{throw Error('INVALID_APP_URL');}
    if(url.protocol!=='https:'||url.origin!==new URL(app.url).origin||url.username||url.password)throw Error('INVALID_APP_URL');
    allowed.set(app.code,{...app,url:url.href});
  }
  return APPS.filter(app=>allowed.has(app.code)).map(app=>allowed.get(app.code));
}
const lockIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>';
export function mountCentral({client,document,window,clearSession=()=>{}}){
  const $=id=>document.getElementById(id),access=$('access'),workspace=$('workspace'),grid=$('apps-grid');
  let generation=0,checked=false,leaving=false;
  function reset(){checked=false;workspace.hidden=true;grid.replaceChildren();$('user-name').textContent='';$('user-role').textContent='';$('avatar').textContent='';$('app-count').textContent='';$('signout').hidden=true;}
  function status(message){const node=$('access-status');if(node)node.textContent=message;}
  function login(message=''){
    reset();access.hidden=false;access.setAttribute('aria-busy','false');
    access.innerHTML=`<section class="login-card"><div class="login-mark">${lockIcon}</div><h1>Entre na Central Forte</h1><p>Use seu CPF cadastrado e sua senha numérica.</p><form id="login-form" class="login-form"><label for="cpf">CPF<input id="cpf" name="cpf" inputmode="numeric" autocomplete="username" maxlength="14" placeholder="000.000.000-00" required></label><label for="password">Senha numérica<div class="password-wrap"><input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" minlength="6" pattern="[0-9]{6,}" aria-label="Senha numérica" aria-describedby="password-help" required><button type="button" class="password-toggle" id="password-toggle" aria-label="Mostrar senha" aria-pressed="false">Mostrar</button></div></label><span id="password-help" class="login-footnote">No mínimo 6 números.</span><button type="submit" class="primary-button" id="login-submit">Entrar</button></form><p id="access-status" class="access-message" role="status"></p><div class="login-links"><a href="https://forte-vendas.onrender.com/?recuperar-senha=1">Esqueci minha senha</a><a href="https://forte-vendas.onrender.com/?primeiro-acesso=1">Primeiro acesso</a></div></section><p class="login-footnote">O acesso depende da aprovação do seu cadastro e da liberação de cada aplicativo.</p>`;
    status(message);
    $('cpf').oninput=e=>{const value=e.target.value.replace(/\D/g,'').slice(0,11);e.target.value=value.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4');};
    $('password-toggle').onclick=()=>{const field=$('password'),show=field.type==='password';field.type=show?'text':'password';$('password-toggle').textContent=show?'Ocultar':'Mostrar';$('password-toggle').setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');$('password-toggle').setAttribute('aria-pressed',String(show));};
    $('login-form').onsubmit=async event=>{
      event.preventDefault();const form=event.currentTarget,cpf=form.elements.cpf.value.replace(/\D/g,''),password=form.elements.password.value;
      if(!validCPF(cpf)){status('Informe um CPF válido.');return;}
      if(!/^\d{6,}$/.test(password)){status('A senha deve ter no mínimo 6 números.');return;}
      const ticket=++generation,submit=$('login-submit');submit.disabled=true;status('Entrando…');
      try{
        const {data,error}=await client.functions.invoke('login-cpf',{body:{cpf,password}});
        if(ticket!==generation)return;
        if(error||!data?.access_token||!data?.refresh_token){
          let payload=data;if(error?.context?.json){try{payload=await error.context.json();}catch{}}
          const message=error?.context?.status===429||/MUITAS TENTATIVAS/i.test(payload?.error||'')?'Muitas tentativas. Aguarde um minuto e tente novamente.':'Não foi possível entrar. Confira CPF e senha e tente novamente.';
          throw Error(message);
        }
        const result=await client.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
        if(ticket!==generation)return;if(result.error)throw Error('Não foi possível confirmar sua sessão. Tente entrar novamente.');
        form.elements.password.value='';await authorize();
      }catch(error){if(ticket!==generation)return;status(/^(Não foi possível|Muitas tentativas)/.test(error.message||'')?error.message:'Falha de conexão. Confira sua internet e tente novamente.');submit.disabled=false;}
    };
  }
  function failure(message){
    reset();access.hidden=false;access.setAttribute('aria-busy','false');access.innerHTML='<section class="notice"><h1>Não foi possível carregar</h1><p id="failure-message" role="alert"></p><button id="retry-access" class="primary-button" type="button">Tentar novamente</button><button id="failure-signout" class="text-button" type="button">Sair da Central</button></section>';
    $('failure-message').textContent=message;$('retry-access').onclick=authorize;$('failure-signout').onclick=signout;
  }
  function renderApps(apps,profile){
    grid.replaceChildren();
    for(const app of apps){
      const card=document.createElement('a');card.className='app-card';card.dataset.system=app.code;card.href=app.url;card.target='_blank';card.rel='noopener noreferrer';card.style.setProperty('--accent',app.accent);card.style.setProperty('--tint',app.tint);card.setAttribute('aria-label',`Abrir ${app.name} em nova aba`);
      card.innerHTML=`<div class="card-top"><span class="app-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${app.icon}</svg></span><span class="app-category"></span></div><h3></h3><p></p><span class="app-open">Abrir aplicativo</span>`;
      card.querySelector('.app-category').textContent=app.category;card.querySelector('h3').textContent=app.name;card.querySelector('p').textContent=app.description;grid.append(card);
    }
    const name=String(profile.nome||'Usuário Forte');$('user-name').textContent=name;$('user-role').textContent=String(profile.perfil||'Usuário').replaceAll('_',' ');$('avatar').textContent=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();$('app-count').textContent=String(apps.length);$('empty-state').hidden=apps.length!==0;
    $('signout').hidden=false;access.hidden=true;access.setAttribute('aria-busy','false');workspace.hidden=false;checked=true;
  }
  async function authorize(){
    if(leaving)return;const ticket=++generation;reset();access.hidden=false;access.setAttribute('aria-busy','true');access.innerHTML='<div class="loading"><span class="spinner" aria-hidden="true"></span><p>Conferindo seu acesso…</p></div>';
    try{
      const result=await client.auth.getUser();if(ticket!==generation||leaving)return;
      const user=result.data?.user;
      if(!user){if(result.error&&result.error.name!=='AuthSessionMissingError'&&!['session_not_found','bad_jwt','refresh_token_not_found'].includes(result.error.code)&&result.error.status!==401){failure('Confira sua conexão com a internet e tente novamente.');}else login();return;}
      if(result.error){failure('Não foi possível confirmar sua sessão. Tente novamente.');return;}
      const {data:profile,error:profileError}=await client.from('fc_perfis').select('user_id,nome,perfil,ativo,trocar_senha,status_aprovacao').eq('user_id',user.id).maybeSingle();
      if(ticket!==generation||leaving)return;
      if(profileError){failure('Não foi possível conferir seu cadastro. Tente novamente.');return;}
      if(!approvedProfile(profile,user.id)){login(profile?.trocar_senha===true?'Defina sua senha pelo Primeiro acesso ou por Esqueci minha senha.':profile?.status_aprovacao==='PENDENTE'?'Seu cadastro está aguardando aprovação do administrador.':'Seu cadastro não está ativo e aprovado para entrar na Central.');return;}
      const {data,error}=await client.from('central_meus_acessos').select('codigo,nome,url,status,permitido');
      if(ticket!==generation||leaving)return;
      if(error){failure('Não foi possível conferir suas permissões. Tente novamente.');return;}
      renderApps(permittedApps(data),profile);
    }catch(error){if(ticket===generation&&!leaving)failure(error.message==='INVALID_APP_URL'?'Um aplicativo está com endereço inválido. Solicite a correção ao administrador.':'Confira sua conexão com a internet e tente novamente.');}
  }
  async function signout(){
    leaving=true;++generation;reset();
    try{await client.auth.signOut({scope:'local'});}catch{}finally{try{clearSession();}catch{}leaving=false;login('Você saiu da Central.');}
  }
  $('signout').onclick=signout;$('refresh-access').onclick=authorize;
  window.addEventListener('pageshow',event=>{if(event.persisted)authorize();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&checked)authorize();});
  return {authorize,signout,login,invalidate(){++generation;reset();login();}};
}
