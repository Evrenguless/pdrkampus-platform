export function safeArticleUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function articleSource(article) {
  return safeArticleUrl(article.sourcePage) || safeArticleUrl(article.doi);
}
export function orderArticles(articles) {
  return [...articles].sort((a, b) => String(b.publicationDate || b.publicationYear || '').localeCompare(String(a.publicationDate || a.publicationYear || '')) || String(a.title).localeCompare(String(b.title), 'tr'));
}
