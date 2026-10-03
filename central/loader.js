import('./main.js?v=20261003-1').catch(()=>{
  const root=document.getElementById('access');
  document.getElementById('workspace').hidden=true;
  root.hidden=false;root.setAttribute('aria-busy','false');
  root.innerHTML='<section class="notice"><h1>Não foi possível abrir a Central</h1><p role="alert">Confira sua conexão com a internet e tente novamente.</p><button class="primary-button" type="button">Tentar novamente</button></section>';
  root.querySelector('button').onclick=()=>window.location.reload();
});
