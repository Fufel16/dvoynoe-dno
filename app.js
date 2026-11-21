// Основная логика приложения базы знаний

let currentCategory = 'all';
let currentQuery = '';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(html, query) {
  if (!query.trim()) return html;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return html.replace(regex, '<span class="highlight">$1</span>');
}

function textToHtml(text) {
  if (!text) return '';
  // Convert plain text with newlines to paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  return paragraphs.map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
}

function getFilteredData() {
  const query = currentQuery.toLowerCase().trim();
  return knowledgeBase.filter(item => {
    const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
    if (!matchesCategory) return false;
    if (!query) return true;
    const searchable = (
      item.title + ' ' +
      item.category + ' ' +
      (item.content || '')
    ).toLowerCase();
    return searchable.includes(query);
  });
}

function getPreview(text, maxLen = 180) {
  if (!text) return '';
  const clean = text.replace(/\n/g, ' ').trim();
  return clean.length > maxLen ? clean.substring(0, maxLen) + '…' : clean;
}

function renderCards() {
  const container = document.getElementById('cards');
  const stats = document.getElementById('stats');
  const filtered = getFilteredData();

  stats.textContent = `Найдено разделов: ${filtered.length} из ${knowledgeBase.length}`;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">Ничего не найдено. Попробуйте другое слово или снимите фильтр.</div>';
    return;
  }

  container.innerHTML = filtered.map(item => {
    const titleHtml = highlightText(escapeHtml(item.title), currentQuery);
    const preview = getPreview(item.content);
    const previewHtml = highlightText(escapeHtml(preview), currentQuery);
    return `
      <article class="card" data-id="${item.id}">
        <div class="category-badge">${escapeHtml(item.category)}</div>
        <h3>${titleHtml}</h3>
        <div class="preview">${previewHtml}</div>
      </article>
    `;
  }).join('');

  // Attach click handlers
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openModal(id);
    });
  });
}

function openModal(id) {
  const item = knowledgeBase.find(s => s.id === id);
  if (!item) return;

  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalCategory').textContent = item.category;
  
  let bodyHtml = textToHtml(item.content);
  bodyHtml = highlightText(bodyHtml, currentQuery);
  document.getElementById('modalBody').innerHTML = bodyHtml;

  document.getElementById('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  document.body.style.overflow = '';
}

function initFilters() {
  document.getElementById('filters').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      renderCards();
    }
  });
}

function initSearch() {
  const searchInput = document.getElementById('search');
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentQuery = e.target.value;
      renderCards();
    }, 180);
  });
}

function initModal() {
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initSearch();
  initModal();
  renderCards();
});