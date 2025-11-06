;(function(){
  function rpc(name,args){ if(window.sketchup&&window.sketchup.rpc){ window.sketchup.rpc(JSON.stringify({name,args})); } }
  function h(str){ return (str||'').replace(/[&<>]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[s])); }

  // Build UI skeleton (no external includes)
  function buildSkeleton(){
    const app=document.getElementById('app'); if(!app) return;
    app.innerHTML = `
      <header class="sticky top-0 z-10 bg-card border px-3 py-2 flex items-center justify-between">
        <div class="flex items-center gap-3"><div class="text-xl">Material Scheduler</div><span id="ms-badge" class="badge">OK</span></div>
        <div class="flex items-center gap-2"><button id="btn-apply" class="btn btn-primary">Normalize</button><button id="btn-export" class="btn">Export CSV</button></div>
      </header>
      <div class="bg-card border px-3 py-2 flex items-center gap-2 sticky top-12 z-10">
        <button id="btn-refresh" class="btn btn-icon" title="Refresh">⟳</button>
        <button id="btn-dark" class="btn">Toggle Dark</button>
        <div class="ml-auto"></div>
        <nav class="flex items-center gap-2">
          <button data-tab="quick" class="btn" id="tab-quick">Quick Edit</button>
          <button data-tab="scheduler" class="btn btn-primary" id="tab-scheduler">Scheduler</button>
          <button data-tab="kinds" class="btn" id="tab-kinds">Kinds</button>
          <button data-tab="samples" class="btn" id="tab-samples">Samples</button>
          <button data-tab="hidden" class="btn" id="tab-hidden">Hidden</button>
        </nav>
      </div>
      <main id="views"></main>
      <div id="modal" class="hidden"><div id="modal-backdrop" class="fixed inset-0" style="background:rgba(0,0,0,.4)"></div>
        <div class="fixed" style="left:50%;top:30%;transform:translateX(-50%);min-width:360px"><div class="bg-card border rounded shadow-md p-3">
          <div id="modal-title" class="text-lg">Confirm</div><div id="modal-body" class="text-sm text-muted" style="margin-top:8px">Are you sure?</div>
          <div class="flex items-center gap-2 justify-end" style="margin-top:12px"><button id="modal-cancel" class="btn">Cancel</button><button id="modal-ok" class="btn btn-primary">Confirm</button></div>
        </div></div></div>
      <div id="toast2" class="toast"></div>
    `;
  }

  function fillKinds(sel, kinds){ sel.innerHTML = '<option value="">All kinds</option>' + Object.keys(kinds||{}).sort().map(k=>`<option value="${k}">${kinds[k]}</option>`).join(''); }
  function filterRows(rows){ const qs=document.getElementById('flt-search'); const q=(qs?qs.value:'').toLowerCase(); const ks=document.getElementById('flt-kind'); const k=(ks?ks.value:''); let r=(rows||[]).filter(x=>!x.hidden); if(k) r=r.filter(x=>x.type===k); if(q) r=r.filter(x=> (x.code||'').toLowerCase().includes(q) || (x.brand||'').toLowerCase().includes(q) || (x.notes||'').toLowerCase().includes(q) ); return r; }
  function rowHtml(r,kinds){ const status='<span class="badge badge-ok">Normalized</span>'; return `<tr data-id="${r.id}"><td>${h(r.code||'')}</td><td>${h(r.brand||'')}</td><td>${h((kinds||{})[r.type]||r.type||'')}</td><td>${h(r.subtype||'')}</td><td>${h(r.notes||'')}</td><td>${status}</td><td><button class="btn btn-ghost text-accent t-del" title="Delete">Delete</button></td></tr>` }
  function renderRows(rows, kinds){ const tb=document.getElementById('dt-rows'); if(!tb) return; const fr=filterRows(rows); tb.innerHTML = fr.map(r=>rowHtml(r,kinds)).join(''); wireRowActions(); }

  // Views
  function viewScheduler(){ const v=document.getElementById('views'); v.innerHTML = `
    <div class="bg-card border px-3 py-2 flex items-center gap-2 sticky top-24 z-10">
      <input id=\"flt-search\" class=\"input\" placeholder=\"Search...\" />
      <select id=\"flt-kind\" class=\"input\" style=\"width:180px\"></select>
    </div>
    <div class=\"px-3 py-2\"><div class=\"border rounded overflow-auto bg-card\"><table class=\"table\" id=\"dt\"><thead><tr><th style=\"width:160px\">Code</th><th style=\"width:160px\">Brand</th><th style=\"width:160px\">Kind</th><th style=\"width:160px\">Type</th><th>Notes</th><th style=\"width:120px\">Status</th><th style=\"width:90px\">Actions</th></tr></thead><tbody id=\"dt-rows\"></tbody></table></div></div>`; if(window.__DATA){ fillKinds(document.getElementById('flt-kind'), window.__DATA.kinds||{}); renderRows(window.__DATA.entries||[], window.__DATA.kinds||{}); const fs=document.getElementById('flt-search'), fk=document.getElementById('flt-kind'); function r(){ renderRows(window.__DATA.entries||[], window.__DATA.kinds||{}); } if(fs) fs.addEventListener('input',r); if(fk) fk.addEventListener('change',r); }
  }

  function viewQuick(){ const v=document.getElementById('views'); const s=window.__SEL||{}; const kinds= (window.__DATA&&window.__DATA.kinds)||{}; const opts=['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${s.type===k?'selected':''}>${kinds[k]||k}</option>`)).join(''); let sw=''; const swt=s.swatch||{}; if(swt && swt.kind==='texture' && swt.path){ const safe=(swt.path||'').replace(/\\/g,'/'); const vq=swt.stamp||0; sw = `style=\"width:110px;height:110px;border-radius:10px;border:1px solid #e5e7eb;background-image:url('file:///${safe}?v=${vq}');background-size:cover\"`; } else if(swt && swt.kind==='color' && Array.isArray(swt.rgba)){ const a=(swt.rgba[3]||255)/255.0; sw = `style=\"width:110px;height:110px;border-radius:10px;border:1px solid #e5e7eb;background:rgba(${swt.rgba[0]},${swt.rgba[1]},${swt.rgba[2]},${a})\"`; } else { sw = `style=\"width:110px;height:110px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6\"`; }
    v.innerHTML = `
      <div class=\"px-3 py-2\">
        <div class=\"grid\" style=\"grid-template-columns:140px 1fr;gap:16px\">
          <div ${sw}></div>
          <div class=\"grid\" style=\"grid-template-columns:1fr 1fr;gap:12px\">
            <div><div class=\"text-muted text-sm\">Code</div><div class=\"badge\" id=\"q_code\">${h(s.code||'')}</div></div>
            <div><div class=\"text-muted text-sm\">Material Type</div><select id=\"q_type\" class=\"input\">${opts}</select></div>
            <div><div class=\"text-muted text-sm\">Brand</div><input id=\"q_brand\" class=\"input\" value=\"${h(s.brand||'')}\"/></div>
            <div><div class=\"text-muted text-sm\">Type (SKU)</div><input id=\"q_subtype\" class=\"input\" value=\"${h(s.subtype||'')}\"/></div>
            <div style=\"grid-column:1/-1\"><div class=\"text-muted text-sm\">Notes</div><input id=\"q_notes\" class=\"input\" value=\"${h(s.notes||'')}\"/></div>
            <div class=\"flex items-center gap-2 justify-end\" style=\"grid-column:1/-1\"><button id=\"q_apply\" class=\"btn btn-primary\">Apply</button></div>
          </div>
        </div>
      </div>`;
    const btn=document.getElementById('q_apply'); if(btn){ btn.addEventListener('click',()=>{ const payload={ id:s.id, prefix:(document.getElementById('q_type').value||''), brand:(document.getElementById('q_brand').value||''), subtype:(document.getElementById('q_subtype').value||''), notes:(document.getElementById('q_notes').value||'') }; rpc('quick_apply', payload); }); }
  }

  function viewKinds(){ const v=document.getElementById('views'); const kinds=(window.__DATA&&window.__DATA.kinds)||{}; v.innerHTML = `<div class=\"px-3 py-2\"><div class=\"text-sm text-muted\">Kinds editor (WIP)</div><div class=\"badge\">${Object.keys(kinds).length} kinds</div></div>`; }
  function viewSamples(){ const v=document.getElementById('views'); v.innerHTML = `<div class=\"px-3 py-2\"><div class=\"text-sm text-muted\">Samples (use classic UI flow for now)</div></div>`; }
  function viewHidden(){ const v=document.getElementById('views'); v.innerHTML = `<div class=\"px-3 py-2\"><div class=\"text-sm text-muted\">Hidden list (WIP)</div></div>`; }
  function switchTab(tab){ ['quick','scheduler','kinds','samples','hidden'].forEach(t=>{ const el=document.getElementById('tab-'+t); if(el){ if(t===tab) el.classList.add('btn-primary'); else el.classList.remove('btn-primary'); } }); if(tab==='quick') viewQuick(); if(tab==='scheduler') viewScheduler(); if(tab==='kinds') viewKinds(); if(tab==='samples') viewSamples(); if(tab==='hidden') viewHidden(); }
  function wireRowActions(){ document.querySelectorAll('#dt-rows .t-del').forEach(btn=>{ btn.addEventListener('click',()=>{ const tr=btn.closest('tr'); const id=parseInt(tr.getAttribute('data-id'),10); openConfirm('Delete material','Are you sure to delete '+tr.children[0].textContent+'?').then(ok=>{ if(ok) rpc('delete_material',{id:id}); }); }); }); }

  // Modal helpers
  function openConfirm(title, body){ const root=document.getElementById('modal'); const t=document.getElementById('modal-title'); const b=document.getElementById('modal-body'); const ok=document.getElementById('modal-ok'); const cancel=document.getElementById('modal-cancel'); return new Promise(res=>{ t.textContent=title; b.textContent=body; root.classList.remove('hidden'); function done(v){ root.classList.add('hidden'); ok.removeEventListener('click',yes); cancel.removeEventListener('click',no); res(v);} function yes(){done(true)} function no(){done(false)} ok.addEventListener('click',yes); cancel.addEventListener('click',no); }); }

  // RPC bridge
  window.__ms_rpc_resolve=function(p){ var name=p&&p.name; if(name==='get_full'){ var r=p.result||{}; window.__DATA=r; fillKinds(document.getElementById('flt-kind'), r.kinds||{}); renderRows(r.entries||[], r.kinds||{}); return; } if(name==='normalize_preview'){ var ch=(p.result&&p.result.changes)||[]; if(!ch.length){ document.getElementById('toast2').textContent='Already normalized'; document.getElementById('toast2').classList.add('show'); setTimeout(()=>document.getElementById('toast2').classList.remove('show'),3000); return;} openConfirm('Normalize','Will update '+ch.length+' items. Proceed?').then(ok=>{ if(ok) rpc('normalize_all',{}); }); return; } if(name==='normalize_all'){ document.getElementById('toast2').textContent='Normalized'; document.getElementById('toast2').classList.add('show'); setTimeout(()=>document.getElementById('toast2').classList.remove('show'),3000); rpc('get_full',{}); return; } if(name==='delete_material'){ document.getElementById('toast2').textContent='Deleted'; document.getElementById('toast2').classList.add('show'); setTimeout(()=>document.getElementById('toast2').classList.remove('show'),3000); rpc('get_full',{}); return; } };
  window.__ms_rpc_reject=function(p){ var t=document.getElementById('toast2'); t.textContent='Error: '+(p&&p.error||''); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); };

  window.addEventListener('DOMContentLoaded', function(){
    buildSkeleton();
    const darkBtn=document.getElementById('btn-dark'); if(darkBtn){ darkBtn.addEventListener('click',()=>document.documentElement.classList.toggle('dark')); }
    const refresh=document.getElementById('btn-refresh'); if(refresh){ refresh.addEventListener('click',()=>rpc('get_full',{})); }
    const apply=document.getElementById('btn-apply'); if(apply){ apply.addEventListener('click',()=>rpc('normalize_preview',{})); }
    const exp=document.getElementById('btn-export'); if(exp){ exp.addEventListener('click',()=>rpc('export_csv',{ cols:['code','type','brand','subtype','notes','locked','sample','hidden','name','kind_label'] })); }
    document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.getAttribute('data-tab'))));
    switchTab('scheduler');
    try{ if(window.sketchup&&sketchup.ready){ sketchup.ready(); } }catch(e){}
    rpc('get_full',{});
    document.addEventListener('keydown', function(e){ if(e.key==='/'){ var s=document.getElementById('flt-search'); if(s){ s.focus(); e.preventDefault(); } } if(e.key==='Escape'){ var m=document.getElementById('modal'); if(m&&!m.classList.contains('hidden')){ m.classList.add('hidden'); } var t=document.getElementById('toast2'); if(t) t.classList.remove('show'); } });
  });

  // Selection bridge for Quick Edit
  window.__ms_selected_info=function(p){ window.__SEL=p; const active=document.querySelector('button.btn.btn-primary[id^="tab-"]'); if(active && active.getAttribute('data-tab')==='quick'){ viewQuick(); } };
})();
