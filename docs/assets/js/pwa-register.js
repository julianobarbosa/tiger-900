/**
 * PWA Registration - Triumph Tiger 900 Roteiro
 * Registra o service worker e gerencia instalação do PWA
 */

(function() {
  'use strict';

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/tiger-900/service-worker.js')
        .then(function(registration) {
          console.log('[PWA] Service Worker registrado:', registration.scope);

          // Verificar atualizações
          registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch(function(error) {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        });
    });
  }

  // Notificação de atualização disponível
  function showUpdateNotification() {
    var notification = document.createElement('div');
    notification.className = 'pwa-update-notification';

    var span = document.createElement('span');
    span.textContent = 'Nova versão disponível!';
    notification.appendChild(span);

    var button = document.createElement('button');
    button.textContent = 'Atualizar';
    button.onclick = function() {
      window.location.reload();
    };
    notification.appendChild(button);

    document.body.appendChild(notification);
  }

  // Botão de instalação PWA
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  function showInstallButton() {
    var existingBtn = document.querySelector('.pwa-install-btn');
    if (existingBtn) return;

    var installBtn = document.createElement('button');
    installBtn.className = 'pwa-install-btn md-button md-button--primary';
    installBtn.textContent = 'Instalar App';
    installBtn.title = 'Instalar para usar offline durante a viagem';

    installBtn.onclick = function() {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(choiceResult) {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] App instalado');
          installBtn.remove();
        }
        deferredPrompt = null;
      });
    };

    // Inserir após o botão de compartilhar se existir
    var shareContainer = document.querySelector('.share-container');
    if (shareContainer) {
      shareContainer.appendChild(installBtn);
    }
  }

  // Detectar se já está instalado
  window.addEventListener('appinstalled', function() {
    console.log('[PWA] App instalado com sucesso');
    var installBtn = document.querySelector('.pwa-install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  });
})();
