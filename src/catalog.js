// Official entries identify names/codes visible in MEB's Form Haritası (16.05.2025).
// The map is an index, not a downloadable copy of each form or its instructions.
export const formMap='https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/16122806_formharitasi-16.05.2025-saat_09.45.pdf';
const official=(id,title,category,level,completedBy,tags)=>({id,title,category,level,grade:'Kaynakta belirtilmiyor',audience:'Kaynakta belirtilmiyor',appliedBy:'Kaynakta belirtilmiyor',completedBy,duration:'Kaynakta belirtilmiyor',purpose:'Form haritasında listelenen araç',when:'Uygulama koşulları ilgili formun yönergesinden doğrulanmalı',domain:'Kaynakta belirtilmiyor',source:'MEB Özel Eğitim ve Rehberlik Hizmetleri GM · Form Haritası (16.05.2025)',sourceUrl:formMap,sourceType:'official-map',file:null,evaluation:'Form haritası değerlendirme yönergesi içermez.',tags});
export const tools=[
 official('B.K.A.2.c','Devamsızlık Nedenleri Anketi','Anket','Belirtilmiyor','Kaynakta belirtilmiyor',['devamsızlık','okul','öğrenci']),
 official('B.G.G.7.c','Öğrenci Gözlem Kaydı','Gözlem','Belirtilmiyor','Kaynakta belirtilmiyor',['gözlem','akran','zorbalık','7. sınıf']),
 official('B.G.G.9.a','Sosyometri','Sosyometri','Belirtilmiyor','Kaynakta belirtilmiyor',['akran','ilişkiler','sınıf','zorbalık']),
 official('B.K.A.16.a','RİBA (Ortaokul-Öğrenci Formu)','RİBA','Ortaokul','Öğrenci',['riba','risk','değişim']),
 official('B.K.A.17.a','RİBA (Lise-Öğrenci Formu)','RİBA','Lise','Öğrenci',['riba','risk','değişim']),
 official('B.K.A.19.a','RİBA (İlkokul-Öğretmen Formu)','RİBA','İlkokul','Öğretmen',['riba','öğretmen']),
 official('B.K.A.20.a','RİBA (Ortaokul-Öğretmen Formu)','RİBA','Ortaokul','Öğretmen',['riba','öğretmen']),
 official('B.K.A.21.a','RİBA (Lise-Öğretmen Formu)','RİBA','Lise','Öğretmen',['riba','öğretmen']),
 official('B.K.A.22.a','RİBA (Okulöncesi-Veli Formu)','RİBA','Okul öncesi','Veli',['riba','veli']),
 official('B.K.A.23.a','RİBA (İlkokul-Veli Formu)','RİBA','İlkokul','Veli',['riba','veli']),
 official('B.K.A.24.a','RİBA (Ortaokul-Veli Formu)','RİBA','Ortaokul','Veli',['riba','veli']),
 official('B.K.A.25.a','RİBA (Lise-Veli Formu)','RİBA','Lise','Veli',['riba','veli'])
];
// Direct files remain on MEB's domain. Match on the printed form code and title.
const officialFiles = {
  'B.K.A.2.c': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131422_devamsizliknedenianketi.pdf',
  'B.G.G.7.c': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131159_ogrencigozlemkaydi.pdf',
  'B.G.G.9.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131159_sosyometri.pdf',
  'B.K.A.16.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/09171828_ribaortaokulogrenciformuyeni.pdf',
  'B.K.A.17.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaliseogrenciformuyeni.pdf',
  'B.K.A.19.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribailkokulogretmenformuyeni.pdf',
  'B.K.A.20.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaortaokulogretmenformuyeni.pdf',
  'B.K.A.21.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaliseogretmenformuyeni.pdf',
  'B.K.A.22.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaokuloncesiveliformuyeni.pdf',
  'B.K.A.23.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribailkokulveliformuyeni.pdf',
  'B.K.A.24.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaortaokulveliformuyeni.pdf',
  'B.K.A.25.a': 'https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/08131423_ribaliseveliformuyeni.pdf',
};
for (const item of tools) item.file = officialFiles[item.id] ?? null;

export const library=[
{id:'veli',title:'Akran ilişkileri için veli bilgilendirme taslağı',type:'Veli metni',level:'Ortaokul',area:'Veli',topic:'Akran zorbalığı',source:'PDR Kampüs örnek içerik taslağı',sourceType:'draft',tags:['7. sınıf','akran','zorbalık','veli']},
{id:'ogretmen',title:'Sınıfta akran ilişkilerini konuşma rehberi',type:'Öğretmen metni',level:'Ortaokul',area:'Sosyal-duygusal',topic:'Akran ilişkileri',source:'PDR Kampüs örnek içerik taslağı',sourceType:'draft',tags:['7. sınıf','akran','zorbalık','öğretmen']},
{id:'sinav',title:'Sınav kaygısı üzerine etkinlik planı',type:'Etkinlik',level:'Ortaokul',area:'Akademik',topic:'Sınav kaygısı',source:'PDR Kampüs örnek içerik taslağı',sourceType:'draft',tags:['8. sınıf','sınav','kaygı']},
{id:'kariyer',title:'Kariyer seçenekleri çalışma kağıdı',type:'Çalışma kağıdı',level:'Lise',area:'Kariyer',topic:'Kariyer',source:'PDR Kampüs örnek içerik taslağı',sourceType:'draft',tags:['kariyer','meslek']},
{id:'iletisim',title:'Duyguları ifade etme etkinliği',type:'Etkinlik',level:'İlkokul',area:'Sosyal-duygusal',topic:'Duygu yönetimi',source:'PDR Kampüs örnek içerik taslağı',sourceType:'draft',tags:['duygu','iletişim']}
];
