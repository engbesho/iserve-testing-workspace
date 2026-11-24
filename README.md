# IServe Testing Workspace

Static website (no build step): HTML + CSS + JavaScript.

## Run locally
1. Open this folder in Visual Studio Code (File > Open Folder).
2. Install the "Live Server" extension (VS Code suggests it), then click "Go Live". You can also double-click `index.html`.

## Files
- `index.html` - page structure and dialogs
- `css/style.css` - all styling
- `js/app.js` - all app logic (projects, services, checklist, bugs, dashboard, exports, Google Sheets sync)
- `js/assets.js` - embedded default banner and logo
- `assets/` - original banner and logo images
- `google-apps-script/Code.gs` - backend that stores the data in a Google Sheet

## Team sync with Google Sheets (free)
1. Create a new Google Sheet.
2. Extensions > Apps Script. Paste `google-apps-script/Code.gs` and change `TOKEN` to your own secret word.
3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the URL ending in `/exec`.
4. On the deployed website click **Sync**, paste the URL and the same access key, tick "Turn on sync", then "Save and sync".
5. Every teammate does step 4 on their own browser.

Notes: sync works only on a real host (Netlify, GitHub Pages, localhost), not inside Claude's preview. Attached images/videos and custom banner/background/profile images stay local to each browser. If two people edit the same project at once the site asks who wins.

## Deploy (free)
Upload the folder (or a zip with `index.html` at the top level) to Netlify, GitHub Pages, Cloudflare Pages or Vercel.
