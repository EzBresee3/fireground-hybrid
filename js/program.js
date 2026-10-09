/* Fireground Hybrid: 12-week program data. Copied verbatim from reference/fireground-hybrid.html. */
const PH = w => (w===4||w===8) ? 'deload' : w===12 ? 'test' : w<=3 ? 'base' : w<=7 ? 'build' : 'peak';
const PH_NAME = {base:'Base block', build:'Build block', peak:'Peak block', deload:'Deload week', test:'Test week'};
const PH_NOTE = {
  base:'Groove technique and build your aerobic engine. Finish lifts with about 3 reps left in the tank.',
  build:'Heavier loads and harder intervals. Finish lifts with about 2 reps left in the tank.',
  peak:'Heaviest lifts, fastest intervals and the most fireground-specific work of the program.',
  deload:'Back off on purpose. Same movements, less volume, so your body absorbs the last three weeks.',
  test:'A light week to freshen up, then retest everything from week 1.'
};
const MAIN = {1:'3 × 10 @ RPE 7',2:'3 × 10, add a little load',3:'4 × 8 @ RPE 7–8',4:'2 × 8 light (RPE 6)',5:'4 × 6 @ RPE 8',6:'4 × 5, add load',7:'5 × 5 @ RPE 8',8:'2 × 5 light (RPE 6)',9:'4 × 4 @ RPE 8',10:'4 × 3 @ RPE 8–9',11:'5 × 3, heaviest of the program',12:'3 × 3 crisp, about 80% effort'};
const MAINBW = {1:'3 × 12',2:'3 × 15',3:'4 × 12, 3-second lowering',4:'2 × 10 easy',5:'4 × 10, 3-sec lowering + pause',6:'4 × 12, 3-sec lowering + pause',7:'5 × 10, harder variation',8:'2 × 10 easy',9:'4 × 8, harder variation, explode up',10:'4 × max quality reps (stop 2 short)',11:'5 × 8, harder variation',12:'3 × 6 crisp'};
const ACC = {base:'3 × 12', build:'3 × 10', peak:'3 × 8', deload:'2 × 10', test:'2 × 8'};
const WARM = '4 min: 2 min easy bike, jump rope or jumping jacks, then 5 inchworms, 10 bodyweight squats and 5 lunges per side with an overhead reach.';
const it = (lab,name,rx,note='',log=true,main=false) => ({lab,name,rx,note,log,main});
const cardioFields = [{k:'duration',l:'Time (min)',t:'number'},{k:'distance',l:'Distance',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'},{k:'watts',l:'Avg watts / RPM',t:'text'}];

function strengthA(w){
  const p=PH(w), m=MAIN[w], mb=MAINBW[w], a=ACC[p], pw = p==='peak', light = p==='deload'||p==='test';
  const C = light ? '2 × ' : '3 × ';
  return {kind:'strength', code:'S', title:'Strength A: legs and push', minutes: light?20:28,
    focus:'Squat pattern, pressing and single-leg strength for climbing stairs and ladders with a load.',
    how:'Superset A1 with A2, resting 60–90 s after each pair. Same with B1 and B2. Finish with C.',
    versions:{
      bw:[pw&&it('P','Squat jumps','3 × 5','Land soft, reset each rep',false), it('A1','Bulgarian split squat',mb+' /leg','Rear foot on a chair or couch',true,true), it('A2','Push-ups',mb,'Feet on a chair from week 7',true,true), it('B1','Reverse lunge',a+' /leg'), it('B2','Pike push-up',a), it('C','Hollow hold',C+'30 s','',false)].filter(Boolean),
      db:[pw&&it('P','Squat jumps','3 × 5','Land soft, reset each rep',false), it('A1','Goblet squat',m,'',true,true), it('A2','Dumbbell floor press',m,'Use a bench if you have one',true,true), it('B1','Dumbbell step-up',a+' /leg','Knee-height step'), it('B2','Half-kneeling dumbbell press',a+' /arm'), it('C','Suitcase carry',C+'30 m /side','Stay tall, no leaning')].filter(Boolean),
      gym:[pw&&it('P','Box jump','3 × 3','Step down, full reset each rep',false), it('A1','Back squat',m,'',true,true), it('A2','Bench press',m,'',true,true), it('B1','Dumbbell step-up',a+' /leg','Knee-height box'), it('B2','Half-kneeling landmine press',a+' /arm'), it('C','Pallof press',C+'10 /side','')].filter(Boolean)
    }};
}
function strengthB(w){
  const p=PH(w), m=MAIN[w], mb=MAINBW[w], a=ACC[p], pw = p==='peak', light = p==='deload'||p==='test';
  const C = light ? '2 × ' : '3 × ';
  return {kind:'strength', code:'S', title:'Strength B: pull, hinge and carry', minutes: light?20:28,
    focus:'Deadlift pattern, pulling and grip for hose pulls, victim drags and carrying tools.',
    how:'Superset A1 with A2, resting 60–90 s after each pair. Same with B1 and B2. Finish with C.',
    versions:{
      bw:[pw&&it('P','Broad jumps','3 × 3','Stick each landing',false), it('A1','Single-leg hip thrust',mb+' /leg','Shoulders on a couch or bench',true,true), it('A2','Pull-ups or table rows',mb,'Rows under a sturdy table if no bar',true,true), it('B1','Single-leg RDL',a+' /leg','Slow, hips square'), it('B2','Bear crawl',(light?'2':'4')+' × 20 m','Knees an inch off the floor',false), it('C','Side plank',C+'30 s /side','',false)].filter(Boolean),
      db:[pw&&it('P','Kettlebell swing','3 × 8 hard','Snap the hips, float the bell'), it('A1','Dumbbell Romanian deadlift',m,'',true,true), it('A2','One-arm dumbbell row',m+' /arm','',true,true), it('B1','Single-leg dumbbell RDL',a+' /leg'), it('B2','Farmer carry',(light?'2':'4')+' × 40 m','Heavy, fast, tall'), it('C','Plank drag-through',C+'10 /side')].filter(Boolean),
      gym:[pw&&it('P','Kettlebell swing','3 × 8 hard','Snap the hips, float the bell'), it('A1','Trap bar deadlift',m,'',true,true), it('A2','Pull-ups',m,'Band or lat pulldown if needed; add weight once 10 reps is easy',true,true), it('B1','Chest-supported row',a), it('B2','Farmer carry',(light?'2':'4')+' × 40 m','Heavy, fast, tall'), it('C','Dead hang',C+'max hold (cap 60 s)','Grip for tools and hose')].filter(Boolean)
    }};
}
/* Original bike day. Now the Bike option of intervals() below. */
function bike(w){
  const main = {1:'8 × 30 s hard (RPE 8), 90 s easy between',2:'10 × 30 s hard, 90 s easy between',3:'10 × 40 s hard, 80 s easy between',4:'20 min steady zone 2, add 4 × 15 s fast spins',5:'5 × 2 min hard (RPE 8), 1 min easy between',6:'6 × 2 min hard, 1 min easy between',7:'4 × 3 min hard, 90 s easy between',8:'20 min steady zone 2, add 4 × 15 s fast spins',9:'2 sets of 8 × 20 s all-out, 40 s easy; 2 min easy between sets',10:'2 sets of 10 × 20 s all-out, 40 s easy; 2 min easy between sets',11:'6 × 1 min hard, 1 min easy, then 4 × 20 s all-out, 40 s easy',12:'15 min easy, add 4 × 30 s openers at race pace'}[w];
  return {kind:'cardio', code:'B', title: PH(w)==='deload' ? 'Bike: easy aerobic' : 'Bike intervals', minutes:26,
    focus:'Your stationary bike at home is perfect for this. Builds the engine for repeated hard efforts on scene with low impact on your joints.',
    steps:[it('1','Warm-up','5 min easy, build to moderate','',false), it('2','Main set',main,'',false), it('3','Cool-down','3–5 min easy spin','',false)],
    fields:cardioFields};
}
function run(w){
  const main = {1:'20 min easy, conversational pace',2:'22 min easy',3:'25 min easy, last 3 min a little faster',4:'20 min easy',5:'3 × 5 min comfortably hard (RPE 7), 1 min walk between',6:'3 × 6 min comfortably hard, 1 min walk between',7:'2 × 10 min comfortably hard, 2 min walk between',8:'20 min easy',9:'6 × 90 s hard (RPE 8–9), 90 s easy jog between',10:'8 × 90 s hard, 90 s easy jog between',11:'5 × 2 min hard, 2 min easy jog between',12:'15 min easy, add 4 × 20 s strides'}[w];
  const easy = ['base','deload'].includes(PH(w)) || w===12;
  return {kind:'cardio', code:'R', title: easy ? 'Run: aerobic base' : 'Run: '+(PH(w)==='build'?'tempo':'intervals'), minutes:25,
    focus:'Walk breaks are fine on easy days. No running today? Do the same structure on the bike, a rower or a stair climber.',
    steps: easy ? [it('1','Run',main,'You should be able to talk in full sentences',false)] : [it('1','Warm-up','5 min easy jog','',false), it('2','Main set',main,'',false), it('3','Cool-down','3 min easy jog or walk','',false)],
    fields:cardioFields};
}
function hybrid(w){
  const p = PH(w);
  if (w===1 || w===12) return {kind:'hybrid', code:'F', title: w===1 ? 'Fireground benchmark' : 'Fireground benchmark retest', minutes:25,
    focus:'4 rounds for time. Note which version you use; repeat the same one in week 12 so the times compare.',
    how:'Warm up well, then go. Steady first round, empty the tank on the last.',
    versions:{
      bw:[it('1','Step-ups or stair climbs','20 total','Bench, stairs or a sturdy chair',false), it('2','Bear crawl','20 m','',false), it('3','Burpees','10','',false), it('4','Air squats','20','',false)],
      db:[it('1','Dumbbell step-ups','20 total','',false), it('2','Farmer carry','40 m','Heavy',false), it('3','Burpees','10','',false), it('4','Kettlebell swings','15','',false)],
      gym:[it('1','Row','250 m','',false), it('2','Sled push','20 m','Or 40 m heavy farmer carry',false), it('3','Burpees','10','',false), it('4','Kettlebell swings','15','',false)]
    },
    fields:[{k:'result',l:'Total time (mm:ss)',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}]};
  if (p==='base' || p==='deload') {
    const dl = p==='deload';
    return {kind:'hybrid', code:'F', title: dl ? 'Fireground circuit: easy' : 'Fireground circuit', minutes: dl?20:25,
      focus: dl ? '15 min continuous at an easy, nose-breathing pace, then 5 min of mobility.' : (w===2?'18':'20')+'-minute AMRAP at a steady pace (RPE 7). Move the whole time and count rounds.',
      how:'Cycle through the list in order. Smooth beats fast.',
      versions:{
        bw:[it('1','Burpees','10','',false), it('2','Step-ups or stair climbs','20 total','',false), it('3','Bear crawl','20 m','',false), it('4','Air squats','15','',false)],
        db:[it('1','Dumbbell thrusters','10','',false), it('2','Kettlebell swings','12','',false), it('3','Farmer carry','40 m','',false), it('4','Dumbbell step-ups','10 /leg','',false)],
        gym:[it('1','Row','200 m','',false), it('2','Sled push','20 m','',false), it('3','Wall balls','10','',false), it('4','Box step-ups','10 /leg','',false)]
      },
      fields:[{k:'result',l: dl ? 'How it felt' : 'Rounds completed',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}]};
  }
  if (p==='build') return {kind:'hybrid', code:'F', title:'Fireground circuit: for time', minutes:27,
    focus:(w===7?'6':'5')+' rounds for time with 60 s rest between rounds. Push the pace (RPE 8).',
    how:'Go hard but keep every rep clean. Log the total time.',
    versions:{
      bw:[it('1','Burpees','8','',false), it('2','Jumping lunges','20 total','',false), it('3','Bear crawl','20 m','',false), it('4','Push-ups','10','',false)],
      db:[it('1','Kettlebell swings','12','',false), it('2','Dumbbell push press','8','',false), it('3','Front-rack carry','30 m','',false), it('4','Dumbbell reverse lunges','10 total','',false)],
      gym:[it('1','Assault bike','12 cal','Or 15 cal row',false), it('2','Sled drag, walking backward','20 m','Victim drag',false), it('3','Dumbbell push press','8','',false), it('4','Farmer carry','30 m','',false)]
    },
    fields:[{k:'result',l:'Total time (mm:ss)',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}]};
  const rounds = w===9 ? 5 : 6;
  return {kind:'hybrid', code:'F', title:'Fireground intervals', minutes:26,
    focus: rounds+' rounds of 3 min on, 1 min off. Each round is 1 minute at each station, done in order.',
    how:'On shift, if your department allows it, do this in turnout coat and SCBA pack once in this block and cut it to 4 rounds.',
    versions:{
      bw:[it('1','Stair climbs or step-ups','1 min','Stair climb',false), it('2','Bear crawl','1 min','Search crawl',false), it('3','Burpees','1 min','',false)],
      db:[it('1','Weighted step-ups','1 min','Stair climb with a load',false), it('2','Farmer carry','1 min','Equipment carry',false), it('3','Kettlebell swings','1 min','',false)],
      gym:[it('1','Stair climber','1 min','Or weighted step-ups',false), it('2','Sled drag or rope sled pull','1 min','Victim drag, hose pull',false), it('3','Med ball or sledgehammer slams','1 min','Forcible entry',false)]
    },
    fields:[{k:'result',l:'Rounds completed',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}]};
}
function day6(w){
  if (w===1 || w===12) return {kind:'test', code:'T', title: w===1 ? 'Baseline test' : 'Final test', minutes:28,
    focus: w===1 ? 'Sets your starting numbers. Treadmill at 1% incline or a track is fine for the run.' : 'Same tests as week 1, same conditions if you can. See what twelve weeks did.',
    steps:[it('1','Warm-up','5 min easy jog plus a few strides','',false), it('2','1.5-mile run','For time','',false), it('3','Rest','5 min, walk it off','',false), it('4','Push-ups','One set, max reps','Chest to a fist on the floor, no resting at the top',false), it('5','Pull-ups','One set, max reps','Strict, from a dead hang',false)],
    fields:[{k:'run',l:'1.5-mile time (mm:ss)',t:'text'},{k:'pushups',l:'Push-ups',t:'number'},{k:'pullups',l:'Pull-ups',t:'number'}]};
  return {kind:'cardio', code:'Z', optional:true, title:'Zone 2 and mobility', minutes:30,
    focus:'Optional sixth day. Easy aerobic work that speeds recovery. Skip it if you are beat up after shift.',
    steps:[it('1','Zone 2','25 min easy bike or run','Nose breathing, talk in full sentences',false), it('2','Mobility','5 min','Hip flexor stretch, 90/90 hips, thoracic rotations, child\u2019s pose',false)],
    fields:cardioFields};
}

/* ======================================================================
   Everything below extends the original program: interval modes, extra
   builders, a library of 12-week programs, exercise rotation per cycle.
   Cycle 1 of "Fireground Hybrid" in Bike mode is the original plan.
   ====================================================================== */

const VNAME = {bw:'Bodyweight', db:'DB / KB', gym:'Full gym'};

/* ---------------- Interval day: bike, stair climber or run ---------------- */
const MODES = {bike:'Bike', stairs:'Stair climber', run:'Run'};
const STAIR_FIELDS = [{k:'duration',l:'Time (min)',t:'number'},{k:'floors',l:'Floors climbed',t:'number'},{k:'hr',l:'Avg heart rate',t:'number'},{k:'spm',l:'Steps per min',t:'text'}];
const RUN_FIELDS = [{k:'duration',l:'Time (min)',t:'number'},{k:'distance',l:'Distance',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'},{k:'pace',l:'Avg pace',t:'text'}];
const MODE_FIELDS = {bike:cardioFields, stairs:STAIR_FIELDS, run:RUN_FIELDS};
const MODE_FAST = {bike:'fast spins', stairs:'fast climbs', run:'strides'};
const MODE_EASY = {bike:'easy spin', stairs:'easy stepping', run:'easy jog or walk'};
const MODE_FOCUS = {
  stairs:'Stair climber, a stairwell or step-ups. The most fireground-specific engine work there is: high-rise stairs with a load on your back.',
  run:'Treadmill, track or road. Run the hard parts at a pace you can hold for every rep, not a sprint.'
};
const EASY_FOCUS = 'Easy day. Keep it conversational and finish fresher than you started.';
const modeSteps = (m, main) => [it('1','Warm-up','5 min easy, build to moderate','',false), it('2','Main set',main.replace('fast spins',MODE_FAST[m]),'',false), it('3','Cool-down','3–5 min '+MODE_EASY[m],'',false)];

function intervals(w){
  const b = bike(w), dl = PH(w)==='deload', main = b.steps[1].rx;
  return {kind:'cardio', code:'I', title: dl ? 'Easy aerobic' : 'Intervals', minutes:b.minutes,
    modes:{
      bike:{title:b.title, focus:b.focus, steps:b.steps, fields:b.fields},
      stairs:{title: dl ? 'Stair climber: easy aerobic' : 'Stair climber intervals', focus: dl ? EASY_FOCUS : MODE_FOCUS.stairs, steps:modeSteps('stairs', main), fields:STAIR_FIELDS},
      run:{title: dl ? 'Run: easy aerobic' : 'Run intervals', focus: dl ? EASY_FOCUS : MODE_FOCUS.run, steps:modeSteps('run', main), fields:RUN_FIELDS}
    }};
}

/* Threshold day (Engine block): longer, steadier efforts in any mode. */
function threshold(w){
  const p = PH(w), easy = p==='deload' || w===12;
  const main = {1:'2 × 8 min comfortably hard (RPE 7), 2 min easy between',2:'3 × 8 min comfortably hard, 2 min easy between',3:'3 × 10 min comfortably hard, 2 min easy between',4:'20 min easy, add 4 × 15 s fast spins',5:'2 × 15 min comfortably hard, 3 min easy between',6:'3 × 12 min comfortably hard, 2 min easy between',7:'2 × 20 min comfortably hard, 3 min easy between',8:'20 min easy, add 4 × 15 s fast spins',9:'25 min continuous at threshold (RPE 7–8)',10:'30 min continuous at threshold (RPE 7–8)',11:'3 × 12 min a little faster than threshold, 2 min easy between',12:'15 min easy, add 4 × 20 s fast spins'}[w];
  const name = {bike:'Bike', stairs:'Stair climber', run:'Run'};
  const mk = m => ({title: (easy ? 'Easy aerobic: ' : 'Threshold: ') + name[m].toLowerCase(),
    focus: easy ? EASY_FOCUS : 'Threshold work: hard enough that you can only speak in short phrases, steady enough to hold for the whole block. This is what lets you work longer on scene before you red-line.',
    steps: modeSteps(m, main), fields: MODE_FIELDS[m]});
  return {kind:'cardio', code:'H', title: easy ? 'Easy aerobic' : 'Threshold', minutes: easy ? 25 : ({base:32, build:42, peak:42, test:25}[p] || 30),
    modes:{bike:mk('bike'), stairs:mk('stairs'), run:mk('run')}};
}

/* Long zone 2 (Engine block, day 6). */
function longZone2(w){
  const min = {2:40,3:45,4:30,5:45,6:50,7:55,8:30,9:50,10:55,11:60}[w] || 40;
  return {kind:'cardio', code:'Z', title:'Long zone 2', minutes:min+5,
    focus:'Easy and long: the aerobic base everything else sits on. Any mode works, and mixing them is fine.',
    steps:[it('1','Zone 2',min+' min easy bike, run, stair climber or a mix','Nose breathing, talk in full sentences',false), it('2','Mobility','5 min','Hip flexor stretch, 90/90 hips, thoracic rotations, child’s pose',false)],
    fields:cardioFields};
}

/* Strength C (Strength block): overhead, upper back and grip. */
function strengthC(w){
  const p=PH(w), m=MAIN[w], mb=MAINBW[w], a=ACC[p], light = p==='deload'||p==='test';
  const C = light ? '2 × ' : '3 × ';
  return {kind:'strength', code:'S', title:'Strength C: upper body and grip', minutes: light?20:28,
    focus:'Overhead strength, upper-back endurance and grip for raising ladders, breaching ceilings and holding a charged line.',
    how:'Superset A1 with A2, resting 60–90 s after each pair. Same with B1 and B2. Finish with C.',
    versions:{
      bw:[it('A1','Feet-elevated pike push-up',mb,'Feet on a chair, head between your hands',true,true), it('A2','Table rows',mb,'Under a sturdy table, body straight',true,true), it('B1','Chair dips',a,'Elbows back, shoulders down'), it('B2','Prone Y-T-W raise',a,'Slow, squeeze the shoulder blades',false), it('C','Bear crawl hold',C+'30 s','Knees an inch off the floor',false)],
      db:[it('A1','Standing dumbbell press',m,'',true,true), it('A2','Dumbbell bent-over row',m,'',true,true), it('B1','Close-grip dumbbell floor press',a,'Dumbbells together, elbows tucked'), it('B2','Dumbbell rear-delt fly',a), it('C','Turkish get-up',(light?'2':'3')+' × 2 /side','Slow, eyes on the bell')],
      gym:[it('A1','Standing barbell press',m,'',true,true), it('A2','Barbell row',m,'',true,true), it('B1','Dips',a,'Band-assisted if needed'), it('B2','Face pull',a), it('C','Plate pinch carry',C+'30 m','Two plates smooth side out, one set per hand')]
    }};
}

/* Fireground test prep: CPAT-style event circuit. */
function cpat(w){
  const p = PH(w), test = w===1 || w===12;
  const plan = {base:'2 rounds at a steady, controlled pace, 3 min rest between rounds', build:'3 rounds at a strong pace, 2 min rest between rounds', peak:'Full run-through for time, rest 5 min, then 1 more round at a steady pace', deload:'1 easy round, practising technique only', test:'1 easy round, practising technique only'}[p];
  const fields = [{k:'result',l: test ? 'Total time (mm:ss)' : 'Time or rounds',t:'text'},{k:'load',l:'Vest or pack load',t:'text'},{k:'hr',l:'Avg heart rate',t:'number'}];
  return {kind:'hybrid', code:'C', bench:test, title: test ? (w===1 ? 'Test simulation: baseline' : 'Test simulation: retest') : 'Fireground test circuit', minutes: test ? 25 : 30,
    focus: test ? 'All eight stations in order for time, walking between them with no other rest. For reference, the CPAT is passed in 10:20 or less wearing a 50 lb vest. Retest with the same version and load.' : plan+'. All eight stations in order, walking between them like on the test.',
    how:'Walk, never run, between stations. Wear a weighted vest or a loaded backpack throughout if you have one, and add load as the weeks go on.',
    versions:{
      bw:[it('1','Stair climb','3 min','Stairs or step-ups at a steady rhythm, loaded backpack on',false), it('2','Hose drag','25 m','Drag a heavy duffel or bag, walking backward',false), it('3','Equipment carry','2 × 25 m','Two heavy bags or water jugs',false), it('4','Ladder raise','10 reps','Push-up position, walk your hands up a wall and back down',false), it('5','Forcible entry','30 strikes','Slam a heavy bag into the floor or strike a hanging bag',false), it('6','Search','25 m','Bear crawl, under a table if you can',false), it('7','Rescue drag','25 m','Heavy bag or a willing partner, walking backward',false), it('8','Ceiling breach and pull','4 × (3 push + 5 pull)','Press a broom overhead against a band, then pull it down hard',false)],
      db:[it('1','Weighted step-ups','3 min','Dumbbells in hand, steady rhythm',false), it('2','Hose drag','25 m','Sled or a heavy sandbag, walking backward',false), it('3','Farmer carry','2 × 25 m','Heavy, fast, tall',false), it('4','Dumbbell push press','10 reps','Drive with the legs like raising a ladder',false), it('5','Kettlebell or sandbag slams','30 reps','',false), it('6','Bear crawl','25 m','',false), it('7','Sandbag drag','25 m','Walking backward, low hips',false), it('8','Push press + bent-over row','4 × (3 + 5)','Dumbbells',false)],
      gym:[it('1','Stair climber','3 min at 60 steps/min','Add a 25 lb weight on your shoulders if you can',false), it('2','Rope sled pull or sled drag','25 m','Hose drag',false), it('3','Farmer carry','2 × 25 m','About 40 lb per hand',false), it('4','Landmine walk-up press','10 reps','Ladder raise',false), it('5','Sledgehammer on a tire','30 strikes','Forcible entry',false), it('6','Bear crawl under a low bar or hurdles','25 m','Search',false), it('7','Heavy sled or dummy drag','25 m','Rescue drag, walking backward',false), it('8','Cable push and pull-down','4 × (3 push + 5 pull)','About 60 lb push, 80 lb pull',false)]
    },
    fields};
}

/* ---------------- Set-and-rep tables for the main lifts ---------------- */
const STR = {1:'4 × 8 @ RPE 7',2:'4 × 6 @ RPE 7–8',3:'5 × 5 @ RPE 8',4:'3 × 5 light (RPE 6)',5:'5 × 4 @ RPE 8',6:'5 × 3 @ RPE 8',7:'6 × 3 @ RPE 8–9',8:'3 × 3 light (RPE 6)',9:'5 × 3 @ RPE 8–9',10:'5 × 2 @ RPE 9',11:'4 × 2, heaviest of the program',12:'Work up to a heavy single (RPE 9), then 2 × 3 at about 80%'};
const STRBW = {1:'4 × 10, 3-sec lowering',2:'4 × 8, 3-sec lowering + pause',3:'5 × 8, harder variation',4:'2 × 8 easy',5:'5 × 6, harder variation, 3-sec lowering',6:'5 × 6, hardest variation you can do cleanly',7:'6 × 5, hardest variation',8:'2 × 8 easy',9:'5 × 5, hardest variation, pause at the bottom',10:'5 × 4, add a loaded backpack if you can',11:'6 × 3, hardest variation with load',12:'3 × 5 crisp'};
const MAINT = {base:'3 × 8 @ RPE 7', build:'3 × 6 @ RPE 7–8', peak:'3 × 5 @ RPE 8', deload:'2 × 6 light (RPE 6)', test:'2 × 5 crisp'};
const MAINTBW = {base:'3 × 10', build:'3 × 10, 3-sec lowering', peak:'3 × 8, harder variation', deload:'2 × 8 easy', test:'2 × 8 crisp'};

/* Rewrites the main-lift prescription, keeping any " /leg" or " /arm" suffix. */
function withMain(s, w, table, tableBW){
  if(!s.versions) return s;
  for(const v of ['bw','db','gym']) s.versions[v] = s.versions[v].map(x=>{
    if(!x.main) return x;
    const base = v==='bw' ? MAINBW[w] : MAIN[w];
    if(!x.rx.startsWith(base)) return x;
    return {...x, rx: (v==='bw' ? tableBW(w) : table(w)) + x.rx.slice(base.length)};
  });
  return s;
}

/* ---------------- Exercise rotation ----------------
   Variation 0 is the exercise as written. Cycles 2, 3, 4, 5... use 1, 2, 0, 1...
   Same movement pattern, same sets and reps, different exercise.                  */
const R = (name, note) => ({name, note});
const ROT = {
  'Strength A: legs and push':{
    gym:{A1:[R('Front squat'), R('Safety-bar squat','Or pause back squat, 2 s at the bottom')], A2:[R('Incline bench press'), R('Close-grip bench press')], B1:[R('Dumbbell walking lunge'), R('Dumbbell rear-foot-elevated split squat','Rear foot on a bench')], B2:[R('Standing landmine press'), R('Seated dumbbell press','One arm at a time')], C:[R('Half-kneeling cable chop'), R('Landmine rotation')]},
    db:{A1:[R('Double dumbbell front squat'), R('Heels-elevated goblet squat','Heels on a plate or book')], A2:[R('Dumbbell incline press','Bench on an incline, or floor press with a 2-second pause'), R('Close-grip dumbbell press','Dumbbells together, elbows tucked')], B1:[R('Dumbbell walking lunge'), R('Dumbbell rear-foot-elevated split squat','Rear foot on a chair or couch')], B2:[R('Standing single-arm dumbbell press'), R('Kettlebell bottoms-up press','Light bell, squeeze the handle')], C:[R('Single-arm overhead carry','Arm locked out, ribs down'), R('Single-arm front-rack carry','No leaning')]},
    bw:{A1:[R('Skater squat','Back knee touches a cushion'), R('Single-leg box squat','Sit to a chair on one leg, stand back up')], A2:[R('Deficit push-ups','Hands on books or two chairs'), R('Diamond push-ups','Hands on a step to start if needed')], B1:[R('Lateral lunge'), R('Curtsy lunge')], B2:[R('Feet-elevated pike push-up','Feet on a chair'), R('Pike push-up, 3-second lowering')], C:[R('Hollow rock'), R('Plank shoulder taps','Hips still')]}
  },
  'Strength B: pull, hinge and carry':{
    gym:{A1:[R('Conventional deadlift'), R('Barbell Romanian deadlift')], A2:[R('Chin-ups','Band or lat pulldown if needed; add weight once 10 reps is easy'), R('Neutral-grip pull-ups','Band or lat pulldown if needed; add weight once 10 reps is easy')], B1:[R('Seated cable row'), R('Chest-supported dumbbell row')], B2:[R('Trap bar carry','Heavy, fast, tall'), R('Front-rack kettlebell carry','Heavy, fast, tall')], C:[R('Towel hang','Towel over the bar, grip it like a hose'), R('Fat-grip dead hang','Grips or a towel wrapped round the bar')]},
    db:{A1:[R('Heavy kettlebell deadlift'), R('Dumbbell hip thrust','Shoulders on a bench or couch')], A2:[R('Staggered-stance kettlebell row'), R('Single-arm dumbbell row, 2-second pause')], B1:[R('Kickstand dumbbell RDL'), R('Single-leg kettlebell deadlift')], B2:[R('Uneven farmer carry','Heavy in one hand, lighter in the other; switch each length'), R('Front-rack carry','Heavy, fast, tall')], C:[R('Side plank with dumbbell row'), R('Half-kneeling dumbbell halo')]},
    bw:{A1:[R('Single-leg glute bridge, feet elevated','Foot on a chair'), R('Single-leg hip thrust, 3-second hold','Shoulders on a couch or bench')], A2:[R('Chin-ups or underhand table rows','Rows under a sturdy table if no bar'), R('Towel rows','Towel round a pole or door handle, lean back')], B1:[R('B-stance hip hinge','Back foot on its toes, most weight on the front leg'), R('Single-leg RDL with reach','Reach for a spot on the floor ahead')], B2:[R('Crab walk'), R('Backward bear crawl')], C:[R('Copenhagen plank','Top leg on a chair, short lever to start'), R('Side plank with reach-through')]}
  },
  'Strength C: upper body and grip':{
    gym:{A1:[R('Push press'), R('Seated dumbbell press')], A2:[R('Pendlay row'), R('Chest-supported row')], B1:[R('Close-grip bench press'), R('Weighted push-ups','Plate on your back')]},
    db:{A1:[R('Half-kneeling dumbbell press','One arm at a time')], A2:[R('Single-arm dumbbell row')], B1:[R('Dumbbell push-up to row')]},
    bw:{A1:[R('Decline push-ups','Feet on a chair'), R('Pike push-up, 3-second lowering')], A2:[R('Towel rows','Towel round a pole or door handle, lean back'), R('Underhand table rows')]}
  }
};
function rotate(s, variant){
  const t = ROT[s.title]; if(!variant || !t || !s.versions) return s;
  for(const v of ['bw','db','gym']) s.versions[v] = s.versions[v].map(x=>{
    const opts = t[v] && t[v][x.lab]; if(!opts) return x;
    const r = opts[(variant-1) % opts.length]; // lists can be shorter than 2
    return {...x, name:r.name, note: r.note!==undefined ? r.note : ''};
  });
  return s;
}

/* ---------------- Strength cycle type ----------------
   Lower A, Upper A, zone 2, Lower B, Upper B, optional fireground power. Main lifts follow MAIN /
   MAINBW, accessories ACC, supersets as everywhere else. Tests in weeks 1 and 12 replace day 6.   */
const LIFT_HOW = 'Superset A1 with A2, resting 60–90 s after each pair. Same with B1 and B2. Finish with C.';
function liftParts(w){
  const p=PH(w), light = p==='deload'||p==='test';
  return {p, m:MAIN[w], mb:MAINBW[w], a:ACC[p], light, C: light ? '2 × ' : '3 × ', min: light ? 20 : 28};
}
function lowerA(w){
  const {m, mb, a, C, min} = liftParts(w);
  return {kind:'strength', code:'L', title:'Lower A: squat', minutes:min,
    focus:'Squat strength and single-leg control for stairs, ladders and lifting from the floor with a load.', how:LIFT_HOW,
    versions:{
      bw:[it('A1','Bulgarian split squat',mb+' /leg','Rear foot on a chair or couch',true,true), it('A2','Dead bug',C+'8 /side','Low back pressed into the floor'), it('B1','Lateral lunge',a+' /leg'), it('B2','Single-leg RDL',a+' /leg','Slow, hips square'), it('C','Copenhagen plank',C+'20 s /side','Top leg on a chair, short lever to start',false)],
      db:[it('A1','Goblet squat',m,'',true,true), it('A2','Dead bug',C+'8 /side','Low back pressed into the floor'), it('B1','Dumbbell rear-foot-elevated split squat',a+' /leg','Rear foot on a bench'), it('B2','Dumbbell hip thrust',a,'Shoulders on a bench or couch'), it('C','Copenhagen plank',C+'20 s /side','Top leg on a bench',false)],
      gym:[it('A1','Back squat',m,'',true,true), it('A2','Dead bug',C+'8 /side','Low back pressed into the floor'), it('B1','Dumbbell rear-foot-elevated split squat',a+' /leg','Rear foot on a bench'), it('B2','Back extension',a,'Hinge at the hips, squeeze the glutes at the top'), it('C','Copenhagen plank',C+'20 s /side','Top leg on a bench',false)]
    }};
}
function upperA(w){
  const {m, mb, a, C, min} = liftParts(w);
  return {kind:'strength', code:'U', title:'Upper A: push', minutes:min,
    focus:'Pressing strength for forcible entry and pushing through doors, balanced with rowing to keep shoulders healthy under SCBA.', how:LIFT_HOW,
    versions:{
      bw:[it('A1','Push-ups',mb,'Feet on a chair from week 7',true,true), it('A2','Table rows',a,'Under a sturdy table, body straight'), it('B1','Pike push-up',a), it('B2','Chair dips',a,'Elbows back, shoulders down'), it('C','Prone Y-T-W raise',C+'8 each','Slow, squeeze the shoulder blades',false)],
      db:[it('A1','Dumbbell floor press',m,'Use a bench if you have one',true,true), it('A2','One-arm dumbbell row',a+' /arm'), it('B1','Standing dumbbell press',a), it('B2','Dumbbell skull crusher',a,'Elbows pointed up, lower to the forehead'), it('C','Band pull-apart',C+'15','Arms straight, squeeze the shoulder blades',false)],
      gym:[it('A1','Bench press',m,'',true,true), it('A2','Chest-supported row',a), it('B1','Seated dumbbell press',a), it('B2','Cable triceps pressdown',a), it('C','Face pull',C+'15','Pull to the eyes, elbows high',false)]
    }};
}
function lowerB(w){
  const {m, mb, a, C, min} = liftParts(w), light = PH(w)==='deload'||PH(w)==='test';
  const carry = (light ? '2' : '3') + ' × 40 m';
  return {kind:'strength', code:'L', title:'Lower B: hinge', minutes:min,
    focus:'Deadlift strength and carries for lifting a patient, dragging a hose line and hauling tools up a stairwell.', how:LIFT_HOW,
    versions:{
      bw:[it('A1','Single-leg hip thrust',mb+' /leg','Shoulders on a couch or bench',true,true), it('A2','Plank shoulder taps',C+'20 total','Hips still'), it('B1','Single-leg box squat',a+' /leg','Sit to a chair on one leg, stand back up'), it('B2','Loaded backpack carry',carry,'Heavy pack, walk tall'), it('C','Side plank',C+'30 s /side','',false)],
      db:[it('A1','Dumbbell Romanian deadlift',m,'',true,true), it('A2','Half-kneeling dumbbell halo',C+'8 /direction','Ribs down, slow circles'), it('B1','Heels-elevated goblet squat',a,'Heels on a plate or book'), it('B2','Farmer carry',carry,'Heavy, fast, tall'), it('C','Side plank',C+'30 s /side','',false)],
      gym:[it('A1','Trap bar deadlift',m,'Or conventional deadlift',true,true), it('A2','Pallof press',C+'10 /side',''), it('B1','Leg press',a,'Full depth you can control'), it('B2','Farmer carry',carry,'Heavy, fast, tall'), it('C','Side plank',C+'30 s /side','',false)]
    }};
}
function upperB(w){
  const {m, mb, a, C, min} = liftParts(w);
  return {kind:'strength', code:'U', title:'Upper B: pull', minutes:min,
    focus:'Pulling strength and grip for hose pulls, victim drags, ladder climbs and hanging on to tools.', how:LIFT_HOW,
    versions:{
      bw:[it('A1','Pull-ups or table rows',mb,'Rows under a sturdy table if no bar',true,true), it('A2','Decline push-ups',a,'Feet on a chair'), it('B1','Towel rows',a,'Towel round a pole or door handle, lean back'), it('B2','Prone Y-T-W raise',a+' total','Slow, squeeze the shoulder blades',false), it('C','Dead hang',C+'max hold (cap 60 s)','A bar, a tree branch or a sturdy beam',false)],
      db:[it('A1','Single-arm dumbbell row',m+' /arm','',true,true), it('A2','Dumbbell incline press',a,'Bench on an incline, or floor press'), it('B1','Dumbbell rear-delt fly',a), it('B2','Hammer curl',a), it('C','Farmer hold',C+'30 s','Heaviest dumbbells you can hold, stand tall',false)],
      gym:[it('A1','Pull-ups',m,'Band or lat pulldown if needed; add weight once 10 reps is easy',true,true), it('A2','Dumbbell incline press',a), it('B1','Seated cable row',a), it('B2','Hammer curl',a), it('C','Dead hang',C+'max hold (cap 60 s)','Grip for tools and hose',false)]
    }};
}
function zone2(w){
  const min = {base:20, build:25, peak:25, deload:20, test:20}[PH(w)];
  return {kind:'cardio', code:'Z', title:'Zone 2 and mobility', minutes:min+5,
    focus:'The one cardio day: easy aerobic work that helps you recover between lifting days. Keep it conversational.',
    steps:[it('1','Zone 2',min+' min easy bike or run','Nose breathing, talk in full sentences',false), it('2','Mobility','5 min','Hip flexor stretch, 90/90 hips, thoracic rotations, child’s pose',false)],
    fields:cardioFields};
}
function power(w){
  const p = PH(w), dl = p==='deload';
  const rounds = {base:'3 rounds', build:'4 rounds', peak:'4 rounds, as fast and crisp as you can', deload:'2 easy rounds', test:'2 easy rounds'}[p];
  return {kind:'hybrid', code:'P', title:'Fireground power', minutes: dl ? 12 : 18,
    focus: rounds+', resting 60–90 s between rounds. Fast, explosive reps; stop each set before you slow down. Kept short so it doesn’t eat into your recovery.',
    how:'Full recovery matters more than the clock here: power work only counts when it’s fast.',
    versions:{
      bw:[it('1','Broad jumps','4','Stick each landing',false), it('2','Squat jumps','6','Land soft',false), it('3','Bear crawl','20 m','',false), it('4','Burpees','6','Explode up',false)],
      db:[it('1','Squat jumps','5','Land soft, reset each rep',false), it('2','Kettlebell swing','12','Snap the hips',false), it('3','Farmer carry','40 m','Heavy and fast',false), it('4','Kettlebell or sandbag slams','8','',false)],
      gym:[it('1','Box jump','4','Step down, full reset each rep',false), it('2','Kettlebell swing','12','Snap the hips',false), it('3','Sled push','20 m','Or 40 m heavy farmer carry',false), it('4','Med ball slam','8','',false)]
    }};
}
/* Weeks 1 and 12: estimated 5-rep max on the main lifts (gym and DB/KB), max reps on bodyweight.
   Items carry t (which test row) and e5 (log load + reps for an estimated 5RM).                   */
function strengthTest(w){
  const heavy = 'Work up to a heavy set of 5', e5 = (x, t) => ({...x, t, e5:true}), mx = (x, t) => ({...x, t});
  const pull = mx(it('4','Strict pull-ups','One set, max reps','From a dead hang, no kipping. Table rows if you have no bar'), 'pull');
  const push = mx(it('5','Push-ups','One set, max reps','Chest to a fist on the floor, no resting at the top'), 'push');
  return {kind:'test', code:'T', title: w===1 ? 'Strength test: baseline' : 'Strength test: retest', minutes:35,
    focus: w===1 ? 'Sets your starting numbers. Warm up, then work up in 3–4 sets to a set of 5 you could repeat once more at most. Log the load and reps: the app estimates your 5-rep max even if you got 4 or 7.' : 'Same tests as week 1, same equipment and order. See what twelve weeks did.',
    how:'Rest 2–3 min between heavy sets. Bodyweight version: one all-out set of the main movement instead of a 5-rep max.',
    versions:{
      bw:[mx(it('1','Bulgarian split squat','One set per leg, max reps','Rear foot on a chair'), 'squat'), mx(it('3','Single-leg hip thrust','One set per leg, max reps','Shoulders on a couch'), 'dead'), pull, push],
      db:[e5(it('1','Goblet squat',heavy,'Or double dumbbell front squat if the goblet is too light'), 'squat'), e5(it('2','Dumbbell floor press',heavy), 'bench'), e5(it('3','Dumbbell Romanian deadlift',heavy), 'dead'), pull, push],
      gym:[e5(it('1','Back squat',heavy), 'squat'), e5(it('2','Bench press',heavy), 'bench'), e5(it('3','Trap bar deadlift',heavy,'Or conventional deadlift; use the same one in week 12'), 'dead'), pull, push]
    }};
}

/* ---------------- Program library ---------------- */
const opt = s => (s.optional = true, s);
const PROGRAMS = {
  hybrid:{type:'hybrid', name:'Fireground Hybrid', perWeek:'Five sessions a week, plus an optional sixth.',
    blurb:'The original. Two lifting days, intervals, a fireground circuit and a run every week.',
    days: w => [strengthA(w), intervals(w), hybrid(w), run(w), strengthB(w), day6(w)]},
  strength:{type:'hybrid', name:'Hybrid strength block', perWeek:'Five sessions a week, plus an optional sixth.',
    blurb:'Three heavier lifting days with lower reps, plus intervals and a fireground circuit to keep the engine running.',
    days: w => [withMain(strengthA(w),w,x=>STR[x],x=>STRBW[x]), intervals(w), withMain(strengthC(w),w,x=>STR[x],x=>STRBW[x]), hybrid(w), withMain(strengthB(w),w,x=>STR[x],x=>STRBW[x]), day6(w)]},
  engine:{type:'hybrid', name:'Engine block', perWeek:'Six sessions a week. Day 6 is a long, easy one.',
    blurb:'Conditioning first: intervals, threshold work and a long zone 2 day, with two shorter lifting days to hold your strength.',
    days: w => [withMain(strengthA(w),w,x=>MAINT[PH(x)],x=>MAINTBW[PH(x)]), intervals(w), hybrid(w), threshold(w), withMain(strengthB(w),w,x=>MAINT[PH(x)],x=>MAINTBW[PH(x)]), (w===1||w===12) ? day6(w) : longZone2(w)]},
  cpat:{type:'hybrid', name:'Fireground test prep', perWeek:'Five sessions a week, plus an optional sixth.',
    blurb:'For the CPAT, an academy or a department fitness test: an event-by-event test circuit every week and full simulations to finish.',
    days: w => [strengthA(w), intervals(w), cpat(w), run(w), strengthB(w), day6(w)]},
  maintenance:{type:'hybrid', name:'Shift-season maintenance', perWeek:'Three sessions a week, plus an optional fourth.',
    blurb:'Three short sessions a week to hold what you’ve built when shifts, overtime or life get busy.',
    days: w => [withMain(strengthA(w),w,x=>MAINT[PH(x)],x=>MAINTBW[PH(x)]), hybrid(w), withMain(strengthB(w),w,x=>MAINT[PH(x)],x=>MAINTBW[PH(x)]), (w===1||w===12) ? day6(w) : opt(intervals(w))]},
  lift:{type:'strength', name:'Strength', perWeek:'Five sessions a week, plus an optional sixth.',
    blurb:'Four 20–30 minute lifting days (lower and upper, twice each), one zone 2 day and an optional short fireground power day.',
    days: w => [lowerA(w), upperA(w), zone2(w), lowerB(w), upperB(w), (w===1||w===12) ? strengthTest(w) : opt(power(w))]}
};
const TYPES = {hybrid:'Hybrid', strength:'Strength'};
/* A cycle's type; cycles saved before types existed are hybrid. */
const typeOf = c => (c && c.type) || ((PROGRAMS[c && c.program] || {}).type) || 'hybrid';
const CODE_NAME = {S:'strength', L:'lower', U:'upper', I:'intervals', H:'threshold', F:'fireground', C:'test circuit', R:'run', Z:'zone 2', P:'power', T:'test'};

/* ---------------- Cycles ----------------
   A cycle is {n, program, type, baseline, startedAt, finishedAt}. n only ever grows (deleted
   cycles leave gaps). Cycle 1 keeps the original
   session ids (w1d1...); later cycles prefix them (c2:w1d1...), so nothing ever collides.
   baseline:false skips the week-1 tests: the previous cycle's week-12 results are the start. */
const DEFAULT_CYCLE = {n:1, program:'hybrid', type:'hybrid', baseline:true};
const idFor = (n, w, d) => (n===1 ? '' : 'c'+n+':') + 'w'+w+'d'+d;
const cycleOf = id => { const m = /^c(\d+):/.exec(id); return m ? +m[1] : 1; };
const cache = new Map();
function planFor(c){
  const key = c.n+'|'+c.program+'|'+(c.baseline!==false);
  if(cache.has(key)) return cache.get(key);
  const prog = PROGRAMS[c.program] || PROGRAMS.hybrid, variant = (c.n-1) % 3, plan = [];
  for(let w=1; w<=12; w++){
    let days = prog.days(w);
    // No baseline this cycle: week 1 tests become ordinary week-2-style sessions.
    if(w===1 && c.baseline===false){ const w2 = prog.days(2); days = days.map((s,i)=> (s.kind==='test' || s.bench || /benchmark/.test(s.title)) ? w2[i] : s); }
    days.forEach((s,i)=>{
      rotate(s, variant);
      if(/^Fireground benchmark/.test(s.title)) s.bench = true;
      s.id = idFor(c.n, w, i+1); s.week = w; s.day = i+1; s.cycle = c.n;
      plan.push(s);
    });
  }
  cache.set(key, plan);
  return plan;
}

export { PH, PH_NAME, PH_NOTE, MAIN, MAINBW, ACC, WARM, VNAME, MODES, PROGRAMS, TYPES, typeOf, CODE_NAME, DEFAULT_CYCLE, planFor, cycleOf, idFor };
