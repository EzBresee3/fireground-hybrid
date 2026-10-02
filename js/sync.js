/* ---------------- Auto-sync to a private GitHub Gist ----------------
   After every local save, the full log (same JSON as "Export data") is uploaded to one private
   gist file. Each upload is a gist revision, so GitHub keeps the history. Offline or failed
   uploads stay marked as pending (in IndexedDB) and retry when the app is online again.
   Stored under IndexedDB key 'sync': {token, gistId, gistUrl, lastSyncedAt, lastError, dirty}   */

import { get, set, buildExport, validateImport } from './storage.js';

const API = 'https://api.github.com';
const FILE = 'fireground-hybrid.json';
const DESCRIPTION = 'Fireground Hybrid log (auto-sync)';
const PUSH_DELAY = 3000;

let cfg = null;               // persisted sync state, null when not connected
let getData = () => ({});     // () => {logs, settings}
let onChange = () => {};      // called whenever status changes
let timer = null, pushing = null, again = false, rev = 0;

export const status = () => cfg ? {connected:true, gistUrl:cfg.gistUrl, lastSyncedAt:cfg.lastSyncedAt, lastError:cfg.lastError, pending:!!cfg.dirty} : {connected:false};

async function save(){ try{ await set('sync', cfg); }catch(e){} }

class GitHubError extends Error { constructor(msg, code){ super(msg); this.code = code; } }
async function gh(path, opts={}, token=cfg && cfg.token){
  let res;
  try{
    res = await fetch(API + path, Object.assign({}, opts, {headers:{
      'Accept':'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28',
      'Authorization':'Bearer ' + token, ...(opts.body ? {'Content-Type':'application/json'} : {})
    }}));
  }catch(e){ throw new GitHubError('offline', 'offline'); }
  if(res.status === 401) throw new GitHubError('GitHub rejected the token. It may have expired or been revoked.', 'auth');
  if(res.status === 404) throw new GitHubError('Not found on GitHub.', 'notfound');
  if(res.status === 403 || res.status === 429) throw new GitHubError('GitHub refused the request. Check the token has the "gist" permission.', 'forbidden');
  if(!res.ok) throw new GitHubError('GitHub error ' + res.status + '.', 'http');
  return res.status === 204 ? null : res.json();
}

const payload = () => JSON.stringify(buildExport(getData().logs, getData().settings), null, 1);

async function findGist(token){
  for(let page=1; page<=10; page++){
    const list = await gh(`/gists?per_page=100&page=${page}`, {}, token);
    const hit = list.find(g => g.files && g.files[FILE]);
    if(hit) return hit;
    if(list.length < 100) return null;
  }
  return null;
}
async function readGist(id, token){
  const g = await gh('/gists/' + id, {}, token);
  const f = g.files && g.files[FILE];
  if(!f) return {gist:g, data:null};
  let text = f.content;
  if(f.truncated){ const r = await fetch(f.raw_url); text = await r.text(); }
  try{ return {gist:g, data:JSON.parse(text)}; }catch(e){ return {gist:g, data:null}; }
}

/* ---------------- Public API ---------------- */
export async function initSync(opts){
  getData = opts.getData; onChange = opts.onChange;
  try{ cfg = (await get('sync')) || null; }catch(e){ cfg = null; }
  window.addEventListener('online', ()=>{ if(cfg && cfg.dirty) pushNow(); });
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && cfg && cfg.dirty) pushNow(); });
  if(cfg && cfg.dirty) pushNow();
  return status();
}

/* Call after every successful local save. */
export function markDirty(){
  if(!cfg) return;
  rev++;
  if(!cfg.dirty){ cfg.dirty = true; save(); onChange(status()); }
  clearTimeout(timer); timer = setTimeout(pushNow, PUSH_DELAY);
}

export function pushNow(opts={}){
  clearTimeout(timer); timer = null;
  if(!cfg) return Promise.resolve(false);
  if(pushing){ again = true; return pushing; }
  const c = cfg, startRev = rev;
  pushing = (async ()=>{
    let ok = false;
    try{
      const body = JSON.stringify({files:{[FILE]:{content:payload()}}});
      const keepalive = !!opts.keepalive && body.length < 60000;
      let g;
      try{
        g = c.gistId ? await gh('/gists/' + c.gistId, {method:'PATCH', body, keepalive}, c.token) : null;
      }catch(e){ if(e.code !== 'notfound') throw e; g = null; } // gist was deleted: make a new one
      if(!g) g = await gh('/gists', {method:'POST', body:JSON.stringify({description:DESCRIPTION, public:false, files:{[FILE]:{content:payload()}}})}, c.token);
      c.gistId = g.id; c.gistUrl = g.html_url;
      c.lastSyncedAt = new Date().toISOString(); c.lastError = null; c.dirty = rev !== startRev;
      ok = true;
    }catch(e){
      if(e.code !== 'offline') c.lastError = e.message;
    }
    pushing = null;
    if(cfg !== c) return false;   // disconnected meanwhile
    await save(); onChange(status());
    if(again){ again = false; return pushNow(); }
    return ok;
  })();
  return pushing;
}

/* Connect with a token. Returns one of:
   {ok:false, error}                         token or network problem
   {ok:true, found:false}                    no synced copy yet; this device's data was uploaded
   {ok:true, found:true, remote:{logs, settings, exportedAt}}   a synced copy exists; the caller
       decides: useRemote() or keepLocal()                                                        */
export async function connect(token){
  token = token.trim();
  if(!token) return {ok:false, error:'Paste a token first.'};
  let hit;
  try{ hit = await findGist(token); }
  catch(e){ return {ok:false, error: e.code === 'offline' ? 'You need to be online to connect.' : e.message}; }
  cfg = {token, gistId:null, gistUrl:null, lastSyncedAt:null, lastError:null, dirty:true};
  if(hit){
    let r;
    try{ r = await readGist(hit.id, token); }catch(e){ cfg = null; return {ok:false, error:e.message}; }
    cfg.gistId = hit.id; cfg.gistUrl = hit.html_url;
    const v = r.data ? validateImport(r.data) : {ok:false};
    if(v.ok){ cfg.dirty = false; await save(); onChange(status()); return {ok:true, found:true, remote:v}; }
  }
  await save();
  const ok = await pushNow();
  if(!ok){ const err = (cfg && cfg.lastError) || 'Could not reach GitHub.'; await disconnect(); return {ok:false, error:err}; }
  return {ok:true, found:false};
}

/* After connect() found a copy: the app has replaced its data with it. */
export async function useRemote(){ cfg.lastSyncedAt = new Date().toISOString(); cfg.dirty = false; await save(); onChange(status()); }
/* After connect() found a copy: overwrite it with this device's data. */
export function keepLocal(){ cfg.dirty = true; save(); return pushNow(); }

export async function disconnect(){ clearTimeout(timer); cfg = null; try{ await set('sync', null); }catch(e){} onChange(status()); }
