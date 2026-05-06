export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const label = type === 'success' ? 'Exito:' : 'Error:';
  toast.textContent = `${label} ${message}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function openModal(overlayId) {
  document.getElementById(overlayId).classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeModal(overlayId) {
  document.getElementById(overlayId).classList.remove('open');
  document.body.style.overflow = '';
}

export function setupModalClose(overlayId) {
  const overlay = document.getElementById(overlayId);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlayId);
  });
}

export function setupStarRating(containerId, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);

  if (!container || !input) return;

  let selected = 0;
  const buttons = [];

  function update(hovered = 0) {
    const active = hovered || selected;
    buttons.forEach((button) => {
      const value = Number(button.dataset.value);
      button.classList.toggle('filled', value <= active);
      button.setAttribute('aria-pressed', value === selected ? 'true' : 'false');
    });
  }

  input.value = '';
  container.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    star.textContent = String(i);
    star.dataset.value = String(i);
    star.setAttribute('aria-label', `Puntuación ${i}`);
    star.setAttribute('aria-pressed', 'false');

    star.addEventListener('mouseenter', () => update(i));
    star.addEventListener('mouseleave', () => update(0));
    star.addEventListener('focus', () => update(i));
    star.addEventListener('blur', () => update(0));
    star.addEventListener('click', () => {
      selected = i;
      input.value = String(i);
      update(0);
    });

    buttons.push(star);
    container.appendChild(star);
  }

  update(0);
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function getImageSrc(imageUrl, baseUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${baseUrl}${imageUrl}`;
}

export function exportToCSV(series) {
  const headers = ['ID', 'Nombre', 'Descripción', 'Género', 'Año', 'Imagen URL', 'Fecha Creación'];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  };

  const rows = series.map(s => [
    escape(s.id),
    escape(s.name),
    escape(s.description),
    escape(s.genre),
    escape(s.year),
    escape(s.image_url),
    escape(s.created_at ? new Date(s.created_at).toLocaleDateString('es-ES') : ''),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `mundial2010_series_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildParams(state) {
  const params = {};
  if (state.page > 1) params.page = state.page;
  if (state.limit !== 10) params.limit = state.limit;
  if (state.q) params.q = state.q;
  if (state.sort !== 'id') params.sort = state.sort;
  if (state.order !== 'asc') params.order = state.order;
  return params;
}
