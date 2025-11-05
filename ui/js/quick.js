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
      swStyle = `background-image:url('file:///${safe}'); background-size:cover;`;
    }else if(sw && sw.kind==='color' && Array.isArray(sw.rgba)){
      const a = (sw.rgba[3]||255)/255.0; swStyle = `background: rgba(${sw.rgba[0]||0},${sw.rgba[1]||0},${sw.rgba[2]||0},${a});`;
    }
    const disabled = p.locked ? 'disabled' : '';
    const chip = (lbl,on)=>`<span class="chip" data-k="${lbl}">${lbl}: <span class="switch ${on?'active':''}"><span></span></span></span>`;
    return `
      <div class="tablewrap" style="padding:12px">
        <div class="quick-grid">
          <div class="thumb quick-thumb" style="${swStyle}"></div>
          <div class="code-block">
            <div class="muted" style="margin-bottom:4px">Code</div>
            <div class="code-value" id="q_code">${p.code||'—'}</div>
          </div>
          <div class="col-stack">
            <div class="field"><div class="muted">Material Type</div><select id="q_type" class="inp" ${disabled}>${opts}</select></div>
            <div class="field"><div class="muted">Brand</div><input id="q_brand" class="inp" type="text" value="${p.brand||''}" ${disabled}></div>
            <div class="quick-row">
              <div class="field-grow"><div class="muted">Type (SKU Type)</div><input id="q_subtype" class="inp" type="text" value="${p.subtype||''}" ${disabled}></div>
              <div class="flags-row">${chip('locked',!!p.locked)} ${chip('sample',!!p.sample)}</div>
              <div><button class="btn btn-primary" id="q_apply">Apply</button></div>
            </div>
          </div>
          <div class="notes-col">
            <div class="muted">Notes</div>
            <textarea id="q_notes" class="inp" rows="4" ${disabled}>${(p.notes||'')}</textarea>
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
    (el.querySelectorAll('.chip')||[]).forEach(chip=>{
      const key=chip.getAttribute('data-k'); const sw=chip.querySelector('.switch');
      chip.addEventListener('click',()=>{ const on=!sw.classList.contains('active'); sw.classList.toggle('active'); const flags={}; flags[key]=on; __rpc('set_flags',{ ids:[p.id], flags:flags }); });
    });
  }
  return { render: render, onSelected: onSelected };
})();
