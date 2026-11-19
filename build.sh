#!/usr/bin/env bash
# Build TalcoCalendar : icônes + version du cache + archive prête pour GitHub Pages
set -euo pipefail
cd "$(dirname "$0")"
echo "▶ Icônes PNG…"
python3 generate_icons.py
echo "▶ Vérification JSON/JS…"
python3 -m json.tool manifest.json >/dev/null && echo "  manifest OK"
command -v node >/dev/null && node --check app.js && echo "  app.js OK"
echo "▶ Archive…"
rm -f TalcoCalendar-pwa.zip
zip -rq TalcoCalendar-pwa.zip index.html style.css app.js sw.js manifest.json icon*.svg icon-*.png
echo "✔ TalcoCalendar-pwa.zip ($(du -h TalcoCalendar-pwa.zip | cut -f1))"
echo "  Test local : python3 -m http.server 8080"
