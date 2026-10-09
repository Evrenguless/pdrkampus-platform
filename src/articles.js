import { articleSource, orderArticles } from './articles-catalog.js?v=20261010-2';
const $ = id => document.getElementById(id);
const pageSize = 24;
let articles = [], visible = pageSize;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function sourceLink(url, label) {
  const link = element('a', label);
  link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}
function articleCard(article) {
  const card = element('article', '', 'document-card library-document resource-card surface-card');
  const visual = element('div', '', 'resource-card-cover');
  const tile = element('span', 'MAKALE', 'resource-format-tile');
  tile.append(element('small', 'Akademik yayın')); visual.append(tile);
  const content = element('div', '', 'resource-content');
  const meta = element('div', '', 'document-card-meta');
  meta.append(element('span', String(article.publicationYear || 'Akademik yayın')), element('span', 'Makale'));
  const title = element('h3');
  const source = articleSource(article);
  title.append(source ? sourceLink(source, article.title) : document.createTextNode(article.title));
  content.append(meta, title, element('p', article.source || 'Akademik yayın', 'library-source'));
  if (article.authors?.length) content.append(element('p', article.authors.join(', '), 'resource-detail'));
  const actions = element('div', '', 'resource-actions');
  actions.append(source ? sourceLink(source, 'Kaynak sayfasını aç ↗') : element('p', 'Kaynak bağlantısı bulunmuyor.'));
  card.append(visual, content, actions);
  return card;
}
function render() {
  $('articleCount').textContent = `${articles.length.toLocaleString('tr-TR')} makale`;
  $('articleGrid').replaceChildren(...articles.slice(0, visible).map(articleCard));
  $('articleMore').hidden = visible >= articles.length;
}
async function load() {
  try {
    const response = await fetch('/data/academic-articles-tr.json');
    if (!response.ok) throw new Error('Catalogue unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid catalogue');
    articles = orderArticles(data);
    $('articleMore').addEventListener('click', () => {
      const previous = visible; visible += pageSize; render();
      $('articleGrid').children[previous]?.querySelector('a')?.focus();
    });
    render();
  } catch {
    $('articleStatus').textContent = 'Tam katalog şu anda yüklenemedi. Aşağıdaki makalelerin kaynak bağlantılarını kullanabilir veya sayfayı yeniden yükleyebilirsin.';
  }
}
load();
