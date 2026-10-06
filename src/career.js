import {matchesCareerFilters, recruitmentStatus, statusLabels} from './career-model.js';

const form = document.querySelector('[data-filter]');
const cards = [...document.querySelectorAll('[data-career-card]')];
const resultCount = document.querySelector('[data-result-count]');
const empty = document.querySelector('[data-empty]');
const timeData = element => ({
  startsAt: element.dataset.start,
  deadline: element.dataset.deadline,
  withdrawn: element.dataset.withdrawn === 'true'
});

function updateDates() {
  const now = new Date();
  document.querySelectorAll('.career-status[data-deadline]').forEach(element => {
    const status = recruitmentStatus(timeData(element), now);
    element.dataset.status = status;
    element.textContent = statusLabels[status];
  });
  document.querySelectorAll('[data-apply-link]').forEach(element => {
    const status = recruitmentStatus(timeData(element), now);
    element.hidden = status !== 'open';
    const note = element.parentElement.querySelector('[data-apply-note]');
    if (note) note.textContent = {
      open: 'Başvuru, kurumun resmî sistemi üzerinden yapılır.',
      upcoming: 'Başvuru henüz başlamadı. Başlangıç tarihini ve kurum duyurusunu kontrol edin.',
      closed: 'Başvuru süresi sona erdi. Sonuçlar için kurumun resmî duyurusunu izleyin.',
      withdrawn: 'İlan geri çekildi. Kurumun güncel duyurusunu kontrol edin.',
      unknown: 'Başvuru takvimini kurumun resmî duyurusundan kontrol edin.'
    }[status];
  });
}

function filters() {
  return Object.fromEntries(new FormData(form));
}

function applyFilters(syncUrl = false) {
  if (!form) return;
  const current = filters();
  let count = 0;
  cards.forEach(card => {
    const row = {...card.dataset, status: card.querySelector('.career-status')?.dataset.status};
    if (card.dataset.education) row.education = JSON.parse(card.dataset.education);
    const matched = matchesCareerFilters(row, current);
    card.hidden = !matched;
    if (matched) count++;
  });
  resultCount.textContent = `${count} ${form.dataset.filter === 'jobs' ? 'ilan' : 'bölüm'}`;
  empty.hidden = count > 0;
  if (syncUrl) {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(current)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);
  }
}

function readUrl() {
  if (!form) return;
  const params = new URLSearchParams(location.search);
  for (const field of form.elements) {
    if (!field.name) continue;
    const value = params.get(field.name) || '';
    if (field.tagName !== 'SELECT' || [...field.options].some(option => option.value === value)) field.value = value;
    else field.value = '';
  }
}

updateDates();
if (form) {
  readUrl();
  form.hidden = false;
  applyFilters();
  form.addEventListener('submit', event => {event.preventDefault(); applyFilters(true);});
  form.addEventListener('input', () => applyFilters(true));
  form.addEventListener('change', () => applyFilters(true));
  form.addEventListener('reset', event => {
    event.preventDefault();
    for (const field of form.elements) if (field.name) field.value = '';
    applyFilters(true);
  });
  window.addEventListener('popstate', () => {readUrl(); applyFilters();});
}
setInterval(() => {updateDates(); applyFilters();}, 30000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {updateDates(); applyFilters();}
});
