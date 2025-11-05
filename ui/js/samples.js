window.Samples = (function(){
  const $=s=>document.querySelector(s);
  function render(){ const el=$('#tab-samples'); const rows=State.rows.filter(r=>r.sample&&!r.hidden); el.innerHTML = `
    <div class="tablewrap"><table><thead><tr><th>Code</th><th>Brand</th><th>Type</th><th>Notes</th><th>Received</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${r.code||''}</td><td>${r.brand||''}</td><td>${r.type||''}</td><td>${r.notes||''}</td><td>${r.sample_received?'Yes':'No'}</td></tr>`).join('')}
    </tbody></table></div>`; }
  return { render };
})();
