window.Samples = (function(){
  const $=s=>document.querySelector(s);
  function render(){
    const el=$('#tab-samples'); const rows=State.rows.filter(r=>r.sample&&!r.hidden);
    el.innerHTML = `
      <div class="toolbar flex items-center gap-3 mb-2"><div class="muted text-sm text-slate-600">${rows.length} samples</div></div>
      <div class="tablewrap"><table class="min-w-full text-sm">
        <thead>
          <tr>
            <th class="text-left font-semibold text-slate-600 bg-slate-50">Code</th>
            <th class="text-left font-semibold text-slate-600 bg-slate-50">Material Type</th>
            <th class="text-left font-semibold text-slate-600 bg-slate-50">Brand</th>
            <th class="text-left font-semibold text-slate-600 bg-slate-50">SKU Type</th>
            <th class="text-left font-semibold text-slate-600 bg-slate-50">Received</th>
          </tr>
        </thead>
        <tbody id='s_rows'>
          ${rows.map(r=>`
            <tr data-id='${r.id}'>
              <td>${r.code||''}</td>
              <td>${(State.kinds||{})[r.type]||r.type||''}</td>
              <td>${r.brand||''}</td>
              <td>${r.subtype||''}</td>
              <td><label class='inline-flex items-center gap-2'><input class='s_recv' type='checkbox' ${r.sample_received?'checked':''} ${r.locked?'disabled':''}/> <span>${r.sample_received?'Yes':'No'}</span></label></td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>`;
    wire();
  }
  function wire(){
    document.querySelectorAll('#s_rows tr').forEach(tr=>{
      const id=parseInt(tr.getAttribute('data-id'),10);
      const recv=tr.querySelector('.s_recv'); if(recv){ recv.addEventListener('change',()=>{ __rpc('set_flags',{ ids:[id], flags:{ sample_received: recv.checked } }); tr.querySelector('span').textContent = recv.checked ? 'Yes' : 'No'; }); }
    });
    // Removed "Need only" filter: rely on Received checkbox only
  }
  return { render };
})();
