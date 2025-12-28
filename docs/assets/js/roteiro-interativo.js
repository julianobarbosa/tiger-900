/**
 * Roteiro Interativo - Serras Gaúchas 2026
 * Funcionalidades:
 * - Destaque do dia atual na tabela
 * - Botão de compartilhamento
 */

document.addEventListener('DOMContentLoaded', function() {
  highlightToday();
  addShareButton();
});

/**
 * Destaca a linha do dia atual na tabela de resumo
 */
function highlightToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diaLinks = document.querySelectorAll('.dia-link');

  diaLinks.forEach(function(link) {
    const dateStr = link.getAttribute('data-date');
    if (!dateStr) return;

    const linkDate = new Date(dateStr + 'T00:00:00');
    const row = link.closest('tr');

    if (!row) return;

    if (linkDate.getTime() === today.getTime()) {
      row.classList.add('dia-hoje');
      row.setAttribute('title', 'Você está aqui!');
    } else if (linkDate < today) {
      row.classList.add('dia-passado');
    } else {
      row.classList.add('dia-futuro');
    }
  });
}

/**
 * Adiciona botão de compartilhar usando Web Share API
 */
function addShareButton() {
  const resumoDiv = document.getElementById('resumo-tabela');
  if (!resumoDiv) return;

  const canShare = navigator.share !== undefined;

  const shareContainer = document.createElement('div');
  shareContainer.className = 'share-container';

  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-btn md-button md-button--primary';

  if (canShare) {
    shareBtn.textContent = 'Compartilhar Roteiro';
    shareBtn.onclick = async function() {
      try {
        await navigator.share({
          title: 'Roteiro Serras Gaúchas 2026',
          text: 'Confira o roteiro de moto pelas Serras Gaúchas - 15 dias de aventura!',
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    };
  } else {
    shareBtn.textContent = 'Copiar Link do Roteiro';
    shareBtn.onclick = function() {
      navigator.clipboard.writeText(window.location.href).then(function() {
        shareBtn.textContent = 'Link Copiado!';
        setTimeout(function() {
          shareBtn.textContent = 'Copiar Link do Roteiro';
        }, 2000);
      });
    };
  }

  shareContainer.appendChild(shareBtn);
  resumoDiv.insertBefore(shareContainer, resumoDiv.firstChild);
}
