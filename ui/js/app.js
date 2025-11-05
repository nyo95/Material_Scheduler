;(function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  $$('.ms-tabs .tab').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.ms-tabs .tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const tab=btn.dataset.tab; $$('.tabpanel').forEach(s=>s.classList.remove('active')); document.getElementById('tab-'+tab).classList.add('active');
    if(tab==='quick') Quick.render(); if(tab==='scheduler') Scheduler.render();
    if(tab==='kinds') Kinds.render(); if(tab==='reservations') Reservations.render();
    if(tab==='samples') Samples.render(); if(tab==='hidden') Hidden.render();
  }));
  const statusEl = document.querySelector('#status');
  function setStatus(s){ statusEl.textContent=s; } window.__setStatus=setStatus;
  function toast(msg){ const t=document.querySelector('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400);} window.__toast=toast;
  function rpc(name,args){ if(window.sketchup&&window.sketchup.rpc){ window.sketchup.rpc(JSON.stringify({name,args})); } else { console.warn('No SU bridge'); } } window.__rpc=rpc;

  function updateStatusBar(){
    const rows = State.rows || [];
    const visible = rows.filter(r=>!r.hidden).length;
    const hidden  = rows.filter(r=> r.hidden).length;
    const samples = rows.filter(r=> r.sample && !r.hidden).length;
    setStatus(visible + ' visible • ' + hidden + ' hidden • ' + samples + ' samples • ' + (new Date().toLocaleTimeString()));
  }
  window.__ms_receive_full=function(data){
    State.rows=data.entries||[]; State.kinds=data.kinds||{}; State.reservations=data.reservations||{};
    var actEl = document.querySelector('.ms-tabs .tab.active'); var active = (actEl && actEl.dataset ? actEl.dataset.tab : 'quick');
    if(active==='quick') Quick.render(); if(active==='scheduler') Scheduler.render();
    if(active==='kinds') Kinds.render(); if(active==='reservations') Reservations.render();
    if(active==='samples') Samples.render(); if(active==='hidden') Hidden.render();
    updateStatusBar();
  };
  window.__ms_selected_info=function(p){ Quick.onSelected(p); };
  window.__ms_rpc_resolve=function(p){ var name = p && p.name; if(name==='get_full'){ if(p.result){ window.__ms_receive_full(p.result); } return; } if(['normalize_all','quick_apply','set_flags','kinds_save','reservations_save','reservations_import_json','delete_material'].indexOf(name)>=0){ rpc('get_full',{}); } else if(name==='export_csv'){ var csv = (p.result && p.result.csv)||''; var blob=new Blob([csv],{type:'text/csv'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='materials.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); __toast('CSV exported'); } };
  window.__ms_rpc_reject=function(p){ __toast('Error: '+p.error); console.error(p.error); };
  document.querySelector('[data-action="refresh"]').addEventListener('click',function(){ rpc('get_full',{}); });
  document.querySelector('[data-action="normalize"]').addEventListener('click',function(){ rpc('normalize_all',{}); });
  document.querySelector('[data-action="export"]').addEventListener('click',function(){ var cols=Scheduler.currentColumns(); rpc('export_csv',{ cols: cols }); });
  window.State={ rows:[], kinds:{}, reservations:{}, get visibleRows(){return this.rows.filter(r=>!r.hidden)}, get sampleRows(){return this.rows.filter(r=>r.sample&&!r.hidden)}, get hiddenRows(){return this.rows.filter(r=>r.hidden)} };
  rpc('get_full',{});
})();

window.addEventListener('DOMContentLoaded', function(){
  try{
    if(window.sketchup && sketchup.ready){ sketchup.ready(); }
    if(window.sketchup && sketchup.ping){ sketchup.ping('hello'); }
    if(!(window.sketchup && sketchup.rpc)){
      try{ __setStatus('No SketchUp bridge'); }catch(e){}
    }
  }catch(e){}
});

