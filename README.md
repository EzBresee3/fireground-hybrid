# Fireground Hybrid

A 12-week hybrid strength and conditioning tracker for firefighters, built as an installable web app.
It runs entirely on your phone. There are no accounts, no server, and it works in airplane mode.

**App:** https://ezbresee3.github.io/fireground-hybrid/

## Install on iPhone

1. Open the link above in **Safari** (it has to be Safari).
2. Tap **Share** (the square with the arrow), then **Add to Home Screen**, then **Add**.
3. Open it from the home-screen icon once while you're online. After that it works fully offline.

## Cycles and programs

The app runs in 12-week **cycles**. When you finish one, or tap **Start the next cycle early** on the Plan tab, you pick what to run next:

| Program | Per week | For |
|---|---|---|
| Fireground Hybrid | 5 + 1 optional | The original: balanced strength and conditioning |
| Strength block | 5 + 1 optional | Three heavier lifting days with lower reps |
| Engine block | 6 | Intervals, threshold work and long zone 2, with two shorter lifts |
| Fireground test prep | 5 + 1 optional | CPAT, academy or department tests: event circuit and simulations |
| Shift-season maintenance | 3 + 1 optional | Holding your fitness through busy stretches |
| **Strength** (Strength type) | 5 + 1 optional | Lower A (squat), Upper A (push), zone 2, Lower B (hinge), Upper B (pull), optional fireground power |

When you start a cycle, pick a **type** first: **Hybrid** (the programs above, unchanged; the old Strength block is listed as Hybrid strength block) or **Strength**. Strength cycles test an estimated 5-rep max on squat, bench and deadlift (max reps on bodyweight), plus max strict pull-ups and push-ups, in weeks 1 and 12. Plan tags: L lower, U upper, Z zone 2, P power, T test.

- **Rotation:** main lifts and accessories rotate to a new variation each cycle, for example back squat, then front squat, then safety-bar squat, then back to the start. Fireground circuits stay the same so the benchmark keeps comparing.
- **Baseline:** if you finished last cycle's week 12 tests, the new cycle skips the week 1 tests and uses those results as its starting numbers.
- **Interval days:** choose **Bike**, **Stair climber** or **Run**. It's the same workout either way, and the app remembers your choice.
- **History:** every lift shows **Last time** (from any earlier week or cycle). The Plan tab can step back through old cycles, and Progress shows every cycle plus all-time bests.
- **Nothing is ever replaced.** Every cycle's log is kept, and it's included in exports and auto-sync.
- **Deleting a cycle:** Plan tab → step to the cycle with ‹ › → **Delete cycle** at the very bottom. The sheet shows what will go and offers **Export backup first**. Type `DELETE` to confirm. You then get 10 seconds to **Undo**; the delete is only saved when that runs out, and closing the app before then cancels it. Your custom exercises and every-time swaps stay. If you delete the current cycle, the most recent remaining one becomes current; with none left, the app offers to start a new cycle.

## Swapping exercises and sessions

- **One exercise:** tap **Swap** on any exercise. Alternatives with the same movement pattern are grouped by equipment, with your session's equipment first. **Add your own** saves a custom exercise for that pattern. Then pick **Just today** or **Every time**; every-time swaps apply to all future sessions with that exercise on that equipment. Sets, reps and effort never change. A swapped row shows *Swapped from …* with **Undo**.
- **A cardio session:** tap **Swap session** to do it on a run, stationary bike, rower, assault bike, stair climber, incline walk (ruck) or swim. The structure and times stay the same, and "hard" still means about RPE 8. Choose **Just today** or **Every time** (for that type of day).
- **A strength or fireground session:** **Swap session** switches this one session to Bodyweight, DB / KB or Full gym without changing your default.
- **My swaps:** the gear icon in the header opens Settings, which lists every every-time swap, cardio machine and custom exercise, each with Delete.
- **History is safe:** each logged lift records both the planned exercise and the one you did, and finished sessions keep their swaps even if you delete the rule later. Progress tracks the lift you actually did, marked "swapped".

## Coaching tips

The plan never rewrites itself, but the app reads what you log and adds short tips:

- **Lifts:** if you hit every rep and rated the session 6 or lower, or beat the target by 2+ reps, it suggests more weight (+10–20 lb for squats and deadlifts, +5–10 lb for presses and rows). If you missed reps on a hard day, it suggests repeating the weight or dropping about 10%. When today has more reps than last time, it estimates a starting weight.
- **New lift this cycle:** the starting weight comes from the lift it replaced (for example, front squat from your back squat).
- **Bodyweight:** if you beat the target easily, it suggests a harder variation. If you struggled, an easier one.
- **Intervals, runs and circuits:** two hard sessions that felt easy, two that felt maxed out, easy days that felt hard, or going much longer than planned at an easy effort each trigger a tip.
- **No tips on deload or test weeks.** Those are easy on purpose, and they're never used as evidence.

Tips use your load, your reps (type them like `10,10,9`), your time, and the **How hard was it?** rating, so log those for the best suggestions.

## Auto-sync (recommended)

Turn this on once and you never need to back up by hand. After every save, the app uploads your log to a **private gist** on your GitHub account. GitHub keeps every version, so you can always roll back.

1. In the app, open **Progress → Backup and sync** and tap **Create a GitHub token**. This opens GitHub with only the **gist** permission ticked.
2. Set **Expiration** to **No expiration**, tap **Generate token** and copy the token (it starts with `ghp_`).
3. Back in the app, paste it and tap **Connect**. The header changes to **Saved and synced**.

- **Offline:** changes wait and upload the next time you open the app with a connection.
- **New phone:** install the app, paste the same token and tap Connect. Your log comes back automatically.
- **Problem:** if the token is revoked or expires, the app says "sync failed" and keeps everything on the phone. Turn auto-sync off and connect again with a new token.
- **Your gist:** it's named `fireground-hybrid.json`. Use **View on GitHub** to see it, or **Revisions** on GitHub to see older versions.
- The token can only read and write your gists, nothing else on your account. It's stored only in the app on your phone and is never included in exported files.

## Manual backup and restore

Export and Import still work alongside auto-sync, or instead of it.

- **Back up:** Progress tab → **Export data**. Pick **Save to Files** and keep it somewhere like iCloud Drive. The file is named `fireground-hybrid-backup-YYYY-MM-DD.json`.
- **Restore:** Progress tab → **Import data**, then pick a backup file. The app checks the file and asks before it replaces anything. A gist's `fireground-hybrid.json` file imports too.
- Without auto-sync, the Progress tab reminds you if your last backup is more than 14 days old.

## Updates

Push changes to `main` and GitHub Actions publishes them to GitHub Pages in about a minute.
The next time you open the app online, a banner says **Update available, tap to reload**. Tap it to switch to the new version. Your data isn't touched.
If the banner doesn't show, close the app fully and open it again.

## Development

Plain HTML, CSS and ES modules with no build step:

```
index.html             app shell
css/app.css            styles (design tokens, light/dark)
js/program.js          the program library: session builders, rotations, cycles (data only)
js/storage.js          IndexedDB storage, backup validation
js/sync.js             auto-sync to a private GitHub Gist
js/coach.js            coaching tips from your logged sessions
js/exercises.js        exercise library: movement patterns, equipment, alternatives, cardio machines
js/app.js              views, logging, rest timer, wake lock, update banner
sw.js                  service worker (cache-first app shell)
manifest.webmanifest   install metadata
fonts/                 self-hosted Barlow / Barlow Condensed (SIL OFL)
icons/                 app icons (regenerate: NODE_PATH=$(npm root -g) node tools/make-icons.cjs)
reference/             the original single-file version (not deployed)
```

To run locally, serve the folder under the same path GitHub Pages uses, so the manifest scope matches:

```sh
mkdir -p /tmp/site && ln -sfn "$PWD" /tmp/site/fireground-hybrid
npx http-server /tmp/site -c-1 -p 8080   # then open http://localhost:8080/fireground-hybrid/
```

**One-time GitHub setup:** in repo **Settings → Pages**, set **Source** to **GitHub Actions**.

**Service worker cache:** `sw.js` has `VERSION = 'dev'`, and the deploy workflow replaces it with the commit SHA. If you add a new file the app needs offline, add it to `SHELL` in `sw.js`.
