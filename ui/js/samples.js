window.Samples = (function(){
  const $=s=>document.querySelector(s);
  function render(){
    const el=$('#tab-samples'); const rows=State.rows.filter(r=>r.sample&&!r.hidden);
    el.innerHTML = `
      <div class="toolbar flex items-center gap-3 mb-2"><div class="muted text-sm text-slate-600">${rows.length} samples</div><label class='ml-auto inline-flex items-center gap-2 text-sm text-slate-700'><input id='s_need_only' type='checkbox'/> Need only</label></div>
      <div class="tablewrap"><table class="min-w-full text-sm">
        <thead><tr><th class="text-left font-semibold text-slate-600 bg-slate-50">Code</th><th class="text-left font-semibold text-slate-600 bg-slate-50">Brand</th><th class="text-left font-semibold text-slate-600 bg-slate-50">Material Type</th><th class="text-left font-semibold text-slate-600 bg-slate-50">Sample Notes</th><th class="text-left font-semibold text-slate-600 bg-slate-50">Received</th></tr></thead>
        <tbody id='s_rows'>
          ${rows.map(r=>`
            <tr data-id='${r.id}'>
              <td>${r.code||''}</td>
              <td>${r.brand||''}</td>
              <td>${(State.kinds||{})[r.type]||r.type||''}</td>
              <td><input class='s_notes inp rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 px-2 py-1 text-sm' type='text' value='${r.sample_notes||''}' ${r.locked?'disabled':''}></td>
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
      const notes=tr.querySelector('.s_notes'); if(notes){ notes.addEventListener('change',()=>{ __rpc('set_flags',{ ids:[id], flags:{ sample_notes: notes.value } }); }); notes.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); __rpc('set_flags',{ ids:[id], flags:{ sample_notes: notes.value } }); } }); }
      const recv=tr.querySelector('.s_recv'); if(recv){ recv.addEventListener('change',()=>{ __rpc('set_flags',{ ids:[id], flags:{ sample_received: recv.checked } }); tr.querySelector('span').textContent = recv.checked ? 'Yes' : 'No'; }); }
    });
    const chk=document.getElementById('s_need_only'); if(chk){ chk.addEventListener('change',()=>{ const v=chk.checked; const rows=Array.from(document.querySelectorAll('#s_rows tr')); rows.forEach(tr=>{ const isYes = tr.querySelector('.s_recv').checked; tr.style.display = (v && isYes) ? 'none' : ''; }); }); }
  }
  return { render };
})();
