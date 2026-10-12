/* ---------------- Layout diagnostics ----------------
   Triple-tap the "Fireground Hybrid" title to show live viewport and layout measurements, and to
   switch the shell sizing option (a / b / c, see app.css) without a new deploy. Read-only apart
   from the html[data-shell] attribute and the saved choice in localStorage. Sets no heights.      */
const OPTIONS = ['a', 'b', 'c'];
const DESCR = {a:'fixed top, height 100lvh', b:'fixed inset 0 + min-height 100lvh', c:'fixed top, height 100vh + bottom inset', none:'fixed inset 0 (browser tab default)'};
const KEY = 'fh-shell';

export function initDiag(){
  const html = document.documentElement;
  const box = document.createElement('div');
  box.className = 'diag'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Layout diagnostics');
  box.innerHTML = `<pre id="diag-out"></pre><div class="row"><button id="diag-cycle">Cycle option</button><button class="ghost" id="diag-auto">Auto</button><button class="ghost" id="diag-close">Close</button></div>`;
  const probe = document.createElement('div'); probe.id = 'env-probe';
  document.body.append(box, probe);
  const out = box.querySelector('#diag-out');

  const r = sel => { const el = document.querySelector(sel); if(!el) return '–'; const b = el.getBoundingClientRect(); return `${Math.round(b.top)} → ${Math.round(b.bottom)}`; };
  const mode = () => ['standalone','fullscreen','minimal-ui','browser'].find(m => matchMedia(`(display-mode: ${m})`).matches) || 'none';
  function paint(){
    if(box.hidden) return;
    const vv = window.visualViewport, cs = getComputedStyle(probe), nav = document.querySelector('nav.tabs').getBoundingClientRect();
    const opt = html.getAttribute('data-shell') || 'none';
    const navOk = Math.round(nav.bottom) === screen.height;
    out.innerHTML =
`innerHeight        ${innerHeight}
docEl.clientHeight ${html.clientHeight}
visualViewport     ${vv ? `${Math.round(vv.height)} (offsetTop ${Math.round(vv.offsetTop)})` : 'n/a'}
screen.height      ${screen.height}
window.scrollY     ${Math.round(scrollY)}
#app-shell         ${r('#app-shell')}
#scroller          ${r('#scroller')}
nav                ${r('nav.tabs')}  <span class="${navOk ? 'good' : 'bad'}">${navOk ? '= screen.height' : '≠ screen.height'}</span>
safe-area top      ${cs.paddingTop}
safe-area bottom   ${cs.paddingBottom}
navigator.standalone ${String(navigator.standalone)}
display-mode       ${mode()}
shell option       ${opt}: ${DESCR[opt]}`;
  }
  let timer = null;
  const show = on => { box.hidden = !on; clearInterval(timer); if(on){ paint(); timer = setInterval(paint, 300); } };
  const setOpt = o => {
    if(o) html.setAttribute('data-shell', o); else html.removeAttribute('data-shell');
    try{ o ? localStorage.setItem(KEY, o) : localStorage.removeItem(KEY); }catch(e){}
    requestAnimationFrame(paint);
  };
  box.querySelector('#diag-cycle').addEventListener('click', ()=>{ const cur = html.getAttribute('data-shell'); setOpt(OPTIONS[(OPTIONS.indexOf(cur) + 1) % OPTIONS.length]); });
  box.querySelector('#diag-auto').addEventListener('click', ()=>{
    setOpt(null);
    const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
    if(standalone) html.setAttribute('data-shell', 'a');
    requestAnimationFrame(paint);
  });
  box.querySelector('#diag-close').addEventListener('click', ()=>show(false));
  ['resize','scroll','orientationchange'].forEach(ev=>window.addEventListener(ev, paint, {passive:true}));
  if(window.visualViewport){ visualViewport.addEventListener('resize', paint); visualViewport.addEventListener('scroll', paint); }

  // Triple tap: three taps on the title within 600 ms
  let taps = [];
  document.querySelector('.brand').addEventListener('click', ()=>{
    const now = Date.now(); taps = taps.filter(t=>now - t < 600); taps.push(now);
    if(taps.length >= 3){ taps = []; show(box.hidden); }
  });
}
