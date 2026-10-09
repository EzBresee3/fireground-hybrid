import { PH, PH_NAME, PH_NOTE, WARM, VNAME, PROGRAMS, TYPES, typeOf, CODE_NAME, DEFAULT_CYCLE, planFor, cycleOf } from './program.js';
import { PATTERNS, CARDIO, CARDIO_DAY, alternatives, patternOf, cardioAs, nativeMode } from './exercises.js';
import { loadAll, set, setMany, requestPersist, buildExport, validateImport } from './storage.js';
import { liftTip, sessionTip, findPrev } from './coach.js';
import { initSync, markDirty, pushNow, connect, useRemote, keepLocal, disconnect, status as syncStatus } from './sync.js';

/* ---------------- State and storage ---------------- */
const state = {logs:{}, settings:{version:'gym', mode:'bike', cycles:[{...DEFAULT_CYCLE}]}, meta:{}, tab:'today', openId:null, planCycle:null, picker:false, pick:null, pickType:null, screen:null};
const normSettings = s => Object.assign({version:'gym', mode:'bike'}, s || {});

/* ---------------- Cycles ----------------
   settings.cycles = [{n, program, baseline, startedAt, finishedAt}]. Logs from every cycle stay in
   state.logs forever (cycle 1 ids are w1d1..., later cycles c2:w1d1...), so nothing is ever replaced. */
let PLAN = [], BY_ID = {}, REQUIRED = [];
const cycles = () => state.settings.cycles;
const curCycle = () => cycles()[cycles().length-1] || null;   // the active cycle is the last one; null when every cycle was deleted
const progOf = c => PROGRAMS[c.program] || PROGRAMS.hybrid;
const cycleLabel = c => `Cycle ${c.n} · ${progOf(c).name}`;
function refreshPlan(){
  if(!Array.isArray(state.settings.cycles)) state.settings.cycles = [{...DEFAULT_CYCLE}];   // older saves; an empty list means every cycle was deleted
  // The old bike / stairs / run switch on interval days becomes an "every time" machine for interval and threshold days.
  if(!state.settings.modeBy){ const m = state.settings.mode; state.settings.modeBy = m && m!=='bike' ? {I:m, H:m} : {}; }
  if(!state.settings.swaps) state.settings.swaps = {rules:{}, custom:{}};
  PLAN = curCycle() ? planFor(curCycle()) : []; BY_ID = Object.fromEntries(PLAN.map(s=>[s.id,s])); REQUIRED = PLAN.filter(s=>!s.optional);
}

/* ---------------- Deleting a cycle ----------------
   The cycle and its logs leave the screen at once but stay saved (flush and sync write them back)
   until the 10-second Undo runs out. Closing the app before then cancels the delete.            */
let pendingDelete = null;   // {cycle, logs, timer}
const persistLogs = () => pendingDelete ? {...state.logs, ...pendingDelete.logs} : state.logs;
const persistSettings = () => pendingDelete ? {...state.settings, cycles:[...cycles(), pendingDelete.cycle].sort((a,b)=>a.n-b.n)} : state.settings;
const cycleLogIds = n => Object.keys(state.logs).filter(id=>cycleOf(id)===n);
function deleteCycle(n){
  commitDelete();
  const cs = cycles(), cycle = cs.find(c=>c.n===n); if(!cycle) return;
  const logs = {};
  for(const id of cycleLogIds(n)){ logs[id] = state.logs[id]; delete state.logs[id]; }
  cs.splice(cs.indexOf(cycle), 1);
  if(state.openId && cycleOf(state.openId)===n) state.openId = null;
  if(state.planCycle===n) state.planCycle = null;
  state.picker = false;
  pendingDelete = {cycle, logs, timer: setTimeout(commitDelete, 10000)};
  refreshPlan(); render(); window.scrollTo(0,0);
  undoToast(`Cycle ${n} deleted`);
}
function undoDelete(){
  if(!pendingDelete) return;
  const {cycle, logs, timer} = pendingDelete; clearTimeout(timer); pendingDelete = null;
  Object.assign(state.logs, logs);
  cycles().push(cycle); cycles().sort((a,b)=>a.n-b.n);
  hideUndoToast(); refreshPlan(); render(); toast(`Cycle ${cycle.n} restored`);
}
/* Make a pending delete permanent: when the Undo runs out, or before anything else changes the cycle list. */
function commitDelete(){
  if(!pendingDelete) return;
  clearTimeout(pendingDelete.timer); pendingDelete = null; hideUndoToast(); flush();
}
function undoToast(msg){
  const el = document.getElementById('undo-toast');
  document.getElementById('undo-msg').textContent = msg; el.hidden = false;
}
function hideUndoToast(){ document.getElementById('undo-toast').hidden = true; }
document.getElementById('undo-btn').addEventListener('click', undoDelete);
function cycleSummary(c){
  const plan = planFor(c), ids = cycleLogIds(c.n);
  const logged = ids.filter(id=>{ const l = state.logs[id]; return l && (l.done || l.skipped || l.rpe || l.notes || Object.keys(l.items||{}).length || Object.keys(l.fields||{}).length); }).length;
  const dates = plan.map(s=>(state.logs[s.id]||{}).date).filter(Boolean).sort();
  const from = dates[0] || c.startedAt, to = dates[dates.length-1] || c.finishedAt;
  const range = from ? `${fmtLong(from)} – ${to && to!==from ? fmtLong(to) : c===curCycle() ? 'now' : fmtLong(from)}` : 'Not started yet';
  return {logged, done: ids.filter(id=>state.logs[id].done).length, range};
}
function findSession(id){
  if(BY_ID[id]) return BY_ID[id];
  const c = cycles().find(x=>x.n===cycleOf(id));
  return c ? planFor(c).find(s=>s.id===id) || null : null;
}
const coachCtx = () => ({logs:state.logs, cycles:cycles()});
const tipHtml = t => t ? `<div class="tip ${t.dir}">${esc(t.text)}</div>` : '';
const MODE_DONE = {run:'running', bike:'on the bike', rower:'on the rower', assault:'on the assault bike', stairs:'on the stair climber', ruck:'rucking', swim:'swimming'};

/* Most recent earlier log of the exercise actually being done, this cycle or any before it. */
function lastLine(s, v, name){
  const f = findPrev(coachCtx(), s, name, false); if(!f) return '';
  const {p, e} = f, load = e.load ? esc(e.load) + (/^\s*[\d.]+\s*$/.test(e.load) && v!=='bw' ? ' lb' : '') : '';
  return `<div class="note last">Last time: ${load}${load && e.reps ? ' × ' : ''}${e.reps ? esc(e.reps) : ''} (${p.cycle!==s.cycle ? 'cycle '+p.cycle+', ' : ''}wk ${p.week})</div>`;
}

/* ---------------- Swaps ----------------
   Exercise swaps: "just today" lives on the session log (log.swaps[key] = name, or null to keep the
   planned exercise despite a rule); "every time" is a rule in settings.swaps.rules[key]. Rules only
   apply to sessions not yet done; marking done copies them onto the log so history never changes.
   Cardio: log.mode is this session's machine; settings.modeBy[code] is the every-time machine.
   Equipment: log.version on an unfinished session is a this-session-only version.                 */
const swapRules = () => state.settings.swaps.rules;
const customEx = () => state.settings.swaps.custom;
const verOf = log => log.version || state.settings.version;
const itemByKey = (s, key) => { const v = key.slice(0, key.indexOf(':')); return ((s.versions||{})[v]||[]).find(x=>v+':'+slug(x.name)===key) || null; };
function swapOf(v, x, log, s){
  const key = v+':'+slug(x.name);
  if(s && s.kind==='test') return {key, name:x.name, how:null};   // tests stay as written so week 1 and week 12 compare
  if(log.swaps && key in log.swaps){ const to = log.swaps[key]; return to ? {key, name:to, how:'today'} : {key, name:x.name, how:'kept'}; }
  const r = !log.done && swapRules()[key];
  return r ? {key, name:r.to, how:'rule'} : {key, name:x.name, how:null};
}
/* Record on each logged lift what was planned and what was done; freeze=true also pins every-time swaps to this session. */
function stampItems(s, log, freeze){
  if(!s.versions) return;
  const v = verOf(log);
  for(const x of s.versions[v]){
    const sw = swapOf(v, x, log, s);
    if(freeze && sw.how==='rule') (log.swaps = log.swaps || {})[sw.key] = sw.name;
    const e = log.items && log.items[sw.key];
    if(e){ e.from = x.name; e.did = sw.name; }
  }
}
function modeOf(s, log){
  if(s.kind!=='cardio') return null;
  if(log.mode) return log.mode;
  if(log.done) return s.modes ? 'bike' : nativeMode(s);   // logged before machines could change
  return state.settings.modeBy[s.code] || nativeMode(s);
}
let lt=null;
function saveLocal(){ clearTimeout(lt); lt=setTimeout(flush,250); }
async function flush(){
  clearTimeout(lt); lt=null;
  try{ await setMany([['logs', persistLogs()], ['settings', persistSettings()]]); markDirty(); setSync(syncLabel()); return true; }
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
  const v = verOf(log);
  const md = modeOf(s, log);
  const sm = s.kind==='cardio' ? cardioAs(s, md) : null;
  const list = s.versions ? s.versions[v] : sm ? sm.steps : s.steps;
  const fields = sm ? sm.fields : s.fields;
  let h = '';
  if(!isNext && state.openId) h += `<button class="btn link" data-act="back">Back to ${state.tab==='plan'?'plan':'up next'}</button>`;
  h += `<p class="where">${isNext?'Up next: ':''}${cycles().length>1 ? `Cycle ${s.cycle}, week ${s.week}` : `Week ${s.week}`}, day ${s.day}${s.optional?' (optional)':''}</p>`;
  h += `<h1>${esc(sm ? sm.title : s.title)}</h1><div class="trim" aria-hidden="true"></div>`;
  h += `<div class="meta"><span>About ${s.minutes} min</span><span>${PH_NAME[PH(s.week)]}</span></div>`;
  h += `<p>${esc(sm ? sm.focus : s.focus)}</p>`;
  h += tipHtml(sessionTip(coachCtx(), s));
  if(log.done) h += `<div class="done-note"><div class="trim thin" aria-hidden="true"></div><span>Done ${log.date?fmtDate(log.date):''}${log.version&&s.versions?' with '+VNAME[log.version]:''}${log.mode&&s.kind==='cardio'?' '+MODE_DONE[log.mode]:''}</span></div>`;
  if(s.kind==='cardio'){
    const today = !log.done && log.mode;
    h += `<div class="swaprow"><span>Machine: <b>${md ? CARDIO[md].label : 'your choice'}</b>${today ? ` · just today <button class="linkbtn" data-act="undo-mode">Undo</button>` : ''}</span><button class="btn-sm" data-act="swap-session">Swap session</button></div>`;
  }
  if(s.versions){
    h += `<div class="seg" role="group" aria-label="Equipment">${['bw','db','gym'].map(k=>`<button data-ver="${k}" aria-pressed="${k===v}">${VNAME[k]}</button>`).join('')}</div>`;
    h += `<div class="hint">Home: bodyweight. Shift and gym days: full gym.</div>`;
    if(!log.done) h += `<div class="swaprow"><span>${log.version ? `Just this session: <b>${VNAME[log.version]}</b> <button class="linkbtn" data-act="undo-ver">Undo</button>` : ''}</span><button class="btn-sm" data-act="swap-session">Swap session</button></div>`;
  }
  if(s.kind==='strength'||s.kind==='hybrid') h += `<div id="timer-slot"></div>`;
  if(s.kind==='strength'||s.kind==='hybrid') h += `<div class="block"><h3>Warm-up</h3><p class="small muted" style="margin:4px 0 0">${WARM}</p></div>`;
  h += `<div class="block">${s.how?`<p class="small muted">${esc(s.how)}</p>`:''}<ul class="items">`;
  list.forEach(x=>{
    const key = v+':'+slug(x.name);
    const iv = (log.items||{})[key] || {};
    const sw = s.versions ? swapOf(v, x, log, s) : {name:x.name, how:null}, swapped = sw.name!==x.name;
    const swapBtn = s.versions && s.kind!=='test' && patternOf(x.name) ? `<button class="swap" data-swap="${key}" aria-label="Swap ${esc(sw.name)}">Swap</button>` : '';
    h += `<li class="item"><span class="lab">${esc(x.lab)}</span><div><div class="nm-row"><div class="nm">${esc(sw.name)}</div>${swapBtn}</div><div class="rx">${esc(x.rx)}</div>`;
    h += swapped ? `<div class="note swapped">Swapped from ${esc(x.name)}${sw.how==='rule' ? ' (every time)' : ''} · <button class="linkbtn" data-unswap="${key}">Undo</button></div>` : (x.note ? `<div class="note">${esc(x.note)}</div>` : '');
    h += `${x.log ? lastLine(s, v, sw.name) + tipHtml(liftTip(coachCtx(), s, x, v, sw.name)) : ''}</div>`;
    if(x.log) h += `<div class="inputs"><label class="f">Load<input type="text" inputmode="decimal" data-f="items|${key}|load" value="${esc(iv.load)}" placeholder="${v==='bw'?'bodyweight':'lb'}"></label><label class="f">Reps done<input type="text" data-f="items|${key}|reps" value="${esc(iv.reps)}" placeholder="e.g. 10,10,9"></label></div>`;
    h += `</li>`;
  });
  h += `</ul></div>`;
  if(fields){
    h += `<div class="block"><h3>Results</h3><div class="fields" style="margin-top:8px">${fields.map(f=>`<label class="f">${f.l}<input type="${f.t==='number'?'number':'text'}" ${f.t==='number'?'inputmode="numeric"':''} data-f="fields|${f.k}" value="${esc((log.fields||{})[f.k])}"></label>`).join('')}</div></div>`;
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
  if(state.openId) return sessionView(findSession(state.openId), false);
  if(!curCycle()) return pickerView('empty');
  const n = nextSession();
  if(!n || state.picker) return pickerView(n ? 'early' : 'complete');
  const wkStart = PLAN.find(s=>s.week===n.week), c = curCycle();
  let h = '';
  if(n.id===wkStart.id){
    h += `<div class="block"><h3>Week ${n.week}: ${PH_NAME[PH(n.week)]}</h3><p class="small muted" style="margin:4px 0 0">${PH_NOTE[PH(n.week)]}</p>`;
    if(n.week===1 && cycles().length>1) h += `<p class="small muted" style="margin:8px 0 0">${esc(cycleLabel(c))}. ${c.baseline===false ? `No baseline tests this time: your week 12 results from the last cycle are your starting numbers.` : `Week 1 includes baseline tests.`}</p>`;
    h += `</div>`;
  }
  return h + sessionView(n, true);
}

const nextCycleN = () => Math.max(0, ...cycles().map(c=>c.n)) + 1;
/* The program the picker has selected: what was tapped, else the current program if it fits the chosen type, else the type's first. */
function pickedProgram(){
  const c = curCycle(), type = state.pickType || (c ? typeOf(c) : 'hybrid');
  const ofType = Object.keys(PROGRAMS).filter(k=>PROGRAMS[k].type===type);
  return {type, ofType, pick: ofType.includes(state.pick) ? state.pick : c && ofType.includes(c.program) ? c.program : ofType[0]};
}
function pickerView(mode){
  const c = curCycle(), next = nextCycleN(), {type, ofType, pick} = pickedProgram();
  let h = mode==='complete'
    ? `<h1>Twelve weeks, done.</h1><div class="trim" aria-hidden="true"></div><p>Every session in cycle ${c.n} is logged or skipped, and it stays in your log for good. Open Progress to compare your numbers.</p>`
    : mode==='empty'
    ? `<h1>Start a new cycle</h1><div class="trim" aria-hidden="true"></div><p>There are no cycles in your log. Pick a type and a program to start twelve new weeks.</p>`
    : `<button class="btn link" data-act="cancel-cycle">Back to up next</button><h1>Start the next cycle</h1><div class="trim" aria-hidden="true"></div><p>Anything you haven't done in cycle ${c.n} stays in your log as it is.</p>`;
  h += `<h2>Pick cycle ${next}</h2>`;
  h += `<div class="seg two" role="group" aria-label="Cycle type">${Object.entries(TYPES).map(([k,l])=>`<button data-ptype="${k}" aria-pressed="${k===type}">${l}</button>`).join('')}</div>`;
  h += `<p class="small muted">${type==='hybrid' ? 'Strength and conditioning together. The main lifts and accessories rotate to new variations every cycle; the fireground circuits stay the same, so your benchmark keeps comparing.' : 'Four lifting days, one zone 2 day and an optional short power day. Same 12-week phases, same equipment versions and swaps.'}</p>`;
  h += `<div class="progs" role="radiogroup" aria-label="Program">${ofType.map(k=>{ const p = PROGRAMS[k]; return `<button class="prog" role="radio" data-prog="${k}" aria-checked="${k===pick}"><b>${esc(p.name)}</b><small>${esc(p.perWeek)}</small><span>${esc(p.blurb)}</span></button>`; }).join('')}</div>`;
  h += `<div class="actions"><button class="btn primary" data-act="start-cycle">Start cycle ${next}</button></div>`;
  return h;
}

function planView(){
  if(!curCycle()) return `<h1>12-week plan</h1><div class="trim" aria-hidden="true"></div><p>No cycle yet.</p><div class="actions"><button class="btn primary" data-act="go-start">Start a new cycle</button></div>`;
  const cs = cycles(), vc = cs.find(c=>c.n===state.planCycle) || curCycle(), isCur = vc===curCycle();
  const plan = planFor(vc), i = cs.indexOf(vc);
  const cw = isCur ? currentWeek() : null, nx = isCur ? nextSession() : null;
  const codes = Object.keys(CODE_NAME).filter(k=>plan.some(s=>s.code===k));
  let h = `<h1>12-week plan</h1><div class="trim" aria-hidden="true"></div>`;
  h += `<div class="cyc">${cs.length>1 ? `<button data-cyc="${i>0?cs[i-1].n:''}" ${i>0?'':'disabled'} aria-label="Previous cycle">‹</button>` : ''}<span>${esc(cycleLabel(vc))}${isCur && cs.length>1 ? ' (current)' : ''}</span>${cs.length>1 ? `<button data-cyc="${i<cs.length-1?cs[i+1].n:''}" ${i<cs.length-1?'':'disabled'} aria-label="Next cycle">›</button>` : ''}</div>`;
  h += `<p>Do the days in order and fit them around your shifts; they don't have to land on set weekdays. ${progOf(vc).perWeek}</p>
  <div class="legend">${codes.map(k=>`<span>${k} ${CODE_NAME[k]}</span>`).join('')}</div>`;
  for(let w=1; w<=12; w++){
    h += `<section class="week${w===cw?' now':''}"><div class="wk-head"><h3>Week ${w}</h3><span class="small muted">${PH_NAME[PH(w)]}</span></div><div class="tags">`;
    plan.filter(s=>s.week===w).forEach(s=>{
      const cls = ['tag', s.optional?'opt':'', isDone(s.id)?'done':'', isSkip(s.id)?'skip':'', nx&&nx.id===s.id?'next':''].join(' ');
      h += `<button class="${cls}" data-open="${s.id}" aria-label="Day ${s.day}: ${esc(s.title)}${isDone(s.id)?', done':isSkip(s.id)?', skipped':''}"><b>${s.code}</b><small>Day ${s.day}</small></button>`;
    });
    h += `</div></section>`;
  }
  if(isCur && nx) h += `<div class="actions"><button class="btn link" data-act="early-cycle">Start the next cycle early</button></div>`;
  h += `<div class="danger-zone"><button class="btn link danger" data-act="del-cycle" data-n="${vc.n}">Delete cycle ${vc.n}</button></div>`;
  return h;
}

function progressView(){
  if(!curCycle()) return `<h1>Progress</h1><div class="trim" aria-hidden="true"></div><p>No cycle yet. Start one from the Today tab, or import a backup below.</p>` + backupView();
  const done = REQUIRED.filter(s=>isDone(s.id)).length;
  const extra = PLAN.filter(s=>s.optional && isDone(s.id)).length;
  const c = curCycle(), prevC = cycles()[cycles().length-2], hasOpt = PLAN.some(s=>s.optional);
  const optName = c.program==='hybrid' ? `optional zone 2 day${extra===1?'':'s'}` : `optional session${extra===1?'':'s'}`;
  let h = `<h1>Progress</h1><div class="trim" aria-hidden="true"></div>`;
  if(cycles().length>1) h += `<p class="where" style="margin-bottom:6px">${esc(cycleLabel(c))}</p>`;
  h += `<div class="block"><div class="count">${done} <span class="muted" style="font-size:24px">of ${REQUIRED.length}</span></div><p class="muted" style="margin:4px 0 0">core sessions done${hasOpt ? `, plus ${extra} ${optName}` : ''}. You're in week ${currentWeek()}.</p></div>`;

  // Start = week 1 tests, or last cycle's week 12 when this cycle skipped the baseline.
  const prevPlan = prevC ? planFor(prevC) : null, fromPrev = c.baseline===false && !!prevPlan && typeOf(prevC)===typeOf(c);
  const testIn = (pl, w) => pl.find(s=>s.kind==='test' && s.week===w), benchIn = (pl, w) => pl.find(s=>s.bench && s.week===w);
  const fieldsOf = s => (s && state.logs[s.id] && state.logs[s.id].fields) || {};
  const t1 = fieldsOf(fromPrev ? testIn(prevPlan,12) : testIn(PLAN,1)), t2 = fieldsOf(testIn(PLAN,12));
  const b2s = benchIn(PLAN,12); let b1s = fromPrev ? benchIn(prevPlan,12) : benchIn(PLAN,1);
  if(b1s && b2s && b1s.code!==b2s.code) b1s = null;
  const b1 = (b1s && state.logs[b1s.id]) || {}, b2 = (b2s && state.logs[b2s.id]) || {};
  const benchName = b2s && b2s.code==='C' ? 'Test simulation' : 'Fireground benchmark';
  const cell = x => (x===undefined||x===null||x==='') ? '<span class="muted">–</span>' : esc(x);
  if(typeOf(c)==='strength'){
    const a = strengthResults(fromPrev ? testIn(prevPlan,12) : testIn(PLAN,1)), b = strengthResults(testIn(PLAN,12));
    const tcell = r => r ? `${esc(r.value)}<div class="note">${esc(r.name)}</div>` : '<span class="muted">–</span>';
    h += `<h2>Tests</h2><div class="block"><table><thead><tr><th>Test</th><th>${fromPrev?'Start':'Week 1'}</th><th>Week 12</th></tr></thead><tbody>`;
    h += STRENGTH_TESTS.map(([t,l])=>`<tr><td>${l}</td><td class="num">${tcell(a[t])}</td><td class="num">${tcell(b[t])}</td></tr>`).join('');
    h += `</tbody></table><p class="small muted" style="margin:8px 0 0">5-rep maxes are estimated from the heaviest set you logged.${fromPrev ? ' Start is your week 12 result from the last cycle.' : ''}</p></div>`;
  } else
  h += `<h2>Tests</h2><div class="block"><table><thead><tr><th>Test</th><th>${fromPrev?'Start':'Week 1'}</th><th>Week 12</th></tr></thead><tbody>
    <tr><td>1.5-mile run</td><td class="num">${cell(t1.run)}</td><td class="num">${cell(t2.run)}</td></tr>
    <tr><td>Push-ups</td><td class="num">${cell(t1.pushups)}</td><td class="num">${cell(t2.pushups)}</td></tr>
    <tr><td>Pull-ups</td><td class="num">${cell(t1.pullups)}</td><td class="num">${cell(t2.pullups)}</td></tr>
    <tr><td>${benchName}${b1.version?`<div class="note">${VNAME[b1.version]}</div>`:''}</td><td class="num">${cell((b1.fields||{}).result)}</td><td class="num">${cell((b2.fields||{}).result)}</td></tr>
  </tbody></table>${fromPrev ? `<p class="small muted" style="margin:8px 0 0">Start is your week 12 result from cycle ${prevC.n}.</p>` : ''}</div>`;

  // main lifts
  const best = {};
  PLAN.filter(s=>s.kind==='strength').forEach(s=>{
    const log = state.logs[s.id]; if(!log||!log.items) return;
    ['bw','db','gym'].forEach(v=>s.versions[v].filter(x=>x.main).forEach(x=>{
      const e = log.items[v+':'+slug(x.name)]; if(!e) return;
      const n = parseFloat(String(e.load||'').replace(/[^0-9.]/g,''));
      const nm = e.did || x.name;   // track the exercise actually done
      const r = best[nm] || (best[nm]={first:null,best:null,swapped: slug(nm)!==slug(x.name)});
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
      h += `<tr><td>${esc(n)}${r.swapped?'<div class="note">swapped</div>':''}</td><td class="num">${r.first?esc(r.first.n)+'<div class="note">wk '+r.first.w+'</div>':'<span class="muted">–</span>'}</td><td class="num">${r.best?esc(r.best.n)+'<div class="note">wk '+r.best.w+(r.best.reps?', '+esc(r.best.reps):'')+'</div>':(r.reps?esc(r.reps)+'<div class="note">wk '+r.wk+'</div>':'<span class="muted">–</span>')}</td></tr>`; });
    h += `</tbody></table>`;
  }
  h += `</div>`;

  // effort by week
  const avg = []; for(let w=1;w<=12;w++){ const r = PLAN.filter(s=>s.week===w && isDone(s.id) && state.logs[s.id].rpe).map(s=>state.logs[s.id].rpe); avg.push(r.length ? r.reduce((a,b)=>a+b,0)/r.length : null); }
  h += `<h2>Average effort by week</h2><div class="block"><div class="bars" aria-label="Average session effort per week">${avg.map((a,i)=>`<div class="bar${a?'':' empty'}" style="height:${a?a*10:2}%" title="Week ${i+1}: ${a?a.toFixed(1):'no data'}"></div>`).join('')}</div><div class="bar-x">${avg.map((_,i)=>`<span>${i+1}</span>`).join('')}</div><p class="small muted" style="margin:10px 0 0">Expect it to climb through each block and dip in weeks 4 and 8. If deload weeks still feel like an 8, sleep and shift load are catching up with you.</p></div>`;
  h += historyView();
  h += backupView();
  h += `<div class="actions"><button class="btn link" data-act="reset">Erase all logged data</button></div>`;
  return h;
}

/* Strength test results for test session s: {squat:{value, name}, ...}. 5RM rows are estimated (Epley) from load × reps. */
const STRENGTH_TESTS = [['squat','Squat 5RM'],['bench','Bench 5RM'],['dead','Deadlift 5RM'],['pull','Pull-ups'],['push','Push-ups']];
function strengthResults(s){
  const out = {}, log = s && state.logs[s.id]; if(!log || !log.items || !s.versions) return out;
  const v = verOf(log);
  for(const x of s.versions[v]){
    const e = log.items[v+':'+slug(x.name)]; if(!e || !x.t) continue;
    const reps = parseInt(String(e.reps||'').split(/[^\d]+/).filter(Boolean)[0], 10), load = parseFloat(e.load);
    const perLeg = /per leg/.test(x.rx);
    if(x.e5 && load && reps) out[x.t] = {value: Math.round(load * (1 + reps/30) / (1 + 5/30)) + ' lb', name: e.did || x.name};
    else if(reps) out[x.t] = {value: reps + (perLeg ? ' /leg' : ''), name: e.did || x.name};
  }
  return out;
}

function historyView(){
  const cs = cycles(); if(cs.length < 2) return '';
  let h = `<h2>All cycles</h2><div class="block"><ul class="items">`;
  const best = {};
  for(const c of [...cs].reverse()){
    const plan = planFor(c), req = plan.filter(s=>!s.optional), done = req.filter(s=>isDone(s.id)).length;
    const dates = plan.map(s=>(state.logs[s.id]||{}).date).filter(Boolean).sort();
    const finS = plan.find(s=>s.kind==='test' && s.week===12), fin = ((state.logs[(finS||{}).id]||{}).fields)||{};
    const sr = typeOf(c)==='strength' ? strengthResults(finS) : null;
    const tests = sr ? STRENGTH_TESTS.filter(([t])=>sr[t]).map(([t,l])=>`${l} ${esc(sr[t].value)}`).join(' · ')
      : [fin.run && `1.5 mi ${esc(fin.run)}`, fin.pushups && `${esc(fin.pushups)} push-ups`, fin.pullups && `${esc(fin.pullups)} pull-ups`].filter(Boolean).join(' · ');
    h += `<li class="hist"><div><b>${esc(cycleLabel(c))}</b>${c===curCycle() ? ' <span class="small muted">(current)</span>' : ''}<div class="note">${dates.length ? fmtLong(dates[0])+' – '+fmtLong(dates[dates.length-1])+' · ' : ''}${done} of ${req.length} done${tests ? ' · '+tests : ''}</div></div><button class="btn link" data-viewcyc="${c.n}">View</button></li>`;
    for(const s of plan){
      if(s.kind!=='strength') continue;
      const log = state.logs[s.id]; if(!log || !log.items) continue;
      for(const v of ['bw','db','gym']) for(const x of s.versions[v]){
        if(!x.main) continue;
        const e = log.items[v+':'+slug(x.name)]; if(!e) continue;
        const n = parseFloat(String(e.load||'').replace(/[^0-9.]/g,'')); if(isNaN(n)) continue;
        const nm = e.did || x.name, r = best[nm];
        if(!r || n > r.n || (n===r.n && c.n > r.c)) best[nm] = {n, c:c.n, w:s.week, reps:e.reps, swapped: slug(nm)!==slug(x.name)};
      }
    }
  }
  h += `</ul></div>`;
  const names = Object.keys(best).sort();
  if(names.length) h += `<h2>All-time bests</h2><div class="block"><table><thead><tr><th>Lift</th><th>Best</th><th>When</th></tr></thead><tbody>${names.map(n=>{ const r = best[n];
    return `<tr><td>${esc(n)}${r.swapped ? '<div class="note">swapped</div>' : ''}</td><td class="num">${esc(r.n)}</td><td class="small">Cycle ${r.c}, wk ${r.w}${r.reps ? `<div class="note">${esc(r.reps)}</div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  return h;
}

function render(){
  const app = document.getElementById('app');
  if(state.openId && !findSession(state.openId)) state.openId = null;
  app.innerHTML = state.screen==='settings' ? settingsView()
                : state.tab==='plan' ? (state.openId ? sessionView(findSession(state.openId), false) : planView())
                : state.tab==='progress' ? progressView() : todayView();
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current', !state.screen && b.dataset.tab===state.tab ? 'page' : 'false'));
  const slot = document.getElementById('timer-slot'); if(slot) slot.appendChild(timer.el);
  syncWakeLock();
}

/* ---------------- Events ---------------- */
function currentSession(){
  if(state.screen) return null;
  if(state.openId) return findSession(state.openId);
  return state.tab==='today' && !state.picker ? nextSession() : null;
}
document.querySelector('nav.tabs').addEventListener('click', e=>{
  const b = e.target.closest('button[data-tab]'); if(!b) return;
  state.tab = b.dataset.tab; state.openId = null; state.planCycle = null; state.picker = false; state.screen = null; render(); window.scrollTo(0,0);
});
document.getElementById('app').addEventListener('input', e=>{
  const el = e.target.closest('[data-f]'); if(!el) return;
  const s = currentSession(); if(!s) return;
  const log = logOf(s.id); const p = el.dataset.f.split('|');
  if(p[0]==='notes') log.notes = el.value;
  else if(p[0]==='fields'){ log.fields = log.fields||{}; log.fields[p[1]] = el.value; }
  else if(p[0]==='items'){
    log.items = log.items||{}; const o = log.items[p[1]] || (log.items[p[1]]={}); o[p[2]] = el.value;
    const x = itemByKey(s, p[1]); if(x){ o.from = x.name; o.did = swapOf(verOf(log), x, log, s).name; }
  }
  log.updatedAt = Date.now(); saveLocal();
});
document.getElementById('app').addEventListener('click', async e=>{
  const t = e.target.closest('button'); if(!t) return;
  if(t.dataset.open){ state.openId = t.dataset.open; render(); window.scrollTo(0,0); return; }
  if(t.dataset.prog){ state.pick = t.dataset.prog; render(); return; }
  if(t.dataset.ptype){ state.pickType = t.dataset.ptype; state.pick = null; render(); return; }
  if(t.dataset.cyc){ const n = +t.dataset.cyc; state.planCycle = n===curCycle().n ? null : n; render(); return; }
  if(t.dataset.act==='del-cycle'){ openSheet({kind:'delcycle', n:+t.dataset.n, ret:'[data-act="del-cycle"]'}); return; }
  if(t.dataset.act==='go-start'){ state.tab = 'today'; render(); window.scrollTo(0,0); return; }
  if(t.dataset.viewcyc){ const n = +t.dataset.viewcyc; state.tab = 'plan'; state.openId = null; state.planCycle = n===curCycle().n ? null : n; render(); window.scrollTo(0,0); return; }
  const s = currentSession();
  if(t.dataset.ver){
    state.settings.version = t.dataset.ver;
    if(s && isDone(s.id)){ const l=logOf(s.id); l.version=t.dataset.ver; stampItems(s, l); l.updatedAt=Date.now(); saveLocal(); }
    else if(s && state.logs[s.id] && state.logs[s.id].version){ delete state.logs[s.id].version; stampItems(s, state.logs[s.id]); }   // the default wins over a this-session swap
    render(); pushSettings(); return;
  }
  if(t.dataset.swap && s){ openSheet({kind:'ex', sid:s.id, key:t.dataset.swap, ret:`[data-swap="${t.dataset.swap}"]`}); return; }
  if(t.dataset.unswap && s){
    const log = logOf(s.id), x = itemByKey(s, t.dataset.unswap), sw = swapOf(verOf(log), x, log, s);
    if(sw.how==='rule'){ openSheet({kind:'unrule', sid:s.id, key:sw.key, ret:'.nm'}); return; }
    delete log.swaps[sw.key]; stampItems(s, log); log.updatedAt = Date.now(); await flush(); render(); toast(`Back to ${swapOf(verOf(log), x, log, s).name}`); return;
  }
  if(t.dataset.delRule){ delete swapRules()[t.dataset.delRule]; await flush(); render(); toast('Swap deleted'); return; }
  if(t.dataset.delMode){ delete state.settings.modeBy[t.dataset.delMode]; await flush(); render(); toast('Machine swap deleted'); return; }
  if(t.dataset.delCustom){ const [pat, name] = t.dataset.delCustom.split('|'); const l = customEx()[pat] || [], i = l.indexOf(name); if(i>=0) l.splice(i, 1); if(!l.length) delete customEx()[pat]; await flush(); render(); toast('Exercise deleted'); return; }
  if(t.dataset.rpe && s){ const log=logOf(s.id); log.rpe=+t.dataset.rpe; log.updatedAt=Date.now(); render(); saveLocal(); return; }
  const act = t.dataset.act; if(!act) return;
  if(act==='back'){ state.openId=null; render(); window.scrollTo(0,0); return; }
  if(act==='close-settings'){ state.screen = null; render(); window.scrollTo(0,0); return; }
  if(act==='swap-session' && s){ openSheet({kind: s.kind==='cardio' ? 'cardio' : 'ver', sid:s.id, ret:'[data-act="swap-session"]'}); return; }
  if(act==='undo-mode' && s){ const l = logOf(s.id); delete l.mode; l.updatedAt = Date.now(); await flush(); render(); return; }
  if(act==='undo-ver' && s){ const l = logOf(s.id); delete l.version; stampItems(s, l); l.updatedAt = Date.now(); await flush(); render(); return; }
  if(act==='reset'){
    if(!confirm('Erase every logged session and test result? This cannot be undone.' + (syncStatus().connected ? '\n\nThe synced copy on GitHub is overwritten too (GitHub keeps older versions).' : ''))) return;
    commitDelete(); state.logs = {}; state.settings.cycles = [{...DEFAULT_CYCLE}]; state.screen = null; state.planCycle = null; state.picker = false; refreshPlan(); await flush();
    render(); toast('All logged data erased'); return;
  }
  if(act==='export'){ exportData(); return; }
  if(act==='early-cycle'){ state.tab = 'today'; state.openId = null; state.picker = true; render(); window.scrollTo(0,0); return; }
  if(act==='cancel-cycle'){ state.picker = false; state.pick = null; state.pickType = null; render(); window.scrollTo(0,0); return; }
  if(act==='start-cycle'){ await startCycle(); return; }
  if(act==='import'){ document.getElementById('import-file').click(); return; }
  if(act==='gh-connect'){ connectGitHub(t); return; }
  if(act==='gh-sync'){ markDirty(); const ok = await pushNow(); toast(ok ? 'Synced' : (syncStatus().lastError || 'Offline: it will sync when you are back online')); return; }
  if(act==='gh-off'){ if(confirm('Turn off auto-sync on this device? The copy on GitHub stays where it is.')){ await disconnect(); render(); toast('Auto-sync is off'); } return; }
  if(!s) return;
  const log = logOf(s.id); log.updatedAt = Date.now();
  if(act==='done'){
    if(s.versions){ log.version = verOf(log); stampItems(s, log, true); }
    if(s.kind==='cardio'){ const m = modeOf(s, log); if(m) log.mode = m; }
    log.done = true; log.skipped = false; log.date = new Date().toISOString();
    const ok = await pushLog(s.id); state.openId = null; state.tab='today'; render(); window.scrollTo(0,0);
    const n = nextSession(); toast((ok?'Marked done.':'Marked done, but saving failed.') + (n?' Up next: '+n.title:''));
  } else if(act==='save'){
    if(s.versions && log.done){ log.version = verOf(log); stampItems(s, log); }
    if(s.kind==='cardio' && log.done && !log.mode){ const m = modeOf(s, log); if(m) log.mode = m; }
    const ok = await pushLog(s.id); toast(ok?'Saved':'Could not save');
  } else if(act==='undone'){
    log.done = false; await pushLog(s.id); render(); toast('Marked as not done');
  } else if(act==='skip'){
    log.skipped = true; await pushLog(s.id); state.openId=null; render(); window.scrollTo(0,0); toast('Skipped');
  } else if(act==='unskip'){
    log.skipped = false; await pushLog(s.id); render(); toast('Back in the queue');
  }
});

/* ---------------- Settings ---------------- */
function settingsView(){
  const rules = Object.entries(swapRules()), modes = Object.entries(state.settings.modeBy), custom = Object.entries(customEx());
  const row = (main, sub, attr, label) => `<div class="srow"><div><b>${main}</b>${sub ? `<div class="note">${sub}</div>` : ''}</div><button class="btn-sm" ${attr} aria-label="${label}">Delete</button></div>`;
  let h = `<button class="btn link" data-act="close-settings">Back</button><h1>Settings</h1><div class="trim" aria-hidden="true"></div>`;
  h += `<h2>My swaps</h2><div class="block"><h3>Exercises, every time</h3>`;
  h += rules.length ? rules.map(([k,r])=>row(`${esc(r.from)} → ${esc(r.to)}`, `${VNAME[k.slice(0,k.indexOf(':'))]} days`, `data-del-rule="${esc(k)}"`, `Delete swap ${esc(r.from)} to ${esc(r.to)}`)).join('')
    : `<p class="small muted" style="margin:4px 0 0">None yet. Tap Swap on any exercise and choose Every time.</p>`;
  h += `<h3 style="margin-top:18px">Cardio machines, every time</h3>`;
  h += modes.length ? modes.map(([c,m])=>row(`${CARDIO_DAY[c][0].toUpperCase()+CARDIO_DAY[c].slice(1)} → ${esc(CARDIO[m].label)}`, '', `data-del-mode="${c}"`, `Delete machine swap for ${CARDIO_DAY[c]}`)).join('')
    : `<p class="small muted" style="margin:4px 0 0">None. Cardio days use the machine they're written for.</p>`;
  h += `<h3 style="margin-top:18px">My exercises</h3>`;
  const mine = custom.flatMap(([p,l])=>l.map(n=>[p,n]));
  h += mine.length ? mine.map(([p,n])=>row(esc(n), esc(PATTERNS[p]||p), `data-del-custom="${esc(p+'|'+n)}"`, `Delete ${esc(n)}`)).join('')
    : `<p class="small muted" style="margin:4px 0 0">None yet. Use Add your own in the Swap sheet.</p>`;
  h += `</div><p class="small muted">Just-today swaps live on the session itself: open it and tap Undo.</p>`;
  return h;
}

/* ---------------- Swap sheet ---------------- */
let sheet = null;
const sheetEl = document.getElementById('sheet'), sheetBody = document.getElementById('sheet-body');
function openSheet(o){ sheet = o; renderSheet(); sheetEl.hidden = false; document.body.classList.add('sheet-open'); const f = sheetBody.querySelector('button, input'); if(f) f.focus(); }
function closeSheet(){
  const ret = sheet && sheet.ret; sheet = null; sheetEl.hidden = true; document.body.classList.remove('sheet-open');
  const el = ret && document.querySelector(ret); if(el) el.focus();
}
function renderSheet(){
  if(sheet.kind==='delcycle'){
    const c = cycles().find(x=>x.n===sheet.n), sm = cycleSummary(c);
    sheetBody.innerHTML = `<h2 id="sheet-title">Delete cycle ${c.n}?</h2>
      <div class="del-sum"><b>${esc(cycleLabel(c))}</b><div>${esc(sm.range)}</div><div>${sm.logged} session${sm.logged===1?'':'s'} logged${sm.logged ? `, ${sm.done} done` : ''}</div></div>
      <p class="small">This removes every session log and test result in this cycle. Other cycles, your custom exercises and your every-time swaps stay.</p>
      <button class="btn ghost" data-sh-export style="width:100%">Export backup first</button>
      <label class="f" style="margin-top:16px">Type DELETE to confirm<input type="text" id="del-confirm" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-describedby="sheet-title"></label>
      <div class="sh-actions"><button class="btn danger-fill" data-sh-delcycle disabled>Delete cycle</button><button class="btn link" data-sh="close">Cancel</button></div>`;
    return;
  }
  const s = findSession(sheet.sid), log = state.logs[s.id] || {}, v = verOf(log);
  let h = '';
  if(sheet.kind==='ex'){
    const x = itemByKey(s, sheet.key), cur = swapOf(v, x, log, s).name, alt = alternatives(x.name, v, customEx(), [cur]);
    h += `<h2 id="sheet-title">Swap ${esc(cur)}</h2><p class="small muted">Same sets and reps: ${esc(x.rx)}. ${esc(PATTERNS[alt.pattern])} options, ${VNAME[v]} first.</p>`;
    if(cur!==x.name) h += `<div class="opts"><button class="opt" data-sh-pick="${esc(x.name)}">${esc(x.name)} <small>as planned</small></button></div>`;
    h += alt.groups.map(g=>`<h3 class="sh-group">${esc(g.label)}${g.fits && g.eq!=='custom' ? ` <span class="fits">${VNAME[v]}</span>` : ''}</h3><div class="opts">${g.items.map(n=>`<button class="opt" data-sh-pick="${esc(n)}">${esc(n)}</button>`).join('')}</div>`).join('');
    h += `<h3 class="sh-group">Add your own</h3><form class="own" data-sh-own><input type="text" id="own-name" maxlength="60" placeholder="e.g. Landmine squat" autocomplete="off" aria-label="Your exercise name"><button class="btn ghost" type="submit">Add</button></form>`;
  } else if(sheet.kind==='scope'){
    const x = itemByKey(s, sheet.key), back = sheet.to===x.name;
    h += `<h2 id="sheet-title">${back ? `Back to ${esc(x.name)}?` : `Swap ${esc(x.name)} for ${esc(sheet.to)}?`}</h2><p class="small muted">Sets, reps and effort stay the same.</p>`;
    h += `<div class="sh-actions"><button class="btn primary" data-sh-scope="today">Just today</button><button class="btn ghost" data-sh-scope="always">Every time<small>${back ? `Remove the every-time swap for ${esc(x.name)}` : `Every ${esc(x.name)} on ${VNAME[v]} days from now on`}</small></button><button class="btn link" data-sh="close">Cancel</button></div>`;
  } else if(sheet.kind==='unrule'){
    const x = itemByKey(s, sheet.key), r = swapRules()[sheet.key];
    h += `<h2 id="sheet-title">Undo the swap?</h2><p class="small muted">${esc(r.to)} replaces ${esc(r.from)} every time on ${VNAME[v]} days.</p>`;
    h += `<div class="sh-actions"><button class="btn primary" data-sh-unrule="today">Just today<small>Do ${esc(x.name)} this session</small></button><button class="btn ghost" data-sh-unrule="rule">Every time<small>Delete the swap rule</small></button><button class="btn link" data-sh="close">Cancel</button></div>`;
  } else if(sheet.kind==='cardio'){
    const cur = modeOf(s, log);
    h += `<h2 id="sheet-title">Swap session</h2><p class="small muted">Same structure and times on another machine.</p><div class="opts">`;
    h += Object.entries(CARDIO).map(([k,c])=>`<button class="opt" data-sh-mode="${k}" aria-pressed="${k===cur}">${esc(c.label)}${k===nativeMode(s) ? ' <small>as written</small>' : ''}</button>`).join('') + `</div>`;
  } else if(sheet.kind==='cscope'){
    h += `<h2 id="sheet-title">${esc(CARDIO[sheet.to].label)}</h2><div class="sh-actions"><button class="btn primary" data-sh-cscope="today">Just today</button><button class="btn ghost" data-sh-cscope="always">Every time<small>All ${CARDIO_DAY[s.code]} from now on</small></button><button class="btn link" data-sh="close">Cancel</button></div>`;
  } else if(sheet.kind==='ver'){
    h += `<h2 id="sheet-title">Swap session</h2><p class="small muted">Do this session with different equipment. Your default stays ${VNAME[state.settings.version]}.</p><div class="opts">`;
    h += ['bw','db','gym'].map(k=>`<button class="opt" data-sh-ver="${k}" aria-pressed="${k===v}">${VNAME[k]}</button>`).join('') + `</div>`;
  }
  sheetBody.innerHTML = h + (sheet.kind==='scope' || sheet.kind==='cscope' || sheet.kind==='unrule' ? '' : `<div class="sh-actions"><button class="btn link" data-sh="close">Cancel</button></div>`);
}
async function applyExSwap(scope){
  const s = findSession(sheet.sid), x = itemByKey(s, sheet.key), key = sheet.key, to = sheet.to, back = to===x.name;
  const log = logOf(s.id);
  if(scope==='today'){
    log.swaps = log.swaps || {};
    if(back){ if(swapRules()[key] && !log.done) log.swaps[key] = null; else delete log.swaps[key]; }
    else log.swaps[key] = to;
  } else {
    if(back) delete swapRules()[key]; else swapRules()[key] = {from:x.name, to, v:key.slice(0, key.indexOf(':'))};
    if(log.swaps) delete log.swaps[key];
    if(log.done && !back) (log.swaps = log.swaps || {})[key] = to;    // finished sessions keep what they record
  }
  stampItems(s, log); log.updatedAt = Date.now();
  closeSheet(); await flush(); render();
  toast(back ? `Back to ${x.name}` : scope==='today' ? `${to} for this session` : `${to} every time`);
}
sheetEl.addEventListener('click', async e=>{
  if(e.target.closest('[data-sh="close"]') || e.target.classList.contains('sheet-backdrop')){ closeSheet(); return; }
  const t = e.target.closest('button'); if(!t || !sheet) return;
  if(t.dataset.shExport!==undefined){ exportData(); return; }
  if(t.dataset.shDelcycle!==undefined){
    if(document.getElementById('del-confirm').value.trim()!=='DELETE') return;
    const n = sheet.n; sheet.ret = null; closeSheet(); deleteCycle(n); return;
  }
  const s = findSession(sheet.sid);
  if(t.dataset.shPick){ sheet = {...sheet, kind:'scope', to:t.dataset.shPick}; renderSheet(); sheetBody.querySelector('button').focus(); return; }
  if(t.dataset.shScope){ await applyExSwap(t.dataset.shScope); return; }
  if(t.dataset.shUnrule){
    const log = logOf(s.id), x = itemByKey(s, sheet.key);
    if(t.dataset.shUnrule==='today') (log.swaps = log.swaps || {})[sheet.key] = null; else delete swapRules()[sheet.key];
    stampItems(s, log); log.updatedAt = Date.now(); closeSheet(); await flush(); render(); toast(`Back to ${x.name}`); return;
  }
  if(t.dataset.shMode){ sheet = {...sheet, kind:'cscope', to:t.dataset.shMode}; renderSheet(); sheetBody.querySelector('button').focus(); return; }
  if(t.dataset.shCscope){
    const log = logOf(s.id), m = sheet.to;
    if(t.dataset.shCscope==='today' || log.done) log.mode = m;
    if(t.dataset.shCscope==='always'){ if(m===nativeMode(s)) delete state.settings.modeBy[s.code]; else state.settings.modeBy[s.code] = m; if(!log.done) delete log.mode; }
    log.updatedAt = Date.now(); closeSheet(); await flush(); render(); toast(`${CARDIO[m].label}${t.dataset.shCscope==='always' ? ' every time' : ' for this session'}`); return;
  }
  if(t.dataset.shVer){
    const log = logOf(s.id), nv = t.dataset.shVer;
    if(nv===state.settings.version) delete log.version; else log.version = nv;
    stampItems(s, log); log.updatedAt = Date.now(); closeSheet(); await flush(); render(); toast(`${VNAME[nv]} for this session`); return;
  }
});
sheetEl.addEventListener('input', e=>{
  if(e.target.id==='del-confirm') sheetBody.querySelector('[data-sh-delcycle]').disabled = e.target.value.trim()!=='DELETE';
});
sheetEl.addEventListener('submit', e=>{
  e.preventDefault(); if(!sheet) return;
  const name = document.getElementById('own-name').value.replace(/[|<>]/g,'').trim().replace(/\s+/g,' ').slice(0, 60); if(!name) return;
  const s = findSession(sheet.sid), x = itemByKey(s, sheet.key), p = patternOf(x.name), list = customEx()[p] = customEx()[p] || [];
  const known = alternatives(x.name, verOf(state.logs[s.id] || {}), customEx()).groups.flatMap(g=>g.items).concat(x.name);
  const same = known.find(n=>slug(n)===slug(name));
  if(!same) list.push(name);
  sheet = {...sheet, kind:'scope', to: same || name}; renderSheet(); sheetBody.querySelector('button').focus();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && sheet) closeSheet(); });
document.getElementById('open-settings').addEventListener('click', ()=>{ state.screen = 'settings'; render(); window.scrollTo(0,0); });

async function startCycle(){
  commitDelete();
  const c = curCycle(), fin = PLAN.find(s=>s.kind==='test' && s.week===12), now = new Date().toISOString();
  const {type, pick} = pickedProgram();
  // Skip the week-1 tests only when last cycle's week-12 tests are done and comparable (same type).
  const next = {n:nextCycleN(), program:pick, type, baseline: !(c && typeOf(c)===type && fin && isDone(fin.id)), startedAt: now};
  if(c) c.finishedAt = now;
  cycles().push(next);
  state.pick = null; state.pickType = null; state.picker = false; state.openId = null; state.planCycle = null; state.tab = 'today';
  refreshPlan(); await flush(); render(); window.scrollTo(0,0);
  toast(`Cycle ${next.n} started: ${progOf(next).name}`);
}

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
    commitDelete();
    state.logs = r.remote.logs; state.settings = normSettings(r.remote.settings); state.openId = null; state.planCycle = null; state.picker = false; refreshPlan();
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
  commitDelete();
  state.logs = v.logs; state.settings = normSettings(v.settings); state.openId = null; state.planCycle = null; state.picker = false; refreshPlan();
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
    state.logs = d.logs; state.settings = Object.assign(state.settings, d.settings); state.meta = d.meta; refreshPlan();
    await initSync({
      getData: ()=>({logs:persistLogs(), settings:persistSettings()}),
      onChange: ()=>{ setSync(syncLabel()); if(state.tab==='progress' && document.activeElement?.id!=='gh-token') render(); }
    });
    setSync(syncLabel());
  }catch(e){ setSync('Storage unavailable: changes will not be kept'); }
  refreshPlan();
  render();
  requestPersist();
  initSW();
})();
