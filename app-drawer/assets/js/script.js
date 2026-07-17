const targetFile = '/apps/';
const fallbackFile = 'README.md';
let retryCount = 0;
const MAX_RETRIES = 3;
let timeoutId = null;

function updateStatus(text) {
    document.getElementById('status-text').textContent = text;
}

function tryReload() {
    retryCount = 0;
    document.getElementById('readme-fallback').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    updateStatus('Neuer Versuch wird gestartet...');
    checkApp();
}

function checkApp() {
    updateStatus(`Prüfe Anwendung (Versuch ${retryCount + 1}/${MAX_RETRIES})...`);
    
    fetch(targetFile, { 
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        if (response.ok) {
            updateStatus('✅ Anwendung gefunden! Weiterleitung...');
            // Kleine Verzögerung für UX
            setTimeout(() => {
                const currentPath = window.location.pathname;
                const basePath = currentPath.endsWith('/') ? currentPath : currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                window.location.replace(basePath + '/apps/');
            }, 500);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    })
    .catch(error => {
        console.warn('App nicht gefunden:', error);
        retryCount++;
        
        if (retryCount < MAX_RETRIES) {
            const delay = retryCount * 1000;
            updateStatus(`⏳ Warte ${delay/1000}s vor erneutem Versuch...`);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkApp, delay);
        } else {
            updateStatus('❌ Anwendung nicht erreichbar');
            loadFallback();
        }
    });
}

function loadFallback() {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('readme-fallback').classList.remove('hidden');
    
    document.getElementById('readme-content').textContent = 'Lade Dokumentation...';
    
    fetch(fallbackFile)
        .then(res => {
            if (res.ok) return res.text();
            throw new Error('README nicht gefunden');
        })
        .then(text => {
            document.getElementById('readme-content').textContent = text;
        })
        .catch(() => {
            document.getElementById('readme-content').textContent = 
                '❌ Die README.md Datei konnte nicht geladen werden.\n\n' +
                'Bitte überprüfen Sie:\n' +
                '1. Ob die Datei im Root-Verzeichnis existiert\n' +
                '2. Ob die Datei lesbar ist\n' +
                '3. Ob der Pfad korrekt ist';
        });
}

// Start the check
updateStatus('Initialisiere...');
setTimeout(checkApp, 500);

// Cleanup timeout on page unload
window.addEventListener('beforeunload', function() {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
});

// Fallback for network issues
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.getElementById('loader').classList.contains('hidden') === false) {
        // Tab wurde wieder sichtbar, prüfe erneut
        checkApp();
    }
});