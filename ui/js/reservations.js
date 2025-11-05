window.Reservations = (function(){
  const $=s=>document.querySelector(s);
  function row(px,arr){ const csv = arr.map(x=> (typeof x==='number'? x : (''+x).split('-')[1])).join(','); return `<tr data-px='${px}'><td>${px}</td><td><input class='inp r_csv' value='${csv}'></td></tr>`; }
  function render(){ const el=document.getElementById('tab-reservations'); const kinds=State.kinds||{}; const map=State.reservations||{}; const rows = Object.keys(kinds).sort().map(px=>row(px,map[px]||[])).join(''); el.innerHTML = `
    <div class="toolbar"><button class="btn mini" id="r_save">Save</button><button class="btn mini" id="r_export">Export JSON</button><button class="btn mini" id="r_import">Import JSON</button></div>
    <div class="tablewrap"><table><thead><tr><th style='width:120px'>Prefix</th><th>Reserved Numbers (CSV)</th></tr></thead><tbody id='r_rows'>${rows}</tbody></table></div>`;
    document.getElementById('r_save').onclick=function(){
      const map={}; document.querySelectorAll('#r_rows tr').forEach(function(tr){ const px=tr.getAttribute('data-px'); const csv=(tr.querySelector('.r_csv').value||'').trim(); const nums=csv.split(/\s*,\s*/).filter(x=>x!==''); map[px]=nums.map(function(n){ const i=parseInt(n,10); return isNaN(i) ? (px+'-'+n) : (px+'-'+i); }); });
      __rpc('reservations_save',{ map: map });
    };
    document.getElementById('r_export').onclick=function(){ __rpc('reservations_export_json',{}); };
    document.getElementById('r_import').onclick=function(){ const json=prompt('Paste JSON'); if(json){ __rpc('reservations_import_json',{ json: json }); } };
  }
  return { render: render };
})();
