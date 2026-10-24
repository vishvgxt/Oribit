(() => {
  const $ = (s) => document.querySelector(s);
  const storeKey = 'orbit-tasks-v1';
  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem(storeKey) || '[]'); if (!Array.isArray(tasks)) tasks = []; } catch { tasks = []; }
  let filter = 'all', query = '';
  const todayISO = new Date().toLocaleDateString('en-CA');
  $('#today').textContent = new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
  $('#dateInput').min = todayISO;
  const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(tasks)); } catch { toast('Could not save: device storage is full.'); } };
  let toastTimer;
  function toast(msg){ const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1900); }
  function safe(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function dateLabel(value){ if(!value)return ''; const d=new Date(value+'T12:00:00');return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
  function render(){
    const active=tasks.filter(t=>!t.done).length, done=tasks.length-active;
    $('#activeCount').textContent=active;$('#doneCount').textContent=done;$('#totalCount').textContent=tasks.length;
    $('#allNum').textContent=tasks.length;$('#activeNum').textContent=active;$('#doneNum').textContent=done;
    const pct=tasks.length?Math.round(done/tasks.length*100):0;$('#progressText').textContent=pct+'%';$('#progressFill').style.width=pct+'%';
    const shown=tasks.filter(t=>(filter==='all'||(filter==='active'&&!t.done)||(filter==='completed'&&t.done))&&t.title.toLowerCase().includes(query));
    $('#taskList').innerHTML=shown.map(t=>`<article class="task-item ${t.done?'completed':''}" data-id="${t.id}">
      <button class="check-btn" data-action="toggle" aria-label="${t.done?'Mark active':'Complete task'}" title="${t.done?'Mark active':'Complete task'}">${t.done?'✓':''}</button>
      <div class="task-copy"><div class="task-title">${safe(t.title)}</div><div class="task-meta"><span class="priority ${t.priority}">${t.priority[0].toUpperCase()+t.priority.slice(1)} priority</span>${t.due?`<span class="due ${!t.done&&t.due<todayISO?'overdue':''}">◷ ${t.due<todayISO&&!t.done?'Overdue · ':''}${dateLabel(t.due)}</span>`:''}</div></div>
      <div class="task-actions"><button class="action-btn" data-action="edit" aria-label="Edit task" title="Edit">✎</button><button class="action-btn" data-action="delete" aria-label="Delete task" title="Delete">×</button></div></article>`).join('');
    $('#emptyState').style.display=shown.length?'none':'block';
    if(window.gsap && shown.length){gsap.fromTo('.task-item:not(.animated)',{y:12,opacity:0,rotateX:-4},{y:0,opacity:1,rotateX:0,duration:.36,stagger:.045,ease:'power3.out',onComplete:()=>document.querySelectorAll('.task-item').forEach(el=>el.classList.add('animated'))});}
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
  }
  $('#taskForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#taskInput').value.trim();if(!title)return;tasks.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,priority:$('#priorityInput').value,due:$('#dateInput').value,done:false,created:Date.now()});save();render();$('#taskInput').value='';$('#dateInput').value='';$('#taskInput').focus();toast('Task added to your orbit ✳');if(window.gsap)gsap.fromTo('.stat-card',{y:5},{y:0,duration:.4,stagger:.06,ease:'back.out(2)'});});
  $('#taskList').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const row=b.closest('[data-id]');const t=tasks.find(x=>x.id===row.dataset.id);if(!t)return;const action=b.dataset.action;
    if(action==='toggle'){t.done=!t.done;if(window.gsap&&t.done)gsap.fromTo(row,{scale:1},{scale:.985,duration:.12,yoyo:true,repeat:1,ease:'power1.inOut'});toast(t.done?'One more win collected ✨':'Task back in motion');}
    if(action==='delete'){if(window.gsap)gsap.to(row,{x:25,opacity:0,height:0,marginBottom:0,paddingTop:0,paddingBottom:0,duration:.2,onComplete:()=>{tasks=tasks.filter(x=>x.id!==t.id);save();render();toast('Task removed');}});else{tasks=tasks.filter(x=>x.id!==t.id);save();render();}return;}
    if(action==='edit'){const next=prompt('Edit task title:',t.title);if(next===null)return;if(!next.trim()){toast('A task needs a title');return;}t.title=next.trim();toast('Task updated');}
    save();render();
  });
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;render();}));
  $('#searchInput').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
  $('#clearDone').addEventListener('click',()=>{const n=tasks.filter(t=>t.done).length;if(!n){toast('No completed tasks to clear');return;}tasks=tasks.filter(t=>!t.done);save();render();toast(`${n} completed task${n===1?'':'s'} cleared`);});
  $('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');const light=document.body.classList.contains('light');$('#themeBtn').textContent=light?'☾':'☼';try{localStorage.setItem('orbit-theme',light?'light':'dark');}catch{}});
  try{if(localStorage.getItem('orbit-theme')==='light'){document.body.classList.add('light');$('#themeBtn').textContent='☾';}}catch{}
  if(window.gsap){gsap.from('.hero .eyebrow',{y:12,opacity:0,duration:.6,delay:.08});gsap.from('.hero h1',{y:35,opacity:0,duration:.8,delay:.15,ease:'power3.out'});gsap.from('.subhead',{y:12,opacity:0,duration:.6,delay:.35});gsap.from('.stat-card',{y:30,opacity:0,rotateY:12,duration:.7,stagger:.12,delay:.35,ease:'power3.out'});gsap.from('.workspace',{y:28,opacity:0,duration:.8,delay:.55,ease:'power3.out'});}
  // Gentle pointer-driven 3D tilt on larger screens; disabled for touch/reduced-motion users.
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.stat-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;if(window.gsap)gsap.to(card,{rotateY:x*8,rotateX:-y*8,duration:.3,overwrite:true});});card.addEventListener('pointerleave',()=>{if(window.gsap)gsap.to(card,{rotateY:0,rotateX:0,duration:.5,ease:'power2.out'});});});
  }
  render();
})();