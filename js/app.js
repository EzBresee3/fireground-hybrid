import { PH, PH_NAME, PH_NOTE, WARM, PLAN, BY_ID, REQUIRED, VNAME } from './program.js';
import { loadAll, set, setMany, requestPersist, buildExport, validateImport } from './storage.js';
import { initSync, markDirty, pushNow, connect, useRemote, keepLocal, disconnect, status as syncStatus } from './sync.js';

/* ---------------- State and storage ---------------- */
const state = {logs:{}, settings:{version:'gym'}, meta:{}, tab:'today', openId:null};
let lt=null;
function saveLocal(){ clearTimeout(lt); lt=setTimeout(flush,250); }
async function flush(){
  clearTimeout(lt); lt=null;
  try{ await setMany([['logs', state.logs], ['settings', state.settings]]); markDirty(); setSync(syncLabel()); return true; }
  catch(e){ setSync('Not saved: storage error'); return false; }
}
function setSync(t){ document.getElementById('sync').textContent=t; }
function syncLabel(){
  const st = syncStatus();
  if(!st.connected) return 'Saved on this device';
  if(st.lastError) return 'Saved on this device, sync failed';
  return st.pending ? 'Saved on this device' : 'Saved and synced';
}
async function pushLog(id){ return flush(); }
async function pushSettings(){ return flush(); }
async function saveMeta(){ try{ await set('meta', state.meta); }catch(e){} }

/* ---------------- Helpers ---------------- */
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const logOf = id => state.logs[id] || (state.logs[id] = {items:{}, fields:{}, notes:'', rpe:null, done:false, skipped:false});
const isDone = id => !!(state.logs[id] && state.logs[id].done);
const isSkip = id => !!(state.logs[id] && state.logs[id].skipped && !state.logs[id].done);
function nextSession(){ return PLAN.find(s=>!isDone(s.id) && !isSkip(s.id)) || null; }
function currentWeek(){ const n=nextSession(); return n ? n.week : 12; }
function toast(t){ const el=document.getElementById('toast'); el.textContent=t; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600); }
function fmtDate(iso){ try{ return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }catch(e){ return iso; } }

/* ---------------- Views ---------------- */
function sessionView(s, isNext){
  const log = state.logs[s.id] || {items:{},fields:{},notes:'',rpe:null};
  const v = log.done && log.version ? log.version : state.settings.version;
  const list = s.versions ? s.versions[v] : s.steps;
  let h = '';
  if(!isNext && state.openId) h += `<button class="btn link" data-act="back">Back to ${state.tab==='plan'?'plan':'up next'}</button>`;
  h += `<p class="where">${isNext?'Up next: ':''}Week ${s.week}, day ${s.day}${s.optional?' (optional)':''}</p>`;
  h += `<h1>${esc(s.title)}</h1><div class="trim" aria-hidden="true"></div>`;
  h += `<div class="meta"><span>About ${s.minutes} min</span><span>${PH_NAME[PH(s.week)]}</span></div>`;
  h += `<p>${esc(s.focus)}</p>`;
  if(log.done) h += `<div class="done-note"><div class="trim thin" aria-hidden="true"></div><span>Done ${log.date?fmtDate(log.date):''}${log.version&&s.versions?' with '+VNAME[log.version]:''}</span></div>`;
  if(s.versions){
    h += `<div class="seg" role="group" aria-label="Equipment">${['bw','db','gym'].map(k=>`<button data-ver="${k}" aria-pressed="${k===v}">${VNAME[k]}</button>`).join('')}</div>`;
    h += `<div class="hint">Home: bodyweight. Shift and gym days: full gym.</div>`;
  }
  if(s.kind==='strength'||s.kind==='hybrid') h += `<div id="timer-slot"></div>`;
  if(s.kind==='strength'||s.kind==='hybrid') h += `<div class="block"><h3>Warm-up</h3><p class="small muted" style="margin:4px 0 0">${WARM}</p></div>`;
  h += `<div class="block">${s.how?`<p class="small muted">${esc(s.how)}</p>`:''}<ul class="items">`;
  list.forEach(x=>{
    const key = v+':'+slug(x.name);
    const iv = (log.items||{})[key] || {};
    h += `<li class="item"><span class="lab">${esc(x.lab)}</span><div><div class="nm">${esc(x.name)}</div><div class="rx">${esc(x.rx)}</div>${x.note?`<div class="note">${esc(x.note)}</div>`:''}</div>`;
    if(x.log) h += `<div class="inputs"><label class="f">Load<input type="text" inputmode="decimal" data-f="items|${key}|load" value="${esc(iv.load)}" placeholder="${v==='bw'?'bodyweight':'lb'}"></label><label class="f">Reps done<input type="text" data-f="items|${key}|reps" value="${esc(iv.reps)}" placeholder="e.g. 10,10,9"></label></div>`;
    h += `</li>`;
  });
  h += `</ul></div>`;
  if(s.fields){
    h += `<div class="block"><h3>Results</h3><div class="fields" style="margin-top:8px">${s.fields.map(f=>`<label class="f">${f.l}<input type="${f.t==='number'?'number':'text'}" ${f.t==='number'?'inputmode="numeric"':''} data-f="fields|${f.k}" value="${esc((log.fields||{})[f.k])}"></label>`).join('')}</div></div>`;
  }
  h += `<div class="block"><h3>How hard was it?</h3><p class="small muted" style="margin:2px 0 0">1 is easy, 10 is everything you had.</p><div class="rpe" role="group" aria-label="Session effort">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button data-rpe="${n}" aria-pressed="${log.rpe===n}">${n}</button>`).join('')}</div>
    <label class="f" style="margin-top:10px">Notes<textarea data-f="notes" placeholder="Calls overnight, soreness, what felt good">${esc(log.notes)}</textarea></label></div>`;
  h += `<div class="actions">`;
  if(log.done) h += `<button class="btn ghost" data-act="save">Save changes</button><button class="btn link" data-act="undone">Mark as not done</button>`;
  else {
    h += `<button class="btn primary" data-act="done">Mark done</button><button class="btn ghost" data-act="save">Save for later</button>`;
    h += isSkip(s.id) ? `<button class="btn link" data-act="unskip">Put back in the queue</button>` : `<button class="btn link" data-act="skip">Skip this session</button>`;
  }
  h += `</div>`;
  return h;
}

function todayView(){
  if(state.openId) return sessionView(BY_ID[state.openId], false);
  const n = nextSession();
  if(!n) return `<h1>Twelve weeks, done.</h1><div class="trim" aria-hidden="true"></div><p>Every session is logged or skipped. Open Progress to compare your week 1 and week 12 numbers.</p>`;
  const wkStart = PLAN.find(s=>s.week===n.week);
  let h = '';
  if(n.id===wkStart.id) h += `<div class="block"><h3>Week ${n.week}: ${PH_NAME[PH(n.week)]}</h3><p class="small muted" style="margin:4px 0 0">${PH_NOTE[PH(n.week)]}</p></div>`;
  return h + sessionView(n, true);
}

function planView(){
  const cw = currentWeek(), nx = nextSession();
  let h = `<h1>12-week plan</h1><div class="trim" aria-hidden="true"></div>
  <p>Do the days in order and fit them around your shifts; they don't have to land on set weekdays. Five sessions a week, plus an optional sixth.</p>
  <div class="legend"><span>S strength</span><span>B bike</span><span>F fireground</span><span>R run</span><span>Z zone 2</span><span>T test</span></div>`;
  for(let w=1; w<=12; w++){
    h += `<section class="week${w===cw?' now':''}"><div class="wk-head"><h3>Week ${w}</h3><span class="small muted">${PH_NAME[PH(w)]}</span></div><div class="tags">`;
    PLAN.filter(s=>s.week===w).forEach(s=>{
      const cls = ['tag', s.optional?'opt':'', isDone(s.id)?'done':'', isSkip(s.id)?'skip':'', nx&&nx.id===s.id?'next':''].join(' ');
      h += `<button class="${cls}" data-open="${s.id}" aria-label="Day ${s.day}: ${esc(s.title)}${isDone(s.id)?', done':isSkip(s.id)?', skipped':''}"><b>${s.code}</b><small>Day ${s.day}</small></button>`;
    });
    h += `</div></section>`;
  }
  return h;
}

function progressView(){
  const done = REQUIRED.filter(s=>isDone(s.id)).length;
  const extra = PLAN.filter(s=>s.optional && isDone(s.id)).length;
  let h = `<h1>Progress</h1><div class="trim" aria-hidden="true"></div>`;
  h += `<div class="block"><div class="count">${done} <span class="muted" style="font-size:24px">of ${REQUIRED.length}</span></div><p class="muted" style="margin:4px 0 0">core sessions done, plus ${extra} optional zone 2 day${extra===1?'':'s'}. You're in week ${currentWeek()}.</p></div>`;

  const t1 = (state.logs.w1d6||{}).fields||{}, t2=(state.logs.w12d6||{}).fields||{};
  const b1 = state.logs.w1d3||{}, b2 = state.logs.w12d3||{};
  const cell = x => (x===undefined||x===null||x==='') ? '<span class="muted">–</span>' : esc(x);
  h += `<h2>Tests</h2><div class="block"><table><thead><tr><th>Test</th><th>Week 1</th><th>Week 12</th></tr></thead><tbody>
    <tr><td>1.5-mile run</td><td class="num">${cell(t1.run)}</td><td class="num">${cell(t2.run)}</td></tr>
    <tr><td>Push-ups</td><td class="num">${cell(t1.pushups)}</td><td class="num">${cell(t2.pushups)}</td></tr>
    <tr><td>Pull-ups</td><td class="num">${cell(t1.pullups)}</td><td class="num">${cell(t2.pullups)}</td></tr>
    <tr><td>Fireground benchmark${b1.version?`<div class="note">${VNAME[b1.version]}</div>`:''}</td><td class="num">${cell((b1.fields||{}).result)}</td><td class="num">${cell((b2.fields||{}).result)}</td></tr>
  </tbody></table></div>`;

  // main lifts
  const best = {};
  PLAN.filter(s=>s.kind==='strength').forEach(s=>{
    const log = state.logs[s.id]; if(!log||!log.items) return;
    ['bw','db','gym'].forEach(v=>s.versions[v].filter(x=>x.main).forEach(x=>{
      const e = log.items[v+':'+slug(x.name)]; if(!e) return;
      const n = parseFloat(String(e.load||'').replace(/[^0-9.]/g,''));
      const r = best[x.name] || (best[x.name]={first:null,best:null});
      if(!isNaN(n)){ if(!r.first) r.first={n,w:s.week}; if(!r.best||n>=r.best.n) r.best={n,w:s.week,reps:e.reps}; }
      else if(e.reps && !r.best){ r.reps = e.reps; r.wk=s.week; }
    }));
  });
  const names = Object.keys(best);
  h += `<h2>Main lifts</h2><div class="block">`;
  if(!names.length) h += `<p class="muted" style="margin:0">Log a load on any A1 or A2 lift and your first and best numbers show up here.</p>`;
  else {
    h += `<table><thead><tr><th>Lift</th><th>First</th><th>Best</th></tr></thead><tbody>`;
    names.forEach(n=>{ const r=best[n];
      h += `<tr><td>${esc(n)}</td><td class="num">${r.first?esc(r.first.n)+'<div class="note">wk '+r.first.w+'</div>':'<span class="muted">–</span>'}</td><td class="num">${r.best?esc(r.best.n)+'<div class="note">wk '+r.best.w+(r.best.reps?', '+esc(r.best.reps):'')+'</div>':(r.reps?esc(r.reps)+'<div class="note">wk '+r.wk+'</div>':'<span class="muted">–</span>')}</td></tr>`; });
    h += `</tbody></table>`;
  }
  h += `</div>`;

  // effort by week
  const avg = []; for(let w=1;w<=12;w++){ const r = PLAN.filter(s=>s.week===w && isDone(s.id) && state.logs[s.id].rpe).map(s=>state.logs[s.id].rpe); avg.push(r.length ? r.reduce((a,b)=>a+b,0)/r.length : null); }
  h += `<h2>Average effort by week</h2><div class="block"><div class="bars" aria-label="Average session effort per week">${avg.map((a,i)=>`<div class="bar${a?'':' empty'}" style="height:${a?a*10:2}%" title="Week ${i+1}: ${a?a.toFixed(1):'no data'}"></div>`).join('')}</div><div class="bar-x">${avg.map((_,i)=>`<span>${i+1}</span>`).join('')}</div><p class="small muted" style="margin:10px 0 0">Expect it to climb through each block and dip in weeks 4 and 8. If deload weeks still feel like an 8, sleep and shift load are catching up with you.</p></div>`;
  h += backupView();
  h += `<div class="actions"><button class="btn link" data-act="reset">Erase all logged data</button></div>`;
  return h;
}

function render(){
  const app = document.getElementById('app');
  app.innerHTML = state.tab==='plan' ? (state.openId ? sessionView(BY_ID[state.openId], false) : planView())
                : state.tab==='progress' ? progressView() : todayView();
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current', b.dataset.tab===state.tab ? 'page' : 'false'));
  const slot = document.getElementById('timer-slot'); if(slot) slot.appendChild(timer.el);
  syncWakeLock();
}

/* ---------------- Events ---------------- */
function currentSession(){
  if(state.openId) return BY_ID[state.openId];
  return state.tab==='today' ? nextSession() : null;
}
document.querySelector('nav.tabs').addEventListener('click', e=>{
  const b = e.target.closest('button[data-tab]'); if(!b) return;
  state.tab = b.dataset.tab; state.openId = null; render(); window.scrollTo(0,0);
});
document.getElementById('app').addEventListener('input', e=>{
  const el = e.target.closest('[data-f]'); if(!el) return;
  const s = currentSession(); if(!s) return;
  const log = logOf(s.id); const p = el.dataset.f.split('|');
  if(p[0]==='notes') log.notes = el.value;
  else if(p[0]==='fields'){ log.fields = log.fields||{}; log.fields[p[1]] = el.value; }
  else if(p[0]==='items'){ log.items = log.items||{}; const o = log.items[p[1]] || (log.items[p[1]]={}); o[p[2]] = el.value; }
  log.updatedAt = Date.now(); saveLocal();
});
document.getElementById('app').addEventListener('click', async e=>{
  const t = e.target.closest('button'); if(!t) return;
  if(t.dataset.open){ state.openId = t.dataset.open; render(); window.scrollTo(0,0); return; }
  const s = currentSession();
  if(t.dataset.ver){ state.settings.version = t.dataset.ver; if(s && isDone(s.id)){ const l=logOf(s.id); l.version=t.dataset.ver; l.updatedAt=Date.now(); saveLocal(); } render(); pushSettings(); return; }
  if(t.dataset.rpe && s){ const log=logOf(s.id); log.rpe=+t.dataset.rpe; log.updatedAt=Date.now(); render(); saveLocal(); return; }
  const act = t.dataset.act; if(!act) return;
  if(act==='back'){ state.openId=null; render(); window.scrollTo(0,0); return; }
  if(act==='reset'){
    if(!confirm('Erase every logged session and test result? This cannot be undone.' + (syncStatus().connected ? '\n\nThe synced copy on GitHub is overwritten too (GitHub keeps older versions).' : ''))) return;
    state.logs = {}; await flush();
    render(); toast('All logged data erased'); return;
  }
  if(act==='export'){ exportData(); return; }
  if(act==='import'){ document.getElementById('import-file').click(); return; }
  if(act==='gh-connect'){ connectGitHub(t); return; }
  if(act==='gh-sync'){ markDirty(); const ok = await pushNow(); toast(ok ? 'Synced' : (syncStatus().lastError || 'Offline: it will sync when you are back online')); return; }
  if(act==='gh-off'){ if(confirm('Turn off auto-sync on this device? The copy on GitHub stays where it is.')){ await disconnect(); render(); toast('Auto-sync is off'); } return; }
  if(!s) return;
  const log = logOf(s.id); log.updatedAt = Date.now();
  if(act==='done'){
    log.done = true; log.skipped = false; log.date = new Date().toISOString(); if(s.versions) log.version = state.settings.version;
    const ok = await pushLog(s.id); state.openId = null; state.tab='today'; render(); window.scrollTo(0,0);
    const n = nextSession(); toast((ok?'Marked done.':'Marked done, but saving failed.') + (n?' Up next: '+n.title:''));
  } else if(act==='save'){
    if(s.versions && log.done) log.version = log.version || state.settings.version;
    const ok = await pushLog(s.id); toast(ok?'Saved':'Could not save');
  } else if(act==='undone'){
    log.done = false; await pushLog(s.id); render(); toast('Marked as not done');
  } else if(act==='skip'){
    log.skipped = true; await pushLog(s.id); state.openId=null; render(); window.scrollTo(0,0); toast('Skipped');
  } else if(act==='unskip'){
    log.skipped = false; await pushLog(s.id); render(); toast('Back in the queue');
  }
});

/* ---------------- Backup ---------------- */
const BACKUP_NAG_DAYS = 14;
const fmtLong = iso => { try{ return new Date(iso).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return iso; } };
const daysSince = iso => (Date.now() - new Date(iso).getTime()) / 864e5;
const doneCount = logs => Object.values(logs).filter(l=>l && l.done).length;

const fmtStamp = iso => { try{ return new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }catch(e){ return iso; } };
const hasData = logs => Object.values(logs).some(l=>l && (l.done || l.skipped || l.rpe || l.notes || Object.keys(l.items||{}).length || Object.keys(l.fields||{}).length));
const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Fireground%20Hybrid%20sync';

function backupView(){
  const st = syncStatus();
  let h = `<h2>Backup and sync</h2><div class="block">`;
  if(st.connected){
    if(st.lastError) h += `<p class="reminder">Sync isn't working: ${esc(st.lastError)} Your data is still saved on this device. If the token expired, turn auto-sync off and connect again with a new one.</p>`;
    h += `<p style="margin:0">Auto-sync to GitHub is <b>on</b>.</p>`;
    h += `<p style="margin:2px 0 0">${st.pending && !st.lastError ? 'Waiting to sync. It uploads as soon as you are online.' : `Last synced: <b>${st.lastSyncedAt ? fmtStamp(st.lastSyncedAt) : 'not yet'}</b>`}</p>`;
    h += `<p class="small muted" style="margin:4px 0 0">Every save is uploaded to a private gist on your GitHub account, and GitHub keeps every version. On a new phone, connect the same token to get it all back.</p>`;
    h += `<div class="backup-actions"><button class="btn primary" data-act="gh-sync">Sync now</button>${st.gistUrl ? `<a class="btn ghost" style="text-align:center;text-decoration:none;color:inherit" href="${esc(st.gistUrl)}" target="_blank" rel="noopener">View on GitHub</a>` : ''}</div>`;
    h += `<div class="actions" style="margin-top:6px"><button class="btn link" data-act="gh-off">Turn off auto-sync</button></div>`;
  } else {
    const last = state.meta.lastBackup, since = last || state.meta.firstUse;
    const nag = hasData(state.logs) && since && daysSince(since) > BACKUP_NAG_DAYS;
    if(nag) h += `<p class="reminder">${last ? `It's been ${Math.floor(daysSince(last))} days since your last backup.` : `You haven't backed up yet.`} Turn on auto-sync below, or export a copy and keep it in Files or iCloud Drive.</p>`;
    h += `<h3>Auto-sync to GitHub</h3>`;
    h += `<p class="small muted" style="margin:4px 0 8px">Uploads your log to a private gist after every save, so you never have to back up by hand.</p>`;
    h += `<ol class="small" style="margin:0 0 10px;padding-left:20px"><li><a href="${TOKEN_URL}" target="_blank" rel="noopener" style="color:var(--red)">Create a GitHub token</a>. Only the <b>gist</b> box should be ticked. Set Expiration to <b>No expiration</b>, then tap <b>Generate token</b> and copy it.</li><li>Paste it here and tap Connect.</li></ol>`;
    h += `<label class="f">GitHub token<input type="password" id="gh-token" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ghp_…"></label>`;
    h += `<div class="actions" style="margin-top:10px"><button class="btn primary" data-act="gh-connect">Connect</button></div>`;
    h += `<p style="margin:18px 0 0">Last manual backup: <b>${last ? fmtLong(last) : 'never'}</b></p>`;
  }
  h += `<div class="backup-actions"><button class="btn ghost" data-act="export">Export data</button><button class="btn ghost" data-act="import">Import data</button></div></div>`;
  return h;
}

async function connectGitHub(btn){
  const input = document.getElementById('gh-token');
  btn.disabled = true; btn.textContent = 'Connecting…';
  const r = await connect(input ? input.value : '');
  if(!r.ok){ btn.disabled = false; btn.textContent = 'Connect'; toast(r.error); return; }
  if(!r.found){ toast('Auto-sync is on'); }
  else if(JSON.stringify(r.remote.logs) === JSON.stringify(state.logs)){ await useRemote(); toast('Auto-sync is on'); }
  else if(!hasData(state.logs) || confirm(`Found a synced copy${r.remote.exportedAt ? ' from '+fmtStamp(r.remote.exportedAt) : ''} with ${doneCount(r.remote.logs)} sessions done. This phone has ${doneCount(state.logs)}.\n\nOK: use the synced copy on this phone.\nCancel: keep this phone's data and replace the synced copy.`)){
    state.logs = r.remote.logs; state.settings = Object.assign({version:'gym'}, r.remote.settings); state.openId = null;
    try{ await setMany([['logs', state.logs], ['settings', state.settings]]); }catch(e){}
    await useRemote(); toast('Restored from GitHub. Auto-sync is on');
  } else { await keepLocal(); toast('Auto-sync is on'); }
  render();
}

function localDate(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function download(blob, name){
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 10000);
}
async function exportData(){
  const name = `fireground-hybrid-backup-${localDate()}.json`;
  const blob = new Blob([JSON.stringify(buildExport(state.logs, state.settings), null, 2)], {type:'application/json'});
  // On phones the share sheet ("Save to Files") is the reliable way to get a file out of a home-screen app.
  let file = null; try{ file = new File([blob], name, {type:'application/json'}); }catch(e){}
  if(file && matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], title:'Fireground Hybrid backup'}); }
    catch(e){ if(e.name==='AbortError') return; download(blob, name); }
  } else download(blob, name);
  state.meta.lastBackup = new Date().toISOString(); await saveMeta();
  if(state.tab==='progress') render();
  toast('Backup exported');
}
document.getElementById('import-file').addEventListener('change', async e=>{
  const input = e.target, f = input.files && input.files[0]; input.value = '';
  if(!f) return;
  let data;
  try{ data = JSON.parse(await f.text()); }catch(err){ toast('That file is not valid JSON.'); return; }
  const v = validateImport(data);
  if(!v.ok){ toast(v.error); return; }
  const have = Object.keys(state.logs).length;
  if(have && !confirm(`Replace everything on this device (${doneCount(state.logs)} sessions done) with the backup${v.exportedAt?' from '+fmtLong(v.exportedAt):''} (${doneCount(v.logs)} sessions done)? This cannot be undone.`)) return;
  state.logs = v.logs; state.settings = Object.assign({version:'gym'}, v.settings); state.openId = null;
  const ok = await flush(); render(); toast(ok ? 'Backup restored' : 'Could not save the restored data');
});

/* ---------------- Rest timer ---------------- */
const timer = {dur:90, left:90, endAt:0, running:false, zero:false, iv:null, el:document.createElement('div')};
timer.el.className = 'timer'; timer.el.setAttribute('role','group'); timer.el.setAttribute('aria-label','Rest timer');
timer.el.innerHTML = `<div class="row"><span class="t-lab">Rest</span><span class="t-time" data-t="time">1:30</span><span class="grow"></span><button class="go" data-t="go">Start</button><button data-t="reset">Reset</button></div>
  <div class="row"><div class="t-pre">${[[60,'60 s'],[90,'90 s'],[120,'2 min']].map(([n,l])=>`<button data-t="pre" data-sec="${n}" aria-pressed="${n===90}">${l}</button>`).join('')}</div></div>`;
const tEl = k => timer.el.querySelector(`[data-t="${k}"]`);
const fmtClock = sec => Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
const tRemaining = () => timer.running ? Math.max(0, Math.ceil((timer.endAt-Date.now())/1000)) : timer.left;
function tPaint(){
  tEl('time').textContent = fmtClock(tRemaining());
  tEl('go').textContent = timer.running ? 'Pause' : (timer.left>0 && timer.left<timer.dur ? 'Resume' : 'Start');
  timer.el.querySelectorAll('[data-t="pre"]').forEach(b=>b.setAttribute('aria-pressed', +b.dataset.sec===timer.dur));
  timer.el.classList.toggle('zero', timer.zero);
}
function tStop(){ clearInterval(timer.iv); timer.iv=null; timer.running=false; }
function tTick(){ if(timer.running && Date.now()>=timer.endAt){ tStop(); timer.left=0; tZero(); } tPaint(); }
function tStart(){ if(timer.left<=0) timer.left=timer.dur; timer.zero=false; timer.endAt=Date.now()+timer.left*1000; timer.running=true; clearInterval(timer.iv); timer.iv=setInterval(tTick,250); tPaint(); }
function tPause(){ timer.left=tRemaining(); tStop(); tPaint(); }
function tReset(){ tStop(); timer.left=timer.dur; timer.zero=false; tPaint(); }
function tZero(){
  timer.zero = true;
  try{ if(navigator.vibrate) navigator.vibrate([300,120,300,120,300]); }catch(e){}
  const fl = document.getElementById('flash'); fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
  clearTimeout(tZero.t); tZero.t = setTimeout(()=>fl.classList.remove('on'), 1900);
  toast('Rest is up');
}
timer.el.addEventListener('click', e=>{
  const b = e.target.closest('button[data-t]'); if(!b) return;
  e.stopPropagation();
  if(b.dataset.t==='go') timer.running ? tPause() : tStart();
  else if(b.dataset.t==='reset') tReset();
  else if(b.dataset.t==='pre'){ timer.dur=+b.dataset.sec; tReset(); }
});
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') tTick(); });

/* ---------------- Screen wake lock ---------------- */
let wakeLock = null, wakeQ = Promise.resolve();
function syncWakeLock(){
  wakeQ = wakeQ.then(async ()=>{
    const want = !!currentSession() && document.visibilityState==='visible';
    try{
      if(want && !wakeLock && 'wakeLock' in navigator){
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', ()=>{ wakeLock = null; });
      } else if(!want && wakeLock){ const l = wakeLock; wakeLock = null; await l.release(); }
    }catch(e){ wakeLock = null; }
  });
}
document.addEventListener('visibilitychange', syncWakeLock);

/* ---------------- Service worker and updates ---------------- */
function initSW(){
  if(!('serviceWorker' in navigator)) return;
  const banner = document.getElementById('update');
  let asked = false;
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(asked) location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg=>{
    const offer = w => {
      banner.hidden = false;
      banner.onclick = async ()=>{ asked = true; banner.textContent = 'Updating…'; await flush(); w.postMessage({type:'SKIP_WAITING'}); };
    };
    if(reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', ()=>{
      const w = reg.installing; if(!w) return;
      w.addEventListener('statechange', ()=>{ if(w.state==='installed' && navigator.serviceWorker.controller) offer(w); });
    });
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') reg.update().catch(()=>{}); });
  }).catch(()=>{});
}

/* ---------------- Boot ---------------- */
document.addEventListener('visibilitychange', async ()=>{
  if(document.visibilityState!=='hidden') return;
  if(lt) await flush();
  if(syncStatus().pending) pushNow({keepalive:true});
});
window.addEventListener('pagehide', ()=>{ if(lt) flush(); });

(async function boot(){
  try{
    const d = await loadAll();
    state.logs = d.logs; state.settings = Object.assign(state.settings, d.settings); state.meta = d.meta;
    await initSync({
      getData: ()=>({logs:state.logs, settings:state.settings}),
      onChange: ()=>{ setSync(syncLabel()); if(state.tab==='progress' && document.activeElement?.id!=='gh-token') render(); }
    });
    setSync(syncLabel());
  }catch(e){ setSync('Storage unavailable: changes will not be kept'); }
  render();
  requestPersist();
  initSW();
})();
