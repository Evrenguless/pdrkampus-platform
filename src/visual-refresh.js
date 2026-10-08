/* Presentation controls use the existing library filter events. */
const filters = document.querySelector('.library-filters');
if (filters && window.matchMedia('(max-width: 760px)').matches) filters.open = false;

document.getElementById('libraryReset')?.addEventListener('click', () => {
  const query = document.getElementById('libraryQuery');
  if (query) { query.value = ''; query.dispatchEvent(new Event('input', {bubbles: true})); }
  for (const id of ['libraryType', 'libraryLevel', 'libraryArea']) {
    const select = document.getElementById(id);
    if (select) { select.value = ''; select.dispatchEvent(new Event('change', {bubbles: true})); }
  }
  document.querySelector('[data-library-source=""]')?.click();
  document.querySelectorAll('[data-need]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  const guide = document.getElementById('libraryNeedsGuide');
  if (guide) guide.hidden = true;
});
