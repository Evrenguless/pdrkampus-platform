import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterArticles, verifiedPdf, safeArticleUrl} from '../src/articles-catalog.js';
const articles = JSON.parse(readFileSync(new URL('../data/academic-articles-tr.json', import.meta.url)));
test('catalogue retains all scanned records and only verified PDF links', () => {
  assert.equal(articles.length, 1512);
  assert.equal(new Set(articles.map(a => a.id)).size, 1512);
  assert.equal(filterArticles(articles, {access:'pdf'}).length, 248);
  assert.equal(filterArticles(articles, {access:'source'}).length, 1264);
  assert.equal(verifiedPdf({directDownload:true, downloadStatus:'verification-pending', file:'https://example.org/a.pdf'}), '');
  assert.equal(safeArticleUrl('javascript:alert(1)'), '');
  assert.equal(safeArticleUrl('https://user:pass@example.org/a.pdf'), '');
});
test('Turkish queries match author, title and DOI and combine with year and access', () => {
  const result = filterArticles(articles, {query:'yavruturk inovasyon', year:'2024', access:'pdf'});
  assert.equal(result.length, 1);
  assert.match(result[0].title, /İnovasyon/);
  assert.equal(filterArticles(articles, {query:'10.13114/mjh.1575107'}).length, 1);
  assert.equal(filterArticles(articles, {query:'zzzznonexistent'}).length, 0);
});
test('sort orders and publication year filter reflect the data', () => {
  assert.equal(filterArticles(articles, {year:'2026'}).length, 168);
  assert.equal(filterArticles(articles)[0].publicationYear, 2026);
  assert.equal(filterArticles(articles, {sort:'oldest'})[0].publicationYear, 2020);
});
