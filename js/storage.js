/* ---------------- IndexedDB storage ----------------
   A tiny key-value wrapper (same idea as idb-keyval). One database, one object store.
   Keys: 'logs'     -> { [sessionId]: {items, fields, notes, rpe, done, skipped, date?, version?, updatedAt} }
         'settings' -> { version: 'bw' | 'db' | 'gym' }
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
export const set = (key, val) => tx('readwrite', s => { s.put(val, key); });
export const setMany = entries => tx('readwrite', s => { for(const [k,v] of entries) s.put(v, k); });

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

const ID_RE = /^w([1-9]|1[0-2])d[1-6]$/;
const VERSIONS = ['bw','db','gym'];
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
  }
  const settings = isObj(data.settings) ? data.settings : {};
  if(settings.version !== undefined && !VERSIONS.includes(settings.version)) return {ok:false, error:'The backup has an unknown equipment setting.'};
  return {ok:true, logs:data.logs, settings, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null};
}
