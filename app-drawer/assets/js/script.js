const translations = {
    en: {
        subheading: "Central software infrastructure & digital logistics tools",
        p1: "Sustainable", p2: "Innovative", p3: "Municipal",
        statAsz: "Recycling Centers (ASZ)",
        statRec: "Waste materials collected annually",
        statStaff: "Dedicated team members",
        statCirc: "Circular Economy Upper Austria",
        gridTitle: "Integrated Applications",
        noDesc: "No description available.",
        infoTitle: "Show/Hide LAVU Infos",
        infoBtnText: "Info"
    },
    de: {
        subheading: "Zentrale Software-Infrastruktur & digitale Logistikwerkzeuge",
        p1: "Nachhaltig", p2: "Innovativ", p3: "Kommunal",
        statAsz: "Altstoffsammelzentren (ASZ)",
        statRec: "Altstoffe jährlich gesammelt",
        statStaff: "Engagierte Mitarbeiter",
        statCirc: "Kreislaufwirtschaft OÖ",
        gridTitle: "Integrierte Anwendungen",
        noDesc: "Keine Beschreibung verfügbar.",
        infoTitle: "LAVU Infos anzeigen/ausblenden",
        infoBtnText: "Info"
    }
};

let currentLang = 'en';
let apps = [];

// Fallback configuration if apps.json is missing or encounters load issues
const defaultAppsFallback = [
    {
        name: "Etiketten-Druckstudio",
        url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
        desc: "Studio for creating and printing standardized container and sorting labels for the LAVU-OOE network.",
        icon: "🏷️"
    }
];

async function loadCentralApps() {
    try {
        const response = await fetch('apps.json');
        if (!response.ok) {
            throw new Error(`HTTP network error: ${response.status}`);
        }
        apps = await response.json();
    } catch (error) {
        console.warn("Could not read central apps.json file. Reverting to internal fallback array.", error);
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
    document.getElementById('lblStatAsz').innerText = t.statAsz;
    document.getElementById('lblStatRec').innerText = t.statRec;
    document.getElementById('lblStatStaff').innerText = t.statStaff;
    document.getElementById('lblStatCirc').innerText = t.statCirc;
    document.getElementById('txtGridTitle').innerText = t.gridTitle;
    
    renderApps();
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

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Kick off initialization routines when the browser is ready
document.addEventListener('DOMContentLoaded', loadCentralApps);