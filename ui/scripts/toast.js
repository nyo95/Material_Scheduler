;(function(){
  const el = document.getElementById('toast2');
  let t=null;
  function show(msg){ if(!el) return; el.textContent=msg; el.classList.add('show'); clearTimeout(t); t=setTimeout(()=>el.classList.remove('show'),3000); }
  window.Toast = { show };
})();
