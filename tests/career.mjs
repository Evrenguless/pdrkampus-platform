import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCareerFilters, recruitmentStatus, normalizeCareerText} from '../src/career-model.js';

const announcement = {startsAt: '2026-09-28T09:00:00+03:00', deadline: '2026-10-12T13:00:00+03:00'};
test('date-only deadlines never invent an open application hour on the last day', () => {
  const row = {startsAt:'2026-10-04', deadline:'2026-10-11'};
  assert.equal(recruitmentStatus(row, new Date('2026-10-10T20:59:59Z')), 'open');
  assert.equal(recruitmentStatus(row, new Date('2026-10-10T21:00:00Z')), 'unknown');
  assert.equal(recruitmentStatus(row, new Date('2026-10-11T20:59:59Z')), 'unknown');
  assert.equal(recruitmentStatus(row, new Date('2026-10-11T21:00:00Z')), 'closed');
});
test('application opens and closes at the exact Turkey time boundary', () => {
  assert.equal(recruitmentStatus(announcement, new Date('2026-09-28T05:59:59Z')), 'upcoming');
  assert.equal(recruitmentStatus(announcement, new Date('2026-09-28T06:00:00Z')), 'open');
  assert.equal(recruitmentStatus(announcement, new Date('2026-10-12T09:59:59Z')), 'open');
  assert.equal(recruitmentStatus(announcement, new Date('2026-10-12T10:00:00Z')), 'closed');
});
test('withdrawal takes priority and invalid dates never enable applications', () => {
  assert.equal(recruitmentStatus({...announcement, withdrawn:true}), 'withdrawn');
  assert.equal(recruitmentStatus({...announcement, deadline:'invalid'}), 'unknown');
  assert.equal(recruitmentStatus({...announcement, startsAt:announcement.deadline}), 'unknown');
});
test('Turkish names can be found with or without diacritics', () => {
  assert.equal(normalizeCareerText('İLK ve ACİL YARDIM'), 'ilk ve acil yardim');
  assert.ok(matchesCareerFilters({search:'Düzce Üniversitesi Büro Personeli'}, {q:'DUZCE buro'}));
  assert.ok(matchesCareerFilters({search:'Özel Eğitim Öğretmenliği'}, {q:'ozel ogretmenligi'}));
  assert.ok(!matchesCareerFilters({search:'Psikoloji'}, {q:'pdr'}));
});
test('filters intersect, support multiple education levels, and allow reset', () => {
  const row = {search:'Büro Personeli', city:'Düzce', education:['Lisans','Ön lisans'], status:'open'};
  assert.ok(matchesCareerFilters(row, {q:'büro',city:'Düzce',education:'Ön lisans',status:'open'}));
  assert.ok(!matchesCareerFilters(row, {q:'büro',education:'Ortaöğretim'}));
  assert.ok(!matchesCareerFilters(row, {status:'closed'}));
  assert.ok(matchesCareerFilters(row, {q:'', city:'',education:'',status:''}));
});
