;(function(){
  const root = document.getElementById('modal');
  const t = document.getElementById('modal-title');
  const b = document.getElementById('modal-body');
  const ok = document.getElementById('modal-ok');
  const cancel = document.getElementById('modal-cancel');
  function open(opts){ if(!root) return Promise.resolve(false); t.textContent=opts.title||'Confirm'; b.textContent=opts.body||''; root.classList.remove('hidden'); return new Promise((resolve)=>{ function done(v){ root.classList.add('hidden'); ok.removeEventListener('click',okH); cancel.removeEventListener('click',cancelH); resolve(v);} function okH(){ done(true) } function cancelH(){ done(false) } ok.addEventListener('click',okH); cancel.addEventListener('click',cancelH); }); }
  window.Modal = { open };
})();
