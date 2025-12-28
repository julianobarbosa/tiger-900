/**
 * Roteiro Interativo - Serras Gaúchas 2026
 * Funcionalidades:
 * - Destaque do dia atual na tabela
 * - Timeline visual com progresso
 * - Botão de compartilhamento
 */

document.addEventListener('DOMContentLoaded', function() {
  highlightToday();
  updateTimeline();
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
 * Atualiza a timeline visual com estado das fases e dias
 */
function updateTimeline() {
  var timelineContainer = document.getElementById('viagem-timeline');
  if (!timelineContainer) return;

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  // Datas da viagem
  var tripStart = new Date('2026-01-19T00:00:00');
  var tripEnd = new Date('2026-02-02T00:00:00');
  var totalDays = 15;

  // Atualizar day dots
  var dayDots = timelineContainer.querySelectorAll('.day-dot');
  var currentDayNumber = 0;
  var daysCompleted = 0;

  dayDots.forEach(function(dot) {
    var dateStr = dot.getAttribute('data-date');
    if (!dateStr) return;

    var dotDate = new Date(dateStr + 'T00:00:00');

    if (dotDate.getTime() === today.getTime()) {
      dot.classList.add('day-hoje');
      currentDayNumber = parseInt(dot.textContent, 10);
    } else if (dotDate < today) {
      dot.classList.add('day-passado');
      daysCompleted++;
    } else {
      dot.classList.add('day-futuro');
    }
  });

  // Atualizar fases
  var phases = timelineContainer.querySelectorAll('.timeline-phase');

  phases.forEach(function(phase) {
    var startStr = phase.getAttribute('data-start');
    var endStr = phase.getAttribute('data-end');
    if (!startStr || !endStr) return;

    var phaseStart = new Date(startStr + 'T00:00:00');
    var phaseEnd = new Date(endStr + 'T00:00:00');

    if (today > phaseEnd) {
      phase.classList.add('phase-passada');
    } else if (today >= phaseStart && today <= phaseEnd) {
      phase.classList.add('phase-atual');
    } else {
      phase.classList.add('phase-futura');
    }
  });

  // Atualizar status do progresso
  var statusEl = document.getElementById('progress-status');
  var percentEl = document.getElementById('progress-percent');

  if (statusEl) {
    if (today < tripStart) {
      var daysUntil = Math.ceil((tripStart - today) / (1000 * 60 * 60 * 24));
      if (daysUntil === 1) {
        statusEl.textContent = 'A viagem começa amanhã!';
      } else {
        statusEl.textContent = 'Viagem começa em ' + daysUntil + ' dias';
      }
    } else if (today > tripEnd) {
      statusEl.textContent = 'Viagem concluída!';
    } else {
      statusEl.textContent = 'Dia ' + currentDayNumber + ' de ' + totalDays;
    }
  }

  if (percentEl) {
    if (today < tripStart) {
      percentEl.textContent = '0%';
    } else if (today > tripEnd) {
      percentEl.textContent = '100%';
    } else {
      var progress = Math.round((daysCompleted / totalDays) * 100);
      percentEl.textContent = progress + '%';
    }
  }
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
