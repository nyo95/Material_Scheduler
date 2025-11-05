window.Scheduler = (function(){
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  function header(){
    return `<div class="toolbar"><input id="sch_q" class="search" placeholder="Search..."/></div>`+
      `<div class="tablewrap"><table><thead><tr>`+
      `<th style="width:100px">Code</th><th style="width:100px">Type</th>`+
      `<th>Brand</th><th>Notes</th><th style="width:140px">Flags</th><th style="width:60px"></th>`+
      `</tr></thead><tbody id="sch_rows"></tbody></table></div>`;
  }
  function row(r){
    const disabled = r.locked ? 'disabled' : '';
    return `<tr data-id="${r.id}" class="${r.locked?'locked':''}">`+
      `<td>${r.code||''}</td>`+
      `<td><select class="t_type" ${disabled}>${typeOptions(r.type)}</select></td>`+
      `<td><input class="t_brand" type="text" value="${r.brand||''}" ${disabled}></td>`+
      `<td><input class="t_notes" type="text" value="${r.notes||''}" ${disabled}></td>`+
      `<td>${flagHtml(r)}</td>`+
      `<td><button class="btn mini t_delete" ${r.locked?'disabled':''}>Delete</button></td>`+
    `</tr>`;
  }
  function flagHtml(r){
    function chip(lbl,on){ return `<span class="chip" data-k="${lbl}">${lbl}: <span class="switch ${on?'active':''}"><span></span></span></span>` }
    return chip('locked', !!r.locked) + ' ' + chip('sample', !!r.sample) + ' ' + chip('hidden', !!r.hidden) + ' ' + chip('received', !!r.sample_received);
  }
  function typeOptions(sel){ const kinds=State.kinds||{}; const arr=['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(k=>`<option value="${k}" ${sel===k?'selected':''}>${k}</option>`)); return arr.join(''); }
  function currentColumns(){ return ['code','type','brand','notes','locked','sample','hidden','name','kind_label']; }
  function render(){ const el=$('#tab-scheduler'); el.innerHTML = header(); const q=$('#sch_q'); q.addEventListener('input',renderRows); renderRows(); }
  function renderRows(){ const tb=$('#sch_rows'); const query=($('#sch_q').value||'').toLowerCase(); let rows=State.visibleRows; if(query) rows=rows.filter(r=> (r.code||'').toLowerCase().includes(query) || (r.brand||'').toLowerCase().includes(query) || (r.notes||'').toLowerCase().includes(query)); tb.innerHTML = rows.map(row).join(''); wireRows(); }
  function wireRows(){ $$('#sch_rows tr').forEach(tr=>{
    const id=parseInt(tr.getAttribute('data-id'),10);
    tr.querySelector('.t_delete').addEventListener('click',()=>__rpc('delete_material',{id:id}));
    tr.querySelectorAll('.chip').forEach(chip=>{
      const key=chip.getAttribute('data-k'); const sw=chip.querySelector('.switch');
      chip.addEventListener('click',()=>{ const on=!sw.classList.contains('active'); sw.classList.toggle('active'); const flags={}; flags[key]=on; __rpc('set_flags',{ ids:[id], flags:flags }); });
    });
    const tsel=tr.querySelector('.t_type'); if(tsel){ tsel.addEventListener('change',()=>{ const prefix=tsel.value||''; __rpc('quick_apply',{ id:id, prefix:prefix }); }); }
    const tbrand=tr.querySelector('.t_brand'); if(tbrand){ tbrand.addEventListener('change',()=>{ __rpc('quick_apply',{ id:id, brand:tbrand.value }); }); }
    const tnotes=tr.querySelector('.t_notes'); if(tnotes){ tnotes.addEventListener('change',()=>{ __rpc('quick_apply',{ id:id, notes:tnotes.value }); }); }
  }); }
  return { render: render, currentColumns: currentColumns };
})();
