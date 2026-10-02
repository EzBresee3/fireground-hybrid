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
const PLAN = [];
for (let w=1; w<=12; w++){
  const days = [strengthA(w), bike(w), hybrid(w), run(w), strengthB(w), day6(w)];
  days.forEach((s,i)=>{ s.id='w'+w+'d'+(i+1); s.week=w; s.day=i+1; PLAN.push(s); });
}
const BY_ID = Object.fromEntries(PLAN.map(s=>[s.id,s]));
const REQUIRED = PLAN.filter(s=>!s.optional);
const VNAME = {bw:'Bodyweight', db:'DB / KB', gym:'Full gym'};

export { PH, PH_NAME, PH_NOTE, MAIN, MAINBW, ACC, WARM, PLAN, BY_ID, REQUIRED, VNAME };
