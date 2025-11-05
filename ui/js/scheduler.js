window.Scheduler = (function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  let sortKey='code', sortDir='asc', filterType='';
  function header(){
    return `<div class="toolbar">`+
      `<input id="sch_q" class="search" placeholder="Search code/brand/notes..."/>`+
      `<select id="sch_filter" class="inp" style="width:180px">${filterOptions()}</select>`+
      `</div>`+
      `<div class="tablewrap"><table><thead><tr>`+
      `${th('code','Code',80)}`+
      `${th('thumb','Thumbnail',48)}`+
      `${th('kind_label','Material Type')}`+
      `${th('brand','Brand')}`+
      `${th('subtype','Type (SKU)')}`+
      `${th('notes','Notes')}`+
      `${th('flags','Flags',200)}`+
      `<th style="width:60px"></th>`+
      `</tr></thead><tbody id="sch_rows"></tbody></table></div>`;
  }
  function filterOptions(){ const kinds=State.kinds||{}; const arr=['<option value="">All types</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${filterType===k?'selected':''}>${kinds[k]||k}</option>`)); return arr.join(''); }
  function th(key,label,w){ const st=w?` style=\"width:${w}px\"`:''; const arrow = sortKey===key ? (sortDir==='asc'?' \u25B2':' \u25BC') : ''; return `<th data-k="${key}"${st} class="sortable">${label}${arrow}</th>` }
  function row(r){
    const disabled = r.locked ? 'disabled' : '';
    const sw = r.swatch||{}; let swStyle='';
    if(sw && sw.kind==='texture' && sw.path){ const safe=(sw.path||'').replace(/\\\\/g,'/'); const v=sw.stamp||0; swStyle = `background-image:url('file:///${safe}?v=${v}'); background-size:cover;`; }
    else if(sw && sw.kind==='color' && Array.isArray(sw.rgba)){ const a=(sw.rgba[3]||255)/255.0; swStyle=`background: rgba(${sw.rgba[0]||0},${sw.rgba[1]||0},${sw.rgba[2]||0},${a});`; }
    const isDirty = !!(State.pending && State.pending[r.id]);
    return `<tr data-id="${r.id}" class="${r.locked?'locked':''} ${isDirty?'dirty':''}">`+
      `<td class="td-code">${r.code||''}</td>`+
      `<td class="td-thumb"><div class="thumb thumb-sm" style="${swStyle}"></div></td>`+
      `<td class="td-type cell-input"><select class="t_type" ${disabled}>${typeOptionsLabel(r.type)}</select></td>`+
      `<td class="td-brand cell-input"><input class="t_brand" type="text" value="${r.brand||''}" ${disabled}></td>`+
      `<td class="td-subtype cell-input"><input class="t_subtype" type="text" value="${r.subtype||''}" ${disabled}></td>`+
      `<td class="td-notes cell-input"><input class="t_notes" type="text" value="${r.notes||''}" ${disabled}></td>`+
      `<td class="td-flags">${flagHtml(r)}</td>`+
      `<td class="td-actions">`+
        `<button class="btn mini t_apply" ${isDirty?'':'disabled'}>Apply</button> `+
        `<button class="btn mini t_revert" ${isDirty?'':'disabled'}>Revert</button> `+
        `<button class="btn mini t_delete" ${r.locked?'disabled':''}>Delete</button>`+
      `</td>`+
    `</tr>`;
  }
  function flagHtml(r){
    function chip(lbl,on){ return `<span class="chip" data-k="${lbl}">${lbl}: <span class="switch ${on?'active':''}"><span></span></span></span>` }
    return chip('locked', !!r.locked) + ' ' + chip('sample', !!r.sample) + ' ' + chip('hidden', !!r.hidden) + ' ' + chip('received', !!r.sample_received);
  }
  function typeOptionsLabel(sel){ const kinds=State.kinds||{}; const arr=['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${sel===k?'selected':''}>${kinds[k]||k}</option>`)); return arr.join(''); }
  function currentColumns(){ return ['code','type','brand','subtype','notes','locked','sample','hidden','name','kind_label']; }
  function render(){ const el=$('#tab-scheduler'); el.innerHTML = header(); const q=$('#sch_q'); q.addEventListener('input',renderRows); const f=$('#sch_filter'); f.addEventListener('change',()=>{ filterType=f.value||''; renderRows(); }); el.querySelectorAll('th.sortable').forEach(th=>th.addEventListener('click',()=>{ const k=th.getAttribute('data-k'); if(sortKey===k){ sortDir = (sortDir==='asc'?'desc':'asc'); } else { sortKey=k; sortDir='asc'; } render(); })); renderRows(); }
  function sortRows(rows){ const k=sortKey; const dir = (sortDir==='asc'?1:-1); return rows.slice().sort((a,b)=>{ let va=a[k], vb=b[k]; va=(va==null?'':va); vb=(vb==null?'':vb); if(typeof va==='string') va=va.toLowerCase(); if(typeof vb==='string') vb=vb.toLowerCase(); if(va<vb) return -1*dir; if(va>vb) return 1*dir; return 0; }); }
  function renderRows(){ const tb=$('#sch_rows'); const query=($('#sch_q').value||'').toLowerCase(); let rows=State.visibleRows; if(filterType){ rows=rows.filter(r=> (r.type||'')===filterType); } if(query) rows=rows.filter(r=> (r.code||'').toLowerCase().includes(query) || (r.brand||'').toLowerCase().includes(query) || (r.notes||'').toLowerCase().includes(query)); rows=sortRows(rows); tb.innerHTML = rows.map(row).join(''); wireRows(); }
  function markDirty(id, patch){ if(!State.pending) State.pending={}; const cur=State.pending[id]||{}; State.pending[id]=Object.assign({},cur,patch||{}); const tr=document.querySelector(`tr[data-id="${id}"]`); if(tr){ tr.classList.add('dirty'); const ap=tr.querySelector('.t_apply'), rv=tr.querySelector('.t_revert'); if(ap) ap.removeAttribute('disabled'); if(rv) rv.removeAttribute('disabled'); } }
  function wireRows(){ $$('#sch_rows tr').forEach(tr=>{
    const id=parseInt(tr.getAttribute('data-id'),10);
    // Drag & drop swap on code cell
    const codeCell = tr.querySelector('.td-code');
    if(codeCell){
      tr.setAttribute('draggable','true');
      tr.addEventListener('dragstart',ev=>{ ev.dataTransfer.setData('text/plain', String(id)); ev.dataTransfer.effectAllowed = 'move'; tr.classList.add('dragging'); });
      tr.addEventListener('dragend',()=>{ tr.classList.remove('dragging'); });
      tr.addEventListener('dragover',ev=>{ ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
      tr.addEventListener('drop',ev=>{ ev.preventDefault(); const src = parseInt(ev.dataTransfer.getData('text/plain')||'0',10); const dst = id; if(src && dst && src!==dst){ __rpc('swap_codes',{ a:src, b:dst }); } });
    }
    const del = tr.querySelector('.t_delete'); if(del){ del.addEventListener('click',()=>__rpc('delete_material',{id:id})); }
    tr.querySelectorAll('.chip').forEach(chip=>{
      const key=chip.getAttribute('data-k'); const sw=chip.querySelector('.switch');
      chip.addEventListener('click',()=>{ const on=!sw.classList.contains('active'); sw.classList.toggle('active'); const flags={}; flags[key]=on; __rpc('set_flags',{ ids:[id], flags:flags }); });
    });
    const tsel=tr.querySelector('.t_type'); if(tsel){ tsel.addEventListener('change',()=>{ const prefix=tsel.value||''; markDirty(id,{ prefix:prefix }); }); }
    const tbrand=tr.querySelector('.t_brand'); if(tbrand){ tbrand.addEventListener('input',()=>{ markDirty(id,{ brand:tbrand.value }); }); }
    const tsub=tr.querySelector('.t_subtype'); if(tsub){ tsub.addEventListener('input',()=>{ markDirty(id,{ subtype:tsub.value }); }); }
    const tnotes=tr.querySelector('.t_notes'); if(tnotes){ tnotes.addEventListener('input',()=>{ markDirty(id,{ notes:tnotes.value }); }); }
    const tap=tr.querySelector('.t_apply'); if(tap){ tap.addEventListener('click',()=>{ const patch=(State.pending||{})[id]||{}; if(Object.keys(patch).length===0){ return; } patch.id=id; __rpc('quick_apply', patch); delete (State.pending||{})[id]; }); }
    const trv=tr.querySelector('.t_revert'); if(trv){ trv.addEventListener('click',()=>{ delete (State.pending||{})[id]; renderRows(); }); }
  }); }
  return { render: render, currentColumns: currentColumns };
})();
