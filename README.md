# Meine Bücher

Eine mobile Web-App für die eigene Bücher-Bibliothek – als reine
HTML/CSS/JS-Anwendung, die direkt über **GitHub Pages** läuft. Kein Server,
keine Installation, kein Wert-/Preistracking – nur Bücher und ihre
Merkmale.

Optisch und funktional angelehnt an die "BigBox PC Sammlung"-Desktop-App,
aber für Bücher und für's Handy gebaut.

## Funktionen

- Bücher anlegen, bearbeiten, löschen
- Merkmale: Titel, Autor, Verlag, Jahr, ISBN, Genre, Sprache, Ausgabe
  (Hardcover/Taschenbuch/Ebook/Hörbuch/Sonderausgabe), Zustand, Reihe/Band,
  Seitenzahl, Gelesen (Ja/Nein), Erstausgabe (Ja/Nein), Notizen, Cover
- Regal-Ansicht (Cover-Kacheln) und Listen-Ansicht
- Suche (Titel, Autor, Verlag, Jahr, ISBN, Genre, Reihe) und Sortierung
- Filter: Alle / Gelesen / Ungelesen
- Cover-Bild selbst hochladen **oder** Titel, Autor, Verlag, Jahr, ISBN,
  Seitenzahl und Cover automatisch über die offene Google-Books-API laden
  (kein API-Key nötig)
- Links zu Wikipedia und Goodreads für das ausgewählte Buch
- Als "App" auf dem Homescreen installierbar (PWA mit Offline-Grundgerüst)
- Export/Import als JSON-Datei zum Sichern oder Übertragen auf ein anderes
  Gerät

## Daten & Speicherung

Alle Bücher werden ausschließlich lokal im Browser gespeichert
(`localStorage`), gerätegebunden. Es gibt keinen Server und kein Konto –
über "⚙ Sichern & Übertragen" lässt sich die Sammlung als Datei
exportieren und auf einem anderen Gerät wieder importieren.

## GitHub Pages einrichten

1. Im Repository unter **Settings → Pages** als Source den Branch
   auswählen, auf dem diese Dateien liegen (Ordner `/ (root)`).
2. Nach ein bis zwei Minuten ist die App unter der angezeigten
   `github.io`-URL erreichbar.
3. Auf dem Handy die Seite öffnen und über "Zum Home-Bildschirm
   hinzufügen" (iOS) bzw. "App installieren" (Android/Chrome) als App
   ablegen.

## Lokal testen

Da die App `fetch()` nutzt, reicht ein einfaches Doppelklicken auf
`index.html` nicht überall aus (CORS) – am zuverlässigsten mit einem
kleinen lokalen Server:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen.
