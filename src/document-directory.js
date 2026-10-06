const search = document.getElementById('documentSearch');
const status = document.getElementById('documentResults');
const normalize = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
if (search && status) search.addEventListener('input', () => {
  const query = normalize(search.value.trim());
  let total = 0;
  document.querySelectorAll('[data-document-group]').forEach(group => {
    let shown = 0;
    group.querySelectorAll('[data-document-link]').forEach(link => {
      link.hidden = !normalize(link.textContent + ' ' + group.querySelector('h2').textContent).includes(query);
      if (!link.hidden) shown++;
    });
    group.hidden = shown === 0;
    total += shown;
  });
  status.textContent = query ? (total ? total + ' kaynak sayfası bulundu.' : 'Bu aramaya uygun kaynak sayfası bulunamadı.') : '8 kategori · 48 kaynak sayfası';
});
const draft = document.getElementById('documentDraft');
const draftStatus = document.getElementById('draftStatus');
document.getElementById('downloadDraft')?.addEventListener('click', () => {
  if (!draft) return;
  const blob = new Blob(['\ufeff' + draft.value], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const slug = location.pathname.split('/').filter(Boolean).at(-1) || 'hazirlik';
  link.download = slug + '-taslak.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (draftStatus) draftStatus.textContent = 'Metin indirmesi başlatıldı.';
});
let print = null;
const cleanup = () => { document.body.classList.remove('document-printing'); print?.remove(); print = null; };
window.addEventListener('afterprint', cleanup);
document.getElementById('printDraft')?.addEventListener('click', () => {
  if (!draft) return;
  cleanup();
  print = document.createElement('pre');
  print.className = 'document-print';
  print.textContent = draft.value;
  document.body.append(print);
  document.body.classList.add('document-printing');
  try { window.print(); } catch { cleanup(); }
});
