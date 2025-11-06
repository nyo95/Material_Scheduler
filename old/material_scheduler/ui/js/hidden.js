window.Hidden = (function(){
  const $=s=>document.querySelector(s);
  function render(){ const el=$('#tab-hidden'); const rows=State.hiddenRows; el.innerHTML = `
    <div class="tablewrap"><table><thead><tr><th>Code</th><th>Brand</th><th>Type</th><th>Notes</th><th>Unhide</th></tr></thead><tbody id='h_rows'>
      ${rows.map(r=>`<tr data-id='${r.id}'><td>${r.code||''}</td><td>${r.brand||''}</td><td>${r.type||''}</td><td>${r.notes||''}</td><td><button class='btn mini h_unhide'>Unhide</button></td></tr>`).join('')}
    </tbody></table></div>`; wire(); }
  function wire(){ document.querySelectorAll('#h_rows .h_unhide').forEach(btn=>btn.addEventListener('click',()=>{ const id=parseInt(btn.closest('tr').getAttribute('data-id'),10); __rpc('set_flags',{ ids:[id], flags:{ hidden:false } }); })); }
  return { render };
})();
