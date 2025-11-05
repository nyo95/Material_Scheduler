window.Kinds = (function(){
  const $=s=>document.querySelector(s);
  function row(px,lb){ return `<tr><td><input class='inp k_px' value='${px}'></td><td><input class='inp k_lb' value='${lb}'></td><td><button class='btn mini k_rm'>Del</button></td></tr>`; }
  function render(){ const el=document.getElementById('tab-kinds'); const kinds=State.kinds||{}; const rows = Object.keys(kinds).sort().map(px=>row(px,kinds[px])).join(''); el.innerHTML = `
    <div class="toolbar"><button class="btn mini" id="k_add">Add</button><button class="btn mini" id="k_save">Save</button></div>
    <div class="tablewrap"><table><thead><tr><th style='width:120px'>Prefix</th><th>Label</th><th style='width:60px'></th></tr></thead><tbody id='k_rows'>${rows}</tbody></table></div>`;
    document.getElementById('k_add').onclick=function(){ const tb=document.getElementById('k_rows'); tb.insertAdjacentHTML('beforeend', row('', '')); };
    document.getElementById('k_save').onclick=function(){
      const map={}; document.querySelectorAll('#k_rows tr').forEach(function(tr){ const px=(tr.querySelector('.k_px').value||'').toUpperCase().trim(); const lb=(tr.querySelector('.k_lb').value||'').trim(); if(px && lb) map[px]=lb; });
      __rpc('kinds_save',{ kinds: map });
    };
    el.querySelectorAll('.k_rm').forEach(btn=>btn.addEventListener('click',function(){ btn.closest('tr').remove(); }));
  }
  return { render: render };
})();
