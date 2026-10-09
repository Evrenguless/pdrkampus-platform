export function safeArticleUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function verifiedPdf(article) {
  return article.directDownload === true && article.downloadStatus === 'verified' ? safeArticleUrl(article.file) : '';
}
export function normalizeArticleText(value) {
  return String(value ?? '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}
export function filterArticles(articles, { query = '', year = '', access = '', sort = 'newest' } = {}) {
  const terms = normalizeArticleText(query).split(/\s+/).filter(Boolean);
  return articles.filter(article => {
    if (year && String(article.publicationYear) !== year) return false;
    if (access === 'pdf' && !verifiedPdf(article)) return false;
    if (access === 'source' && verifiedPdf(article)) return false;
    const text = normalizeArticleText([article.title, ...(article.authors || []), article.source, article.topic, article.doi].join(' '));
    return terms.every(term => text.includes(term));
  }).sort((a, b) => {
    const title = String(a.title).localeCompare(String(b.title), 'tr');
    if (sort === 'title') return title;
    const date = String(b.publicationDate || b.publicationYear || '').localeCompare(String(a.publicationDate || a.publicationYear || ''));
    return (sort === 'oldest' ? -date : date) || title;
  });
}
