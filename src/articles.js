import { safeArticleUrl, verifiedPdf, filterArticles } from './articles-catalog.js';
const $ = id => document.getElementById(id);
const pageSize = 24;
let articles = [], results = [], visible = pageSize;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function articleCard(article) {
  const card = element('article', '', 'article-card');
  const pdf = verifiedPdf(article);
  const meta = element('div', '', 'article-card-meta');
  meta.append(element('span', String(article.publicationYear || 'Yıl belirtilmemiş')), element('span', pdf ? 'PDF bağlantısı doğrulandı' : 'Kaynak sayfası', pdf ? 'article-pdf-badge' : 'article-source-badge'));
  card.append(meta, element('h2', article.title), element('p', article.authors?.length ? article.authors.join(', ') : 'Yazar bilgisi kaynakta incelenebilir.', 'article-authors'), element('p', article.source || 'Akademik yayın', 'article-journal'));
  const actions = element('div', '', 'article-actions');
  const source = safeArticleUrl(article.sourcePage) || safeArticleUrl(article.doi);
  for (const [url, label] of [[pdf, 'PDF’yi aç ↗'], [source, 'Kaynağı incele ↗']]) {
    if (!url) continue;
    const link = element('a', label); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    actions.append(link);
  }
  if (!actions.children.length) actions.append(element('span', 'Kaynak bağlantısı bulunmuyor.'));
  card.append(actions);
  return card;
}
function render() {
  $('articleCount').textContent = `${results.length.toLocaleString('tr-TR')} makale · ${Math.min(visible, results.length).toLocaleString('tr-TR')} gösteriliyor`;
  $('articleGrid').replaceChildren(...results.slice(0, visible).map(articleCard));
  $('articleMore').hidden = visible >= results.length;
  $('articleStatus').textContent = results.length ? '' : 'Bu filtrelerle makale bulunamadı. Aramanı değiştir veya filtreleri temizle.';
}
function update() {
  visible = pageSize;
  results = filterArticles(articles, {query: $('articleQuery').value, year: $('articleYear').value, access: $('articleAccess').value, sort: $('articleSort').value});
  render();
}
async function load() {
  try {
    const response = await fetch('/data/academic-articles-tr.json');
    if (!response.ok) throw new Error('Catalogue unavailable');
    articles = await response.json();
    if (!Array.isArray(articles)) throw new Error('Invalid catalogue');
    $('articleTotal').textContent = articles.length.toLocaleString('tr-TR');
    $('articlePdfTotal').textContent = articles.filter(verifiedPdf).length.toLocaleString('tr-TR');
    const years = [...new Set(articles.map(a => a.publicationYear).filter(Boolean))].sort((a, b) => b - a);
    $('articleYear').append(...years.map(year => {const option = element('option', String(year)); option.value = String(year); return option;}));
    const params = new URLSearchParams(location.search);
    $('articleQuery').value = params.get('q') || '';
    $('articleFilters').addEventListener('submit', event => {event.preventDefault(); update();});
    $('articleQuery').addEventListener('input', update);
    ['articleYear', 'articleAccess', 'articleSort'].forEach(id => $(id).addEventListener('change', update));
    $('articleReset').addEventListener('click', () => {$('articleFilters').reset(); update(); $('articleQuery').focus();});
    $('articleMore').addEventListener('click', () => {
      const previous = visible; visible += pageSize; render();
      $('articleGrid').children[previous]?.querySelector('a')?.focus();
    });
    update();
  } catch {
    $('articleStatus').textContent = 'Tam katalog şu anda yüklenemedi. Aşağıdaki makalelerin bağlantılarını kullanabilir veya sayfayı yeniden yükleyebilirsin.';
    $('articleFilters').querySelectorAll('input,select,button').forEach(control => control.disabled = true);
  }
}
load();
