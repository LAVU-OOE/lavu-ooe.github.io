// Paste your Cloudflare Worker URL here:
const API_URL = "https://apps-api.lavu-ooe.workers.dev/";

const translations = {
    en: {
        subheading: "Central software infrastructure & digital logistics tools",
        p1: "Sustainable", p2: "Innovative", p3: "Municipal",
        addApp: "Add App",
        statAsz: "Recycling Centers (ASZ)",
        statRec: "Waste materials collected annually",
        statStaff: "Dedicated team members",
        statCirc: "Circular Economy Upper Austria",
        gridTitle: "My Apps", // <-- Updated here
        modalAdd: "Add App",
        lblAppName: "App Name",
        lblAppUrl: "App URL (Live Version)",
        lblAppDesc: "Description",
        lblAppIcon: "Choose Icon",
        phName: "e.g. Label Printing Studio",
        phDesc: "Short description of the app...",
        btnCancel: "Cancel",
        btnSave: "Save",
        noDesc: "No description available.",
        infoTitle: "Show/Hide LAVU Infos",
        infoBtnText: "Info"
    },
    de: {
        subheading: "Zentrale Software-Infrastruktur & digitale Logistikwerkzeuge",
        p1: "Nachhaltig", p2: "Innovativ", p3: "Kommunal",
        addApp: "App hinzufügen",
        statAsz: "Altstoffsammelzentrum (ASZ)",
        statRec: "Altstoffe jährlich gesammelt",
        statStaff: "Engagierte Mitarbeiter",
        statCirc: "Kreislaufwirtschaft OÖ",
        gridTitle: "Meine Apps", // <-- Updated here to match
        modalAdd: "App hinzufügen",
        lblAppName: "Name der App",
        lblAppUrl: "App URL (Live Version)",
        lblAppDesc: "Beschreibung",
        lblAppIcon: "Symbol wählen",
        phName: "z.B. Etiketten-Druckstudio",
        phDesc: "Kurze Beschreibung der App...",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        noDesc: "Keine Beschreibung verfügbar.",
        infoTitle: "LAVU Infos anzeigen/ausblenden",
        infoBtnText: "Info"
    }
};

let currentLang = 'en';
let apps = [];

const defaultAppsFallback = [
    {
        name: "Etiketten-Druckstudio",
        url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
        desc: "Studio for creating and printing standardized container and sorting labels for the LAVU-OOE network.",
        icon: "🏷️"
    },
        {
        name: "PDF Editor",
        url: "https://lavu-ooe.github.io/pdf-editor/",
        desc: "Tool for editing and manipulating PDF documents.",
        icon: "📄"
    }
];

// Fetch apps dynamically from the Cloudflare Worker API
async function loadAppsFromAPI() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP network error: ${response.status}`);
        }
        apps = await response.json();
    } catch (error) {
        console.warn("API load failed. Reverting to basic fallback defaults.", error);
        apps = defaultAppsFallback;
    } finally {
        switchLanguage(currentLang);
    }
}

function toggleStatsDashboard() {
    const statsDiv = document.getElementById('lavuStatsDashboard');
    const infoBtn = document.getElementById('btnInfoToggle');
    
    statsDiv.classList.toggle('show');
    infoBtn.classList.toggle('active');
}

function switchLanguage(lang) {
    currentLang = lang;
    
    document.getElementById('btnLangEn').classList.toggle('active', lang === 'en');
    document.getElementById('btnLangDe').classList.toggle('active', lang === 'de');
    
    const t = translations[lang];
    document.getElementById('txtSubheading').innerText = t.subheading;
    document.getElementById('badgeP1').innerText = t.p1;
    document.getElementById('badgeP2').innerText = t.p2;
    document.getElementById('badgeP3').innerText = t.p3;
    document.getElementById('btnInfoToggle').title = t.infoTitle;
    document.getElementById('lblInfoBtnText').innerText = t.infoBtnText;
    document.getElementById('btnAddApp').querySelector('span').innerText = t.addApp;
    document.getElementById('lblStatAsz').innerText = t.statAsz;
    document.getElementById('lblStatRec').innerText = t.statRec;
    document.getElementById('lblStatStaff').innerText = t.statStaff;
    document.getElementById('lblStatCirc').innerText = t.statCirc;
    document.getElementById('txtGridTitle').innerText = t.gridTitle;
    
    document.getElementById('lblAppName').innerText = t.lblAppName;
    document.getElementById('lblAppUrl').innerText = t.lblAppUrl;
    document.getElementById('lblAppDesc').innerText = t.lblAppDesc;
    document.getElementById('lblAppIcon').innerText = t.lblAppIcon;
    document.getElementById('appName').placeholder = t.phName;
    document.getElementById('appDesc').placeholder = t.phDesc;
    document.getElementById('btnCancel').innerText = t.btnCancel;
    document.getElementById('submitBtn').innerText = t.btnSave;
    
    renderApps();
}

async function loadAppsFromAPI() {
  try {
    const res = await fetch('https://apps-api.lavu-ooe.workers.dev/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    apps = data; // replace local apps with API data
    renderApps();
  } catch (err) {
    console.warn('API load failed. Using fallback defaults.', err);
    // Keep the existing default apps (already set)
    renderApps();
  }
}
function renderApps() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = '';
    const t = translations[currentLang];

    if (apps.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--muted-text); font-size: 14px;">Loading applications...</p>`;
        return;
    }

    apps.forEach((app) => {
        const card = document.createElement('div');
        card.className = 'app-card';
        
        card.innerHTML = `
            <a href="${app.url}" target="_blank" class="app-info">
                <div class="app-icon">${app.icon || '🚀'}</div>
                <h3 class="app-title">${escapeHTML(app.name)}</h3>
                <p class="app-desc">${escapeHTML(app.desc || t.noDesc)}</p>
            </a>
        `;
        grid.appendChild(card);
    });
}

function openModal() {
    const modal = document.getElementById('appModal');
    const title = document.getElementById('modalTitle');
    const t = translations[currentLang];
    
    document.getElementById('appForm').reset();
    title.innerText = t.modalAdd;

    // Default the selection dynamically back to Rocket emoji on launch
    selectEmoji('🚀', document.querySelector('.emoji-btn[data-emoji="🚀"]'));

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('appModal').style.display = 'none';
}

// Visual layout helper to toggle active CSS states on selected items
function selectEmoji(emoji, btnElement) {
    document.getElementById('appIcon').value = emoji;
    
    const buttons = document.querySelectorAll('.emoji-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// Submit new applications to your Cloudflare Worker DB
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = currentLang === 'de' ? 'Wird gespeichert...' : 'Saving...';

    const appData = {
        name: document.getElementById('appName').value,
        url: document.getElementById('appUrl').value,
        desc: document.getElementById('appDesc').value,
        icon: document.getElementById('appIcon').value || '🚀'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });

        if (!response.ok) {
            throw new Error(`Failed to save: ${response.status}`);
        }

        apps = await response.json();
        renderApps();
        closeModal();
    } catch (error) {
        console.error("Error submitting new application link:", error);
        alert(currentLang === 'de' ? 'Fehler beim Speichern der App.' : 'Could not save the application.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = translations[currentLang].btnSave;
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadAppsFromAPI);