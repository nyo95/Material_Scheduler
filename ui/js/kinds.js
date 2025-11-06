window.Kinds = (function(){
  const $=s=>document.querySelector(s);
  function row(px,lb){ return `<tr><td><input class='inp k_px rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-2 py-1 text-sm' value='${px}'></td><td><input class='inp k_lb rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-2 py-1 text-sm' value='${lb}'></td><td><button class='btn mini k_rm inline-flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1'>Del</button></td></tr>`; }
  function render(){ const el=document.getElementById('tab-kinds'); const kinds=State.kinds||{}; const rows = Object.keys(kinds).sort().map(px=>row(px,kinds[px])).join(''); el.innerHTML = `
    <div class="toolbar flex items-center gap-2 mb-2"><button class="btn mini inline-flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1" id="k_add">Add</button><button class="btn mini inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1" id="k_save">Save</button></div>
    <div class="tablewrap"><table class="min-w-full text-sm"><thead><tr><th class="text-left font-semibold text-slate-600 bg-slate-50" style='width:120px'>Prefix</th><th class="text-left font-semibold text-slate-600 bg-slate-50">Label</th><th style='width:60px'></th></tr></thead><tbody id='k_rows'>${rows}</tbody></table></div>`;
    document.getElementById('k_add').onclick=function(){ const tb=document.getElementById('k_rows'); tb.insertAdjacentHTML('beforeend', row('', '')); };
    document.getElementById('k_save').onclick=function(){
      const map={}; document.querySelectorAll('#k_rows tr').forEach(function(tr){ const px=(tr.querySelector('.k_px').value||'').toUpperCase().trim(); const lb=(tr.querySelector('.k_lb').value||'').trim(); if(px && lb) map[px]=lb; });
      __rpc('kinds_save',{ kinds: map });
    };
    el.querySelectorAll('.k_rm').forEach(btn=>btn.addEventListener('click',function(){ btn.closest('tr').remove(); }));
  }
  return { render: render };
})();
