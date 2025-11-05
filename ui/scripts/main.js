;(function(){
  function rpc(name,args){ if(window.sketchup&&window.sketchup.rpc){ window.sketchup.rpc(JSON.stringify({name,args})); } }
  function fillKinds(sel, kinds){ sel.innerHTML = '<option value="">All kinds</option>' + Object.keys(kinds||{}).sort().map(k=>`<option value="${k}">${kinds[k]}</option>`).join(''); }
  function renderRows(rows, kinds){ const tb=document.getElementById('dt-rows'); if(!tb) return; tb.innerHTML = (rows||[]).filter(r=>!r.hidden).map(r=>`<tr><td>${r.code||''}</td><td>${r.brand||''}</td><td>${(kinds||{})[r.type]||r.type||''}</td><td>${r.subtype||''}</td><td>${r.notes||''}</td><td><span class="badge badge-ok">Normalized</span></td></tr>`).join(''); }
  window.__ms_rpc_resolve=function(p){ var name=p&&p.name; if(name==='get_full'){ var r=p.result||{}; window.__DATA=r; fillKinds(document.getElementById('flt-kind'), r.kinds||{}); renderRows(r.entries||[], r.kinds||{}); return; } if(name==='normalize_preview'){ var ch=(p.result&&p.result.changes)||[]; if(!ch.length){ Toast.show('Already normalized'); return;} Modal.open({ title:'Normalize', body: 'Will update '+ch.length+' items.' }).then(ok=>{ if(ok) rpc('normalize_all',{}); }); return; } if(name==='normalize_all'){ Toast.show('Normalized'); rpc('get_full',{}); return; } };
  window.__ms_rpc_reject=function(p){ Toast.show('Error: '+(p&&p.error||'')); };
  window.addEventListener('DOMContentLoaded', function(){
    // Dark toggle
    var darkBtn=document.getElementById('btn-dark'); if(darkBtn){ darkBtn.addEventListener('click',()=>{ document.documentElement.classList.toggle('dark'); }); }
    var refresh=document.getElementById('btn-refresh'); if(refresh){ refresh.addEventListener('click',()=>rpc('get_full',{})); }
    var apply=document.getElementById('btn-apply'); if(apply){ apply.addEventListener('click',()=>rpc('normalize_preview',{})); }
    var exp=document.getElementById('btn-export'); if(exp){ exp.addEventListener('click',()=>{ rpc('export_csv',{ cols:['code','type','brand','subtype','notes','locked','sample','hidden','name','kind_label'] }); }); }
    try{ if(window.sketchup&&sketchup.ready){ sketchup.ready(); } }catch(e){}
    rpc('get_full',{});
    document.addEventListener('keydown', function(e){ if(e.key==='/'){ var s=document.getElementById('flt-search'); if(s){ s.focus(); e.preventDefault(); } } if(e.key==='Escape'){ var m=document.getElementById('modal'); if(m&&!m.classList.contains('hidden')){ m.classList.add('hidden'); } var t=document.getElementById('toast2'); if(t) t.classList.remove('show'); } });
  });
})();
