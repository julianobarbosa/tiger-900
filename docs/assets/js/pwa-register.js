/**
 * PWA Registration - Tiger 900 Rally Pro
 *
 * Handles Service Worker registration and PWA features.
 * This is a standalone script that doesn't require ES modules
 * for broader browser compatibility.
 *
 * @version 2.0.0
 */

(function() {
  'use strict';

  var BASE_PATH = '/tiger-900';
  var SW_PATH = BASE_PATH + '/service-worker.js';

  // State
  var registration = null;
  var deferredPrompt = null;
  var updateAvailable = false;

  /**
   * Register Service Worker
   */
  function registerSW() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers not supported');
      return;
    }

    navigator.serviceWorker.register(SW_PATH, { scope: BASE_PATH + '/' })
      .then(function(reg) {
        registration = reg;
        console.log('[PWA] Service Worker registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                updateAvailable = true;
                showUpdateNotification();
              }
            });
          }
        });

        // Check if waiting
        if (reg.waiting) {
          updateAvailable = true;
          showUpdateNotification();
        }
      })
      .catch(function(error) {
        console.error('[PWA] Registration failed:', error);
      });

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Listen for controller change (update applied)
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (updateAvailable) {
        window.location.reload();
      }
    });
  }

  /**
   * Handle messages from Service Worker
   */
  function handleSWMessage(event) {
    var data = event.data || {};

    switch (data.type) {
      case 'SW_ACTIVATED':
        console.log('[PWA] New version activated:', data.version);
        break;

      case 'CACHE_COMPLETE':
        console.log('[PWA] Cache complete');
        hideCacheProgress();
        showToast('Conteúdo salvo para uso offline!', 'success');
        break;

      case 'PROCESS_SYNC_QUEUE':
        window.dispatchEvent(new CustomEvent('pwa:sync-requested'));
        break;
    }
  }

  /**
   * Show update notification
   */
  function showUpdateNotification() {
    // Remove existing notification
    var existing = document.querySelector('.pwa-update-notification');
    if (existing) {
      existing.remove();
    }

    var notification = document.createElement('div');
    notification.className = 'pwa-update-notification';

    var text = document.createElement('span');
    text.textContent = '🔄 Nova versão disponível!';
    notification.appendChild(text);

    var button = document.createElement('button');
    button.textContent = 'Atualizar';
    button.onclick = function() {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      notification.remove();
    };
    notification.appendChild(button);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.onclick = function() {
      notification.remove();
    };
    notification.appendChild(closeBtn);

    document.body.appendChild(notification);
  }

  /**
   * Show install button
   */
  function showInstallButton() {
    // Only show on relevant pages
    var path = window.location.pathname;
    if (!path.includes('/viagens/') && !path.endsWith('/tiger-900/')) {
      return;
    }

    var existingBtn = document.querySelector('.pwa-install-btn');
    if (existingBtn) return;

    var container = document.querySelector('.share-container');
    if (!container) {
      // Create container if doesn't exist
      var resumoDiv = document.getElementById('resumo-tabela');
      if (!resumoDiv) return;

      container = document.createElement('div');
      container.className = 'share-container';
      resumoDiv.insertBefore(container, resumoDiv.firstChild);
    }

    var installBtn = document.createElement('button');
    installBtn.className = 'pwa-install-btn md-button md-button--primary';
    installBtn.innerHTML = '📲 Instalar App';
    installBtn.title = 'Instalar para usar offline durante a viagem';

    installBtn.onclick = function() {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') {
          console.log('[PWA] App installed');
          installBtn.remove();
        }
        deferredPrompt = null;
      });
    };

    container.appendChild(installBtn);
  }

  /**
   * Show download offline button
   */
  function showDownloadButton() {
    var path = window.location.pathname;
    if (!path.includes('/viagens/')) return;

    var existingBtn = document.querySelector('.pwa-download-btn');
    if (existingBtn) return;

    var container = document.querySelector('.share-container');
    if (!container) return;

    var downloadBtn = document.createElement('button');
    downloadBtn.className = 'pwa-download-btn md-button';
    downloadBtn.innerHTML = '📥 Baixar para Offline';
    downloadBtn.title = 'Baixar todo o conteúdo para usar sem internet';

    downloadBtn.onclick = function() {
      downloadForOffline();
    };

    container.appendChild(downloadBtn);
  }

  /**
   * Download content for offline use
   */
  function downloadForOffline() {
    if (!navigator.onLine) {
      showToast('Você precisa estar online para baixar', 'error');
      return;
    }

    if (!navigator.serviceWorker.controller) {
      showToast('Aguarde o carregamento do app', 'warning');
      return;
    }

    showCacheProgress();

    // URLs to cache
    var urls = [
      BASE_PATH + '/',
      BASE_PATH + '/viagens/serras-gauchas-2026/',
      BASE_PATH + '/viagens/serras-gauchas-2026/roteiro/',
      BASE_PATH + '/viagens/serras-gauchas-2026/checklist/',
      BASE_PATH + '/viagens/serras-gauchas-2026/mapas-offline/',
      BASE_PATH + '/viagens/serras-gauchas-2026/guia-clima/',
      BASE_PATH + '/viagens/serras-gauchas-2026/guia-emergencias/',
      BASE_PATH + '/viagens/serras-gauchas-2026/guia-gastronomico/',
      BASE_PATH + '/viagens/serras-gauchas-2026/manutencao-viagem/',
      BASE_PATH + '/garagem/manutencao/',
      BASE_PATH + '/garagem/ficha-tecnica/',
      BASE_PATH + '/sobre/'
    ];

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      payload: { urls: urls }
    });

    // Timeout fallback
    setTimeout(function() {
      hideCacheProgress();
    }, 30000);
  }

  /**
   * Show cache progress indicator
   */
  function showCacheProgress() {
    var existing = document.querySelector('.cache-progress');
    if (existing) return;

    var progress = document.createElement('div');
    progress.className = 'cache-progress';
    progress.innerHTML = '<span class="spinner"></span> Baixando conteúdo offline...';
    document.body.appendChild(progress);
  }

  /**
   * Hide cache progress indicator
   */
  function hideCacheProgress() {
    var progress = document.querySelector('.cache-progress');
    if (progress) {
      progress.classList.add('fade-out');
      setTimeout(function() {
        progress.remove();
      }, 300);
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message, type) {
    type = type || 'info';

    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(function() {
      toast.classList.add('fade-out');
      setTimeout(function() {
        toast.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, 4000);
  }

  /**
   * Initialize offline status indicator
   */
  function initOfflineIndicator() {
    // Create indicator element
    var indicator = document.createElement('div');
    indicator.id = 'network-status-indicator';
    indicator.className = 'network-status';

    function updateStatus() {
      if (navigator.onLine) {
        indicator.className = 'network-status online';
        indicator.innerHTML = '';
        indicator.style.display = 'none';
      } else {
        indicator.className = 'network-status offline';
        indicator.innerHTML = '📴 Offline';
        indicator.style.display = 'block';
      }
    }

    document.body.insertBefore(indicator, document.body.firstChild);

    // Initial state
    updateStatus();

    // Listen for changes
    window.addEventListener('online', function() {
      updateStatus();
      showToast('Conexão restaurada', 'success');
    });

    window.addEventListener('offline', function() {
      updateStatus();
      showToast('Você está offline', 'warning');
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    // Register Service Worker
    registerSW();

    // Initialize offline indicator
    initOfflineIndicator();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', function(event) {
      event.preventDefault();
      deferredPrompt = event;
      showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', function() {
      console.log('[PWA] App installed');
      var installBtn = document.querySelector('.pwa-install-btn');
      if (installBtn) {
        installBtn.remove();
      }
    });

    // Show download button after short delay
    setTimeout(showDownloadButton, 1000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.Tiger900PWA = {
    showToast: showToast,
    downloadForOffline: downloadForOffline,
    getRegistration: function() { return registration; }
  };
})();
