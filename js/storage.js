/* ---------------- IndexedDB storage ----------------
   A tiny key-value wrapper (same idea as idb-keyval). One database, one object store.
   Keys: 'logs'     -> { [sessionId]: {items, fields, notes, rpe, done, skipped, date?, version?, mode?, swaps?, updatedAt} }
                         items: {'gym:back-squat': {load, reps, from?, did?}}  (from = planned exercise, did = actually done)
                         swaps: {'gym:back-squat': 'Leg press' | null}       (this session only; null = keep the planned one)
         'settings' -> { version: 'bw' | 'db' | 'gym', mode: 'bike' | 'stairs' | 'run',
                         cycles: [{n, program, type, baseline, startedAt, finishedAt}],  // may be empty
                         modeBy: {I|H|R|Z: machine},  // "every time" cardio swaps
                         swaps: {rules: {'gym:back-squat': {from, to, v}}, custom: {pattern: [names]}} }
         'meta'     -> { firstUse, lastBackup }                                         */

const DB_NAME = 'fireground-hybrid';
const STORE = 'kv';
const LEGACY_KEY = 'fireground-hybrid.v1';
const EXPORT_APP = 'fireground-hybrid';
const EXPORT_FORMAT = 1;

let dbp = null;
function db(){
  if(!dbp) dbp = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = ()=> req.result.createObjectStore(STORE);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
  return dbp;
}
async function tx(mode, fn){
  const d = await db();
  return new Promise((resolve, reject)=>{
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = ()=> resolve(out && 'result' in out ? out.result : undefined);
    t.onerror = t.onabort = ()=> reject(t.error);
  });
}
export const get = key => tx('readonly', s => s.get(key));
/* Values are copied when set/setMany is called, not when the database is ready, so later in-memory
   changes (like a cycle delete that is still inside its Undo window) can never leak into a save. */
const snap = v => typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
export const set = (key, val) => { const v = snap(val); return tx('readwrite', s => { s.put(v, key); }); };
export const setMany = entries => { const copies = entries.map(([k,v])=>[k, snap(v)]); return tx('readwrite', s => { for(const [k,v] of copies) s.put(v, k); }); };

/* Load everything the app needs. Migrates the old single-file localStorage data once, if present. */
export async function loadAll(){
  let [logs, settings, meta] = await Promise.all([get('logs'), get('settings'), get('meta')]);
  if(logs === undefined){
    logs = {}; settings = settings || {};
    try{
      const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      if(old && typeof old === 'object'){ logs = old.logs || {}; settings = Object.assign(settings, old.settings || {}); }
    }catch(e){}
    meta = Object.assign({firstUse: new Date().toISOString()}, meta || {});
    await setMany([['logs', logs], ['settings', settings], ['meta', meta]]);
  }
  return {logs, settings: settings || {}, meta: meta || {}};
}

/* Ask the browser not to evict our data. Safe to call more than once. */
export async function requestPersist(){
  try{
    if(!navigator.storage || !navigator.storage.persist) return false;
    if(await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  }catch(e){ return false; }
}

/* ---------------- Backup ---------------- */
export function buildExport(logs, settings){
  return {app: EXPORT_APP, format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), logs, settings};
}

// Cycle 1 ids are w1d1..w12d6; later cycles are prefixed: c2:w1d1, c3:w1d1...
const ID_RE = /^(c([2-9]|[1-9]\d+):)?w([1-9]|1[0-2])d[1-6]$/;
const VERSIONS = ['bw','db','gym'];
const MODES = ['run','bike','rower','assault','stairs','ruck','swim'];
const str = x => typeof x === 'string' && x.length <= 200;
const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);

/* Returns {ok:true, logs, settings, exportedAt} or {ok:false, error}.
   Accepts this app's export file and the old single-file {logs, settings} shape. */
export function validateImport(data){
  if(!isObj(data)) return {ok:false, error:'This file is not a Fireground Hybrid backup.'};
  if(data.app !== undefined && data.app !== EXPORT_APP) return {ok:false, error:'This file is from a different app.'};
  if(!isObj(data.logs)) return {ok:false, error:'The backup has no session logs.'};
  for(const [id, log] of Object.entries(data.logs)){
    if(!ID_RE.test(id)) return {ok:false, error:`Unknown session "${id}" in the backup.`};
    if(!isObj(log)) return {ok:false, error:`Session ${id} is not readable.`};
    if(log.items !== undefined && !isObj(log.items)) return {ok:false, error:`Session ${id} has bad lift entries.`};
    if(log.fields !== undefined && !isObj(log.fields)) return {ok:false, error:`Session ${id} has bad results.`};
    if(log.notes !== undefined && typeof log.notes !== 'string') return {ok:false, error:`Session ${id} has bad notes.`};
    if(log.rpe !== undefined && log.rpe !== null && !(Number.isInteger(log.rpe) && log.rpe>=1 && log.rpe<=10)) return {ok:false, error:`Session ${id} has a bad effort score.`};
    if(log.version !== undefined && !VERSIONS.includes(log.version)) return {ok:false, error:`Session ${id} has an unknown equipment version.`};
    if(log.mode !== undefined && !MODES.includes(log.mode)) return {ok:false, error:`Session ${id} has an unknown cardio machine.`};
    if(log.swaps !== undefined && !(isObj(log.swaps) && Object.values(log.swaps).every(x=>x===null || str(x)))) return {ok:false, error:`Session ${id} has unreadable exercise swaps.`};
    if(log.items && !Object.values(log.items).every(e=>isObj(e) && (e.did===undefined || str(e.did)) && (e.from===undefined || str(e.from)))) return {ok:false, error:`Session ${id} has bad lift entries.`};
  }
  const settings = isObj(data.settings) ? data.settings : {};
  if(settings.version !== undefined && !VERSIONS.includes(settings.version)) return {ok:false, error:'The backup has an unknown equipment setting.'};
  if(settings.mode !== undefined && !MODES.includes(settings.mode)) return {ok:false, error:'The backup has an unknown interval machine setting.'};
  if(settings.modeBy !== undefined && !(isObj(settings.modeBy) && Object.values(settings.modeBy).every(m=>MODES.includes(m)))) return {ok:false, error:'The backup has an unknown cardio machine setting.'};
  if(settings.swaps !== undefined){
    const w = settings.swaps;
    const okRules = isObj(w) && (w.rules===undefined || (isObj(w.rules) && Object.entries(w.rules).every(([k,r])=>/^(bw|db|gym):/.test(k) && isObj(r) && str(r.from) && str(r.to))));
    const okCustom = isObj(w) && (w.custom===undefined || (isObj(w.custom) && Object.values(w.custom).every(a=>Array.isArray(a) && a.every(str))));
    if(!okRules || !okCustom) return {ok:false, error:'The backup has unreadable exercise swaps.'};
  }
  if(settings.cycles !== undefined){
    const c = settings.cycles;
    // Deleted cycles leave gaps, and every cycle can be deleted: numbers only need to increase.
    if(!Array.isArray(c) || !c.every((x,i)=> isObj(x) && Number.isInteger(x.n) && x.n >= 1 && (i===0 || x.n > c[i-1].n) && typeof x.program==='string' && (x.type===undefined || ['hybrid','strength'].includes(x.type))))
      return {ok:false, error:'The backup has an unreadable list of cycles.'};
  }
  return {ok:true, logs:data.logs, settings, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null};
}
