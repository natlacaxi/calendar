'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const DEF={th:'auto',bgp:'aurore',ac:'#4f8cff',bl:24,ga:1,rd:1,fs:1,dk:1,lab:true,anim:true,sp:1,dens:'comfort',view:'last',ws:1,h24:true,hh:50,scr:7,wn:false,we:true,now:true,maxc:3,dur:60,not:10,col:'#4f8cff',tkt:'18:00',nt:true,snd:true,vib:true};
const S={cfg:{...DEF,...LS('tc_cfg',{})},d:new Date(),view:LS('tc_view','month'),ev:LS('tc_ev',[]),tk:LS('tc_tk',[]),fired:LS('tc_fired',{}),q:'',showEv:true,showTk:true,type:'ev',edit:null,col:'#4f8cff'};
const save=()=>{localStorage.setItem('tc_cfg',JSON.stringify(S.cfg));localStorage.setItem('tc_ev',JSON.stringify(S.ev));localStorage.setItem('tc_tk',JSON.stringify(S.tk));localStorage.setItem('tc_fired',JSON.stringify(S.fired));localStorage.setItem('tc_view',JSON.stringify(S.view))};
const V=['month','week','day','agenda','tasks'],COL=['#4f8cff','#ea4335','#fbbc04','#34a853','#a142f4','#ff6d01','#00bcd4'];
const pad=n=>String(n).padStart(2,'0'),ds=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmt=(d,o)=>new Intl.DateTimeFormat('fr-FR',o).format(d);
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mon=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()-S.cfg.ws+7)%7));x.setHours(0,0,0,0);return x};
const tm=t=>{const[h,m]=(t||'00:00').split(':').map(Number);return h*60+m};
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T=t=>{if(S.cfg.h24)return t;const[h,m]=t.split(':').map(Number);return(h%12||12)+(m?':'+pad(m):'')+(h<12?' AM':' PM')};
const addMin=(t,m)=>{const x=Math.min(1439,tm(t)+m);return pad(Math.floor(x/60))+':'+pad(x%60)};
const isoW=d=>{const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};

function on(e,k){const b=pd(e.date),x=pd(k);if(x<b)return false;const n=Math.round((x-b)/864e5);
 switch(e.repeat){case'daily':return true;case'weekly':return n%7===0;case'monthly':return x.getDate()===b.getDate();case'yearly':return x.getDate()===b.getDate()&&x.getMonth()===b.getMonth();default:return e.date===k}}
const evs=k=>S.showEv?S.ev.filter(e=>on(e,k)).sort((a,b)=>(a.allDay?'':a.start).localeCompare(b.allDay?'':b.start)):[];
const tks=k=>S.showTk?S.tk.filter(t=>t.date===k):[];
const chip=e=>`<span class="ch" data-id="${e.id}" style="--c:${e.color}">${e.allDay?'':T(e.start)+' '}${esc(e.title)}</span>`;
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
  h+=`<div class="c${d.getMonth()!==S.d.getMonth()?' o':''}${k===td?' t':''}${d.getDay()%6===0?' we':''}" data-d="${k}">${S.cfg.wn&&i%7===0?`<em class="wk">S${isoW(d)}</em>`:''}<b data-go="${k}">${d.getDate()}</b>${l.slice(0,S.cfg.maxc).join('')}${l.length>S.cfg.maxc?`<i>+${l.length-S.cfg.maxc} autres</i>`:''}</div>`}
 v.innerHTML=h+'</div>';
 $$('.c',v).forEach(c=>c.onclick=()=>openM(null,c.dataset.d));
 $$('[data-go]',v).forEach(b=>b.onclick=e=>{e.stopPropagation();S.d=pd(b.dataset.go);S.view='day';render()});bindChips(v)}

function grid(v,n){const s=n===1?new Date(S.d):mon(S.d),td=ds(new Date());
 let h=`<div class="tg${n===1?' d1':''}"><div class="hd"><span></span>`+[...Array(n)].map((_,i)=>{const d=addD(s,i);return`<div class="${ds(d)===td?'t':''}"><small>${fmt(d,{weekday:'short'})}</small><b>${d.getDate()}</b></div>`}).join('')+'</div><div class="bd"><div class="hrs">'+[...Array(24)].map((_,i)=>`<span>${i?T(pad(i)+':00'):''}</span>`).join('')+'</div>';
 for(let i=0;i<n;i++){const k=ds(addD(s,i));
  h+=`<div class="col" data-d="${k}">`+'<u></u>'.repeat(24)+evs(k).map(e=>{const a=e.allDay?0:tm(e.start),b=e.allDay?1440:Math.max(tm(e.end),a+30);return`<span class="ev" data-id="${e.id}" style="--c:${e.color};top:${a/60*S.cfg.hh}px;height:${(b-a)/60*S.cfg.hh-2}px${e.allDay?';opacity:.45':''}"><b>${esc(e.title)}</b>${e.allDay?'Toute la journée':T(e.start)+' – '+T(e.end)}</span>`}).join('')
  +tks(k).map(t=>`<span class="ev" data-tid="${t.id}" style="--c:#34a853;top:${tm(t.time)/60*S.cfg.hh}px;height:28px">${t.done?'✔':'○'} ${esc(t.title)}</span>`).join('')+(k===td?`<em class="now" style="top:${nowMin()/60*S.cfg.hh}px"></em>`:'')+'</div>'}
 v.innerHTML=h+'</div></div>';
 $$('.col',v).forEach(c=>c.onclick=e=>{const y=e.clientY-c.getBoundingClientRect().top,hh=Math.floor(y/S.cfg.hh);openM(null,c.dataset.d,pad(hh)+':00')});
 bindChips(v);v.scrollTop=S.cfg.scr*S.cfg.hh}

function agenda(v){let h='<div class="list">';let any=false;
 const m=x=>!S.q||x.title.toLowerCase().includes(S.q);for(let i=0;i<(S.q?365:90);i++){const k=ds(addD(S.d,i)),l=evs(k).filter(m),t=tks(k).filter(m);if(!l.length&&!t.length)continue;any=true;
  h+=`<h3>${fmt(pd(k),{weekday:'long',day:'numeric',month:'long'})}</h3>`+l.map(e=>`<div class="it" data-id="${e.id}" data-d="${k}" style="--c:${e.color}"><div><span>${esc(e.title)}</span><small>${e.allDay?'Toute la journée':T(e.start)+' – '+T(e.end)}${e.loc?' · '+esc(e.loc):''}</small></div></div>`).join('')+t.map(x=>`<div class="it ${x.done?'done':''}" data-tid="${x.id}" style="--c:#34a853"><div><span>${esc(x.title)}</span><small>Tâche · ${T(x.time)}</small></div></div>`).join('')}
 v.innerHTML=h+(any?'':'<p style="text-align:center;color:var(--mu)">Rien de prévu pour les 90 prochains jours.</p>')+'</div>';bindChips(v)}

function tasks(v){const l=[...S.tk].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 v.innerHTML=`<div class="list"><form class="addtk" id="tkf"><input id="tkn" placeholder="Ajouter une tâche…" required><button class="primary" style="border-radius:14px;padding:0 18px">Ajouter</button></form>`+l.map(t=>`<div class="it ${t.done?'done':''}" style="--c:#34a853"><input type="checkbox" data-c="${t.id}" ${t.done?'checked':''}><div data-e="${t.id}" style="flex:1"><span>${esc(t.title)}</span><small>${fmt(pd(t.date),{weekday:'short',day:'numeric',month:'short'})} · ${T(t.time)}</small></div><button data-x="${t.id}" class="ib">✕</button></div>`).join('')+'</div>';
 $('#tkf').onsubmit=e=>{e.preventDefault();S.tk.push({id:uid(),title:$('#tkn').value,date:ds(new Date()),time:S.cfg.tkt,done:false,notify:0});render()};
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

$$('.dock button').forEach(b=>b.onclick=()=>{S.view=b.dataset.v;render()});
$('#q').oninput=e=>{S.q=e.target.value.trim().toLowerCase();S.view=S.q?'agenda':S.view;render()};
const bell=$('#bell'),bs=()=>bell.classList.toggle('on','Notification'in window&&Notification.permission==='granted');
bell.onclick=async()=>{if(!('Notification'in window))return toast('Notifications non supportées ici (sur iPhone : ajoute le site à l’écran d’accueil)');
 const p=await Notification.requestPermission();bs();p==='granted'?notify('TalcoCalendar','Les notifications fonctionnent ✔'):toast('Notifications bloquées : autorise-les dans les réglages du navigateur')};bs();
/* ---- barre liquid glass glissante ---- */
const dock=$('#dock'),pill=$('.pill');
function movePill(){pill.style.transform=`translateX(${V.indexOf(S.view)*100}%)`}
function idxAt(x){const r=dock.getBoundingClientRect(),w=(r.width-12)/5;return{i:Math.max(0,Math.min(4,Math.floor((x-r.left-6)/w))),w,r}}
let drag=false;
dock.addEventListener('pointerdown',e=>{drag=true;dock.setPointerCapture(e.pointerId);dock.classList.add('drag');mv(e)});
dock.addEventListener('pointermove',e=>{if(drag)mv(e)});
function mv(e){const{w,r}=idxAt(e.clientX);const x=Math.max(0,Math.min(4*w,e.clientX-r.left-6-w/2));pill.style.transform=`translateX(${x/w*100}%)`}
dock.addEventListener('pointerup',e=>{if(!drag)return;drag=false;dock.classList.remove('drag');const{i}=idxAt(e.clientX);S.view=V[i];if(S.cfg.vib&&navigator.vibrate)navigator.vibrate(8);render()});
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
 $('#fEnd').value=o?.end||addMin($('#fStart').value,S.cfg.dur);
 $('#fAll').checked=!!o?.allDay;$('#fAll').onchange({target:$('#fAll')});
 $('#fRep').value=o?.repeat||'none';$('#fNot').value=String(o?.notify??S.cfg.not);$('#fLoc').value=o?.loc||'';$('#fDesc').value=o?.desc||'';
 setCol(o?.color||S.cfg.col);$('#del').style.visibility=o?'visible':'hidden';dlg.showModal();$('#fTitle').focus()}
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
function beep(){try{const a=new(window.AudioContext||webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.6);o.start();o.stop(a.currentTime+.6)}catch{}}
function notify(title,body){if(S.cfg.snd)beep();if(S.cfg.vib&&navigator.vibrate)navigator.vibrate([200,100,200]);toast('🔔 '+title+' — '+body);
 if('Notification'in window&&Notification.permission==='granted'){const o={silent:!S.cfg.snd,body,icon:'icon.svg',badge:'icon.svg',vibrate:[200,100,200],tag:title+body};
  (navigator.serviceWorker?.ready||Promise.reject()).then(r=>r.showNotification(title,o)).catch(()=>new Notification(title,o))}}
function bridge(o){try{window.TalcoAndroid?.schedule(o.id,o.title,o.loc||o.date,pd(o.date).getTime()+tm(o.start)*6e4-Math.max(o.notify,0)*6e4)}catch{}}
function tick(){if(!S.cfg.nt)return;const now=Date.now();
 for(let o=-1;o<=1;o++){const k=ds(addD(new Date(),o));
  S.ev.filter(e=>e.notify>=0&&on(e,k)).forEach(e=>{const at=pd(k).getTime()+tm(e.allDay?'09:00':e.start)*6e4,fire=at-e.notify*6e4,key=e.id+k;
   if(now>=fire&&now-fire<6*36e5&&!S.fired[key]){S.fired[key]=1;notify(e.title,e.allDay?'Aujourd’hui':(e.notify?`Dans ${e.notify>=60?e.notify/60+' h':e.notify+' min'} · `:'Maintenant · ')+T(e.start)+(e.loc?' · '+e.loc:''))}});
  S.tk.filter(t=>!t.done&&t.date===k).forEach(t=>{const at=pd(k).getTime()+tm(t.time)*6e4,key='t'+t.id;if(now>=at&&now-at<6*36e5&&!S.fired[key]){S.fired[key]=1;notify('Tâche : '+t.title,'À faire maintenant')}})}
 const keep=Date.now()-7*864e5;localStorage.setItem('tc_fired',JSON.stringify(S.fired));
 if($('#view.month,#view.week,#view.day'))$$('.now').forEach(n=>n.style.top=nowMin()/60*S.cfg.hh+'px')}
setInterval(tick,20000);setTimeout(tick,1500);
document.addEventListener('visibilitychange',()=>!document.hidden&&tick());

if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ================= RÉGLAGES ================= */
const P={ocean:{l:['#c9f0ff','#d6e4ff','#d3fff3'],d:['#031826','#06284a','#053b3a'],k:['#0ea5e9','#6366f1','#14b8a6','#22d3ee']},sunset:{l:['#ffe1c7','#ffd0dc','#e8d2ff'],d:['#2a0e14','#4a1230','#2b1250'],k:['#f97316','#ec4899','#a855f7','#facc15']},forest:{l:['#d8f5d0','#e6f7c8','#cdeedd'],d:['#06140c','#0d2a18','#0f2f2a'],k:['#22c55e','#84cc16','#10b981','#14b8a6']},mono:{l:['#eceef3','#e1e4ec','#f4f5f8'],d:['#0b0c10','#15171e','#1c1e27'],k:['#64748b','#94a3b8','#475569','#cbd5e1']}};
const mq=window.matchMedia?matchMedia('(prefers-color-scheme:dark)'):{matches:false};
function applyCfg(){const c=S.cfg,r=document.documentElement,st=r.style;
 if(c.th==='auto')delete r.dataset.th;else r.dataset.th=c.th;
 const dark=c.th==='dark'||(c.th==='auto'&&mq.matches),p=P[c.bgp];
 ['--b1','--b2','--b3'].forEach((v,i)=>p?st.setProperty(v,p[dark?'d':'l'][i]):st.removeProperty(v));
 (p?.k||['#3b82f6','#a855f7','#ff5f9e','#22d3ee']).forEach((k,i)=>st.setProperty('--k'+(i+1),k));
 st.setProperty('--ac',c.ac);st.setProperty('--ac2',`color-mix(in srgb,${c.ac},#a855f7 55%)`);st.setProperty('--ac3',`color-mix(in srgb,${c.ac},#ff5f9e 70%)`);
 st.setProperty('--bl',c.bl+'px');st.setProperty('--ga',c.ga);st.setProperty('--rd',c.rd);st.setProperty('--fs',c.fs);st.setProperty('--dk',c.dk);st.setProperty('--sp',c.sp);st.setProperty('--hh',c.hh+'px');
 r.dataset.dens=c.dens;r.dataset.anim=c.anim?'on':'off';r.dataset.lab=c.lab?'on':'off';r.dataset.we=c.we?'on':'off';r.dataset.now=c.now?'on':'off';
 const m=$('meta[name=theme-color]');if(m)m.content=c.ac}
mq.addEventListener&&mq.addEventListener('change',applyCfg);
const SCH=[['Apparence',[['th','Thème','sel',[['auto','Automatique'],['light','Clair'],['dark','Sombre']]],['bgp','Ambiance du fond','sel',[['aurore','Aurore'],['ocean','Océan'],['sunset','Coucher de soleil'],['forest','Forêt'],['mono','Monochrome']]],['ac','Couleur d’accent','col'],['bl','Flou du verre','rng',0,60,1],['ga','Opacité du verre','rng',.2,1,.05],['rd','Arrondi des coins','rng',.2,1.6,.1],['fs','Taille du texte','rng',.8,1.4,.05],['dk','Taille de la barre du bas','rng',.8,1.3,.05],['lab','Libellés de la barre','chk'],['anim','Fond animé','chk'],['sp','Vitesse du fond','rng',.2,3,.1],['dens','Densité','sel',[['comfort','Confortable'],['compact','Compacte']]]]],
['Calendrier',[['view','Vue au démarrage','sel',[['last','Dernière utilisée'],['month','Mois'],['week','Semaine'],['day','Jour'],['agenda','Agenda'],['tasks','Tâches']]],['ws','Premier jour de la semaine','sel',[['1','Lundi'],['0','Dimanche'],['6','Samedi']]],['h24','Format 24 heures','chk'],['hh','Hauteur d’une heure (px)','rng',30,110,5],['scr','Défiler vers (heure)','rng',0,16,1],['wn','Numéros de semaine','chk'],['we','Marquer les week-ends','chk'],['now','Ligne « maintenant »','chk'],['maxc','Événements visibles par jour (Mois)','rng',1,6,1]]],
['Nouveaux événements',[['dur','Durée par défaut (min)','rng',15,240,15],['not','Rappel par défaut','sel',[['-1','Aucun'],['0','À l’heure'],['5','5 min'],['10','10 min'],['30','30 min'],['60','1 h'],['1440','1 jour']]],['col','Couleur par défaut','col'],['tkt','Heure des tâches','time']]],
['Notifications',[['nt','Activer les rappels','chk'],['snd','Sons','chk'],['vib','Vibrations','chk']]]];
const cd=document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'cfgDlg',className:'modal cfg'}));
function cfgUI(){cd.innerHTML='<h3>Réglages</h3>'+SCH.map(([t,f])=>`<h4>${t}</h4>`+f.map(([k,l,ty,a,b,st])=>{const v=S.cfg[k];let c;
 if(ty==='sel')c=`<select data-k="${k}">${a.map(([o,n])=>`<option value="${o}"${String(v)===o?' selected':''}>${n}</option>`).join('')}</select>`;
 else if(ty==='rng')c=`<input type="range" data-k="${k}" min="${a}" max="${b}" step="${st}" value="${v}"><output>${v}</output>`;
 else if(ty==='chk')c=`<input type="checkbox" class="sw" data-k="${k}"${v?' checked':''}>`;
 else c=`<input type="${ty==='col'?'color':'time'}" data-k="${k}" value="${v}">`;
 return`<div class="fld"><span>${l}</span><span class="ctl">${c}</span></div>`}).join('')).join('')+
 `<h4>Notifications &amp; données</h4><div class="btns"><button data-a="test">🔔 Tester</button><button data-a="json">⬇ Sauvegarde</button><button data-a="ics">📅 Export .ics</button><button data-a="imp">⬆ Importer</button><button data-a="rst">↺ Réinitialiser les réglages</button><button data-a="clr" class="danger">🗑 Tout effacer</button></div><input type="file" id="impf" accept=".json" hidden><div class="act"><button class="primary" data-a="ok">Terminé</button></div>`}
const dl=(n,t,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:ty}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4e3)};
function ics(){const z=x=>x.replace(/-/g,''),F={daily:'DAILY',weekly:'WEEKLY',monthly:'MONTHLY',yearly:'YEARLY'};
 return'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TalcoCalendar//FR\r\n'+S.ev.map(e=>['BEGIN:VEVENT','UID:'+e.id+'@talco','SUMMARY:'+e.title.replace(/[,;]/g,' '),e.allDay?'DTSTART;VALUE=DATE:'+z(e.date):'DTSTART:'+z(e.date)+'T'+e.start.replace(':','')+'00',e.allDay?'':'DTEND:'+z(e.date)+'T'+e.end.replace(':','')+'00',e.loc?'LOCATION:'+e.loc.replace(/[,;]/g,' '):'',F[e.repeat]?'RRULE:FREQ='+F[e.repeat]:'',e.notify>=0?'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:'+e.title.replace(/[,;]/g,' ')+'\r\nTRIGGER:-PT'+e.notify+'M\r\nEND:VALARM':'','END:VEVENT'].filter(Boolean).join('\r\n')).join('\r\n')+'\r\nEND:VCALENDAR'}
function openCfg(){cfgUI();cd.showModal()}
cd.addEventListener('input',e=>{const el=e.target,k=el.dataset.k;if(!k)return;let v=el.type==='checkbox'?el.checked:el.value;if(typeof DEF[k]==='number')v=+v;S.cfg[k]=v;if(el.type==='range')el.nextElementSibling.textContent=v;applyCfg();render()});
cd.addEventListener('click',async e=>{const a=e.target.dataset.a;if(!a)return;
 if(a==='ok')cd.close();
 if(a==='test'){if(!('Notification'in window))toast('Notifications non supportées ici');else{await Notification.requestPermission();bs();notify('TalcoCalendar','Les notifications fonctionnent ✔')}}
 if(a==='json')dl('talcocalendar-sauvegarde.json',JSON.stringify({ev:S.ev,tk:S.tk,cfg:S.cfg}),'application/json');
 if(a==='ics')dl('talcocalendar.ics',ics(),'text/calendar');
 if(a==='imp')$('#impf').click();
 if(a==='rst'){S.cfg={...DEF};applyCfg();render();cfgUI()}
 if(a==='clr'&&confirm('Supprimer tous les événements et tâches ?')){S.ev=[];S.tk=[];S.fired={};render();toast('Tout a été effacé')}});
cd.addEventListener('change',e=>{if(e.target.id!=='impf')return;const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);S.ev=d.ev||[];S.tk=d.tk||[];if(d.cfg)S.cfg={...DEF,...d.cfg};applyCfg();render();toast('Import réussi ✔')}catch{toast('Fichier invalide')}})});
$('#bell').insertAdjacentHTML('afterend','<button id="gear" class="ib" aria-label="Réglages"><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></button>');
$('#gear').onclick=openCfg;$('#create').insertAdjacentHTML('afterend','<button id="gear2" class="pillbtn" style="width:100%;margin-top:-8px">⚙ Réglages</button>');$('#gear2').onclick=openCfg;
$('#theme').onclick=()=>{S.cfg.th={auto:'light',light:'dark',dark:'auto'}[S.cfg.th];applyCfg();render();toast('Thème : '+{auto:'automatique',light:'clair',dark:'sombre'}[S.cfg.th])};
addEventListener('keydown',e=>{if(e.key===','&&!e.target.matches('input,textarea,select'))openCfg()});
addEventListener('error',e=>toast('⚠ '+e.message));addEventListener('unhandledrejection',e=>toast('⚠ '+(e.reason?.message||e.reason)));
applyCfg();if(S.cfg.view!=='last')S.view=S.cfg.view;else if(innerWidth<700&&!localStorage.tc_view)S.view='day';

render();if(new URLSearchParams(location.search).has('new'))openM();
