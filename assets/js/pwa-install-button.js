// assets/js/pwa-install-button.js
(function() {
  'use strict';

  const CONFIG = {
    containerId: 'pwa-install-container',   // ID of the container (place this in your HTML)
    localStorageKey: 'pwa-installed',
    iconDownload: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    iconClose:    `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    iconOpen:     `<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`,
    labels: {
      default: { de: 'App installieren', en: 'Install App' },
      installed: { de: 'Schließen', en: 'Close' },
      openAsApp: { de: 'Als App öffnen', en: 'Open as App' },
    },
    intentUri: (url) => `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.example.app;end`,
    fallbackMessage: 'Die App kann über das Browser-Menü oder den Installationsbanner installiert werden.'
  };

  let deferredPrompt = null;
  let currentState = 'default';
  let buttonElement = null;
  let container = null;

  function getLang() {
    return document.documentElement.lang || 'en';
  }

  function getLabel(key) {
    const lang = getLang();
    return CONFIG.labels[key]?.[lang] || CONFIG.labels[key]?.['en'] || key;
  }

  function isPwaDisplayMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function isInstalled() {
    if (localStorage.getItem(CONFIG.localStorageKey) === 'true') return true;
    if (navigator.getInstalledRelatedApps) {
      // We'll check asynchronously in init; fallback to false for now
      return false;
    }
    return false;
  }

  function renderButton(state, iconHtml, label) {
    if (!buttonElement) {
      buttonElement = document.createElement('button');
      buttonElement.className = 'pwa-install-btn';
      container.appendChild(buttonElement);
    }
    buttonElement.innerHTML = `${iconHtml} ${label}`;
    buttonElement.dataset.state = state;
    currentState = state;
  }

  function updateButton() {
    const displayMode = isPwaDisplayMode();
    const installed = isInstalled();

    let state, iconHtml, label;
    if (displayMode || installed) {
      if (displayMode) {
        state = 'installed';
        iconHtml = CONFIG.iconClose;
        label = getLabel('installed');
      } else {
        state = 'openAsApp';
        iconHtml = CONFIG.iconOpen;
        label = getLabel('openAsApp');
      }
    } else {
      state = 'default';
      iconHtml = CONFIG.iconDownload;
      label = getLabel('default');
    }

    renderButton(state, iconHtml, label);

    buttonElement.onclick = function(e) {
      e.preventDefault();
      handleButtonClick(state);
    };
  }

  function handleButtonClick(state) {
    switch (state) {
      case 'default': handleInstall(); break;
      case 'installed': handleClose(); break;
      case 'openAsApp': handleOpenAsApp(); break;
    }
  }

  function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    } else {
      alert(CONFIG.fallbackMessage);
    }
  }

  function handleClose() {
    window.close();
  }

  function handleOpenAsApp() {
    const currentUrl = window.location.href;
    window.location.href = CONFIG.intentUri(currentUrl);
  }

  function onBeforeInstallPrompt(e) {
    e.preventDefault();
    deferredPrompt = e;
    updateButton();
  }

  function onAppInstalled() {
    localStorage.setItem(CONFIG.localStorageKey, 'true');
    deferredPrompt = null;
    updateButton();
  }

  async function checkInstalledRelatedApps() {
    if (!navigator.getInstalledRelatedApps) return false;
    try {
      const relatedApps = await navigator.getInstalledRelatedApps();
      if (relatedApps.length > 0) {
        localStorage.setItem(CONFIG.localStorageKey, 'true');
        return true;
      }
    } catch (err) {
      console.warn('getInstalledRelatedApps failed:', err);
    }
    return false;
  }

  function init() {
    container = document.getElementById(CONFIG.containerId);
    if (!container) {
      console.error(`PWA Install Button: container #${CONFIG.containerId} not found.`);
      return;
    }

    checkInstalledRelatedApps().then(() => {
      updateButton();
    });

    window.addEventListener('load', updateButton);
    window.addEventListener('visibilitychange', updateButton);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    updateButton();
  }

  // Expose for external control
  window.PWAInstallButton = {
    init: init,
    update: updateButton,
    config: CONFIG,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();