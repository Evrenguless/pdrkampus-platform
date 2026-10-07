export function normalizeCareerText(value) {
  return String(value ?? '').toLocaleLowerCase('tr-TR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/\s+/g, ' ').trim();
}

export function recruitmentStatus({startsAt, deadline, withdrawn = false}, now = new Date()) {
  if (withdrawn) return 'withdrawn';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const parse = value => Date.parse(dateOnly.test(value) ? value + 'T00:00:00+03:00' : value);
  const start = parse(startsAt), end = parse(deadline), time = Number(now);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(time) || start >= end) return 'unknown';
  if (dateOnly.test(deadline)) {
    if (time >= end + 86400000) return 'closed';
    if (time >= end) return 'unknown';
  } else if (time >= end) return 'closed';
  return time < start ? 'upcoming' : 'open';
}

export const statusLabels = {
  open: 'Başvuru açık', upcoming: 'Başvuru başlayacak', closed: 'Başvuru sona erdi',
  withdrawn: 'İlan geri çekildi', unknown: 'Takvimi resmî kaynaktan kontrol edin'
};

export function matchesCareerFilters(row, filters) {
  const terms = normalizeCareerText(filters.q).split(' ').filter(Boolean);
  if (!terms.every(term => normalizeCareerText(row.search).includes(term))) return false;
  return ['city', 'education', 'score', 'degree', 'status'].every(key => {
    if (!filters[key]) return true;
    const values = Array.isArray(row[key]) ? row[key] : [row[key]];
    return values.includes(filters[key]);
  });
}
