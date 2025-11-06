window.Samples = (function(){
  const $=s=>document.querySelector(s);
  function render(){
    const el=$('#tab-samples'); const rows=State.rows.filter(r=>r.sample&&!r.hidden);
    el.innerHTML = `
      <div class="toolbar"><div class="muted">${rows.length} samples</div><label style='display:flex;align-items:center;gap:6px;margin-left:auto'><input id='s_need_only' type='checkbox'/> Need only</label></div>
      <div class="tablewrap"><table>
        <thead><tr><th>Code</th><th>Brand</th><th>Material Type</th><th>Sample Notes</th><th>Received</th></tr></thead>
        <tbody id='s_rows'>
          ${rows.map(r=>`
            <tr data-id='${r.id}'>
              <td>${r.code||''}</td>
              <td>${r.brand||''}</td>
              <td>${(State.kinds||{})[r.type]||r.type||''}</td>
              <td><input class='s_notes inp' type='text' value='${r.sample_notes||''}' ${r.locked?'disabled':''}></td>
              <td><label style='display:flex;align-items:center;gap:6px'><input class='s_recv' type='checkbox' ${r.sample_received?'checked':''} ${r.locked?'disabled':''}/> <span>${r.sample_received?'Yes':'No'}</span></label></td>
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
