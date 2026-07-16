const translations = {
    en: {
        subheading: "Central software infrastructure & digital logistics tools",
        p1: "Sustainable", p2: "Innovative", p3: "Municipal",
        addApp: "Add App",
        statAsz: "Recycling Centers (ASZ)",
        statRec: "Waste materials collected annually",
        statStaff: "Dedicated team members",
        statCirc: "Circular Economy Upper Austria",
        gridTitle: "Integrated Applications",
        modalAdd: "Add App",
        modalEdit: "Edit App",
        lblAppName: "App Name",
        lblAppUrl: "App URL (Live Version)",
        lblAppDesc: "Description",
        lblAppIcon: "Emoji Icon",
        phName: "e.g. Label Printing Studio",
        phDesc: "Short description of the app...",
        btnCancel: "Cancel",
        btnSave: "Save",
        btnEdit: "Edit",
        btnDelete: "Delete",
        confirmDelete: "Are you sure you want to delete this application?",
        noDesc: "No description available.",
        infoTitle: "Show/Hide LAVU Infos",
        infoBtnText: "Info"
    },
    de: {
        subheading: "Zentrale Software-Infrastruktur & digitale Logistikwerkzeuge",
        p1: "Nachhaltig", p2: "Innovativ", p3: "Kommunal",
        addApp: "App hinzufügen",
        statAsz: "Altstoffsammelzentren (ASZ)",
        statRec: "Altstoffe jährlich gesammelt",
        statStaff: "Engagierte Mitarbeiter",
        statCirc: "Kreislaufwirtschaft OÖ",
        gridTitle: "Integrierte Anwendungen",
        modalAdd: "App hinzufügen",
        modalEdit: "App bearbeiten",
        lblAppName: "Name der App",
        lblAppUrl: "App URL (Live Version)",
        lblAppDesc: "Beschreibung",
        lblAppIcon: "Emoji Icon",
        phName: "z.B. Etiketten-Druckstudio",
        phDesc: "Kurze Beschreibung der App...",
        btnCancel: "Abbrechen",
        btnSave: "Speichern",
        btnEdit: "Bearbeiten",
        btnDelete: "Löschen",
        confirmDelete: "Möchtest du diese Anwendung wirklich löschen?",
        noDesc: "Keine Beschreibung verfügbar.",
        infoTitle: "LAVU Infos anzeigen/ausblenden",
        infoBtnText: "Info"
    }
};

let currentLang = 'en';

const defaultApps = [
    {
        name: "Etiketten-Druckstudio",
        url: "https://lavu-ooe.github.io/Etiketten-Druckstudio/",
        desc: "Studio for creating and printing standardized container and sorting labels for the LAVU-OOE network.",
        icon: "🏷️"
    }
];

let apps = JSON.parse(localStorage.getItem('lavu_apps')) || defaultApps;

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
    
    renderApps();
}

function saveApps() {
    localStorage.setItem('lavu_apps', JSON.stringify(apps));
    renderApps();
}

function renderApps() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = '';
    const t = translations[currentLang];

    apps.forEach((app, index) => {
        const card = document.createElement('div');
        card.className = 'app-card';
        
        card.innerHTML = `
            <a href="${app.url}" target="_blank" class="app-info">
                <div class="app-icon">${app.icon || '🚀'}</div>
                <h3 class="app-title">${escapeHTML(app.name)}</h3>
                <p class="app-desc">${escapeHTML(app.desc || t.noDesc)}</p>
            </a>
            <div class="app-actions">
                <button class="btn-action btn-edit" onclick="openModal('edit', ${index})">${t.btnEdit}</button>
                <button class="btn-action btn-delete" onclick="deleteApp(${index})">${t.btnDelete}</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openModal(mode, index = null) {
    const modal = document.getElementById('appModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const t = translations[currentLang];
    
    document.getElementById('appForm').reset();
    document.getElementById('appIndex').value = index !== null ? index : '';

    if (mode === 'edit') {
        title.innerText = t.modalEdit;
        submitBtn.innerText = t.btnSave;
        
        const app = apps[index];
        document.getElementById('appName').value = app.name;
        document.getElementById('appUrl').value = app.url;
        document.getElementById('appDesc').value = app.desc;
        document.getElementById('appIcon').value = app.icon;
    } else {
        title.innerText = t.modalAdd;
        submitBtn.innerText = t.modalAdd;
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('appModal').style.display = 'none';
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const index = document.getElementById('appIndex').value;
    const appData = {
        name: document.getElementById('appName').value,
        url: document.getElementById('appUrl').value,
        desc: document.getElementById('appDesc').value,
        icon: document.getElementById('appIcon').value || '🚀'
    };

    if (index !== '') {
        apps[index] = appData;
    } else {
        apps.push(appData);
    }

    saveApps();
    closeModal();
}

function deleteApp(index) {
    const t = translations[currentLang];
    if (confirm(`${t.confirmDelete}\n\n"${apps[index].name}"`)) {
        apps.splice(index, 1);
        saveApps();
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

switchLanguage('en');
