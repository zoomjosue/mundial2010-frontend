import * as API from './api.js';
import {
  showToast, openModal, closeModal, setupModalClose,
  setupStarRating, formatDate, getImageSrc, exportToCSV, buildParams
} from './ui.js';

const COUNTER_REFRESH_MS = 5000;

let state = {
  series: [],
  total: 0,
  globalTotal: 0,
  totalPages: 1,
  page: 1,
  limit: 10,
  q: '',
  sort: 'id',
  order: 'asc',
  editingId: null,
  ratingSerieId: null,
};

const grid = document.getElementById('series-grid');
const pagination = document.getElementById('pagination');
const totalCount = document.getElementById('total-count');
const heroTotal = document.getElementById('hero-total');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const orderSelect = document.getElementById('order-select');
const limitSelect = document.getElementById('limit-select');
const genreSelect = document.querySelector('[data-genre-select]');
const genreTrigger = document.getElementById('genre-select-trigger');
const genreLabel = document.getElementById('genre-select-label');
const genreInput = document.getElementById('f-genre');
const genreOptions = Array.from(document.querySelectorAll('[data-genre-option]'));

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadSeries();
  await updateHeroStats();
  setInterval(refreshSeriesCounters, COUNTER_REFRESH_MS);
});

async function loadSeries() {
  grid.innerHTML = `<div class="spinner"></div>`;

  const params = buildParams(state);
  const { data, error } = await API.getSeries(params);

  if (error) {
    grid.innerHTML = `<div class="empty-state">
      <div class="icon">Aviso</div>
      <h3>Error al conectar</h3>
      <p>${error.error}</p>
    </div>`;
    return;
  }

  state.series = data.data || [];
  state.total = Number(data.total || 0);
  state.totalPages = Number(data.total_pages || 1);
  if (!state.q) state.globalTotal = state.total;

  renderGrid();
  renderPagination();
  syncSeriesCounters();
}

function renderGrid() {
  if (state.series.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">Sin resultados</div>
      <h3>No se encontraron series</h3>
      <p>Prueba con otros filtros o agrega una nueva serie.</p>
    </div>`;
    return;
  }

  grid.innerHTML = state.series.map(s => renderCard(s)).join('');

  grid.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit)));
  });
  grid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(parseInt(btn.dataset.delete)));
  });
  grid.querySelectorAll('[data-rate]').forEach(btn => {
    btn.addEventListener('click', () => openRatingModal(parseInt(btn.dataset.rate)));
  });
  grid.querySelectorAll('[data-upload]').forEach(btn => {
    btn.addEventListener('click', () => openUploadModal(parseInt(btn.dataset.upload)));
  });
  grid.querySelectorAll('.card[data-youtube-url]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openYouTubeCard(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('button')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openYouTubeCard(card);
      }
    });
  });
}

function renderCard(s) {
  const imgSrc = getImageSrc(s.image_url, API.BASE_URL);
  const imgHtml = imgSrc
    ? `<img src="${imgSrc}" alt="${escHtml(s.name)}" onerror="this.parentElement.innerHTML='<div class=card-img-placeholder>Sin imagen</div>'" />`
    : `<div class="card-img-placeholder">Sin imagen</div>`;
  const youtubeUrl = getYouTubeUrl(s);

  return `
  <div class="card" id="card-${s.id}" role="link" tabindex="0" data-youtube-url="${escHtml(youtubeUrl)}" aria-label="Abrir ${escHtml(s.name)} en YouTube" title="Abrir en YouTube">
    <div class="card-img">${imgHtml}</div>
    <div class="card-body">
      <div class="card-genre">${escHtml(s.genre || 'General')}</div>
      <div class="card-title">${escHtml(s.name)}</div>
      <div class="card-desc">${escHtml(s.description || 'Sin descripción.')}</div>
      <div class="card-meta">
        <span class="card-year">Año: ${s.year || 'Sin dato'}</span>
        <span class="card-rating" id="rating-${s.id}">Puntuación: Sin calificaciones</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-ghost" data-rate="${s.id}" title="Calificar">Calificar</button>
      <button class="btn btn-ghost" data-upload="${s.id}" title="Subir imagen">Subir imagen</button>
      <button class="btn btn-ghost" data-edit="${s.id}" title="Editar">Editar</button>
      <button class="btn btn-danger" data-delete="${s.id}" title="Eliminar">Eliminar</button>
    </div>
  </div>`;
}

async function loadCardRatings() {
  for (const s of state.series) {
    const el = document.getElementById(`rating-${s.id}`);
    if (!el) continue;
    const { data } = await API.getRatings(s.id);
    if (data && data.count > 0) {
      el.textContent = `Puntuación: ${data.average} (${data.count})`;
    }
  }
}

function renderPagination() {
  if (state.totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = `<button class="page-btn" id="prev-page" ${state.page === 1 ? 'disabled' : ''}>Anterior</button>`;

  const range = getPaginationRange(state.page, state.totalPages);
  range.forEach(p => {
    if (p === '...') {
      html += `<span class="page-info">...</span>`;
    } else {
      html += `<button class="page-btn ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  html += `<button class="page-btn" id="next-page" ${state.page === state.totalPages ? 'disabled' : ''}>Siguiente</button>`;
  html += `<span class="page-info">${state.page} / ${state.totalPages}</span>`;

  pagination.innerHTML = html;

  document.getElementById('prev-page')?.addEventListener('click', () => changePage(state.page - 1));
  document.getElementById('next-page')?.addEventListener('click', () => changePage(state.page + 1));
  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => changePage(parseInt(btn.dataset.page)));
  });
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

async function changePage(p) {
  if (p < 1 || p > state.totalPages) return;
  state.page = p;
  await loadSeries();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupEventListeners() {
  setupGenreSelect();

  let searchTimeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      state.q = searchInput.value.trim();
      state.page = 1;
      await loadSeries();
    }, 400);
  });

  sortSelect?.addEventListener('change', async () => {
    state.sort = sortSelect.value;
    state.page = 1;
    await loadSeries();
  });

  orderSelect?.addEventListener('change', async () => {
    state.order = orderSelect.value;
    state.page = 1;
    await loadSeries();
  });

  limitSelect?.addEventListener('change', async () => {
    state.limit = parseInt(limitSelect.value);
    state.page = 1;
    await loadSeries();
  });

  document.getElementById('btn-new')?.addEventListener('click', openCreateModal);

  document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
    const { data } = await API.getSeries({ limit: 1000 });
    if (data?.data) {
      exportToCSV(data.data);
      showToast('CSV exportado exitosamente', 'success');
    }
  });

  document.getElementById('serie-form')?.addEventListener('submit', handleSerieSubmit);

  document.getElementById('rating-form')?.addEventListener('submit', handleRatingSubmit);

  document.getElementById('upload-form')?.addEventListener('submit', handleUploadSubmit);

  ['serie-modal', 'rating-modal', 'upload-modal', 'delete-modal'].forEach(id => {
    setupModalClose(id);
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);

  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) setUploadFile(file);
    });
    uploadZone.addEventListener('click', () => document.getElementById('image-file').click());
    document.getElementById('image-file')?.addEventListener('change', (e) => {
      if (e.target.files[0]) setUploadFile(e.target.files[0]);
    });
  }
}

function openCreateModal() {
  state.editingId = null;
  document.getElementById('modal-title').textContent = 'Nueva Serie';
  document.getElementById('serie-form').reset();
  setGenreValue('');
  clearFormErrors();
  openModal('serie-modal');
}

async function openEditModal(id) {
  const { data, error } = await API.getSerieById(id);
  if (error) { showToast('Error al cargar la serie', 'error'); return; }

  state.editingId = id;
  document.getElementById('modal-title').textContent = 'Editar Serie';

  document.getElementById('f-name').value = data.name || '';
  document.getElementById('f-description').value = data.description || '';
  setGenreValue(data.genre || '');
  document.getElementById('f-year').value = data.year || 2010;
  document.getElementById('f-image-url').value = data.image_url || '';

  clearFormErrors();
  openModal('serie-modal');
}

async function handleSerieSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const body = {
    name: document.getElementById('f-name').value.trim(),
    description: document.getElementById('f-description').value.trim(),
    genre: document.getElementById('f-genre').value.trim(),
    year: parseInt(document.getElementById('f-year').value),
    image_url: document.getElementById('f-image-url').value.trim(),
  };

  let result;
  if (state.editingId) {
    result = await API.updateSerie(state.editingId, body);
  } else {
    result = await API.createSerie(body);
  }

  const wasEditing = Boolean(state.editingId);
  const { error } = result;

  if (error) {
    if (error.details) {
      Object.entries(error.details).forEach(([field, msg]) => {
        const el = document.getElementById(`err-${field}`);
        if (el) el.textContent = msg;
      });
    }
    showToast(error.error || 'Error al guardar', 'error');
    return;
  }

  if (!wasEditing) bumpSeriesTotal(1);

  closeModal('serie-modal');
  showToast(wasEditing ? 'Serie actualizada' : 'Serie creada', 'success');
  state.page = wasEditing ? state.page : 1;
  await loadSeries();
  await updateHeroStats();
}

let pendingDeleteId = null;

function confirmDelete(id) {
  pendingDeleteId = id;
  const serie = state.series.find(s => s.id === id);
  document.getElementById('delete-name').textContent = serie?.name || `#${id}`;
  openModal('delete-modal');
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  const { error } = await API.deleteSerie(pendingDeleteId);
  closeModal('delete-modal');

  if (error) { showToast('Error al eliminar', 'error'); return; }

  showToast('Serie eliminada', 'success');
  bumpSeriesTotal(-1, { updateFound: true });
  if (state.series.length === 1 && state.page > 1) state.page--;
  await loadSeries();
  await updateHeroStats();
  pendingDeleteId = null;
}

async function openRatingModal(serieId) {
  state.ratingSerieId = serieId;
  const serie = state.series.find(s => s.id === serieId);
  document.getElementById('rating-serie-name').textContent = serie?.name || '';

  setupStarRating('stars-container', 'f-score');
  document.getElementById('f-comment').value = '';

  await loadRatingList(serieId);
  openModal('rating-modal');
}

async function loadRatingList(serieId) {
  const { data } = await API.getRatings(serieId);
  const container = document.getElementById('rating-list');

  if (!data || data.count === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;text-align:center">Sin calificaciones aún. Sé el primero.</p>';
    document.getElementById('rating-avg').textContent = 'Sin calificaciones';
    return;
  }

  document.getElementById('rating-avg').textContent = `Puntuación: ${data.average} (${data.count})`;

  container.innerHTML = data.ratings.map(r => `
    <div class="rating-item" id="ri-${r.id}">
      <div class="rating-score">${r.score}</div>
      <div>
        <div class="rating-comment">${escHtml(r.comment || 'Sin comentario')}</div>
        <div class="rating-date">${formatDate(r.created_at)}</div>
      </div>
      <button class="btn btn-danger" style="padding:.3rem .6rem;font-size:.75rem" onclick="deleteRating(${serieId},${r.id})">Eliminar</button>
    </div>`).join('');

  const cardRating = document.getElementById(`rating-${serieId}`);
  if (cardRating) cardRating.textContent = `Puntuación: ${data.average} (${data.count})`;
}

window.deleteRating = async function(serieId, ratingId) {
  const { error } = await API.deleteRating(serieId, ratingId);
  if (error) { showToast('Error al eliminar', 'error'); return; }
  document.getElementById(`ri-${ratingId}`)?.remove();
  await loadRatingList(serieId);
  showToast('Calificación eliminada', 'success');
};

async function handleRatingSubmit(e) {
  e.preventDefault();
  const score = parseInt(document.getElementById('f-score').value);
  const comment = document.getElementById('f-comment').value.trim();

  if (!score || score < 1 || score > 10) {
    showToast('Selecciona una puntuación del 1 al 10', 'error');
    return;
  }

  const { error } = await API.createRating(state.ratingSerieId, { score, comment });

  if (error) { showToast(error.error || 'Error al calificar', 'error'); return; }

  showToast('Calificación guardada', 'success');
  await loadRatingList(state.ratingSerieId);
  setupStarRating('stars-container', 'f-score');
  document.getElementById('f-comment').value = '';
}

let pendingUploadFile = null;

function openUploadModal(serieId) {
  state.uploadSerieId = serieId;
  const serie = state.series.find(s => s.id === serieId);
  document.getElementById('upload-serie-name').textContent = serie?.name || '';
  document.getElementById('upload-preview').innerHTML = '';
  document.getElementById('upload-filename').textContent = '';
  pendingUploadFile = null;
  openModal('upload-modal');
}

function setUploadFile(file) {
  pendingUploadFile = file;
  document.getElementById('upload-filename').textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('upload-preview').innerHTML =
      `<img src="${e.target.result}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);
}

async function handleUploadSubmit(e) {
  e.preventDefault();

  if (!pendingUploadFile) {
    showToast('Selecciona una imagen primero', 'error');
    return;
  }

  const { data, error } = await API.uploadSerieImage(state.uploadSerieId, pendingUploadFile);

  if (error) { showToast(error.error || 'Error al subir imagen', 'error'); return; }

  showToast('Imagen subida exitosamente', 'success');
  closeModal('upload-modal');

  const cardImg = document.querySelector(`#card-${state.uploadSerieId} .card-img`);
  if (cardImg && data.image_url) {
    cardImg.innerHTML = `<img src="${API.BASE_URL}${data.image_url}" alt="cover" />`;
  }
}

async function updateHeroStats() {
  const { data } = await API.getSeries({ limit: 1 });
  if (data) {
    state.globalTotal = Number(data.total || 0);
    syncSeriesCounters();
  }
}

async function refreshSeriesCounters() {
  const currentParams = { ...buildParams(state), limit: 1, page: 1 };
  const { data } = await API.getSeries(currentParams);

  if (data) {
    const previousTotalPages = state.totalPages;
    state.total = Number(data.total || 0);
    state.totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    if (!state.q) state.globalTotal = state.total;
    syncSeriesCounters();
    if (state.totalPages !== previousTotalPages) renderPagination();
  }

  if (state.q) await updateHeroStats();
}

function syncSeriesCounters() {
  if (totalCount) totalCount.textContent = state.total;
  if (heroTotal) heroTotal.textContent = state.globalTotal;
}

function bumpSeriesTotal(delta, { updateFound = !state.q } = {}) {
  state.globalTotal = Math.max(0, Number(state.globalTotal || 0) + delta);
  if (updateFound) state.total = Math.max(0, Number(state.total || 0) + delta);
  syncSeriesCounters();
}

function setupGenreSelect() {
  if (!genreSelect || !genreTrigger || !genreInput || !genreLabel || genreOptions.length === 0) return;

  genreTrigger.addEventListener('click', () => {
    genreSelect.classList.toggle('open');
    genreTrigger.setAttribute('aria-expanded', genreSelect.classList.contains('open') ? 'true' : 'false');
  });

  genreOptions.forEach(option => {
    option.addEventListener('click', () => {
      setGenreValue(option.value);
      closeGenreSelect();
      genreTrigger.focus();
    });
  });

  document.addEventListener('click', (event) => {
    if (!genreSelect.contains(event.target)) closeGenreSelect();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGenreSelect();
  });
}

function closeGenreSelect() {
  if (!genreSelect || !genreTrigger) return;
  genreSelect.classList.remove('open');
  genreTrigger.setAttribute('aria-expanded', 'false');
}

function setGenreValue(value) {
  if (!genreInput || !genreLabel) return;
  const normalizedValue = value || '';
  const selectedOption = genreOptions.find(option => option.value === normalizedValue) || genreOptions[0];

  genreInput.value = selectedOption?.value || '';
  genreLabel.textContent = selectedOption?.textContent || 'Seleccionar...';
  genreOptions.forEach(option => {
    option.setAttribute('aria-selected', option === selectedOption ? 'true' : 'false');
  });
}

function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function openYouTubeCard(card) {
  const url = card.dataset.youtubeUrl;
  if (url) window.open(url, '_blank', 'noopener');
}

function getYouTubeUrl(serie) {
  const title = serie?.name || 'Mundial 2010 España';
  const query = `${title} documental Mundial 2010`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

setTimeout(loadCardRatings, 500);
