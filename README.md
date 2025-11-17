# Spielbericht Photo Checker - Browser Extension

> **Haftungsausschluss / Disclaimer:**  
> Dies ist **KEIN offizielles Projekt der DFBnet GmbH** oder des Deutschen Fußball-Bundes.  
> Alle Rechte, Marken und Logos liegen bei den jeweiligen Inhabern.  
> 
> Diese Browser-Erweiterung dient ausschließlich als **Hilfsmittel** zur Unterstützung bei der Verwaltung von Spielerfotos.  
> Die Nutzer sind **selbst verantwortlich** für die Kontrolle von Bildern, Spielerdaten und die Einhaltung aller Regeln im Spielbetrieb.  
> Die Verwendung erfolgt auf eigene Verantwortung.

---

Diese Browser-Erweiterung überprüft automatisch, ob alle Spieler auf DFB Spielbericht-Seiten ein Foto hochgeladen haben, und zeigt eine Live-Warnung an, wenn Fotos fehlen.

## Installation

### Chrome / Edge / Brave

0. **Herunterladen der Erweiterung**
   - Laden Sie die Erweiterung von GitHub als .zip herunter
   - Entspacken Sie die .zip Datei in ein Ornder Ihrer Wahl

1. **Öffnen Sie die Erweiterungsverwaltung:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
   - Oder: Klicken Sie auf das Puzzle-Symbol → "Erweiterungen verwalten"

2. **Aktivieren Sie den Entwicklermodus:**
   - Schalten Sie den Schalter "Entwicklermodus" oben rechts ein

3. **Laden Sie die Erweiterung:**
   - Klicken Sie auf "Entpackte Erweiterung laden"
   - Wählen Sie den Ordner den Sie in Schritt 0. gewählt haben
   - Klicken Sie auf "Ordner auswählen"

4. **Fertig!**
   - Die Erweiterung ist jetzt installiert und aktiv
   - Sie sehen das grüne Symbol in Ihrer Symbolleiste

## Verwendung

1. Öffnen Sie eine DFB Spielbericht-Seite (z.B. `https://www.dfbnet.org/sbo-mobile/v2/...`)

2. Die Erweiterung prüft automatisch alle **sichtbaren** Spieler in der Aufstellung

3. **Wenn Spieler ohne Foto gefunden werden:**
   - Eine gelbe Warnung erscheint oben auf der Seite
   - Die Namen der Spieler ohne Foto werden aufgelistet
   - Die Warnung bleibt sichtbar, bis Sie sie schließen (×-Button)

4. **Wenn alle Spieler Fotos haben:**
   - Eine grüne Erfolgsmeldung erscheint
   - Die Meldung verschwindet automatisch nach 5 Sekunden

5. **Live-Aktualisierung:**
   - Wenn Sie eine Mannschaft auf-/zuklappen (Pfeil-Symbol), aktualisiert sich die Warnung automatisch
   - Die Extension überwacht kontinuierlich Änderungen auf der Seite

## Funktionen

✅ Automatische Erkennung von fehlenden Spielerfotos (dummy-person.svg)  
✅ Klare Warnung mit Namen der betroffenen Spieler  
✅ **Live-Aktualisierung** beim Öffnen/Schließen von Mannschafts-Panels  
✅ Funktioniert auf allen DFB Spielbericht-Seiten  
✅ Keine speziellen Berechtigungen erforderlich  
✅ Einfach zu schließen mit einem Klick  
✅ MutationObserver für dynamische Angular-Seiten  

## Technische Details

- **Manifest Version:** 3
- **Berechtigungen:** Keine speziellen Berechtigungen erforderlich
- **Funktioniert auf:** `*.dfbnet.org/*` (alle DFB-Seiten)
- **Technologie:** Vanilla JavaScript mit MutationObserver
- **Framework-Kompatibilität:** Angular (getestet mit Angular 18.2.13)
- **Dateien:** 
  - `manifest.json` - Extension-Konfiguration
  - `content.js` - Prüflogik mit Live-Monitoring
  - `styles.css` - Warnung-Design
  - `icon16.png`, `icon48.png`, `icon128.png` - Extension-Symbole

## Aktualisierung der Extension

Nach Code-Änderungen:

1. Gehen Sie zu `edge://extensions/` oder `chrome://extensions/`
2. Klicken Sie auf das **Aktualisierungs-Symbol** (↻) bei "Spielbericht Photo Checker"
3. Laden Sie die Spielbericht-Seite neu (F5)

## Deinstallation

1. Gehen Sie zur Erweiterungsverwaltung
2. Suchen Sie "Spielbericht Photo Checker"
3. Klicken Sie auf "Entfernen"

## Debugging

Bei Problemen:
- Überprüfen Sie, ob der Entwicklermodus aktiviert ist
- Aktualisieren Sie die Seite nach der Installation/Aktualisierung
- Öffnen Sie die Browser-Konsole (F12) und suchen Sie nach `[Spielbericht Photo Checker]` Meldungen
- Die Konsole zeigt: `{total: X, withoutPhotos: Y, missingPhotoPlayers: [...]}`

## Wie es funktioniert

1. **Content Script** wird auf allen `*.dfbnet.org` Seiten geladen
2. **MutationObserver** überwacht DOM-Änderungen (Panel-Öffnung, Angular-Updates)
3. **Selector** zielt nur auf sichtbare Spieler: `.team-player-list .player-list .player`
4. **Foto-Erkennung** prüft, ob `img src` den Platzhalter `dummy-person.svg` enthält
5. **Live-Update** bei jedem Klick auf Panel-Überschriften und Chevron-Icons
6. **Debouncing** (300ms) verhindert zu häufige Prüfungen

## Version

- **Version:** 1.0
- **Erstellt:** November 2025
- **Browser:** Chrome, Edge, Brave (Manifest V3)
