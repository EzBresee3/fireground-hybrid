# Fireground Hybrid

A 12-week hybrid strength and conditioning tracker for firefighters, built as an installable web app.
It runs entirely on your phone. There are no accounts, no server, and it works in airplane mode.

**App:** https://ezbresee3.github.io/fireground-hybrid/

## Install on iPhone

1. Open the link above in **Safari** (it has to be Safari).
2. Tap **Share** (the square with the arrow), then **Add to Home Screen**, then **Add**.
3. Open it from the home-screen icon once while you're online. After that it works fully offline.

## Back up and restore

Your log is stored only on this phone, in the app's own storage. If you delete the app or reset the phone, the log is gone unless you have a backup.

- **Back up:** Progress tab → **Backup** → **Export data**. Pick **Save to Files** and keep it somewhere like iCloud Drive. The file is named `fireground-hybrid-backup-YYYY-MM-DD.json`.
- **Restore:** Progress tab → **Import data**, then pick a backup file. The app checks the file and asks before it replaces anything.
- The Progress tab shows the date of your last backup, and a reminder if it's been more than 14 days.

## Updates

Push changes to `main` and GitHub Actions publishes them to GitHub Pages in about a minute.
The next time you open the app online, a banner says **Update available, tap to reload**. Tap it to switch to the new version. Your data isn't touched.
If the banner doesn't show, close the app fully and open it again.

## Development

Plain HTML, CSS and ES modules with no build step:

```
index.html             app shell
css/app.css            styles (design tokens, light/dark)
js/program.js          the 12-week plan (data only)
js/storage.js          IndexedDB storage, backup validation
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
