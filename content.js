// Spielbericht Photo Checker - Content Script
// Automatically checks for players without uploaded photos

function checkPlayerPhotos() {
  const results = {
    total: 0,
    withoutPhotos: 0,
    missingPhotoPlayers: []
  };

  // Target only the visible player lists (excludes hidden detail panels)
  const playerCards = document.querySelectorAll('.team-player-list .player-list .player');
  
  playerCards.forEach(playerCard => {
    const photoContainer = playerCard.querySelector('.player-photo');
    
    if (photoContainer) {
      const img = photoContainer.querySelector('img');
      
      if (img) {
        results.total++;
        const src = img.src || '';
        
        // Check if image is the dummy-person.svg placeholder
        if (src.includes('dummy-person.svg')) {
          results.withoutPhotos++;
          
          // Extract player name
          const nameElement = playerCard.querySelector('.player-name b');
          if (nameElement) {
            const playerName = nameElement.textContent.trim();
            results.missingPhotoPlayers.push(playerName);
          }
        }
      }
    }
  });

  return results;
}

function showWarningBanner(results) {
  // Remove any existing banner
  const existingBanner = document.getElementById('photo-checker-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  // Create warning banner
  const banner = document.createElement('div');
  banner.id = 'photo-checker-banner';
  banner.className = results.withoutPhotos > 0 ? 'photo-checker-warning' : 'photo-checker-success';
  
  const content = document.createElement('div');
  content.className = 'photo-checker-content';
  
  const icon = document.createElement('span');
  icon.className = 'photo-checker-icon';
  icon.textContent = results.withoutPhotos > 0 ? '⚠️' : '✅';
  
  const message = document.createElement('div');
  message.className = 'photo-checker-message';
  
  const closeBtnElem = document.createElement('button');
  closeBtnElem.className = 'photo-checker-close';
  closeBtnElem.title = 'Schließen';
  closeBtnElem.textContent = '×';
  
  if (results.withoutPhotos > 0) {
    const title = document.createElement('strong');
    title.textContent = `${results.withoutPhotos} Spieler ohne Foto${results.withoutPhotos > 1 ? 's' : ''}:`;
    message.appendChild(title);
    
    const playerList = document.createElement('ul');
    playerList.className = 'photo-checker-player-list';
    results.missingPhotoPlayers.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      playerList.appendChild(li);
    });
    message.appendChild(playerList);
  } else {
    const title = document.createElement('strong');
    title.textContent = `Alle ${results.total} Spieler haben Fotos!`;
    message.appendChild(title);
  }
  
  // Add disclaimer
  const disclaimer = document.createElement('div');
  disclaimer.className = 'photo-checker-disclaimer';
  disclaimer.textContent = 'Inoffizielle Erweiterung – keine Verbindung zu DFBnet GmbH oder DFB. Verwendung auf eigene Verantwortung. Diese Browser-Erweiterung dient ausschließlich als Hilfsmittel zur Unterstützung bei der Verwaltung von Spielerfotos. Die Nutzer sind selbst verantwortlich für die Kontrolle von Bildern, Spielerdaten und die Einhaltung aller Regeln im Spielbetrieb.Die Verwendung erfolgt auf eigene Verantwortung.'
  message.appendChild(disclaimer);
  
  content.appendChild(icon);
  content.appendChild(message);
  content.appendChild(closeBtnElem);
  banner.appendChild(content);

  // Insert banner at the top of the page
  document.body.insertBefore(banner, document.body.firstChild);

  // Add close button functionality
  closeBtnElem.addEventListener('click', () => {
    banner.remove();
  });

  // Auto-hide success message after 5 seconds
  if (results.withoutPhotos === 0) {
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 5000);
  }
}

// Continuously monitor for changes and update the banner
function initPhotoChecker() {
  let checkTimeout = null;
  
  function tryCheck() {
    // Clear any pending check
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
    
    // Wait a bit to let DOM settle after changes
    checkTimeout = setTimeout(() => {
      const playerCards = document.querySelectorAll('.team-player-list .player-list .player');
      
      if (playerCards.length > 0) {
        const results = checkPlayerPhotos();
        
        // Always show/update banner when players are visible
        if (results.total > 0) {
          showWarningBanner(results);
          
          // Log to console for debugging
          console.log('[Spielbericht Photo Checker]', results);
        }
      }
    }, 300); // 300ms debounce
  }
  
  // Try immediately
  tryCheck();
  
  // Set up observer to watch for DOM changes (when panels open/close)
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations affected the team panels
    const relevantChange = mutations.some(mutation => {
      const target = mutation.target;
      // Check if a panel body was added/removed or if visibility changed
      return target.classList && 
             (target.classList.contains('panel-body') || 
              target.classList.contains('panel') ||
              target.classList.contains('team-player-list') ||
              Array.from(mutation.addedNodes).some(node => 
                node.classList && 
                (node.classList.contains('player') || 
                 node.classList.contains('panel-body'))
              ));
    });
    
    if (relevantChange) {
      tryCheck();
    }
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style'] // Watch for visibility changes
  });
  
  // Also check when user clicks on chevron icons (panel open/close)
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList && 
        (target.classList.contains('icon-chevron-down') || 
         target.classList.contains('icon-chevron-up') ||
         target.closest('.panel-heading'))) {
      // Panel was clicked, recheck after animation
      setTimeout(tryCheck, 500);
    }
  });
}

// Run the checker when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotoChecker);
} else {
  initPhotoChecker();
}

// =============================================================================
// KADERCHECK – Spielerhistorie im Spielbericht
// =============================================================================

const KC_STORAGE_KEY = 'kadercheck_settings';

// ── Einstellungen aus Storage laden ──────────────────────────────────────────

async function getKcSettings() {
  try {
    const result = await browser.storage.local.get(KC_STORAGE_KEY);
    return result[KC_STORAGE_KEY] || {};
  } catch {
    return {};
  }
}

// ── Saison ermitteln ─────────────────────────────────────────────────────────

function aktuellesSaison() {
  const now = new Date();
  const year = now.getFullYear();
  // Ab August läuft die neue Saison
  const startYear = now.getMonth() >= 7 ? year : year - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

// ── Pass-Nummer aus Spieler-Karte extrahieren ─────────────────────────────────
// Format im DFBNet DOM: NNNN-NNNN (z.B. "0523-8761")

function extractPassNr(playerCard) {
  const text = playerCard.textContent || '';
  const match = text.match(/\b(\d{4}-\d{4})\b/);
  return match ? match[1] : null;
}

// ── API-Aufrufe ───────────────────────────────────────────────────────────────

async function fetchVereinSpieler(apiUrl, token, saison) {
  const resp = await fetch(
    `${apiUrl}/api/verein/spieler?saison=${encodeURIComponent(saison)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }
  );
  if (!resp.ok) return null;
  return resp.json(); // string[] der Pass-Nummern
}

async function fetchSpielerEinsaetze(apiUrl, token, passNr, saison) {
  const resp = await fetch(
    `${apiUrl}/api/spieler/${encodeURIComponent(passNr)}/einsaetze?saison=${encodeURIComponent(saison)}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) }
  );
  if (!resp.ok) return null;
  return resp.json();
}

// ── Badge aufbauen ────────────────────────────────────────────────────────────

function buildEinsatzBadge(data) {
  if (!data || !data.einsaetze || data.einsaetze.length === 0) return null;

  // Einsätze nach Mannschaft gruppieren (nur wo hat_gespielt = true)
  const gespielt = data.einsaetze.filter(e => e.hatGespielt);
  if (gespielt.length === 0) return null;

  const gruppen = {};
  gespielt.forEach(e => {
    const key = e.mannschaft;
    if (!gruppen[key]) gruppen[key] = { count: 0, rang: e.mannschaftsRang };
    gruppen[key].count++;
  });

  // Aufsteigend nach Rang sortieren (I zuerst)
  const sortiert = Object.entries(gruppen).sort((a, b) => a[1].rang - b[1].rang);

  // Warnung wenn Spieler in MEHREREN verschiedenen Mannschaften war
  // (mögliche §8-Relevanz – Trainer soll selbst urteilen)
  const hatMehrereMannschaften = sortiert.length > 1;

  const badge = document.createElement('div');
  badge.className = `kc-badge ${hatMehrereMannschaften ? 'kc-badge--warn' : 'kc-badge--ok'}`;

  const icon = hatMehrereMannschaften ? '⚠️' : 'ℹ️';
  const zusammenfassung = sortiert
    .map(([name, { count }]) => `${count}× ${name}`)
    .join(' · ');

  badge.innerHTML =
    `<span class="kc-badge__icon">${icon}</span>` +
    `<span class="kc-badge__text">${data.saison}: ${zusammenfassung}</span>`;

  return badge;
}

// ── Hauptroutine ──────────────────────────────────────────────────────────────

let kcRunning = false;

async function runKadercheck() {
  if (kcRunning) return;

  const playerCards = document.querySelectorAll('.team-player-list .player-list .player');
  if (playerCards.length === 0) return;

  const settings = await getKcSettings();
  const { token, apiUrl = 'https://kadercheck.dev', saison } = settings;

  // Kein Token konfiguriert → still überspringen
  if (!token) return;

  kcRunning = true;

  // Bestehende Badges entfernen
  document.querySelectorAll('.kc-badge').forEach(el => el.remove());

  const aktiveSaison = saison || aktuellesSaison();

  try {
    // 1. Eigene Pass-Nummern vom Server holen (club-scoped durch Token)
    const eigenePassNrs = await fetchVereinSpieler(apiUrl, token, aktiveSaison);
    if (!eigenePassNrs) {
      console.warn('[Kadercheck] Konnte Vereinsspieler nicht laden – Token gültig?');
      return;
    }

    const eigeneSet = new Set(eigenePassNrs);

    // 2. Jede Spieler-Karte prüfen
    for (const card of playerCards) {
      const passNr = extractPassNr(card);
      // Nur eigene Spieler anzeigen (Sicherheitsprinzip b)
      if (!passNr || !eigeneSet.has(passNr)) continue;

      const data = await fetchSpielerEinsaetze(apiUrl, token, passNr, aktiveSaison);
      const badge = buildEinsatzBadge(data);
      if (badge) {
        // Badge unterhalb der Spieler-Info einfügen
        const ziel = card.querySelector('.player-info') || card;
        ziel.appendChild(badge);
      }
    }
  } catch (err) {
    console.warn('[Kadercheck] Fehler:', err);
  } finally {
    kcRunning = false;
  }
}

// ── Integration in bestehenden MutationObserver ───────────────────────────────

function initKadercheck() {
  let kcTimeout = null;

  function tryKcCheck() {
    if (kcTimeout) clearTimeout(kcTimeout);
    // Etwas länger als der Foto-Check warten damit Angular fertig gerendert hat
    kcTimeout = setTimeout(runKadercheck, 600);
  }

  // Beim Start
  tryKcCheck();

  // DOM-Änderungen beobachten (gleiche Logik wie Photo-Checker)
  const observer = new MutationObserver(mutations => {
    const relevant = mutations.some(m =>
      m.target.classList &&
      (m.target.classList.contains('panel-body') ||
       m.target.classList.contains('team-player-list') ||
       Array.from(m.addedNodes).some(n =>
         n.classList && (n.classList.contains('player') || n.classList.contains('panel-body'))
       ))
    );
    if (relevant) tryKcCheck();
  });

  observer.observe(document.body, {
    childList: true, subtree: true,
    attributes: true, attributeFilter: ['class', 'style'],
  });
}

// Kadercheck parallel zum Photo-Checker starten
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKadercheck);
} else {
  initKadercheck();
}
