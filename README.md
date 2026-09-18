# Meine Bücher

Eine mobile Bücher-Bibliothek als reine HTML/CSS/JS-App, die direkt über
**GitHub Pages** läuft. Kein Server, keine Installation, kein Wert-/
Preistracking – nur Bücher und ihre Merkmale.

Diese App ist direkt aus der `docs/index.html` der
[BigBox-PC-Sammlung](https://github.com/Osmodia666/BigBox-PC-Sammlung)
übernommen (dort läuft dieselbe Architektur schon als mobile Web-App für
die PC-Spielesammlung) und für Bücher umgebaut: gleiche Regal-/Such-/
Sync-Oberfläche, aber mit buch-typischen Feldern statt Spiele-Feldern und
ganz ohne Geldwert.

## Funktionen

- **Regal-Ansicht**: Bücher als Buchrücken auf Holzregalen, alphabetisch
  in Reihen gruppiert
- **Suche**: nach Titel, Autor, Verlag, ISBN, Genre, Jahr, mit Sortierung
  (Titel, Seiten, Jahr, Autor) und Filter-Chips (Ausgabe, Zustand)
- **Merkmale pro Buch**: Titel, Autor, Verlag, Jahr, ISBN, Genre, Sprache,
  Ausgabe (Hardcover/Taschenbuch/Ebook/Hörbuch/Sonderausgabe), Zustand,
  Notizen, Gelesen (Ja/Nein), Sterne-Bewertung (1–5), Cover — **kein
  Geldwert**
- **Cover & Metadaten automatisch laden**: Titel eingeben und "Bei Google
  Books suchen" liefert Autor/Verlag/Jahr/ISBN/Seitenzahl/Cover in einem
  Aufruf, ganz ohne eigenen API-Key
- **ISBN-Barcode scannen**: Foto vom Barcode aufnehmen (Kamera-Button) –
  die erkannte ISBN wird automatisch bei Google Books nachgeschlagen und
  füllt leere Felder plus Cover aus
- **Bestand & Statistik**: Anzahl, Gelesen-Quote, Seiten gesamt/Ø Seiten
  pro Buch, Ø Bewertung, Jahresspanne, Verteilung nach
  Zustand/Ausgabe/Genre
- **Sync**: WebDAV (Nextcloud & Co.) und Google Drive, jeweils mit
  Push/Pull und Bestätigungsdialog vor dem Überschreiben; alternativ
  manueller CSV-Export/-Import
- **Einstellungen sichern/wiederherstellen** als separate Backup-Datei
- Als "App" auf dem Homescreen installierbar (PWA-Manifest)

## Daten & Speicherung

Die Bücher liegen in **IndexedDB** im Browser (großzügiges Kontingent,
verträgt eingebettete Cover-Bilder), Sync-Zugangsdaten in `localStorage`
– beides gerätegebunden. Es gibt keinen eigenen Server und kein Konto.
Für mehrere Geräte: unter **Mehr → Sync** entweder WebDAV/Google Drive
verbinden oder die CSV-Datei manuell exportieren/importieren.

## GitHub Pages

Diese App liegt im Root dieses Branches (`main`), damit **Settings →
Pages** direkt mit Source `main` / `/ (root)` funktioniert – ohne
weitere Einstellungen. Nach einer Änderung dauert es meist ein bis zwei
Minuten, bis die `github.io`-URL aktualisiert ist.

Auf dem Handy die Seite öffnen und über "Zum Home-Bildschirm
hinzufügen" (iOS) bzw. "App installieren" (Android/Chrome) als App
ablegen.

Dieselbe App liegt zusätzlich unter `docs/` auf dem Branch
`claude/book-collection-app-61p6fv`, falls Pages dort stattdessen über
`/docs` konfiguriert werden soll.

## Lokal testen

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen.
