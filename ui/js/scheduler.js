window.Scheduler = (function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  let sortKey='code', sortDir='asc', filterType='';
  function header(){
    return `<div class=\"toolbar flex items-center gap-2 mb-2\">`+
      `<input id="sch_q" class="search" placeholder="Search code/brand/notes..."/>`+
      `<select id="sch_filter" class="inp" style="width:180px">${filterOptions()}</select>`+
      `</div>`+
      `<div class=\"tablewrap\"><table class=\"min-w-full text-sm table-fixed\"><thead><tr>`+
      `${th('code','Code',80,'col-code')}`+
      `${th('thumb','Thumbnail',48,'col-thumb')}`+
      `${th('kind_label','Material Type',null,'col-type')}`+
      `${th('brand','Brand',null,'col-brand')}`+
      `${th('subtype','Type (SKU)',null,'col-subtype')}`+
      `${th('notes','Notes',null,'col-notes')}`+
      `${th('flags','Flags',200,'col-flags')}`+
      `<th style="width:60px"><span class="col-resizer" data-k="${key}"></span></th>`+
      `</tr></thead><tbody id="sch_rows"></tbody></table></div>`;
  }
  function filterOptions(){ const kinds=State.kinds||{}; const arr=['<option value="">All types</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${filterType===k?'selected':''}>${kinds[k]||k}</option>`)); return arr.join(''); }
  function th(key,label,w,extraCls){ const st=w?` style=\\"width:${w}px\\"`:''; const arrow = sortKey===key ? (sortDir==='asc'?' \▲':' \▼') : ''; const cls = `sortable ${extraCls||''}`; return `<th data-k=\"${key}\"${st} class=\"${cls}\">${label}${arrow}<span class="col-resizer" data-k="${key}"></span></th>` }
  function row(r){
    const disabled = r.locked ? 'disabled' : '';
    const sw = r.swatch||{}; let swStyle='';
    if(sw && sw.kind==='texture' && sw.path){ const safe=(sw.path||'').replace(/\\\\/g,'/'); const v=sw.stamp||0; swStyle = `background-image:url('file:///${safe}?v=${v}'); background-size:cover;`; }
    else if(sw && sw.kind==='color' && Array.isArray(sw.rgba)){ const a=(sw.rgba[3]||255)/255.0; swStyle=`background: rgba(${sw.rgba[0]||0},${sw.rgba[1]||0},${sw.rgba[2]||0},${a});`; }
    const isDirty = !!(State.pending && State.pending[r.id]);
    const sampleCls = (r.sample ? (r.sample_received ? 'sample-ok' : 'sample-wait') : '');
    return `<tr data-id="${r.id}" data-type="${r.type||''}" data-locked="${r.locked?1:0}" class="${r.locked?'locked':''} ${isDirty?'dirty':''} ${sampleCls}">`+
      `<td class="td-code col-code"><span class="drag-handle" title="Drag to swap"><svg width="14" height="14"><use href="#ico-drag"/></svg></span> ${r.code||''}</td>`+
      `<td class="td-thumb col-thumb"><div class="thumb thumb-sm" style="${swStyle}"></div></td>`+
      `<td class="td-type cell-input col-type"><select class="t_type" ${disabled}>${typeOptionsLabel(r.type)}</select></td>`+
      `<td class="td-brand cell-input col-brand"><input class="t_brand" type="text" value="${r.brand||''}" ${disabled}></td>`+
      `<td class="td-subtype cell-input col-subtype"><input class="t_subtype" type="text" value="${r.subtype||''}" ${disabled}></td>`+
      `<td class="td-notes cell-input col-notes"><input class="t_notes" type="text" value="${r.notes||''}" ${disabled}></td>`+
      `<td class="td-flags col-flags">${flagHtml(r)}</td>`+
      `<td class="td-actions">`+
        `<button class="btn mini t_apply" title="Apply changes" ${isDirty?'':'disabled'}><svg width="14" height="14"><use href="#ico-check"/></svg></button> `+
        `<button class="btn mini t_revert" title="Revert pending" ${isDirty?'':'disabled'}>Revert</button> `+
        `<button class="btn mini t_delete" title="Delete material" ${r.locked?'disabled':''}>Delete</button>`+
      `</td>`+
    `</tr>`;
  }
  function flagHtml(r){
    function ico(id,on,title){ return `<button class=\"flag ${on?'on':''}\" data-k=\"${id}\" title=\"${title}\"><svg width=\"16\" height=\"16\"><use href=\"#${id==='locked'?'ico-lock':id==='hidden'?'ico-eye':id==='sample'?'ico-flask':'ico-check'}\"/></svg></button>` }
    return ico('locked',!!r.locked,'Locked')+ ' ' + ico('sample',!!r.sample,'Sample') + ' ' + ico('hidden',!!r.hidden,'Hidden') + ' ' + ico('received',!!r.sample_received,'Received');
  }
  function typeOptionsLabel(sel){ const kinds=State.kinds||{}; const arr=['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${sel===k?'selected':''}>${kinds[k]||k}</option>`)); return arr.join(''); }
  function currentColumns(){ return ['code','type','brand','subtype','notes','locked','sample','hidden','name','kind_label']; }
  function render(){ const el=$('#tab-scheduler'); el.innerHTML = header(); const q=$('#sch_q'); q.addEventListener('input',renderRows); const f=$('#sch_filter'); f.addEventListener('change',()=>{ filterType=f.value||''; applySavedWidths(); renderRows(); wireResizers(); }); el.querySelectorAll('th.sortable').forEach(th=>th.addEventListener('click',()=>{ const k=th.getAttribute('data-k'); if(sortKey===k){ sortDir = (sortDir==='asc'?'desc':'asc'); } else { sortKey=k; sortDir='asc'; } render(); })); applySavedWidths(); renderRows(); wireResizers(); }
  function sortRows(rows){ const k=sortKey; const dir = (sortDir==='asc'?1:-1); return rows.slice().sort((a,b)=>{ let va=a[k], vb=b[k]; va=(va==null?'':va); vb=(vb==null?'':vb); if(typeof va==='string') va=va.toLowerCase(); if(typeof vb==='string') vb=vb.toLowerCase(); if(va<vb) return -1*dir; if(va>vb) return 1*dir; return 0; }); }
  function renderRows(){ const tb=$('#sch_rows'); const query=($('#sch_q').value||'').toLowerCase(); let rows=State.visibleRows; if(filterType){ rows=rows.filter(r=> (r.type||'')===filterType); } if(query) rows=rows.filter(r=> (r.code||'').toLowerCase().includes(query) || (r.brand||'').toLowerCase().includes(query) || (r.notes||'').toLowerCase().includes(query)); rows=sortRows(rows); tb.innerHTML = rows.map(row).join(''); wireRows(); }
  function markDirty(id, patch){ if(!State.pending) State.pending={}; const cur=State.pending[id]||{}; State.pending[id]=Object.assign({},cur,patch||{}); const tr=document.querySelector(`tr[data-id="${id}"]`); if(tr){ tr.classList.add('dirty'); const ap=tr.querySelector('.t_apply'), rv=tr.querySelector('.t_revert'); if(ap) ap.removeAttribute('disabled'); if(rv) rv.removeAttribute('disabled'); } }
  function wireRows(){ $$('#sch_rows tr').forEach(tr=>{
    const id=parseInt(tr.getAttribute('data-id'),10);
    // Drag & drop swap via handle
    const handle = tr.querySelector('.drag-handle');
    if(handle){
      handle.setAttribute('draggable','true');
      handle.addEventListener('dragstart',ev=>{ ev.stopPropagation(); ev.dataTransfer.setData('text/plain', String(id)); ev.dataTransfer.effectAllowed = 'move'; tr.classList.add('dragging'); });
      handle.addEventListener('dragend',()=>{ tr.classList.remove('dragging'); });
    }
    tr.addEventListener('dragover',ev=>{ ev.preventDefault(); const locked = (tr.getAttribute('data-locked')==='1'); const srcId = parseInt(ev.dataTransfer.getData('text/plain')||'0',10); const srcTr = document.querySelector(`tr[data-id="${srcId}"]`); const typeOk = srcTr && (srcTr.getAttribute('data-type')===tr.getAttribute('data-type')); if(!locked && typeOk){ tr.classList.add('drop-target'); } else { tr.classList.remove('drop-target'); } });
    tr.addEventListener('dragleave',()=>{ tr.classList.remove('drop-target'); });
    tr.addEventListener('drop',ev=>{ ev.preventDefault(); tr.classList.remove('drop-target'); const src = parseInt(ev.dataTransfer.getData('text/plain')||'0',10); const dst = id; if(!src||!dst||src===dst){return;} const srcTr=document.querySelector(`tr[data-id="${src}"]`); const typeOk = srcTr && (srcTr.getAttribute('data-type')===tr.getAttribute('data-type')); const dstLocked = (tr.getAttribute('data-locked')==='1'); const srcLocked = srcTr && (srcTr.getAttribute('data-locked')==='1'); if(srcLocked || dstLocked){ __toast('Cannot swap: locked'); return; } if(!typeOk){ __toast('Types must match'); return; } __rpc('swap_codes',{ a:src, b:dst }); });
    const del = tr.querySelector('.t_delete'); if(del){ del.addEventListener('click',()=>{ if(confirm('Delete this material?')){ __rpc('delete_material',{id:id}); } }); }
    tr.querySelectorAll('.flag').forEach(btn=>{
      const key=btn.getAttribute('data-k');
      btn.addEventListener('click',()=>{ const locked = (tr.getAttribute('data-locked')==='1'); if(locked && key!=='sample'){ __toast('Locked: only sample allowed'); return; } const on=!btn.classList.contains('on'); btn.classList.toggle('on'); if(window.__setFlag){ window.__setFlag(id,key,on); } else { const flags={}; flags[key]=on; __rpc('set_flags',{ ids:[id], flags:flags }); } });
    });
    const tsel=tr.querySelector('.t_type'); if(tsel){ tsel.addEventListener('change',()=>{ const prefix=tsel.value||''; markDirty(id,{ prefix:prefix }); }); }
    const tbrand=tr.querySelector('.t_brand'); if(tbrand){ tbrand.addEventListener('input',()=>{ markDirty(id,{ brand:tbrand.value }); }); tbrand.addEventListener('keydown',e=>{ if(e.key==='Enter'){ applyRow(id); } }); }
    const tsub=tr.querySelector('.t_subtype'); if(tsub){ tsub.addEventListener('input',()=>{ markDirty(id,{ subtype:tsub.value }); }); tsub.addEventListener('keydown',e=>{ if(e.key==='Enter'){ applyRow(id); } }); }
    const tnotes=tr.querySelector('.t_notes'); if(tnotes){ tnotes.addEventListener('input',()=>{ markDirty(id,{ notes:tnotes.value }); }); tnotes.addEventListener('keydown',e=>{ if(e.key==='Enter'){ applyRow(id); } }); }
    const tap=tr.querySelector('.t_apply'); if(tap){ tap.addEventListener('click',()=> applyRow(id)); }
    const trv=tr.querySelector('.t_revert'); if(trv){ trv.addEventListener('click',()=>{ delete (State.pending||{})[id]; applySavedWidths(); renderRows(); wireResizers(); }); }
  }); }
  function applyRow(id){ const patch=(State.pending||{})[id]||{}; if(Object.keys(patch).length===0){ return; } patch.id=id; __rpc('quick_apply', patch); delete (State.pending||{})[id]; }
  return { render: render, currentColumns: currentColumns };
})();



