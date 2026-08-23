#!/bin/bash
# HV Jewelers — local preview launcher.
# Double-click this file to install dependencies (first run only),
# start the dev server, and open the site in your browser.
# Press Ctrl+C in this window to stop the server.

cd "$(dirname "$0")"

echo "── HV Jewelers preview ──────────────────────────"
echo "Syncing dependencies (fast if nothing changed)…"
npm install

# Open the browser once the server is up.
(
  until curl -s -o /dev/null http://localhost:3000; do sleep 1; done
  open http://localhost:3000
) &

echo "Starting dev server at http://localhost:3000 …"
npm run dev
