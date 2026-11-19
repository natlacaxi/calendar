'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const S={d:new Date(),view:LS('tc_view','month'),ev:LS('tc_ev',[]),tk:LS('tc_tk',[]),fired:LS('tc_fired',{}),showEv:true,showTk:true,type:'ev',edit:null,col:'#4f8cff'};
const save=()=>{localStorage.setItem('tc_ev',JSON.stringify(S.ev));localStorage.setItem('tc_tk',JSON.stringify(S.tk));localStorage.setItem('tc_fired',JSON.stringify(S.fired));localStorage.setItem('tc_view',S.view)};
const V=['month','week','day','agenda','tasks'],COL=['#4f8cff','#ea4335','#fbbc04','#34a853','#a142f4','#ff6d01','#00bcd4'];
const pad=n=>String(n).padStart(2,'0'),ds=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmt=(d,o)=>new Intl.DateTimeFormat('fr-FR',o).format(d);
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mon=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x};
const tm=t=>{const[h,m]=(t||'00:00').split(':').map(Number);return h*60+m};
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};

function on(e,k){const b=pd(e.date),x=pd(k);if(x<b)return false;const n=Math.round((x-b)/864e5);
 switch(e.repeat){case'daily':return true;case'weekly':return n%7===0;case'monthly':return x.getDate()===b.getDate();case'yearly':return x.getDate()===b.getDate()&&x.getMonth()===b.getMonth();default:return e.date===k}}
const evs=k=>S.showEv?S.ev.filter(e=>on(e,k)).sort((a,b)=>(a.allDay?'':a.start).localeCompare(b.allDay?'':b.start)):[];
const tks=k=>S.showTk?S.tk.filter(t=>t.date===k):[];
const chip=e=>`<span class="ch" data-id="${e.id}" style="--c:${e.color}">${e.allDay?'':e.start+' '}${esc(e.title)}</span>`;
const tchip=t=>`<span class="ch tk" data-tid="${t.id}" style="--c:#34a853">${t.done?'✔':'○'} ${esc(t.title)}</span>`;

function title(){const d=S.d;if(S.view==='month'||S.view==='agenda'||S.view==='tasks')return fmt(d,{month:'long',year:'numeric'});
 if(S.view==='day')return fmt(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const a=mon(d),b=addD(a,6);return fmt(a,{day:'numeric',month:'short'})+' – '+fmt(b,{day:'numeric',month:'short',year:'numeric'})}

function render(){
 $('#title').textContent=title();
 $$('.dock button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));movePill();
 const v=$('#view');v.className=S.view;
 ({month:month,week:v=>grid(v,7),day:v=>grid(v,1),agenda:agenda,tasks:tasks})[S.view](v);mini();save();
}
function bindChips(v){$$('[data-id]',v).forEach(c=>c.onclick=e=>{e.stopPropagation();openM(S.ev.find(x=>x.id===c.dataset.id),c.closest('[data-d]')?.dataset.d)});
 $$('[data-tid]',v).forEach(c=>c.onclick=e=>{e.stopPropagation();const t=S.tk.find(x=>x.id===c.dataset.tid);t.done=!t.done;render()})}

function month(v){const f=mon(new Date(S.d.getFullYear(),S.d.getMonth(),1)),td=ds(new Date());
 let h='<div class="dow">'+[...Array(7)].map((_,i)=>`<span>${fmt(addD(f,i),{weekday:'short'})}</span>`).join('')+'</div><div class="mg">';
 for(let i=0;i<42;i++){const d=addD(f,i),k=ds(d),l=[...evs(k).map(chip),...tks(k).map(tchip)];
  h+=`<div class="c${d.getMonth()!==S.d.getMonth()?' o':''}${k===td?' t':''}" data-d="${k}"><b data-go="${k}">${d.getDate()}</b>${l.slice(0,3).join('')}${l.length>3?`<i>+${l.length-3} autres</i>`:''}</div>`}
 v.innerHTML=h+'</div>';
 $$('.c',v).forEach(c=>c.onclick=()=>openM(null,c.dataset.d));
 $$('[data-go]',v).forEach(b=>b.onclick=e=>{e.stopPropagation();S.d=pd(b.dataset.go);S.view='day';render()});bindChips(v)}

function grid(v,n){const s=n===1?new Date(S.d):mon(S.d),td=ds(new Date());
 let h=`<div class="tg${n===1?' d1':''}"><div class="hd"><span></span>`+[...Array(n)].map((_,i)=>{const d=addD(s,i);return`<div class="${ds(d)===td?'t':''}"><small>${fmt(d,{weekday:'short'})}</small><b>${d.getDate()}</b></div>`}).join('')+'</div><div class="bd"><div class="hrs">'+[...Array(24)].map((_,i)=>`<span>${i?pad(i)+':00':''}</span>`).join('')+'</div>';
 for(let i=0;i<n;i++){const k=ds(addD(s,i));
  h+=`<div class="col" data-d="${k}">`+'<u></u>'.repeat(24)+evs(k).map(e=>{const a=e.allDay?0:tm(e.start),b=e.allDay?1440:Math.max(tm(e.end),a+30);return`<span class="ev" data-id="${e.id}" style="--c:${e.color};top:${a/60*50}px;height:${(b-a)/60*50-2}px${e.allDay?';opacity:.45':''}"><b>${esc(e.title)}</b>${e.allDay?'Toute la journée':e.start+' – '+e.end}</span>`}).join('')
  +tks(k).map(t=>`<span class="ev" data-tid="${t.id}" style="--c:#34a853;top:${tm(t.time)/60*50}px;height:28px">${t.done?'✔':'○'} ${esc(t.title)}</span>`).join('')+(k===td?`<em class="now" style="top:${nowMin()/60*50}px"></em>`:'')+'</div>'}
 v.innerHTML=h+'</div></div>';
 $$('.col',v).forEach(c=>c.onclick=e=>{const y=e.clientY-c.getBoundingClientRect().top,hh=Math.floor(y/50);openM(null,c.dataset.d,pad(hh)+':00')});
 bindChips(v);v.scrollTop=7*50}

function agenda(v){let h='<div class="list">';let any=false;
 for(let i=0;i<90;i++){const k=ds(addD(S.d,i)),l=evs(k),t=tks(k);if(!l.length&&!t.length)continue;any=true;
  h+=`<h3>${fmt(pd(k),{weekday:'long',day:'numeric',month:'long'})}</h3>`+l.map(e=>`<div class="it" data-id="${e.id}" data-d="${k}" style="--c:${e.color}"><div><span>${esc(e.title)}</span><small>${e.allDay?'Toute la journée':e.start+' – '+e.end}${e.loc?' · '+esc(e.loc):''}</small></div></div>`).join('')+t.map(x=>`<div class="it ${x.done?'done':''}" data-tid="${x.id}" style="--c:#34a853"><div><span>${esc(x.title)}</span><small>Tâche · ${x.time}</small></div></div>`).join('')}
 v.innerHTML=h+(any?'':'<p style="text-align:center;color:var(--mu)">Rien de prévu pour les 90 prochains jours.</p>')+'</div>';bindChips(v)}

function tasks(v){const l=[...S.tk].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 v.innerHTML=`<div class="list"><form class="addtk" id="tkf"><input id="tkn" placeholder="Ajouter une tâche…" required><button class="primary" style="border-radius:14px;padding:0 18px">Ajouter</button></form>`+l.map(t=>`<div class="it ${t.done?'done':''}" style="--c:#34a853"><input type="checkbox" data-c="${t.id}" ${t.done?'checked':''}><div data-e="${t.id}" style="flex:1"><span>${esc(t.title)}</span><small>${fmt(pd(t.date),{weekday:'short',day:'numeric',month:'short'})} · ${t.time}</small></div><button data-x="${t.id}" class="ib">✕</button></div>`).join('')+'</div>';
 $('#tkf').onsubmit=e=>{e.preventDefault();S.tk.push({id:uid(),title:$('#tkn').value,date:ds(new Date()),time:'18:00',done:false,notify:0});render()};
 $$('[data-c]',v).forEach(c=>c.onchange=()=>{S.tk.find(t=>t.id===c.dataset.c).done=c.checked;render()});
 $$('[data-x]',v).forEach(b=>b.onclick=()=>{S.tk=S.tk.filter(t=>t.id!==b.dataset.x);render()});
 $$('[data-e]',v).forEach(b=>b.onclick=()=>openM(S.tk.find(t=>t.id===b.dataset.e)))}

function mini(){const m=$('#mini');if(!m)return;const f=mon(new Date(S.d.getFullYear(),S.d.getMonth(),1)),td=ds(new Date()),sd=ds(S.d);
 m.innerHTML=`<div class="mh"><button data-m="-1">‹</button>${fmt(S.d,{month:'long',year:'numeric'})}<button data-m="1">›</button></div><div class="g">`+[...Array(7)].map((_,i)=>`<b style="color:var(--mu)">${fmt(addD(f,i),{weekday:'narrow'})}</b>`).join('')+[...Array(42)].map((_,i)=>{const d=addD(f,i),k=ds(d);return`<span data-k="${k}" class="${d.getMonth()!==S.d.getMonth()?'o ':''}${k===td?'t ':''}${k===sd?'s':''}">${d.getDate()}</span>`}).join('')+'</div>';
 $$('[data-m]',m).forEach(b=>b.onclick=()=>{S.d=new Date(S.d.getFullYear(),S.d.getMonth()+ +b.dataset.m,1);render()});
 $$('[data-k]',m).forEach(s=>s.onclick=()=>{S.d=pd(s.dataset.k);render()})}

/* ---- navigation ---- */
function step(n){const d=new Date(S.d);if(S.view==='week')d.setDate(d.getDate()+7*n);else if(S.view==='day')d.setDate(d.getDate()+n);else d.setMonth(d.getMonth()+n,1);S.d=d;render()}
$('#prev').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#today').onclick=()=>{S.d=new Date();render()};
$('#theme').onclick=()=>{const r=document.documentElement,c=r.dataset.th==='dark'?'light':'dark';r.dataset.th=c;localStorage.setItem('tc_th',c)};
if(localStorage.tc_th)document.documentElement.dataset.th=localStorage.tc_th;
$('#showEv').onchange=e=>{S.showEv=e.target.checked;render()};$('#showTk').onchange=e=>{S.showTk=e.target.checked;render()};
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;const k=e.key.toLowerCase();
 if(k==='m')S.view='month';else if(k==='w')S.view='week';else if(k==='d')S.view='day';else if(k==='a')S.view='agenda';else if(k==='t')S.d=new Date();else if(k==='c')return openM();else if(e.key==='ArrowLeft')return step(-1);else if(e.key==='ArrowRight')return step(1);else return;render()});

/* ---- barre liquid glass glissante ---- */
const dock=$('#dock'),pill=$('.pill');
function movePill(){pill.style.transform=`translateX(${V.indexOf(S.view)*100}%)`}
function idxAt(x){const r=dock.getBoundingClientRect(),w=(r.width-12)/5;return{i:Math.max(0,Math.min(4,Math.floor((x-r.left-6)/w))),w,r}}
let drag=false;
dock.addEventListener('pointerdown',e=>{drag=true;dock.setPointerCapture(e.pointerId);dock.classList.add('drag');mv(e)});
dock.addEventListener('pointermove',e=>{if(drag)mv(e)});
function mv(e){const{w,r}=idxAt(e.clientX);const x=Math.max(0,Math.min(4*w,e.clientX-r.left-6-w/2));pill.style.transform=`translateX(${x/w*100}%)`}
dock.addEventListener('pointerup',e=>{if(!drag)return;drag=false;dock.classList.remove('drag');const{i}=idxAt(e.clientX);S.view=V[i];if(navigator.vibrate)navigator.vibrate(8);render()});
dock.addEventListener('pointercancel',()=>{drag=false;dock.classList.remove('drag');movePill()});

/* ---- modal ---- */
const dlg=$('#dlg');
$('#fCol').innerHTML=COL.map(c=>`<span data-c="${c}" style="--c:${c}"></span>`).join('');
$$('#fCol span').forEach(s=>s.onclick=()=>setCol(s.dataset.c));
const setCol=c=>{S.col=c;$$('#fCol span').forEach(s=>s.classList.toggle('on',s.dataset.c===c))};
const setType=t=>{S.type=t;$$('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.onlyEv').forEach(x=>x.style.display=t==='ev'?'':'none')};
$$('.tabs button').forEach(b=>b.onclick=()=>setType(b.dataset.t));
$('#fAll').onchange=e=>{$('#fStart').disabled=$('#fEnd').disabled=e.target.checked};
function openM(o,date,start){S.edit=o||null;const isT=o&&!('start' in o);setType(isT?'tk':'ev');
 $('#fTitle').value=o?.title||'';$('#fDate').value=o?.date||date||ds(S.d);
 $('#fStart').value=o?.start||o?.time||start||'09:00';
 $('#fEnd').value=o?.end||(start?pad(Math.min(23,+start.slice(0,2)+1))+start.slice(2):'10:00');
 $('#fAll').checked=!!o?.allDay;$('#fAll').onchange({target:$('#fAll')});
 $('#fRep').value=o?.repeat||'none';$('#fNot').value=String(o?.notify??10);$('#fLoc').value=o?.loc||'';$('#fDesc').value=o?.desc||'';
 setCol(o?.color||'#4f8cff');$('#del').style.visibility=o?'visible':'hidden';dlg.showModal();$('#fTitle').focus()}
$('#create').onclick=$('#fab').onclick=()=>openM();
$('#cancel').onclick=()=>dlg.close();
$('#del').onclick=()=>{if(S.edit){S.ev=S.ev.filter(e=>e!==S.edit);S.tk=S.tk.filter(t=>t!==S.edit)}dlg.close();render()};
$('#f').onsubmit=async e=>{e.preventDefault();const n=+$('#fNot').value,base={id:S.edit?.id||uid(),title:$('#fTitle').value.trim(),date:$('#fDate').value};
 if(S.edit){S.ev=S.ev.filter(x=>x!==S.edit);S.tk=S.tk.filter(x=>x!==S.edit)}
 if(S.type==='ev'){const o={...base,start:$('#fStart').value,end:$('#fEnd').value,allDay:$('#fAll').checked,repeat:$('#fRep').value,notify:n,loc:$('#fLoc').value,desc:$('#fDesc').value,color:S.col};
  if(o.allDay){o.start='00:00';o.end='23:59'}S.ev.push(o);bridge(o)}
 else{const o={...base,time:$('#fStart').value,done:S.edit?.done||false,notify:0};S.tk.push(o)}
 dlg.close();S.d=pd(base.date);if(n>=0||S.type==='tk')await perm();render()};

/* ---- notifications ---- */
async function perm(){if('Notification'in window&&Notification.permission==='default')try{await Notification.requestPermission()}catch{}}
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),5000)}
function notify(title,body){toast('🔔 '+title+' — '+body);
 if('Notification'in window&&Notification.permission==='granted'){const o={body,icon:'icon.svg',badge:'icon.svg',vibrate:[200,100,200],tag:title+body};
  (navigator.serviceWorker?.ready||Promise.reject()).then(r=>r.showNotification(title,o)).catch(()=>new Notification(title,o))}}
function bridge(o){try{window.TalcoAndroid?.schedule(o.id,o.title,o.loc||o.date,pd(o.date).getTime()+tm(o.start)*6e4-Math.max(o.notify,0)*6e4)}catch{}}
function tick(){const now=Date.now();
 for(let o=-1;o<=1;o++){const k=ds(addD(new Date(),o));
  S.ev.filter(e=>e.notify>=0&&on(e,k)).forEach(e=>{const at=pd(k).getTime()+tm(e.allDay?'09:00':e.start)*6e4,fire=at-e.notify*6e4,key=e.id+k;
   if(now>=fire&&now-fire<6*36e5&&!S.fired[key]){S.fired[key]=1;notify(e.title,e.allDay?'Aujourd’hui':(e.notify?`Dans ${e.notify>=60?e.notify/60+' h':e.notify+' min'} · `:'Maintenant · ')+e.start+(e.loc?' · '+e.loc:''))}});
  S.tk.filter(t=>!t.done&&t.date===k).forEach(t=>{const at=pd(k).getTime()+tm(t.time)*6e4,key='t'+t.id;if(now>=at&&now-at<6*36e5&&!S.fired[key]){S.fired[key]=1;notify('Tâche : '+t.title,'À faire maintenant')}})}
 const keep=Date.now()-7*864e5;localStorage.setItem('tc_fired',JSON.stringify(S.fired));
 if($('#view.month,#view.week,#view.day'))$$('.now').forEach(n=>n.style.top=nowMin()/60*50+'px')}
setInterval(tick,20000);setTimeout(tick,1500);
document.addEventListener('visibilitychange',()=>!document.hidden&&tick());

if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
if(innerWidth<700&&!localStorage.tc_view)S.view='day';
render();if(new URLSearchParams(location.search).has('new'))openM();
