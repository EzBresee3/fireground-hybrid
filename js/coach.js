/* ---------------- Coaching tips ----------------
   Reads what you logged (load, reps like "10,10,9", session effort 1–10, cardio time) and
   suggests what to do next. It never changes the plan: it only adds a short tip.
   Deload and test weeks are easy on purpose, so they never get tips and never count as evidence.
   Every tip returns {dir:'up'|'down'|'info', text} as plain text (the caller escapes it).        */

import { PH, planFor } from './program.js';

export const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
const light = s => ['deload','test'].includes(PH(s.week));
const round5 = n => Math.max(5, Math.round(n / 5) * 5);
const mean = a => a.reduce((x,y)=>x+y, 0) / a.length;

/* Every session before s, newest first: earlier this cycle, then earlier cycles. */
export function* walkBack(ctx, s){
  const cs = ctx.cycles, ci = cs.findIndex(c=>c.n===s.cycle);
  for(let i=ci; i>=0; i--){
    const plan = planFor(cs[i]);
    let j = i===ci ? plan.findIndex(x=>x.id===s.id) : plan.length;
    while(--j >= 0) yield plan[j];
  }
}

/* "3 × 10 @ RPE 7" -> {sets:3, reps:10}. Distances and holds ("4 × 40 m", "3 × 30 s") are not reps. */
export function parseRx(rx){
  const m = /^(\d+)\s*×\s*(\d+)(?!\s*(?:m|s|min|cal)\b)(?![\d.])/.exec(rx || '');
  return m ? {sets:+m[1], reps:+m[2]} : null;
}
/* "10,10,9" / "10 10 9" / "3x10" -> [10,10,9] */
export function parseReps(str){
  const t = String(str || '').trim(), m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(t);
  if(m) return Array(Math.min(+m[1], 20)).fill(+m[2]);
  return t.split(/[^\d]+/).filter(Boolean).map(Number).filter(n=>n>0 && n<200);
}
/* "185", "185 lb", "40s" -> number; "2x40", "bodyweight" -> NaN */
export function parseLoad(str){
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|s)?\s*$/i.exec(String(str || ''));
  return m ? +m[1] : NaN;
}
const LOWER = /squat|deadlift|rdl|lunge|step-up|hip thrust|bridge|hinge|swing/i;
function bump(v, name){
  const lower = LOWER.test(name);
  if(v==='gym') return lower ? [10,20] : [5,10];
  return lower ? [5,10] : [5,5];
}
/* Estimated load for `reps` reps with about 3 in reserve (RPE 7), from a set of `done` reps at `load` (Epley). */
const loadFor = (load, done, reps) => load * (1 + done/30) / (1 + (reps + 3)/30);

function itemIn(p, v, key){ return p.versions && (p.versions[v] || []).find(x=>v+':'+slug(x.name)===key); }

/* Tip for one logged lift in session s (not yet done), version v. */
export function liftTip(ctx, s, x, v){
  if(!x.log || light(s) || (ctx.logs[s.id] && ctx.logs[s.id].done)) return null;
  const cur = parseRx(x.rx); if(!cur) return null;
  const key = v+':'+slug(x.name);

  // Most recent non-light session with this exercise logged
  let prev = null;
  for(const p of walkBack(ctx, s)){
    const l = ctx.logs[p.id], e = l && l.items && l.items[key];
    if(e && (e.load || e.reps) && !light(p)){ prev = {p, l, e, x:itemIn(p, v, key)}; break; }
  }
  if(!prev) return seedTip(ctx, s, x, v, cur);

  const pr = prev.x && parseRx(prev.x.rx), D = parseReps(prev.e.reps), L = parseLoad(prev.e.load), r = prev.l.rpe || null;
  if(!pr || !D.length) return null;
  const hitAll = D.length >= pr.sets && D.every(d=>d >= pr.reps);
  const short = D.reduce((t,d)=>t + Math.max(0, pr.reps - d), 0) + Math.max(0, pr.sets - D.length) * pr.reps;
  const over = Math.min(...D) - pr.reps;
  const did = `${prev.e.reps}${isNaN(L) ? '' : ' at '+L+' lb'}`;
  const eff = r ? `, effort ${r}` : '';

  if(v!=='bw' && !isNaN(L)){
    if(cur.reps > pr.reps + 1){
      const t = round5(loadFor(L, mean(D.slice(0, pr.sets)), cur.reps));
      if(t < L) return {dir:'info', text:`More reps today than last time (${did}). Start around ${t} lb.`};
    }
    if(hitAll && ((r && r <= 6) || over >= 2)){
      const [a,b] = bump(v, x.name);
      return {dir:'up', text:`Last time looked easy (${did}${eff}). Try ${a===b ? L+a : (L+a)+'–'+(L+b)} lb today.`};
    }
    if(short >= 1 && (!r || r >= 9)){
      return short >= 3
        ? {dir:'down', text:`Last time was a grind (${did}, target ${pr.sets} × ${pr.reps}). Drop to about ${round5(L*0.9)} lb and own every rep.`}
        : {dir:'down', text:`Last time was close (${did}). Repeat ${L} lb and aim to hit every rep.`};
    }
    return null;
  }
  // Bodyweight, or a load that isn't a single number
  if(hitAll && (over >= 3 || (r && r <= 5)))
    return {dir:'up', text:`You beat the target easily last time (${prev.e.reps} vs ${pr.reps}${eff}). Use a harder variation, slow the lowering to 3–4 s, or wear a loaded backpack.`};
  if(short >= 3 && (!r || r >= 9))
    return {dir:'down', text:`Last time was tough (${prev.e.reps} vs ${pr.reps}). Use an easier variation and build back up.`};
  return null;
}

/* New exercise (no history): start from the lift that held this slot before, e.g. back squat -> front squat. */
function seedTip(ctx, s, x, v, cur){
  if(v==='bw') return null;
  for(const p of walkBack(ctx, s)){
    if(p.title!==s.title || light(p) || !p.versions) continue;
    const px = (p.versions[v] || []).find(y=>y.lab===x.lab && y.name!==x.name); if(!px) continue;
    const l = ctx.logs[p.id], e = l && l.items && l.items[v+':'+slug(px.name)]; if(!e) continue;
    const L = parseLoad(e.load), D = parseReps(e.reps); if(isNaN(L) || !D.length) continue;
    const t = round5(0.85 * loadFor(L, mean(D), cur.reps));
    return {dir:'info', text:`New lift. From your ${px.name.toLowerCase()} (${L} lb × ${e.reps}, cycle ${p.cycle} wk ${p.week}), start around ${t} lb and adjust after the first set.`};
  }
  return null;
}

/* ---------------- Cardio and circuits ---------------- */
const NOUN = {I:'interval', H:'threshold', R:'run', Z:'zone 2', F:'fireground circuit', C:'test circuit'};
const easyDay = p => p.code==='Z' || PH(p.week)==='deload' || /easy|aerobic base/i.test(p.title);

export function sessionTip(ctx, s){
  if(!NOUN[s.code] || s.bench || PH(s.week)==='test' || (ctx.logs[s.id] && ctx.logs[s.id].done)) return null;
  const easy = easyDay(s), noun = NOUN[s.code], last = [];
  for(const p of walkBack(ctx, s)){
    if(p.code!==s.code || p.bench || PH(p.week)==='test' || easyDay(p)!==easy) continue;
    const l = ctx.logs[p.id]; if(!l || !l.done || !l.rpe) continue;
    last.push({p, l}); if(last.length===2) break;
  }
  if(last.length < 2) return null;
  const [a, b] = last, rp = `effort ${b.l.rpe} and ${a.l.rpe}`;
  const mins = last.map(({p,l})=>({did: parseFloat((l.fields||{}).duration), plan: p.minutes}));
  if(mins.every(m=>m.did >= m.plan * 1.25) && last.every(({l})=>l.rpe <= 6))
    return {dir:'up', text:`You've gone longer than planned the last two times (${mins[1].did} and ${mins[0].did} min vs about ${mins[0].plan}) and it felt easy. You're ready for more: keep the extra time on easy days, and on hard days add a round instead of more minutes.`};
  if(easy){
    if(last.every(({l})=>l.rpe >= 7)) return {dir:'down', text:`Easy ${noun} days have felt hard lately (${rp}). Slow down until you can talk in full sentences: easy days only build the engine if they stay easy.`};
    if(last.every(({l})=>l.rpe <= 3)) return {dir:'up', text:`Easy ${noun} days feel very easy (${rp}). If you have time, add 5–10 minutes.`};
    return null;
  }
  const circuit = s.code==='F' || s.code==='C';
  if(last.every(({l})=>l.rpe <= 6)) return {dir:'up', text: circuit
    ? `Your last two ${noun}s felt easy (${rp}). Go heavier on the loads or move faster between stations.`
    : `Your last two hard ${noun} sessions felt easy (${rp}). Push the hard efforts harder today, or add 1–2 rounds.`};
  if(last.every(({l})=>l.rpe >= 9)) return {dir:'down', text: circuit
    ? `Your last two ${noun}s felt maxed out (${rp}). Scale a station or ease the pace so you finish strong.`
    : `Your last two hard ${noun} sessions felt maxed out (${rp}). Ease the hard pace slightly or drop a round so every rep stays strong.`};
  return null;
}
