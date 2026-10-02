/* Renders the app icons with headless Chromium. Dev-only; not deployed.
   Run from the repo root:  NODE_PATH=$(npm root -g) node tools/make-icons.cjs  */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const font = fs.readFileSync(path.join(root, 'fonts/barlow-condensed-700.woff2')).toString('base64');

// 512-unit artwork. `s` scales the mark around the centre (maskable icons need it inside the safe zone).
function svg(s){
  const band = (y,h) => `<rect x="-512" y="${y}" width="1536" height="${h*.32}" fill="#E3DC3C"/>
    <rect x="-512" y="${y+h*.32}" width="1536" height="${h*.36}" fill="#B9C0C4"/>
    <rect x="-512" y="${y+h*.68}" width="1536" height="${h*.32}" fill="#E3DC3C"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
    <rect width="512" height="512" fill="#B8251B"/>
    <g transform="translate(256 256) scale(${s}) translate(-256 -256)">
      ${band(318, 74)}
      <text x="256" y="292" text-anchor="middle" font-family="FH" font-weight="700" font-size="262" letter-spacing="2" fill="#FFFFFF">FH</text>
    </g>
  </svg>`;
}
const page = s => `<!doctype html><html><head><style>
  @font-face{font-family:FH;font-weight:700;src:url(data:font/woff2;base64,${font}) format("woff2")}
  html,body{margin:0;width:100%;height:100%;overflow:hidden}
</style></head><body>${svg(s)}</body></html>`;

const OUT = [
  ['icons/icon-180.png', 180, 1],
  ['icons/icon-192.png', 192, 1],
  ['icons/icon-512.png', 512, 1],
  ['icons/icon-maskable-512.png', 512, 0.8],
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  for (const [file, px, s] of OUT){
    const p = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
    await p.setContent(page(s));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(root, file) });
    await p.close();
    console.log('wrote', file);
  }
  await browser.close();
})();
