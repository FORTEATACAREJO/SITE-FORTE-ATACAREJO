import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {startAccess} from './access-standard.js';
const client=createClient('https://gtwecfyffjszghnvtlzr.supabase.co','sb_publishable_RP8g0VoZdWh8e9R7Nb9mYw_GSXjSuD3',{auth:{storage:localStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const content=document.getElementById('protected-content'),root=document.getElementById('access');root.textContent='';
startAccess({client,app:'site',content}).ready.then(async status=>{
root.innerHTML='<section class="access-card compact"><strong>Administração do site • acesso autorizado</strong></section>';
const exit=document.createElement('button');exit.id='signout';exit.textContent='SAIR';exit.onclick=()=>client.auth.signOut();document.querySelector('[data-forte-top-actions]').appendChild(exit);
const label=document.getElementById('master-profile');if(label)label.textContent=status.name+' • Administração do site';
});

