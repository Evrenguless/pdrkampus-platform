import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {articleSource, orderArticles, safeArticleUrl} from '../src/articles-catalog.js';
const articles = JSON.parse(readFileSync(new URL('../data/academic-articles-tr.json', import.meta.url)));
test('all scanned records remain in the article catalogue', () => {
  assert.equal(articles.length, 1512);
  assert.equal(new Set(articles.map(a => a.id)).size, 1512);
  assert.equal(orderArticles(articles).length, articles.length);
  assert.equal(orderArticles(articles)[0].publicationYear, 2026);
});
test('cards link to source pages or DOI, never to candidate or direct PDF files', () => {
  assert.equal(articleSource({sourcePage:'https://example.org/article',file:'https://example.org/file.pdf',directDownload:true}), 'https://example.org/article');
  assert.equal(articleSource({candidatePdf:'https://example.org/file.pdf',file:'https://example.org/file.pdf'}), '');
  assert.equal(articleSource({sourcePage:'javascript:alert(1)',doi:'https://doi.org/10.1/example'}), 'https://doi.org/10.1/example');
  assert.equal(safeArticleUrl('https://user:pass@example.org/a.pdf'), '');
});
test('page reuses library cards and presents no filter or PDF counter controls', () => {
  const page = readFileSync(new URL('../makaleler.html', import.meta.url), 'utf8');
  assert.match(page, /document-results library-results/);
  assert.match(page, /document-card library-document resource-card surface-card/);
  assert.doesNotMatch(page, /<select|type="search"|articlePdfTotal|Doğrulanmış PDF|PDF’yi aç/);
});
