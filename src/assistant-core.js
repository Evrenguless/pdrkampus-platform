// Date-only values deliberately avoid UTC conversion and DST boundary shifts.
export function dateKey(date=new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function parseDate(value) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Geçerli bir tarih seçin.');
 const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d,12);
 if(dateKey(date)!==value)throw Error('Geçerli bir tarih seçin.');
 return date;
}
export function weekDates(value) {
 const date=parseDate(value);date.setDate(date.getDate()-((date.getDay()+6)%7));
 return Array.from({length:5},(_,i)=>{const day=new Date(date);day.setDate(day.getDate()+i);return dateKey(day)});
}
export function taskSummary(tasks,today=dateKey()) {
 return {open:tasks.filter(x=>!x.completed).length,today:tasks.filter(x=>!x.completed&&x.due_date===today).length,overdue:tasks.filter(x=>!x.completed&&x.due_date&&x.due_date<today).length};
}
export function filterPacks(packs,level,query='') {
 const normalize=s=>s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
 return packs.filter(p=>(!level||p.levels.includes('Tüm kademeler')||p.levels.includes(level))&&normalize(p.title+' '+p.category+' '+p.query).includes(normalize(query.trim())));
}
export function activityText(pack,level,minutes) {
 if(!['Okul öncesi','İlkokul','Ortaokul','Lise'].includes(level))throw Error('Kademe seçin.');
 if(!pack.levels.includes('Tüm kademeler')&&!pack.levels.includes(level))throw Error('Bu taslak seçilen kademe için sunulmuyor.');
 if(![20,30,40].includes(Number(minutes)))throw Error('Süre 20, 30 veya 40 dakika olmalı.');
 const duration=Number(minutes),parts=[Math.round(duration*.2),Math.round(duration*.3),Math.round(duration*.3)];parts.push(duration-parts.reduce((a,b)=>a+b,0));
 return `PDR KAMPÜS · ETKİNLİK TASLAĞI\n${pack.activity.title}\nKademe: ${level}\nSüre: ${duration} dakika\nAmaç: ${pack.activity.goal}\n\nHAZIRLIK\nKâğıt, kalem ve yaş grubuna uygun kurgusal örnekler hazırlayın. Katılım ve paylaşım gönüllüdür. Öğrencilerin özel yaşantılarını grup önünde açıklamasını istemeyin. Okul öncesinde yetişkinin yönettiği oyun/resim, ilkokulda somut kısa örnekler, ortaokul ve lisede yazılı düşünme kullanılabilir.\n\nAKIŞ\n${pack.activity.steps.map((s,i)=>`${i+1}. (${parts[i]} dk) ${s}`).join('\n')}\n\nDEĞERLENDİRME\nİsim almadan “Bugün öğrendiğim bir şey” ve “Daha fazla destek istediğim bir konu” sorularıyla kapanış yapın. Bir hafta sonra becerinin kullanımını sınıf düzeyinde gözden geçirin.\n\nUYGULAMA NOTU\nPDR Kampüs özgün hazırlık taslağıdır; MEB onaylı program, tanı aracı veya tedavi protokolü değildir. Kazanımı, erişilebilirliği ve kademeye uygunluğunu uygulayıcı değerlendirmelidir.\nRehber: https://pdrkampus.com${pack.path}\nResmî kaynak: ${pack.sources[0].url}`;
}
export function reportText(values) {
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.month||''))throw Error('Rapor ayını seçin.');
 const labels={sessions:'Bireysel görüşme sayısı',activities:'Sınıf/grup etkinliği sayısı',parents:'Veli çalışması sayısı',teachers:'Öğretmen müşavirliği çalışması sayısı',participations:'Toplam etkinlik katılımı (benzersiz kişi sayısı değildir)'};
 const lines=Object.entries(labels).map(([k,label])=>{const n=Number(values[k]);if(values[k]===''||!Number.isInteger(n)||n<0||n>100000)throw Error('Sayılar 0–100000 arasında tam sayı olmalı.');return `${label}: ${n}`});
 const clean=k=>String(values[k]||'').trim().slice(0,1000);
 return `PDR KAMPÜS · AYLIK FAALİYET ÖZETİ TASLAĞI\nDönem: ${values.month}\n\nFAALİYET SAYILARI\n${lines.join('\n')}\n\nOKUL PROGRAMINDAKİ HEDEF\n${clean('goal')||'Belirtilmedi.'}\n\nDEĞERLENDİRME VE SINIRLAR\n${clean('evaluation')||'Sonuç değerlendirmesi eklenmedi; faaliyet sayıları etkililik kanıtı değildir.'}\n\nSONRAKİ AY ÖNCELİĞİ\n${clean('next')||'Belirtilmedi.'}\n\nBu metin resmî rapor yerine geçmez. Sayıları kurum kayıtlarıyla doğrulayın. Katılımlar benzersiz kişi olarak sayılmaz. Öğrenci adı, vaka ayrıntısı ve sağlık bilgisi eklemeyin; küçük grupların tanınabilirliğini paylaşım öncesinde değerlendirin.`;
}
