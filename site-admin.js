import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const client=createClient('https://gtwecfyffjszghnvtlzr.supabase.co','sb_publishable_RP8g0VoZdWh8e9R7Nb9mYw_GSXjSuD3',{auth:{storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const root=document.getElementById('access'),content=document.getElementById('protected-content');
const digits=value=>String(value||'').replace(/\D/g,'');
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let sequence=0,changing=new URLSearchParams(location.search).get('recovery')==='1'||location.hash.includes('type=recovery');
export const hasSiteAccess=profile=>Boolean(profile?.ativo&&profile.status_aprovacao==='APROVADO'&&!profile.trocar_senha&&String(profile.perfil).toUpperCase()==='MASTER');
async function errorMessage(error,fallback){
 if(error?.context instanceof Response){try{const body=await error.context.clone().json();if(body.error)return body.error;}catch{}}
 return fallback;
}
function login(notice=''){
 changing=false;content.hidden=true;
 root.innerHTML='<section class="access-card"><h1>Administração do site</h1><p>Entre com seu CPF e senha numérica. Acesso restrito ao MASTER autorizado.</p><form id="site-login"><label>CPF<input name="cpf" inputmode="numeric" autocomplete="username" maxlength="14" required></label><label>Senha numérica<input name="password" type="password" inputmode="numeric" autocomplete="current-password" minlength="6" pattern="[0-9]{6,}" required></label><button type="submit">ENTRAR NA ADMINISTRAÇÃO</button></form><p id="access-status" role="status">'+escape(notice)+'</p><button type="button" class="link-button" id="forgot-site">ESQUECI MINHA SENHA</button><p><a href="/">Voltar ao site</a></p></section>';
 document.getElementById('forgot-site').onclick=()=>recover(digits(document.getElementById('site-login').elements.cpf.value));
 document.getElementById('site-login').onsubmit=async event=>{
  event.preventDefault();const form=event.currentTarget,cpf=digits(form.elements.cpf.value),password=form.elements.password.value,status=document.getElementById('access-status'),button=form.querySelector('button');
  if(!/^\d{11}$/.test(cpf)||!/^\d{6,}$/.test(password)){status.textContent='Informe o CPF e a senha numérica cadastrados.';return;}
  button.disabled=true;status.textContent='Conferindo seu acesso…';
  try{const result=await client.functions.invoke('login-cpf',{body:{cpf,password}});if(result.error||!result.data?.access_token)throw Error();
   const session=await client.auth.setSession({access_token:result.data.access_token,refresh_token:result.data.refresh_token});if(session.error)throw session.error;form.elements.password.value='';await authorize();
  }catch{status.textContent='CPF ou senha inválidos, ou acesso não autorizado. Tente novamente.';button.disabled=false;}
 };
}
function recover(cpf=''){
 ++sequence;changing=false;content.hidden=true;
 root.innerHTML='<section class="access-card"><h1>Recuperar senha do site</h1><p>Informe os dados do seu cadastro autorizado. O acesso continua na administração do site.</p><form id="site-recovery"><label>CPF<input name="cpf" inputmode="numeric" autocomplete="username" maxlength="14" value="'+escape(cpf)+'" required></label><label>Recuperar por<select name="channel"><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option></select></label><label id="site-contact-label">E-mail cadastrado<input name="contact" type="email" autocomplete="email" required></label><button type="submit">ENVIAR LINK DE RECUPERAÇÃO</button></form><p id="access-status" role="status"></p><button class="link-button" type="button" id="back-site">VOLTAR AO LOGIN</button></section>';
 const form=document.getElementById('site-recovery');
 form.elements.channel.onchange=()=>{const email=form.elements.channel.value==='email';document.getElementById('site-contact-label').firstChild.textContent=email?'E-mail cadastrado':'WhatsApp cadastrado com DDD';form.elements.contact.type=email?'email':'tel';form.elements.contact.autocomplete=email?'email':'tel';form.elements.contact.value='';};
 document.getElementById('back-site').onclick=()=>login();
 form.onsubmit=async event=>{
  event.preventDefault();const cpf=digits(form.elements.cpf.value),channel=form.elements.channel.value,contact=form.elements.contact.value.trim(),status=document.getElementById('access-status'),button=form.querySelector('button');
  if(!/^\d{11}$/.test(cpf)){status.textContent='Informe o CPF cadastrado.';return;}button.disabled=true;status.textContent='Solicitando o link…';
  try{const result=await client.functions.invoke('recover-site-password',{body:{identificador:cpf,canal:channel,email:channel==='email'?contact:'',whatsapp:channel==='whatsapp'?contact:''}});status.textContent=result.error?await errorMessage(result.error,'Não foi possível enviar o link. Tente novamente.'):result.data?.message||'Solicitação recebida.';}catch{status.textContent='Verifique sua conexão e tente novamente.';}finally{button.disabled=false;}
 };
}
function newPassword(notice=''){
 changing=true;content.hidden=true;
 root.innerHTML='<section class="access-card"><h1>Criar nova senha do site</h1><p>Use seis números.</p><form id="site-password"><label>Nova senha<input name="password" type="password" inputmode="numeric" autocomplete="new-password" minlength="6" maxlength="6" pattern="[0-9]{6}" required></label><label>Confirmar nova senha<input name="confirmation" type="password" inputmode="numeric" autocomplete="new-password" minlength="6" maxlength="6" pattern="[0-9]{6}" required></label><button type="submit">SALVAR NOVA SENHA</button></form><p id="access-status" role="status">'+escape(notice)+'</p><button type="button" class="link-button" id="back-site">VOLTAR AO LOGIN</button></section>';
 document.getElementById('back-site').onclick=async()=>{++sequence;changing=false;await client.auth.signOut();history.replaceState(null,'','/admin.html');login();};
 document.getElementById('site-password').onsubmit=async event=>{
  event.preventDefault();const form=event.currentTarget,password=form.elements.password.value,status=document.getElementById('access-status'),button=form.querySelector('button');
  if(!/^\d{6}$/.test(password)||password!==form.elements.confirmation.value){status.textContent='Informe seis números e repita a mesma senha.';return;}button.disabled=true;
  try{const session=await client.auth.getUser();if(session.error||!session.data.user)throw Error();const result=await client.auth.updateUser({password});if(result.error)throw result.error;
   const profile=await client.from('fc_perfis').update({trocar_senha:false}).eq('user_id',session.data.user.id);if(profile.error)throw profile.error;
   ++sequence;changing=false;await client.auth.signOut();history.replaceState(null,'','/admin.html');login('Senha atualizada. Entre na administração do site com sua nova senha.');
  }catch{status.textContent='Não foi possível salvar. O link pode ter expirado. Solicite um novo link de recuperação.';button.disabled=false;}
 };
}
async function authorize(){
 const current=++sequence;content.hidden=true;
 const user=await client.auth.getUser();if(current!==sequence)return;
 if(user.error||!user.data.user){if(changing)newPassword('Abra o link de recuperação recebido para criar sua nova senha.');else login();return;}
 if(changing){newPassword();return;}
 const result=await client.from('fc_perfis').select('nome,cpf,email,whatsapp,perfil,ativo,trocar_senha,status_aprovacao').eq('user_id',user.data.user.id).maybeSingle();if(current!==sequence)return;
 if(result.error||!hasSiteAccess(result.data)){login(result.data?.trocar_senha?'Crie ou recupere sua senha aqui antes de entrar.':'Seu cadastro não tem acesso autorizado à administração do site.');return;}
 const profile=result.data;document.getElementById('master-profile').textContent=profile.nome+'\nCPF: '+(profile.cpf||'—')+'\nWhatsApp: '+(profile.whatsapp||'—')+'\nE-mail: '+(profile.email||'—');
 root.innerHTML='<section class="access-card compact"><strong>'+escape(profile.nome)+' • MASTER</strong><button id="site-signout" type="button">SAIR DA ADMINISTRAÇÃO</button></section>';
 document.getElementById('site-signout').onclick=async()=>{++sequence;changing=false;content.hidden=true;await client.auth.signOut();login();};content.hidden=false;
}
client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){++sequence;newPassword();}else if(event==='SIGNED_OUT'){++sequence;changing=false;content.hidden=true;login();}});
authorize().catch(()=>login('Não foi possível conferir seu acesso. Tente novamente.'));
