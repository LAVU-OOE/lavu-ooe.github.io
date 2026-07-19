const TARGET = 'reapps/';
const FALLBACK = 'README.md';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1s, 2s, 3s

let retryCount = 0;
let timeoutId = null;

function updateStatus(text) {
    const el = document.getElementById('status-text');
    if (el) el.textContent = text;
}

function updateRetry(text) {
    const el = document.getElementById('retry-count');
    if (el) el.textContent = text;
}

function tryReload() {
    retryCount = 0;
    document.getElementById('readme-fallback').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    updateStatus('Neuer Versuch wird gestartet...');
    updateRetry('');
    checkApp();
}

function checkApp() {
    updateStatus(`Prüfe Anwendung (Versuch ${retryCount + 1}/${MAX_RETRIES})...`);
    updateRetry(`⏳ Versuch ${retryCount + 1} von ${MAX_RETRIES}`);

    // Use a timeout to abort fetch after 8 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(TARGET, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache, no-store' },
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeout);
        if (response.ok) {
            updateStatus('✅ Anwendung gefunden! Weiterleitung...');
            // Small delay for UX
            setTimeout(() => {
                const basePath = window.location.pathname.endsWith('/')
                    ? window.location.pathname
                    : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                const targetUrl = basePath + TARGET;
                window.location.replace(targetUrl);
            }, 500);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    })
    .catch(error => {
        clearTimeout(timeout);
        console.warn('App nicht gefunden:', error.message);

        retryCount++;
        if (retryCount < MAX_RETRIES) {
            const delay = retryCount * RETRY_DELAY_BASE;
            updateStatus(`⏳ Warte ${delay/1000}s vor erneutem Versuch...`);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkApp, delay);
        } else {
            updateStatus('❌ Anwendung nicht erreichbar');
            updateRetry('⚠️ Maximale Anzahl von Versuchen erreicht');
            loadFallback();
        }
    });
}

function loadFallback() {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('readme-fallback').classList.remove('hidden');

    const contentEl = document.getElementById('readme-content');
    contentEl.textContent = 'Lade Dokumentation...';

    fetch(FALLBACK)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error('README nicht gefunden');
        })
        .then(text => {
            contentEl.textContent = text;
        })
        .catch(() => {
            contentEl.textContent =
                '❌ Die README.md Datei konnte nicht geladen werden.\n\n' +
                'Bitte überprüfen Sie:\n' +
                '1. Ob die Datei im Root-Verzeichnis existiert\n' +
                '2. Ob die Datei lesbar ist\n' +
                '3. Ob der Pfad korrekt ist';
        });
}

// Start
updateStatus('Initialisiere...');
setTimeout(checkApp, 300);

// Cleanup
window.addEventListener('beforeunload', () => clearTimeout(timeoutId));

// Visibility change – retry if tab becomes visible and loader is still active
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !document.getElementById('loader').classList.contains('hidden')) {
        // Don't retry if we already exceeded max retries
        if (retryCount >= MAX_RETRIES) return;
        // Only retry if not currently waiting (i.e., no active timeout)
        if (!timeoutId) {
            checkApp();
        }
    }
});