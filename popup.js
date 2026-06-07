// popup.js – Kadercheck Einstellungen

const STORAGE_KEY = 'kadercheck_settings';
const DEFAULT_API_URL = 'https://kadercheck.dev';

// ── Saison-Hilfsfunktion ──────────────────────────────────────────────────────

function buildSaisonOptions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Aktuelle Saison: ab August des Jahres läuft die neue Saison
  const currentYear = month >= 8 ? year : year - 1;
  const saisons = [];
  for (let y = currentYear + 1; y >= currentYear - 1; y--) {
    saisons.push(`${y}/${String(y + 1).slice(-2)}`);
  }
  return { saisons, current: `${currentYear}/${String(currentYear + 1).slice(-2)}` };
}

// ── Status-Anzeige ────────────────────────────────────────────────────────────

function showStatus(msg, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = type;
  el.style.display = 'block';
  if (type === 'ok') setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Initialisierung ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // Saison-Dropdown befüllen
  const { saisons, current } = buildSaisonOptions();
  const saisonSelect = document.getElementById('saison');
  saisons.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    saisonSelect.appendChild(opt);
  });

  // Gespeicherte Einstellungen laden
  const result = await browser.storage.local.get(STORAGE_KEY);
  const saved = result[STORAGE_KEY] || {};

  document.getElementById('api-url').value = saved.apiUrl || DEFAULT_API_URL;
  document.getElementById('token').value   = saved.token  || '';
  saisonSelect.value = saved.saison || current;

  // Token anzeigen/verstecken
  const tokenInput  = document.getElementById('token');
  const toggleBtn   = document.getElementById('toggle-vis');
  toggleBtn.addEventListener('click', () => {
    const isPassword = tokenInput.type === 'password';
    tokenInput.type  = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? '🙈' : '👁';
  });

  // Speichern
  document.getElementById('btn-save').addEventListener('click', async () => {
    const settings = {
      apiUrl: document.getElementById('api-url').value.trim().replace(/\/$/, ''),
      token:  document.getElementById('token').value.trim(),
      saison: saisonSelect.value,
    };

    if (!settings.token) {
      showStatus('Bitte einen Token eingeben.', 'error');
      return;
    }
    if (!settings.apiUrl) {
      showStatus('Bitte eine API-URL eingeben.', 'error');
      return;
    }

    await browser.storage.local.set({ [STORAGE_KEY]: settings });
    showStatus('Einstellungen gespeichert.', 'ok');
  });

  // Verbindung testen
  document.getElementById('btn-test').addEventListener('click', async () => {
    const apiUrl = document.getElementById('api-url').value.trim().replace(/\/$/, '');
    const token  = document.getElementById('token').value.trim();

    if (!token || !apiUrl) {
      showStatus('Bitte Token und API-URL eingeben.', 'error');
      return;
    }

    showStatus('Verbindung wird getestet…', 'info');
    document.getElementById('btn-test').disabled = true;

    try {
      // Health-Check (öffentlich)
      const health = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!health.ok) throw new Error(`Server antwortet mit ${health.status}`);

      // Token-Validierung via /api/verein/spieler (leichter Aufruf)
      const saison = saisonSelect.value;
      const resp = await fetch(
        `${apiUrl}/api/verein/spieler?saison=${encodeURIComponent(saison)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) }
      );

      if (resp.status === 401) {
        showStatus('Token ungültig oder widerrufen.', 'error');
      } else if (!resp.ok) {
        showStatus(`Server-Fehler: ${resp.status}`, 'error');
      } else {
        const spieler = await resp.json();
        showStatus(`Verbindung OK – ${spieler.length} Spieler in ${saison} gefunden.`, 'ok');
      }
    } catch (err) {
      showStatus(`Verbindungsfehler: ${err.message}`, 'error');
    } finally {
      document.getElementById('btn-test').disabled = false;
    }
  });
});
