/* ---------------- Exercise library ----------------
   Every exercise in the program is tagged with a movement pattern and the equipment it needs,
   and each pattern has alternatives across equipment types. Used by the Swap sheet.
   Also: the cardio machines a whole cardio session can be swapped to.                           */

export const PATTERNS = {
  'squat':'Squat', 'hinge':'Hinge', 'single-leg':'Single leg', 'h-push':'Horizontal push', 'v-push':'Vertical push',
  'h-pull':'Horizontal pull', 'v-pull':'Vertical pull', 'carry':'Carry', 'core-rot':'Core: anti-rotation',
  'core-ext':'Core: anti-extension', 'core-lat':'Core: lateral', 'power':'Power', 'grip':'Grip',
  'full-body':'Full body', 'engine':'Engine', 'stair':'Stair climb', 'drag':'Drag', 'hose':'Hose pull', 'crawl':'Crawl', 'strike':'Strike'
};
export const EQUIPMENT = {
  'bodyweight':'Bodyweight', 'band':'Band', 'dumbbell':'Dumbbell', 'kettlebell':'Kettlebell', 'barbell':'Barbell',
  'cable':'Cable', 'machine':'Machine', 'sled':'Sled', 'pull-up bar':'Pull-up bar', 'bench/box':'Bench / box',
  'cardio machine':'Cardio machine', 'other':'Other gear'
};
/* Equipment that fits each version, shown first in the Swap sheet. */
export const VERSION_EQUIPMENT = {
  bw:['bodyweight','band','pull-up bar','bench/box'],
  db:['dumbbell','kettlebell','band','bench/box'],
  gym:['barbell','machine','cable','sled','pull-up bar','cardio machine']
};

/* name -> 'pattern|equipment+equipment' (first equipment is the main one) */
const T = {
  // squat
  'Back squat':'squat|barbell', 'Front squat':'squat|barbell', 'Safety-bar squat':'squat|barbell', 'Goblet squat':'squat|dumbbell+kettlebell',
  'Heels-elevated goblet squat':'squat|dumbbell+kettlebell', 'Double dumbbell front squat':'squat|dumbbell', 'Air squats':'squat|bodyweight',
  // hinge
  'Trap bar deadlift':'hinge|barbell', 'Conventional deadlift':'hinge|barbell', 'Barbell Romanian deadlift':'hinge|barbell',
  'Dumbbell Romanian deadlift':'hinge|dumbbell', 'Heavy kettlebell deadlift':'hinge|kettlebell', 'Dumbbell hip thrust':'hinge|dumbbell+bench/box',
  'Single-leg hip thrust':'hinge|bodyweight+bench/box', 'Single-leg hip thrust, 3-second hold':'hinge|bodyweight+bench/box',
  'Single-leg glute bridge, feet elevated':'hinge|bodyweight+bench/box', 'Single-leg RDL':'hinge|bodyweight', 'Single-leg RDL with reach':'hinge|bodyweight',
  'B-stance hip hinge':'hinge|bodyweight', 'Single-leg dumbbell RDL':'hinge|dumbbell', 'Kickstand dumbbell RDL':'hinge|dumbbell', 'Single-leg kettlebell deadlift':'hinge|kettlebell',
  // single leg
  'Bulgarian split squat':'single-leg|bodyweight+bench/box', 'Skater squat':'single-leg|bodyweight', 'Single-leg box squat':'single-leg|bodyweight+bench/box',
  'Reverse lunge':'single-leg|bodyweight', 'Lateral lunge':'single-leg|bodyweight', 'Curtsy lunge':'single-leg|bodyweight',
  'Dumbbell step-up':'single-leg|dumbbell+bench/box', 'Dumbbell walking lunge':'single-leg|dumbbell', 'Dumbbell rear-foot-elevated split squat':'single-leg|dumbbell+bench/box',
  'Dumbbell reverse lunges':'single-leg|dumbbell', 'Box step-ups':'single-leg|bench/box',
  // horizontal push
  'Bench press':'h-push|barbell+bench/box', 'Incline bench press':'h-push|barbell+bench/box', 'Close-grip bench press':'h-push|barbell+bench/box',
  'Dumbbell floor press':'h-push|dumbbell', 'Dumbbell incline press':'h-push|dumbbell+bench/box', 'Close-grip dumbbell press':'h-push|dumbbell',
  'Close-grip dumbbell floor press':'h-push|dumbbell', 'Push-ups':'h-push|bodyweight', 'Deficit push-ups':'h-push|bodyweight', 'Diamond push-ups':'h-push|bodyweight',
  'Decline push-ups':'h-push|bodyweight+bench/box', 'Weighted push-ups':'h-push|bodyweight+other', 'Dips':'h-push|bodyweight+machine', 'Chair dips':'h-push|bodyweight+bench/box',
  'Dumbbell push-up to row':'h-push|dumbbell',
  // vertical push
  'Standing barbell press':'v-push|barbell', 'Push press':'v-push|barbell', 'Half-kneeling landmine press':'v-push|barbell', 'Standing landmine press':'v-push|barbell',
  'Seated dumbbell press':'v-push|dumbbell+bench/box', 'Standing dumbbell press':'v-push|dumbbell', 'Half-kneeling dumbbell press':'v-push|dumbbell',
  'Standing single-arm dumbbell press':'v-push|dumbbell', 'Kettlebell bottoms-up press':'v-push|kettlebell', 'Dumbbell push press':'v-push|dumbbell',
  'Pike push-up':'v-push|bodyweight', 'Pike push-up, 3-second lowering':'v-push|bodyweight', 'Feet-elevated pike push-up':'v-push|bodyweight+bench/box',
  'Ladder raise':'v-push|bodyweight', 'Landmine walk-up press':'v-push|barbell', 'Ceiling breach and pull':'v-push|band+other',
  'Cable push and pull-down':'v-push|cable', 'Push press + bent-over row':'v-push|dumbbell',
  // horizontal pull
  'Chest-supported row':'h-pull|dumbbell+bench/box', 'Chest-supported dumbbell row':'h-pull|dumbbell+bench/box', 'Barbell row':'h-pull|barbell', 'Pendlay row':'h-pull|barbell',
  'Seated cable row':'h-pull|cable', 'One-arm dumbbell row':'h-pull|dumbbell+bench/box', 'Single-arm dumbbell row':'h-pull|dumbbell+bench/box',
  'Single-arm dumbbell row, 2-second pause':'h-pull|dumbbell+bench/box', 'Dumbbell bent-over row':'h-pull|dumbbell', 'Staggered-stance kettlebell row':'h-pull|kettlebell',
  'Table rows':'h-pull|bodyweight', 'Underhand table rows':'h-pull|bodyweight', 'Towel rows':'h-pull|bodyweight+other',
  'Face pull':'h-pull|cable+band', 'Dumbbell rear-delt fly':'h-pull|dumbbell', 'Prone Y-T-W raise':'h-pull|bodyweight',
  // vertical pull
  'Pull-ups':'v-pull|pull-up bar', 'Chin-ups':'v-pull|pull-up bar', 'Neutral-grip pull-ups':'v-pull|pull-up bar',
  'Pull-ups or table rows':'v-pull|pull-up bar+bodyweight', 'Chin-ups or underhand table rows':'v-pull|pull-up bar+bodyweight',
  // carry
  'Farmer carry':'carry|dumbbell+kettlebell', 'Uneven farmer carry':'carry|dumbbell+kettlebell', 'Front-rack carry':'carry|kettlebell+dumbbell',
  'Front-rack kettlebell carry':'carry|kettlebell', 'Trap bar carry':'carry|barbell', 'Suitcase carry':'carry|dumbbell+kettlebell',
  'Single-arm overhead carry':'carry|dumbbell+kettlebell', 'Single-arm front-rack carry':'carry|kettlebell+dumbbell', 'Equipment carry':'carry|other',
  // core
  'Pallof press':'core-rot|cable+band', 'Half-kneeling cable chop':'core-rot|cable', 'Landmine rotation':'core-rot|barbell', 'Half-kneeling dumbbell halo':'core-rot|dumbbell+kettlebell',
  'Plank shoulder taps':'core-rot|bodyweight', 'Hollow hold':'core-ext|bodyweight', 'Hollow rock':'core-ext|bodyweight', 'Bear crawl hold':'core-ext|bodyweight',
  'Plank drag-through':'core-ext|dumbbell+kettlebell', 'Side plank':'core-lat|bodyweight', 'Side plank with reach-through':'core-lat|bodyweight',
  'Copenhagen plank':'core-lat|bodyweight+bench/box', 'Side plank with dumbbell row':'core-lat|dumbbell', 'Turkish get-up':'core-lat|kettlebell+dumbbell',
  // power
  'Squat jumps':'power|bodyweight', 'Broad jumps':'power|bodyweight', 'Box jump':'power|bench/box', 'Jumping lunges':'power|bodyweight',
  'Kettlebell swing':'power|kettlebell', 'Kettlebell swings':'power|kettlebell',
  // grip
  'Dead hang':'grip|pull-up bar', 'Towel hang':'grip|pull-up bar+other', 'Fat-grip dead hang':'grip|pull-up bar+other', 'Plate pinch carry':'grip|other',
  // full body and engine
  'Burpees':'full-body|bodyweight', 'Dumbbell thrusters':'full-body|dumbbell', 'Wall balls':'full-body|other',
  'Row':'engine|cardio machine', 'Assault bike':'engine|cardio machine',
  // fireground stations
  'Stair climb':'stair|bodyweight', 'Stair climber':'stair|cardio machine', 'Stair climbs or step-ups':'stair|bodyweight+bench/box',
  'Step-ups or stair climbs':'stair|bodyweight+bench/box', 'Weighted step-ups':'stair|dumbbell+bench/box', 'Dumbbell step-ups':'stair|dumbbell+bench/box',
  'Rescue drag':'drag|other', 'Sandbag drag':'drag|other', 'Heavy sled or dummy drag':'drag|sled', 'Sled drag, walking backward':'drag|sled', 'Sled push':'drag|sled',
  'Hose drag':'hose|other', 'Rope sled pull or sled drag':'hose|sled', 'Sled drag or rope sled pull':'hose|sled',
  'Bear crawl':'crawl|bodyweight', 'Backward bear crawl':'crawl|bodyweight', 'Crab walk':'crawl|bodyweight', 'Search':'crawl|bodyweight',
  'Bear crawl under a low bar or hurdles':'crawl|bodyweight+barbell',
  'Forcible entry':'strike|other', 'Sledgehammer on a tire':'strike|other', 'Kettlebell or sandbag slams':'strike|kettlebell+other', 'Med ball or sledgehammer slams':'strike|other'
};

/* Alternatives per pattern (added to the program's own exercises for that pattern). */
const A = {
  'squat':['Back squat|barbell','Front squat|barbell','Safety-bar squat|barbell','Goblet squat|dumbbell+kettlebell','Leg press|machine','Hack squat|machine','Heels-elevated dumbbell squat|dumbbell','Bulgarian split squat|bodyweight+bench/box','Box squat|barbell+bench/box','Band-resisted squat|band'],
  'hinge':['Trap bar deadlift|barbell','Conventional deadlift|barbell','Romanian deadlift|barbell','Dumbbell RDL|dumbbell','Kettlebell deadlift|kettlebell','Hip thrust|barbell+bench/box','Single-leg hip thrust|bodyweight+bench/box','Back extension|machine','Cable pull-through|cable','Band good morning|band'],
  'single-leg':['Bulgarian split squat|bodyweight+bench/box','Reverse lunge|bodyweight','Walking lunge|dumbbell','Step-up|dumbbell+bench/box','Skater squat|bodyweight','Lateral lunge|bodyweight','Barbell split squat|barbell','Single-leg leg press|machine','Kettlebell goblet reverse lunge|kettlebell'],
  'h-push':['Bench press|barbell+bench/box','Dumbbell bench press|dumbbell+bench/box','Dumbbell floor press|dumbbell','Incline dumbbell press|dumbbell+bench/box','Push-ups|bodyweight','Band push-ups|band','Machine chest press|machine','Cable chest press|cable','Dips|bodyweight+machine'],
  'v-push':['Standing barbell press|barbell','Push press|barbell','Seated dumbbell press|dumbbell+bench/box','Arnold press|dumbbell','Half-kneeling landmine press|barbell','Kettlebell press|kettlebell','Machine shoulder press|machine','Band overhead press|band','Pike push-up|bodyweight'],
  'h-pull':['Chest-supported row|dumbbell+bench/box','One-arm dumbbell row|dumbbell+bench/box','Barbell row|barbell','Seated cable row|cable','Machine row|machine','Kettlebell row|kettlebell','Band row|band','Table rows|bodyweight','Face pull|cable+band'],
  'v-pull':['Pull-ups|pull-up bar','Chin-ups|pull-up bar','Lat pulldown|cable+machine','Band-assisted pull-ups|pull-up bar+band','Neutral-grip pulldown|cable','Negative pull-ups|pull-up bar','Band lat pulldown|band','Table rows|bodyweight'],
  'carry':['Farmer carry|dumbbell+kettlebell','Suitcase carry|dumbbell+kettlebell','Trap bar carry|barbell','Front-rack kettlebell carry|kettlebell','Overhead carry|dumbbell+kettlebell','Sandbag bear-hug carry|other','Water-jug carry|other','Loaded backpack carry|other'],
  'core-rot':['Pallof press|cable+band','Band Pallof press|band','Half-kneeling cable chop|cable','Landmine rotation|barbell','Plank shoulder taps|bodyweight','Bird dog|bodyweight','Kettlebell halo|kettlebell','Single-arm plank|bodyweight'],
  'core-ext':['Hollow hold|bodyweight','Dead bug|bodyweight','Plank|bodyweight','Ab wheel rollout|other','Stability-ball rollout|other','Body saw|bodyweight','Bear crawl hold|bodyweight','Plank drag-through|dumbbell+kettlebell'],
  'core-lat':['Side plank|bodyweight','Copenhagen plank|bodyweight+bench/box','Suitcase carry|dumbbell+kettlebell','Kettlebell windmill|kettlebell','Turkish get-up|kettlebell+dumbbell','Side plank with reach-through|bodyweight','Cable side hold|cable'],
  'power':['Box jump|bench/box','Squat jumps|bodyweight','Broad jumps|bodyweight','Kettlebell swing|kettlebell','Dumbbell snatch|dumbbell','Med ball slam|other','Med ball chest pass|other','Hang power clean|barbell','Jumping lunges|bodyweight'],
  'grip':['Dead hang|pull-up bar','Towel hang|pull-up bar+other','Fat-grip dead hang|pull-up bar+other','Farmer hold|dumbbell+kettlebell','Plate pinch hold|other','Kettlebell bottoms-up hold|kettlebell','Wrist roller|other','Hand gripper|other'],
  'full-body':['Burpees|bodyweight','Dumbbell thrusters|dumbbell','Barbell thrusters|barbell','Wall balls|other','Devil press|dumbbell','Kettlebell clean and press|kettlebell','Man makers|dumbbell','Turkish get-up|kettlebell+dumbbell'],
  'engine':['Row|cardio machine','Assault bike|cardio machine','Ski erg|cardio machine','Stationary bike|cardio machine','Treadmill run|cardio machine','Jump rope|other','Shuttle runs|bodyweight','Burpees|bodyweight'],
  'stair':['Stair climber|cardio machine','Stair climbs|bodyweight','Step-ups|bodyweight+bench/box','Weighted step-ups|dumbbell+bench/box','Loaded backpack step-ups|bench/box+other','Incline treadmill walk|cardio machine','Box step-ups|bench/box'],
  'drag':['Sled drag|sled','Backward sled walk|sled','Sled push|sled','Towel drag with a heavy dumbbell or kettlebell|dumbbell+kettlebell','Partner drag|bodyweight','Sandbag drag|other','Heavy-bag drag|other'],
  'hose':['Rope sled pull|sled','Hand-over-hand cable pull|cable','Towel-wrapped kettlebell pull|kettlebell','Sled drag, walking backward|sled','Band-resisted hose pull|band','Heavy-bag drag|other'],
  'crawl':['Bear crawl|bodyweight','Backward bear crawl|bodyweight','Crab walk|bodyweight','Army crawl|bodyweight','Bear crawl under a low bar|bodyweight+barbell','Weighted bear crawl|other','Sled bear-crawl push|sled'],
  'strike':['Sledgehammer on a tire|other','Med ball slam|other','Sandbag slam|other','Kettlebell slam-to-swing|kettlebell','Heavy-bag strikes|other','Battle rope slams|other','Band chop|band','Dumbbell woodchop|dumbbell']
};

const parse = s => { const [p, eq] = s.split('|'); return {pattern:p, eq:eq.split('+')}; };
export const slugName = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-');

/* Pattern and equipment for an exercise name, or null if it isn't in the library. */
export function tagOf(name){
  if(T[name]) return parse(T[name]);
  for(const [p, list] of Object.entries(A)) for(const x of list){ const [n, eq] = x.split('|'); if(n===name) return {pattern:p, eq:eq.split('+')}; }
  return null;
}
export const patternOf = name => (tagOf(name) || {}).pattern || null;

/* Alternatives for `name`, grouped by main equipment, version's equipment first.
   custom: {pattern: [names]} from settings. Returns [{eq, label, fits, items:[name]}]. */
export function alternatives(name, v, custom={}, exclude=[]){
  const p = patternOf(name); if(!p) return {pattern:null, groups:[]};
  const skip = new Set([name, ...exclude].map(slugName)), seen = new Set(skip), byEq = {};
  const add = (n, eq) => { const k = slugName(n); if(seen.has(k)) return; seen.add(k); (byEq[eq] = byEq[eq] || []).push(n); };
  for(const x of A[p]){ const [n, eq] = x.split('|'); add(n, eq.split('+')[0]); }
  for(const [n, t] of Object.entries(T)){ const tt = parse(t); if(tt.pattern===p) add(n, tt.eq[0]); }
  const mine = (custom[p] || []).filter(n=>!skip.has(slugName(n)));
  const first = VERSION_EQUIPMENT[v] || [];
  const order = [...first, ...Object.keys(EQUIPMENT).filter(e=>!first.includes(e))];
  const groups = order.filter(e=>byEq[e]).map(e=>({eq:e, label:EQUIPMENT[e], fits:first.includes(e), items:byEq[e]}));
  if(mine.length) groups.unshift({eq:'custom', label:'My exercises', fits:true, items:mine});
  return {pattern:p, groups};
}

/* Every exercise name the library knows (for tests). */
export const KNOWN = Object.keys(T);

/* ---------------- Cardio session swaps ---------------- */
export const CARDIO = {
  run:    {label:'Run', short:'Run', noun:'run', easy:'easy jog', fast:'strides',
           focus:'Treadmill, track or road.', extra:{k:'pace', l:'Avg pace', t:'text'}},
  bike:   {label:'Stationary bike', short:'Bike', noun:'bike', easy:'easy spin', fast:'fast spins',
           focus:'Stationary bike: keep the cadence up and add resistance for the hard efforts.', extra:{k:'watts', l:'Avg watts / RPM', t:'text'}},
  rower:  {label:'Rower', short:'Rower', noun:'rower', easy:'easy rowing', fast:'fast pulls',
           focus:'Rower: legs, then hips, then arms. Keep the stroke rate in the mid-20s on hard efforts rather than flailing.', extra:{k:'split', l:'Avg split /500 m', t:'text'}},
  assault:{label:'Assault bike', short:'Assault bike', noun:'assault bike', easy:'easy pedalling', fast:'fast sprints',
           focus:'Assault or air bike: push and pull with the arms as well as the legs. It gets brutal fast, so pace the first hard effort.', extra:{k:'cal', l:'Calories', t:'number'}},
  stairs: {label:'Stair climber', short:'Stair climber', noun:'stair climber', easy:'easy stepping', fast:'fast climbs',
           focus:'Stair climber, a stairwell or step-ups. The most fireground-specific engine work there is.', extra:{k:'floors', l:'Floors climbed', t:'number'}},
  ruck:   {label:'Incline walk (ruck)', short:'Ruck', noun:'incline walk', easy:'easy walk', fast:'brisk pushes up the incline',
           focus:'Treadmill on a steep incline, or hills, with a loaded pack if you have one. Raise the incline or pace for hard efforts; don’t run.', extra:{k:'load', l:'Incline / pack load', t:'text'}},
  swim:   {label:'Swim', short:'Swim', noun:'swim', easy:'easy swimming', fast:'fast lengths',
           focus:'Pool or open water. Rest at the wall instead of moving easy if you need to.', extra:{k:'laps', l:'Laps', t:'number'}}
};
export const CARDIO_CUE = 'Same structure and times as written: “hard” means about RPE 8 and “easy” means you can talk in full sentences, whatever you’re on.';
export const CARDIO_DAY = {I:'interval days', H:'threshold days', R:'run days', Z:'zone 2 days'};

/* The machine a cardio session is written for: intervals and threshold days for the bike, run days for running, zone 2 for anything. */
export const nativeMode = s => s.modes ? 'bike' : s.code==='R' ? 'run' : null;

const swapWords = (t, c) => String(t || '')
  .replace(/easy jog or walk|easy jog|easy spin|easy stepping/g, c.easy)
  .replace(/fast spins|strides|fast climbs/g, c.fast)
  .replace(/walk between/g, 'easy between')
  .replace(/easy bike, run, stair climber or a mix|easy bike or run/g, c.easy);

/* {title, focus, steps, fields} for cardio session s done on `mode` (null = as written). */
export function cardioAs(s, mode){
  if(s.modes && s.modes[mode]) return s.modes[mode];        // bike / stairs / run as written
  const base = s.modes ? s.modes.bike : {title:s.title, focus:s.focus, steps:s.steps, fields:s.fields};
  const native = nativeMode(s);
  if(!mode || mode===native || !CARDIO[mode]) return base;
  const c = CARDIO[mode];
  const title = native==='bike' ? base.title.replace(/\bBike\b/, c.short).replace(/\bbike\b/, c.noun)
              : native==='run' ? base.title.replace(/^Run\b/, c.short)
              : `${base.title}: ${c.noun}`;
  const steps = base.steps.map(x=>({...x, name: x.name==='Run' ? 'Main set' : x.name, rx: swapWords(x.rx, c), note: swapWords(x.note, c)}));
  const fields = [{k:'duration',l:'Time (min)',t:'number'},{k:'distance',l:'Distance',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}, c.extra];
  return {title, focus: c.focus+' '+CARDIO_CUE, steps, fields};
}
