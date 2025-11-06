window.Quick = (function(){
  const $=s=>document.querySelector(s);
  function tpl(p){
    if(!p) return '<div class="pill">No selection</div>';
    const kinds = State.kinds||{};
    const opts = ['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(function(k){ return '<option value="'+k+'"'+(p.type===k?' selected':'')+'>'+k+' — '+(kinds[k]||'')+'</option>'; })).join('');
    const sw = p.swatch||{};
    let swStyle = '';
    if(sw && sw.kind==='texture' && sw.path){
      const safe = (sw.path||'').replace(/\\\\/g,'/');
      const v = sw.stamp||0;
      swStyle = `background-image:url('file:///${safe}?v=${v}'); background-size:cover;`;
    }else if(sw && sw.kind==='color' && Array.isArray(sw.rgba)){
      const a = (sw.rgba[3]||255)/255.0; swStyle = `background: rgba(${sw.rgba[0]||0},${sw.rgba[1]||0},${sw.rgba[2]||0},${a});`;
    }
    const disabled = p.locked ? 'disabled' : '';
    const chip = (lbl,on)=>`<span class="chip" data-k="${lbl}">${lbl}: <span class="switch ${on?'active':''}"><span></span></span></span>`;
    return `
      <div class="tablewrap quick-wrap" style="padding:12px">
        <div class="quick-grid">
          <div class="thumb quick-thumb" style="${swStyle}"></div>
          <div class="code-block">
            <div class="muted" style="margin-bottom:4px">Code</div>
            <div class="code-value" id="q_code">${p.code||'—'}</div>
          </div>
          <div class="col-stack">
            <div class="field"><div class="muted">Material Type</div><select id="q_type" class="inp" ${disabled}>${opts}</select></div>
            <div class="field"><div class="muted">Brand</div><input id="q_brand" class="inp" type="text" value="${p.brand||''}" ${disabled}></div>
            <div class="field-grow"><div class="muted">Type (SKU Type)</div><input id="q_subtype" class="inp" type="text" value="${p.subtype||''}" ${disabled}></div>
          </div>
          <div class="notes-col">
            <div class="muted">Notes</div>
            <textarea id="q_notes" class="inp quick-notes" rows="4" ${disabled}>${(p.notes||'')}</textarea>
            <div class="notes-actions">
              <button class="flag ${p.locked?'on':''}" data-k="locked" title="Locked"><svg width="16" height="16"><use href="#ico-lock"/></svg></button>
              <button class="flag ${p.sample?'on':''}" data-k="sample" title="Sample"><svg width="16" height="16"><use href="#ico-flask"/></svg></button>
              <button class="flag ${p.hidden?'on':''}" data-k="hidden" title="Hidden"><svg width="16" height="16"><use href="#ico-eye"/></svg></button>
              <button class="flag ${p.sample_received?'on':''}" data-k="received" title="Received"><svg width="16" height="16"><use href="#ico-check"/></svg></button>
              <button class=\\"btn btn-primary btn-lg inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-3 py-2\\" id=\"q_apply\" title=\"Apply changes\"><svg width=\"16\" height=\"16\"><use href=\"#ico-check\"/></svg></button>
            </div>
          </div>
        </div>
      </div>`;
  }
  function onSelected(p){ window.__quickSel = p; render(); }
  function render(){
    const el=document.getElementById('tab-quick');
    el.innerHTML = tpl(window.__quickSel);
    const p=window.__quickSel; if(!p) return;
    function apply(){
      const prefix = document.getElementById('q_type').value||'';
      const brand=(document.getElementById('q_brand').value||'');
      const subtype=(document.getElementById('q_subtype').value||'');
      const notes=(document.getElementById('q_notes').value||'');
      __rpc('quick_apply', { id:p.id, prefix:prefix, brand:brand, subtype:subtype, notes:notes });
    }
    document.getElementById('q_apply').onclick = apply;
    ['q_brand','q_notes','q_subtype'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ apply(); } }); }});
    // Flags toggles
    (el.querySelectorAll('.flag')||[]).forEach(btn=>{
      const key=btn.getAttribute('data-k');
      btn.addEventListener('click',()=>{ if(p.locked && key!=='sample'){ __toast('Locked: only sample allowed'); return; } const on=!btn.classList.contains('on'); btn.classList.toggle('on'); if(window.__setFlag){ window.__setFlag(p.id,key,on); } else { const flags={}; flags[key]=on; __rpc('set_flags',{ ids:[p.id], flags:flags }); } });
    });
  }
  return { render: render, onSelected: onSelected };
})();


