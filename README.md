# Magicode AI — Static Dashboard

HTML/CSS/JavaScript dashboard designed to be easy to edit and host on GitHub Pages.

## Run
Open `index.html` directly, or use any static hosting provider.

## Deploy on GitHub Pages
1. Put these files in the repository root: `index.html`, `style.css`, `script.js`.
2. GitHub → Settings → Pages.
3. Source: Deploy from a branch.
4. Branch: `main`, folder `/root`.
5. Save and open the generated Pages URL.

## Make integration
The UI currently uses mock data. Keep the automation in Make. Later add a small server/API layer for `/api/send-message` and `/api/messages` so secrets remain server-side.
