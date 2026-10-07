const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configNode=document.getElementById('resourcePreviewData');
if(configNode){
 const row=JSON.parse(configNode.textContent),stage=document.getElementById('resourcePreview'),controls=document.getElementById('resourcePreviewControls');
 let preview={},index=0,zoom=100;
 try{const response=await fetch('/data/resource-previews.json');if(response.ok)preview=(await response.json())[row.id]||{}}catch{}
 const safeUrl=value=>{try{const url=new URL(value,location.href);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}};
 const file=safeUrl(row.file);
 function sheetMarkup(sheet){
  const columns=Math.max(1,...sheet.rows.map(r=>r.length)),mergeAt={},covered=new Set();
  function coord(v){const m=v.match(/([A-Z]+)(\d+)/);let col=0;for(const ch of m[1])col=col*26+ch.charCodeAt(0)-64;return [Number(m[2])-1,col-1]}
  for(const range of sheet.merges||[]){const [a,b]=range.split(':'),[sr,sc]=coord(a),[er,ec]=coord(b||a);if(sr>=sheet.rows.length||sc>=columns)continue;mergeAt[sr+':'+sc]={rows:Math.min(er+1,sheet.rows.length)-sr,cols:Math.min(ec+1,columns)-sc};for(let y=sr;y<=er;y++)for(let x=sc;x<=ec;x++)if(y!==sr||x!==sc)covered.add(y+':'+x)}
  const letter=i=>{let value='';for(let n=i+1;n;n=Math.floor((n-1)/26))value=String.fromCharCode(65+(n-1)%26)+value;return value};
  return '<table class="resource-sheet" aria-label="'+esc(sheet.name)+'"><thead><tr><th></th>'+Array.from({length:columns},(_,i)=>'<th>'+letter(i)+'</th>').join('')+'</tr></thead><tbody>'+sheet.rows.map((row,y)=>'<tr><th scope="row">'+(y+1)+'</th>'+Array.from({length:columns},(_,x)=>{if(covered.has(y+':'+x))return '';const m=mergeAt[y+':'+x];return '<td'+(m?' rowspan="'+m.rows+'" colspan="'+m.cols+'"':'')+'>'+esc(row[x])+'</td>'}).join('')+'</tr>').join('')+'</tbody></table>';
 }
 function show(){
  if(preview.sheets?.length){stage.innerHTML=sheetMarkup(preview.sheets[index]);controls.innerHTML='<div class="resource-sheet-tabs" role="tablist" aria-label="Çalışma sayfaları">'+preview.sheets.map((s,i)=>'<button role="tab" aria-selected="'+(i===index)+'" data-sheet="'+i+'">'+esc(s.name)+'</button>').join('')+'</div>'}
  else if(preview.previews?.length){stage.innerHTML='<img src="'+esc(preview.previews[index])+'" alt="'+esc(row.title)+' — '+(index+1)+'. sayfa">';controls.innerHTML='<span>'+String(index+1)+' / '+String(preview.pageCount||preview.previews.length)+' sayfa · İlk '+preview.previews.length+' sayfa önizlemesi</span><button id="previewPrevious" aria-label="Önceki sayfa" '+(index===0?'disabled':'')+'>‹</button><button id="previewNext" aria-label="Sonraki sayfa" '+(index===preview.previews.length-1?'disabled':'')+'>›</button>'}
  else if(row.unavailable||!file){stage.innerHTML='<p>Dosyanın güncel adresini resmî yayın sayfasından inceleyebilirsiniz.</p>';return}
  else if(row.fileType==='PDF'){stage.innerHTML='<object data="'+esc(file)+'#toolbar=1" type="application/pdf" aria-label="'+esc(row.title)+'"><p>Bu tarayıcı belgeyi sayfa içinde gösteremiyor. <a href="'+esc(file)+'" target="_blank" rel="noopener">Belgeyi yeni sekmede görüntüleyin</a>.</p></object>';controls.innerHTML='<span>Kaynak kurumun özgün PDF dosyası</span>'}
  else if(['JPG','JPEG','PNG'].includes(row.fileType)){stage.innerHTML='<img src="'+esc(file)+'" alt="'+esc(row.title)+'">'}
  else if(row.fileType==='MP4'){stage.innerHTML='<video controls preload="metadata" src="'+esc(file)+'"></video>'}
  else if(['XLSX','XLS','PPTX','PPT','DOCX','DOC'].includes(row.fileType)){stage.innerHTML='<iframe title="'+esc(row.title)+' — belge önizlemesi" src="https://view.officeapps.live.com/op/embed.aspx?src='+encodeURIComponent(file)+'" loading="lazy" referrerpolicy="no-referrer"></iframe>';controls.innerHTML='<span>Özgün dosyanın çevrim içi önizlemesi</span>'}
  else{stage.innerHTML='<div class="resource-preview-message"><strong>'+esc(row.fileType)+' kaynağı</strong><p>Bu dosya türünün sayfa içi önizlemesi bulunmuyor. Kaynak kurumun yayın sayfasında içeriği inceleyebilirsiniz.</p></div>';return}
  controls.insertAdjacentHTML('beforeend','<button id="previewZoom" aria-label="Önizlemeyi büyüt">＋</button><button id="previewExpand" aria-pressed="false">⛶ Genişlet</button>');
  for(const b of controls.querySelectorAll('[data-sheet]'))b.onclick=()=>{index=Number(b.dataset.sheet);show()};
  const prev=document.getElementById('previewPrevious'),next=document.getElementById('previewNext');if(prev)prev.onclick=()=>{index--;show()};if(next)next.onclick=()=>{index++;show()};
  document.getElementById('previewZoom').onclick=()=>{zoom=zoom===150?100:zoom+25;stage.firstElementChild.style.zoom=zoom+'%'};
  document.getElementById('previewExpand').onclick=toggleExpanded;
 }
 function toggleExpanded(){const viewer=stage.closest('.resource-viewer'),on=viewer.classList.toggle('resource-expanded');document.body.style.overflow=on?'hidden':'';document.getElementById('previewExpand').setAttribute('aria-pressed',String(on));document.getElementById('previewExpand').textContent=on?'✕ Kapat':'⛶ Genişlet'}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.closest('.resource-viewer').classList.contains('resource-expanded'))toggleExpanded()});
 index=preview.sheets?.findIndex(s=>s.name==='EYLÜL')??0;if(index<0)index=0;show();
}
