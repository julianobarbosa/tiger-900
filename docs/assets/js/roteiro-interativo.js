/**
 * Roteiro Interativo - Serras Gaúchas 2026
 * Funcionalidades:
 * - Destaque do dia atual na tabela
 * - Timeline visual com progresso
 * - Hover preview com imagens dos destinos
 * - Botão de compartilhamento
 * - P0: Mobile Cards/Accordion
 * - P0: Banner Dia Atual Sticky
 * - P1: Navegação Entre Dias
 * - P2: Checklist Persistente
 * - P2: Touch Preview Mobile
 */

// Dados da viagem (centralizados)
var TRIP_DATA = {
  start: new Date('2026-01-19T00:00:00'),
  end: new Date('2026-02-02T00:00:00'),
  totalDays: 15,
  days: [
    { day: 1, date: '2026-01-19', route: 'Goiânia → Uberaba', km: 380, type: 'Deslocamento', typeIcon: '🛣️', phase: 1 },
    { day: 2, date: '2026-01-20', route: 'Uberaba → Ourinhos', km: 360, type: 'Deslocamento', typeIcon: '🛣️', phase: 1 },
    { day: 3, date: '2026-01-21', route: 'Ourinhos → Ponta Grossa', km: 350, type: 'Deslocamento', typeIcon: '🛣️', phase: 1 },
    { day: 4, date: '2026-01-22', route: 'Ponta Grossa → Urubici', km: 380, type: 'Deslocamento', typeIcon: '🛣️', phase: 1 },
    { day: 5, date: '2026-01-23', route: 'Urubici (Corvo Branco)', km: 60, type: 'Exploração', typeIcon: '🏔️', phase: 2 },
    { day: 6, date: '2026-01-24', route: 'Serra do Rio do Rastro', km: 80, type: 'CLÍMAX', typeIcon: '⭐', phase: 2, special: 'climax' },
    { day: 7, date: '2026-01-25', route: 'Bom Jardim → Cambará', km: 180, type: 'Transição', typeIcon: '🔄', phase: 3 },
    { day: 8, date: '2026-01-26', route: 'Cânions', km: 60, type: 'Exploração', typeIcon: '🏔️', phase: 3 },
    { day: 9, date: '2026-01-27', route: 'Cambará → Bento', km: 180, type: 'Serra Gaúcha', typeIcon: '🍇', phase: 3 },
    { day: 10, date: '2026-01-28', route: 'Vale dos Vinhedos', km: 40, type: 'Vinícolas', typeIcon: '🍷', phase: 3 },
    { day: 11, date: '2026-01-29', route: 'Bento → Curitiba', km: 430, type: 'Retorno', typeIcon: '🔙', phase: 4 },
    { day: 12, date: '2026-01-30', route: 'Curitiba (descanso)', km: 0, type: 'Folga', typeIcon: '😴', phase: 4, special: 'folga' },
    { day: 13, date: '2026-01-31', route: 'Curitiba → Ourinhos', km: 400, type: 'Retorno', typeIcon: '🔙', phase: 4 },
    { day: 14, date: '2026-02-01', route: 'Ourinhos → Uberaba', km: 360, type: 'Retorno', typeIcon: '🔙', phase: 4 },
    { day: 15, date: '2026-02-02', route: 'Uberaba → Goiânia', km: 380, type: 'Retorno', typeIcon: '🏠', phase: 4, special: 'home' }
  ],
  phases: [
    { id: 1, name: 'Deslocamento', icon: '🛣️', days: '19-22 Jan', km: '1.470 km' },
    { id: 2, name: 'Serras Catarinenses', icon: '🏔️', days: '23-24 Jan', km: '140 km' },
    { id: 3, name: 'Cânions e Serra Gaúcha', icon: '🍇', days: '25-28 Jan', km: '460 km' },
    { id: 4, name: 'Retorno', icon: '🏠', days: '29 Jan - 02 Fev', km: '1.570 km' }
  ]
};

document.addEventListener('DOMContentLoaded', function() {
  highlightToday();
  updateTimeline();
  initHoverPreviews();
  addShareButton();
  initMobileCards();
  initCurrentDayBanner();
  initDayNavigation();
  initPersistentChecklist();
  initTouchPreview();
  initHomepageHero();
});

// Helper para criar elementos com atributos
function createElement(tag, className, textContent) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

/**
 * Destaca a linha do dia atual na tabela de resumo
 */
function highlightToday() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var diaLinks = document.querySelectorAll('.dia-link');

  diaLinks.forEach(function(link) {
    var dateStr = link.getAttribute('data-date');
    if (!dateStr) return;

    var linkDate = new Date(dateStr + 'T00:00:00');
    var row = link.closest('tr');

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

  var currentDayNumber = 0;
  var daysCompleted = 0;

  var dayDots = timelineContainer.querySelectorAll('.day-dot');

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

  var statusEl = document.getElementById('progress-status');
  var percentEl = document.getElementById('progress-percent');

  if (statusEl) {
    if (today < TRIP_DATA.start) {
      var daysUntil = Math.ceil((TRIP_DATA.start - today) / (1000 * 60 * 60 * 24));
      if (daysUntil === 1) {
        statusEl.textContent = 'A viagem começa amanhã!';
      } else {
        statusEl.textContent = 'Viagem começa em ' + daysUntil + ' dias';
      }
    } else if (today > TRIP_DATA.end) {
      statusEl.textContent = 'Viagem concluída!';
    } else {
      statusEl.textContent = 'Dia ' + currentDayNumber + ' de ' + TRIP_DATA.totalDays;
    }
  }

  if (percentEl) {
    if (today < TRIP_DATA.start) {
      percentEl.textContent = '0%';
    } else if (today > TRIP_DATA.end) {
      percentEl.textContent = '100%';
    } else {
      var progress = Math.round((daysCompleted / TRIP_DATA.totalDays) * 100);
      percentEl.textContent = progress + '%';
    }
  }
}

/**
 * Inicializa hover previews nos day-dots da timeline (Desktop)
 */
function initHoverPreviews() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    return;
  }

  var dayDots = document.querySelectorAll('.day-dot[data-preview-img]');

  dayDots.forEach(function(dot) {
    var imgUrl = dot.getAttribute('data-preview-img');
    var title = dot.getAttribute('data-preview-title') || '';
    var desc = dot.getAttribute('data-preview-desc') || '';

    if (!imgUrl) return;

    var preview = createElement('div', 'day-preview');

    var img = createElement('img', 'day-preview-img');
    img.src = imgUrl;
    img.alt = title;
    img.loading = 'lazy';
    preview.appendChild(img);

    if (title || desc) {
      var textDiv = createElement('div', 'day-preview-text');

      if (title) {
        var titleEl = createElement('div', 'day-preview-title', title);
        textDiv.appendChild(titleEl);
      }

      if (desc) {
        var descEl = createElement('div', 'day-preview-desc', desc);
        textDiv.appendChild(descEl);
      }

      preview.appendChild(textDiv);
    }

    dot.appendChild(preview);
  });
}

/**
 * Adiciona botão de compartilhar usando Web Share API
 */
function addShareButton() {
  var resumoDiv = document.getElementById('resumo-tabela');
  if (!resumoDiv) return;

  var canShare = navigator.share !== undefined;

  var shareContainer = createElement('div', 'share-container');
  var shareBtn = createElement('button', 'share-btn md-button md-button--primary');

  if (canShare) {
    shareBtn.textContent = '📤 Compartilhar Roteiro';
    shareBtn.onclick = function() {
      navigator.share({
        title: 'Roteiro Serras Gaúchas 2026',
        text: 'Confira o roteiro de moto pelas Serras Gaúchas - 15 dias de aventura!',
        url: window.location.href
      }).catch(function(err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      });
    };
  } else {
    shareBtn.textContent = '🔗 Copiar Link';
    shareBtn.onclick = function() {
      navigator.clipboard.writeText(window.location.href).then(function() {
        shareBtn.textContent = '✅ Copiado!';
        setTimeout(function() {
          shareBtn.textContent = '🔗 Copiar Link';
        }, 2000);
      });
    };
  }

  shareContainer.appendChild(shareBtn);
  resumoDiv.insertBefore(shareContainer, resumoDiv.firstChild);
}

/* ============================================
   P0: MOBILE CARDS
   ============================================ */

function initMobileCards() {
  var resumoDiv = document.getElementById('resumo-tabela');
  if (!resumoDiv) return;

  var mobileContainer = createElement('div', 'mobile-cards-container');

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  TRIP_DATA.phases.forEach(function(phase) {
    var phaseDays = TRIP_DATA.days.filter(function(d) { return d.phase === phase.id; });

    var accordion = createElement('div', 'mobile-phase-accordion');

    var phaseStart = new Date(phaseDays[0].date + 'T00:00:00');
    var phaseEnd = new Date(phaseDays[phaseDays.length - 1].date + 'T00:00:00');
    var isCurrentPhase = today >= phaseStart && today <= phaseEnd;

    if (isCurrentPhase) {
      accordion.classList.add('expanded');
    }

    // Header do accordion
    var header = createElement('div', 'mobile-phase-header');

    var iconSpan = createElement('span', 'phase-icon', phase.icon);
    header.appendChild(iconSpan);

    var infoDiv = createElement('div', 'phase-info');
    var nameDiv = createElement('div', 'phase-name', phase.name);
    var metaDiv = createElement('div', 'phase-meta', phase.days + ' • ' + phase.km);
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(metaDiv);
    header.appendChild(infoDiv);

    var toggleSpan = createElement('span', 'phase-toggle', '▼');
    header.appendChild(toggleSpan);

    header.onclick = function() {
      accordion.classList.toggle('expanded');
    };

    // Content com cards
    var content = createElement('div', 'mobile-phase-content');
    var cardsContainer = createElement('div', 'mobile-phase-cards');

    phaseDays.forEach(function(dayData) {
      var card = createMobileCard(dayData, today);
      cardsContainer.appendChild(card);
    });

    content.appendChild(cardsContainer);
    accordion.appendChild(header);
    accordion.appendChild(content);
    mobileContainer.appendChild(accordion);
  });

  resumoDiv.appendChild(mobileContainer);
}

function createMobileCard(dayData, today) {
  var card = createElement('div', 'mobile-day-card');

  var dayDate = new Date(dayData.date + 'T00:00:00');

  if (dayDate.getTime() === today.getTime()) {
    card.classList.add('card-hoje');
  } else if (dayDate < today) {
    card.classList.add('card-passado');
  }

  if (dayData.special) {
    card.classList.add('card-' + dayData.special);
  }

  var dateObj = new Date(dayData.date + 'T00:00:00');
  var dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' });

  // Header
  var headerDiv = createElement('div', 'mobile-card-header');
  var daySpan = createElement('span', 'mobile-card-day', 'Dia ' + dayData.day);
  var dateSpan = createElement('span', 'mobile-card-date', dateStr);
  headerDiv.appendChild(daySpan);
  headerDiv.appendChild(dateSpan);
  card.appendChild(headerDiv);

  // Route
  var routeDiv = createElement('div', 'mobile-card-route');
  var routeLink = createElement('a', null, dayData.route);
  routeLink.href = '#dia-' + dayData.day;
  routeDiv.appendChild(routeLink);
  card.appendChild(routeDiv);

  // Footer
  var footerDiv = createElement('div', 'mobile-card-footer');
  var kmSpan = createElement('span', 'mobile-card-km', dayData.km > 0 ? dayData.km + ' km' : '—');
  var typeSpan = createElement('span', 'mobile-card-type', dayData.typeIcon + ' ' + dayData.type);
  footerDiv.appendChild(kmSpan);
  footerDiv.appendChild(typeSpan);
  card.appendChild(footerDiv);

  return card;
}

/* ============================================
   P0: BANNER DIA ATUAL STICKY
   ============================================ */

function initCurrentDayBanner() {
  if (!document.getElementById('viagem-timeline')) return;

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < TRIP_DATA.start || today > TRIP_DATA.end) return;

  var currentDay = TRIP_DATA.days.find(function(d) {
    var dayDate = new Date(d.date + 'T00:00:00');
    return dayDate.getTime() === today.getTime();
  });

  if (!currentDay) return;

  var banner = createElement('div', 'current-day-banner visible');
  banner.id = 'current-day-banner';

  var daySpan = createElement('span', 'banner-day', '📍 Dia ' + currentDay.day);
  var routeSpan = createElement('span', 'banner-route', currentDay.route);
  var kmSpan = createElement('span', 'banner-km', currentDay.km + ' km');
  var closeBtn = createElement('button', 'banner-close', '×');
  closeBtn.setAttribute('aria-label', 'Fechar');

  banner.appendChild(daySpan);
  banner.appendChild(routeSpan);
  banner.appendChild(kmSpan);
  banner.appendChild(closeBtn);

  document.body.insertBefore(banner, document.body.firstChild);
  document.body.classList.add('banner-active');

  closeBtn.onclick = function() {
    banner.classList.remove('visible');
    document.body.classList.remove('banner-active');
    sessionStorage.setItem('bannerClosed', 'true');
  };

  if (sessionStorage.getItem('bannerClosed') === 'true') {
    banner.classList.remove('visible');
    document.body.classList.remove('banner-active');
  }
}

/* ============================================
   P1: NAVEGAÇÃO STICKY ENTRE DIAS
   ============================================ */

function initDayNavigation() {
  if (!document.getElementById('viagem-timeline')) return;

  var nav = createElement('div', 'day-navigation');
  nav.id = 'day-navigation';

  var daySections = [];
  for (var i = 1; i <= 15; i++) {
    var section = document.querySelector('[id^="dia-' + i + '-"]');
    if (section) {
      daySections.push({ day: i, element: section });
    }
  }

  if (daySections.length === 0) return;

  // Prev button
  var prevBtn = createElement('a', 'nav-btn prev');
  prevBtn.href = '#';
  var prevArrow = createElement('span', null, '←');
  var prevDay = createElement('span', 'nav-day');
  prevBtn.appendChild(prevArrow);
  prevBtn.appendChild(prevDay);

  // Current
  var currentDiv = createElement('div', 'nav-current');
  var currentNum = createElement('span', 'current-day-num');
  var currentName = createElement('span', 'current-day-name');
  currentDiv.appendChild(currentNum);
  currentDiv.appendChild(currentName);

  // Next button
  var nextBtn = createElement('a', 'nav-btn next');
  nextBtn.href = '#';
  var nextDay = createElement('span', 'nav-day');
  var nextArrow = createElement('span', null, '→');
  nextBtn.appendChild(nextDay);
  nextBtn.appendChild(nextArrow);

  nav.appendChild(prevBtn);
  nav.appendChild(currentDiv);
  nav.appendChild(nextBtn);

  document.body.appendChild(nav);

  var currentVisibleDay = 1;

  function updateNavigation() {
    var scrollPos = window.scrollY + window.innerHeight / 2;

    daySections.forEach(function(section) {
      if (section.element.offsetTop <= scrollPos) {
        currentVisibleDay = section.day;
      }
    });

    var currentDayData = TRIP_DATA.days[currentVisibleDay - 1];

    currentNum.textContent = 'Dia ' + currentVisibleDay;
    currentName.textContent = currentDayData.route;

    if (currentVisibleDay > 1) {
      prevBtn.style.visibility = 'visible';
      prevDay.textContent = 'Dia ' + (currentVisibleDay - 1);
      prevBtn.href = '#dia-' + (currentVisibleDay - 1) + '-';
    } else {
      prevBtn.style.visibility = 'hidden';
    }

    if (currentVisibleDay < 15) {
      nextBtn.style.visibility = 'visible';
      nextDay.textContent = 'Dia ' + (currentVisibleDay + 1);
      nextBtn.href = '#dia-' + (currentVisibleDay + 1) + '-';
    } else {
      nextBtn.style.visibility = 'hidden';
    }
  }

  var timeline = document.getElementById('viagem-timeline');

  function checkNavVisibility() {
    if (!timeline) return;

    var timelineBottom = timeline.offsetTop + timeline.offsetHeight;

    if (window.scrollY > timelineBottom) {
      nav.classList.add('visible');
      document.body.classList.add('nav-active');
    } else {
      nav.classList.remove('visible');
      document.body.classList.remove('nav-active');
    }
  }

  window.addEventListener('scroll', function() {
    checkNavVisibility();
    if (nav.classList.contains('visible')) {
      updateNavigation();
    }
  }, { passive: true });

  [prevBtn, nextBtn].forEach(function(btn) {
    btn.onclick = function(e) {
      e.preventDefault();
      var targetId = btn.getAttribute('href');
      var target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  });
}

/* ============================================
   P2: CHECKLIST PERSISTENTE
   ============================================ */

function initPersistentChecklist() {
  var taskLists = document.querySelectorAll('.task-list');

  taskLists.forEach(function(list, listIndex) {
    var storageKey = 'checklist-' + window.location.pathname + '-' + listIndex;
    var savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');

    var items = list.querySelectorAll('.task-list-item');
    var totalItems = items.length;
    var checkedCount = 0;

    items.forEach(function(item, itemIndex) {
      var checkbox = item.querySelector('input[type="checkbox"]');
      if (!checkbox) return;

      if (savedState[itemIndex] === true) {
        checkbox.checked = true;
        item.classList.add('checked');
        checkedCount++;
      }

      checkbox.addEventListener('change', function() {
        savedState[itemIndex] = checkbox.checked;
        localStorage.setItem(storageKey, JSON.stringify(savedState));

        if (checkbox.checked) {
          item.classList.add('checked');
        } else {
          item.classList.remove('checked');
        }

        updateChecklistProgress(list, listIndex);
      });
    });

    if (totalItems > 0) {
      var header = createElement('div', 'checklist-header');

      var progressSpan = createElement('span', 'checklist-progress', checkedCount + '/' + totalItems + ' concluídos');
      progressSpan.id = 'checklist-progress-' + listIndex;

      var resetBtn = createElement('button', 'checklist-reset', '🔄 Limpar');
      resetBtn.setAttribute('data-list', listIndex);

      header.appendChild(progressSpan);
      header.appendChild(resetBtn);

      list.parentNode.insertBefore(header, list);

      resetBtn.onclick = function() {
        if (confirm('Limpar toda a checklist?')) {
          localStorage.removeItem(storageKey);
          items.forEach(function(item) {
            var cb = item.querySelector('input[type="checkbox"]');
            if (cb) {
              cb.checked = false;
              item.classList.remove('checked');
            }
          });
          updateChecklistProgress(list, listIndex);
        }
      };
    }
  });
}

function updateChecklistProgress(list, listIndex) {
  var items = list.querySelectorAll('.task-list-item');
  var checked = list.querySelectorAll('.task-list-item input:checked').length;
  var progressEl = document.getElementById('checklist-progress-' + listIndex);
  if (progressEl) {
    progressEl.textContent = checked + '/' + items.length + ' concluídos';
  }
}

/* ============================================
   P2: TOUCH PREVIEW MODAL (Mobile)
   ============================================ */

function initTouchPreview() {
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  var modal = createElement('div', 'touch-preview-modal');
  modal.id = 'touch-preview-modal';

  var content = createElement('div', 'touch-preview-content');

  var img = createElement('img', 'touch-preview-image');
  img.src = '';
  img.alt = '';

  var body = createElement('div', 'touch-preview-body');
  var title = createElement('div', 'touch-preview-title');
  var desc = createElement('div', 'touch-preview-desc');
  var closeBtn = createElement('button', 'touch-preview-close', 'Fechar');

  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(closeBtn);

  content.appendChild(img);
  content.appendChild(body);
  modal.appendChild(content);

  document.body.appendChild(modal);

  function closePreviewModal() {
    modal.classList.remove('visible');
  }

  function openPreviewModal(imgUrl, titleText, descText) {
    img.src = imgUrl;
    title.textContent = titleText;
    desc.textContent = descText;
    modal.classList.add('visible');
  }

  closeBtn.onclick = closePreviewModal;
  modal.onclick = function(e) {
    if (e.target === modal) closePreviewModal();
  };

  var dayDots = document.querySelectorAll('.day-dot[data-preview-img]');
  var longPressTimer;
  var longPressDuration = 500;

  dayDots.forEach(function(dot) {
    dot.addEventListener('touchstart', function() {
      longPressTimer = setTimeout(function() {
        var imgUrl = dot.getAttribute('data-preview-img');
        var titleText = dot.getAttribute('data-preview-title') || '';
        var descText = dot.getAttribute('data-preview-desc') || '';
        openPreviewModal(imgUrl, titleText, descText);
      }, longPressDuration);
    }, { passive: true });

    dot.addEventListener('touchend', function() {
      clearTimeout(longPressTimer);
    });

    dot.addEventListener('touchmove', function() {
      clearTimeout(longPressTimer);
    });
  });
}

/* ============================================
   P1: HOMEPAGE HERO & COUNTDOWN
   ============================================ */

function initHomepageHero() {
  var path = window.location.pathname;
  if (path !== '/' && !path.endsWith('/index.html') && !path.endsWith('/tiger-900/')) {
    return;
  }

  var content = document.querySelector('.md-content__inner');
  if (!content) return;

  if (document.querySelector('.hero-section')) return;

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var daysUntil = Math.ceil((TRIP_DATA.start - today) / (1000 * 60 * 60 * 24));
  var tripStatus = 'planning';
  var statusText = '📅 Planejamento';

  if (today > TRIP_DATA.end) {
    tripStatus = 'completed';
    statusText = '✅ Concluída';
    daysUntil = 0;
  } else if (today >= TRIP_DATA.start) {
    tripStatus = 'active';
    statusText = '🏍️ Em andamento';
    daysUntil = 0;
  }

  var hero = createElement('div', 'hero-section');

  var heroContent = createElement('div', 'hero-content');

  var status = createElement('span', 'trip-status ' + tripStatus, statusText);
  heroContent.appendChild(status);

  var title = createElement('h1', 'hero-title', '🏍️ Serras Gaúchas 2026');
  heroContent.appendChild(title);

  var subtitle = createElement('p', 'hero-subtitle', '15 dias • 3.200 km • Uma aventura épica de moto');
  heroContent.appendChild(subtitle);

  if (daysUntil > 0) {
    var countdown = createElement('div', 'countdown-container');

    var daysItem = createElement('div', 'countdown-item');
    var daysValue = createElement('span', 'countdown-value', String(daysUntil));
    daysValue.id = 'countdown-days';
    var daysLabel = createElement('span', 'countdown-label', 'dias');
    daysItem.appendChild(daysValue);
    daysItem.appendChild(daysLabel);

    var hoursItem = createElement('div', 'countdown-item');
    var hoursValue = createElement('span', 'countdown-value', '00');
    hoursValue.id = 'countdown-hours';
    var hoursLabel = createElement('span', 'countdown-label', 'horas');
    hoursItem.appendChild(hoursValue);
    hoursItem.appendChild(hoursLabel);

    var minsItem = createElement('div', 'countdown-item');
    var minsValue = createElement('span', 'countdown-value', '00');
    minsValue.id = 'countdown-mins';
    var minsLabel = createElement('span', 'countdown-label', 'min');
    minsItem.appendChild(minsValue);
    minsItem.appendChild(minsLabel);

    countdown.appendChild(daysItem);
    countdown.appendChild(hoursItem);
    countdown.appendChild(minsItem);
    heroContent.appendChild(countdown);
  }

  var cta = createElement('a', 'hero-cta', '🗺️ Ver Roteiro Completo');
  cta.href = 'viagens/serras-gauchas-2026/';
  heroContent.appendChild(cta);

  hero.appendChild(heroContent);

  var firstH1 = content.querySelector('h1');
  if (firstH1) {
    firstH1.style.display = 'none';
  }
  content.insertBefore(hero, content.firstChild);

  if (daysUntil > 0) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
}

function updateCountdown() {
  var now = new Date();
  var diff = TRIP_DATA.start - now;

  if (diff <= 0) {
    var countdown = document.querySelector('.countdown-container');
    if (countdown) countdown.style.display = 'none';
    return;
  }

  var days = Math.floor(diff / (1000 * 60 * 60 * 24));
  var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  var daysEl = document.getElementById('countdown-days');
  var hoursEl = document.getElementById('countdown-hours');
  var minsEl = document.getElementById('countdown-mins');

  if (daysEl) daysEl.textContent = String(days);
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
}
