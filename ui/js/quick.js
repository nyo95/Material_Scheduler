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
    return `
      <div class="tablewrap" style="padding:10px">
        <div style="display:grid; grid-template-columns: 140px 1fr; gap:24px; align-items:start">
          <div class="thumb" style="width:110px; height:110px; border-radius:6px; border:1px solid #e5e7eb; ${swStyle}"></div>
          <div style="display:flex; gap:14px; align-items:flex-end; flex-wrap:wrap">
            <div><div class="muted">Current Code</div><div class="tag" id="q_code">${p.code||''}</div></div>
            <div><div class="muted">Type</div><select id="q_type" class="inp">${opts}</select></div>
            <div><div class="muted">Brand</div><input id="q_brand" class="inp" type="text" value="${p.brand||''}"></div>
            <div><div class="muted">Notes</div><input id="q_notes" class="inp" type="text" value="${p.notes||''}"></div>
            <div><button class="btn btn-primary" id="q_apply">Apply</button></div>
          </div>
        </div>
      </div>`;
  }
  function onSelected(p){ window.__quickSel = p; render(); }
  function render(){
    const el=document.getElementById('tab-quick');
    el.innerHTML = tpl(window.__quickSel);
    const p=window.__quickSel; if(!p) return;
    document.getElementById('q_apply').onclick = function(){
      const prefix = document.getElementById('q_type').value||'';
      const brand=(document.getElementById('q_brand').value||'');
      const notes=(document.getElementById('q_notes').value||'');
      __rpc('quick_apply', { id:p.id, prefix:prefix, brand:brand, notes:notes });
    };
  }
  return { render: render, onSelected: onSelected };
})();
