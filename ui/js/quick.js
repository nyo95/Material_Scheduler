window.Quick = (function(){
  const $=s=>document.querySelector(s);
  function tpl(p){
    if(!p) return '<div class="pill">No selection</div>';
    const kinds = State.kinds||{};
    const opts = ['<option value="">(Unassigned)</option>'].concat(Object.keys(kinds).sort().map(function(k){ return '<option value="'+k+'"'+(p.type===k?' selected':'')+'>'+k+' — '+(kinds[k]||'')+'</option>'; })).join('');
    const num = (p.number||'');
    return `
      <div class="tablewrap" style="padding:10px">
        <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap">
          <div><div class="muted">Name</div><div class="tag">${p.name||''}</div></div>
          <div><div class="muted">Current Code</div><div class="tag">${p.code||''}</div></div>
          <div><div class="muted">Type (Prefix)</div><select id="q_type" class="inp">${opts}</select></div>
          <div><div class="muted">Number</div><input id="q_num" class="inp" type="number" min="1" step="1" value="${num}"></div>
          <div><div class="muted">Brand</div><input id="q_brand" class="inp" type="text" value="${p.brand||''}"></div>
          <div><div class="muted">Notes</div><input id="q_notes" class="inp" type="text" value="${p.notes||''}"></div>
          <div><button class="btn btn-primary" id="q_apply">Apply</button></div>
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
      const number = document.getElementById('q_num').value||'';
      const brand=document.getElementById('q_brand').value||'';
      const notes=document.getElementById('q_notes').value||'';
      __rpc('quick_apply', { id:p.id, prefix:prefix, number:number, brand:brand, notes:notes });
    };
  }
  return { render: render, onSelected: onSelected };
})();
