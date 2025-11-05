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
      <div class="tablewrap" style="padding:10px">
        <div style="display:grid; grid-template-columns: 160px 1fr; gap:26px; align-items:start">
          <div class="thumb" style="width:110px; height:110px; border-radius:6px; border:1px solid #e5e7eb; ${swStyle}"></div>
          <div style="display:flex; gap:14px; align-items:flex-end; flex-wrap:wrap">
            <div><div class="muted">Current Code</div><div class="tag" id="q_code">${p.code||''}</div></div>
            <div style="min-width:220px"><div class="muted">Material Type</div><select id="q_type" class="inp" ${disabled}>${opts}</select></div>
            <div style="min-width:220px"><div class="muted">Brand</div><input id="q_brand" class="inp" type="text" value="${p.brand||''}" ${disabled}></div>
            <div style="min-width:220px"><div class="muted">SKU Type</div><input id="q_subtype" class="inp" type="text" value="${p.subtype||''}" ${disabled}></div>
            <div style="min-width:280px; flex:1"><div class="muted">Notes</div><input id="q_notes" class="inp" type="text" value="${p.notes||''}" ${disabled}></div>
            <div><button class="btn btn-primary" id="q_apply">Apply</button></div>
            <div style="margin-left:auto">${chip('locked',!!p.locked)} ${chip('sample',!!p.sample)}</div>
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
