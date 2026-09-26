// Transparent catalogue matching. This module never infers a student's condition.
export const normalize=text=>String(text??'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');

const stop=new Set([
 'sinif','sinifta','sinifi','icin','ile','bir','ve','ne','nasil','hangi','yapmaliyim','suphesi','suphe',
 'ogrenci','ogrencide','cocuk','cocugum','hakkinda','ortaokul','ilkokul','lise','okul','oncesi',
 'form','formu','anket','anketi','istiyorum','lazim','gerekli','gerekiyor','yardim','destek'
]);

// Natural-language intents are deliberately limited to school guidance use cases.
// They improve retrieval without making clinical inferences or diagnoses.
const topics=[
 {
  name:'Akran zorbalığı',
  terms:['akran zorbaligi','zorbalik','akran baskisi','disliyor','dislanma','dalga geciyor','alay ediyor','arkadaslari disliyor'],
  resourceTerms:['akran zorbaligi','zorbalik','akran baskisi','sosyal dislanma','arkadaslik iliskileri'],
  related:['sosyometri','ogrenci gozlem kaydi','siddet sikligi anketi','siddet algisi anketi'],
  explanation:'Konuya yakın araç; kullanım koşullarını belge üzerinden değerlendirin.'
 },
 {
  name:'Devamsızlık / okul reddi',
  terms:['devamsizlik','okula devam','okul reddi','okul fobisi','okula gitmek istemiyor','okula gelmek istemiyor','okula gelmiyor'],
  resourceTerms:['devamsizlik','okul reddi','okul fobisi','okula devam','okula uyum'],
  related:['okul risk','veli gorusme','ogrenci izleme'],
  explanation:'Okula devam, okul reddi veya izleme sürecine yakın kaynak.'
 },
 {
  name:'Sınav kaygısı',
  terms:['sinav kaygisi','sinavdan korkuyor','sinavda heyecanlaniyor','sinav stresi'],
  resourceTerms:['sinav kaygisi'],
  related:[],
  explanation:''
 },
 {
  name:'Kariyer / meslek seçimi',
  terms:['kariyer','meslek secimi','hangi meslegi secmeli','meslek karari','kariyer kararsizligi','meslek kararsizligi','tercih yapacak','lgs tercih','yks tercih'],
  resourceTerms:['kariyer','meslek secimi','mesleki karar','mesleki ilgi','mesleki beceri','tercih rehberi','meslek tanitimi','lgs tercih','yks tercih'],
  related:['yetenek farkindaligi','hedef belirleme'],
  explanation:'Kariyer kararı, mesleki ilgi-yetenek veya tercih sürecine yakın kaynak.'
 },
 {
  name:'Duygu düzenleme',
  terms:['duygu duzenleme','duygularini yonetemiyor','duygularimi yonetemiyorum','cok cabuk ofkeleniyor','sakinlesemiyor','ofke kontrol'],
  resourceTerms:['duygu duzenleme','sakinlesme','ofke yonetimi','otokontrol','ozdenetim'],
  related:['sosyal duygusal beceriler','psikolojik saglamlik'],
  explanation:'Duygu düzenleme ve özdenetim becerilerini destekleyen kaynak.'
 },
 {
  name:'Aile içi iletişim',
  terms:['aile ici iletisim','veli iletisim','aile iletisim','evde iletisim','aile ici catism'],
  resourceTerms:['aile ici iletisim','ebeveyn iletisimi','iletisim becerileri','aile ici catism'],
  related:['ebeveyn tutumlari','veli egitimi'],
  explanation:'Aile iletişimi ve ebeveyn-çocuk etkileşimine yakın kaynak.'
 },
 {
  name:'Dijital yaşam / siber zorbalık',
  terms:['siber zorbalik','dijital zorbalik','telefon bagimliligi','ekran bagimliligi','bilincli teknoloji','dijital guvenlik','internette guvenlik'],
  resourceTerms:['siber zorbalik','dijital zorbalik','bilincli teknoloji','dijital guvenlik','dijital etik','ekran bagimliligi','medya okuryazarligi','dijital esenlik'],
  related:['dijital ebeveynlik','dijital suclar'],
  explanation:'Dijital yaşam, güvenlik ve siber zorbalıkla ilgili kaynak.'
 },
 {
  name:'Özel eğitim',
  terms:['ozel egitim','bep','kaynastirma','butunlestirme','disleksi','otizm','dehb','ozel yetenek','bilsem','ogrenme guclugu'],
  resourceTerms:['ozel egitim','bep','kaynastirma','butunlestirme','disleksi','otizm','dehb','ozel yetenek','bilsem','ogrenme guclugu'],
  related:['egitsel degerlendirme','rama yonlendirme'],
  explanation:'Özel eğitim, kaynaştırma/BEP veya belirli eğitim ihtiyaçlarıyla ilgili kaynak.'
 },
 {
  name:'Mahremiyet / beden güvenliği',
  terms:['mahremiyet','beden guvenligi','beden sinirlari','ozel bolgeler','hayir diyebilme'],
  resourceTerms:['mahremiyet','beden guvenligi','beden sinirlari','hayir diyebilme'],
  related:['sinir koyma','cocuk haklari'],
  explanation:'Mahremiyet, beden güvenliği ve kişisel sınırlarla ilgili kaynak.'
 },
 {
  name:'Psikolojik sağlamlık',
  terms:['psikolojik saglamlik','dayaniklilik','zor zamanlarla basa cikma','zorlayici yasam'],
  resourceTerms:['psikolojik saglamlik','zorlayici yasam','psikososyal'],
  related:['esenlik','stresle bas etme'],
  explanation:'Psikolojik sağlamlık ve zorlayıcı yaşam olaylarına yönelik kaynak.'
 },
 {
  name:'RİBA',
  terms:['riba','rehberlik ihtiyaci'],
  resourceTerms:['riba','rehberlik ihtiyaci belirleme'],
  related:[],
  explanation:''
 },
 {
  name:'Sosyometri',
  terms:['sosyometri'],
  resourceTerms:['sosyometri'],
  related:[],
  explanation:''
 }
];

function topicMatch(topic,hay,title=''){
 const directTerms=(topic?.resourceTerms||topic?.terms||[]).map(normalize);
 const relatedTerms=(topic?.related||[]).map(normalize);
 const direct=directTerms.filter(term=>hay.includes(term));
 const related=relatedTerms.filter(term=>hay.includes(term));
 const titleDirect=directTerms.filter(term=>title.includes(term));
 return {direct,related,titleDirect};
}

export function parseQuery(query){
 const q=normalize(query);
 const grade=Number(q.match(/\b(1[0-2]|[1-9])\.?\s*sinif(?:ta|i|in)?\b/)?.[1]||0);
 let level=grade?(grade<=4?'İlkokul':grade<=8?'Ortaokul':'Lise'):null;
 if(!level){
  if(q.includes('okul oncesi'))level='Okul öncesi';
  else if(q.includes('ortaokul'))level='Ortaokul';
  else if(q.includes('ilkokul'))level='İlkokul';
  else if(q.includes('lise'))level='Lise';
 }
 const topicMatches=[];
 for(const candidate of topics)for(const term of candidate.terms){
  const normalizedTerm=normalize(term);
  if(q.includes(normalizedTerm))topicMatches.push({topic:candidate,term:normalizedTerm});
 }
 topicMatches.sort((a,b)=>b.term.length-a.term.length);
 const topic=topicMatches[0]?.topic||null;
 const words=q
  .replace(/\b(?:1[0-2]|[1-9])\.?\s*sinif(?:ta|i|in)?\b/g,' ')
  .split(/[^a-z0-9]+/)
  .filter(word=>word.length>2&&!stop.has(word));
 return {grade,level,topic,words};
}

export function searchCatalogs(query,forms,resources){
 const parsed=parseQuery(query);
 const results=[];
 for(const [kind,items] of [['form',forms],['resource',resources]])for(const item of items){
  const title=normalize(item.title);
  const topicText=normalize(item.topic);
  const hay=normalize([item.title,item.code,item.category,item.group,item.area,item.topic,item.type,item.source].filter(Boolean).join(' '));
  if(parsed.level&&item.level&&item.level!=='Belirtilmiyor'&&item.level!=='Tüm kademeler'&&!(item.levels?.includes(parsed.level)||item.level===parsed.level))continue;
  if(parsed.grade&&item.grades?.length&&!item.grades.includes(parsed.grade))continue;
  const range=title.match(/\b([1-9]|1[0-2])\s*[-–]\s*([1-9]|1[0-2])\.?\s*sinif\b/);
  if(parsed.grade&&range&&(parsed.grade<Number(range[1])||parsed.grade>Number(range[2])))continue;

  const intent=parsed.topic?topicMatch(parsed.topic,hay,title):{direct:[],related:[],titleDirect:[]};
  const titleHits=parsed.words.filter(word=>title.includes(word)).length;
  const allHits=parsed.words.filter(word=>hay.includes(word)).length;
  let relation=null,reason='',score=0;

  if(parsed.topic&&intent.direct.length){
   relation='direct';
   score=30+(intent.titleDirect.length?7:0)+titleHits*3+(kind==='resource'&&normalize(item.type).includes('program')?5:0);
   reason=parsed.topic.name+' konusunda kaynak';
  }else if(parsed.topic&&intent.related.length){
   relation='related';
   score=12+intent.related.length*2;
   reason=parsed.topic.explanation;
  }else if(!parsed.topic&&parsed.words.length&&allHits===parsed.words.length&&titleHits){
   relation='direct';
   score=titleHits*6+(allHits-titleHits)*2;
   reason='Arama terimleri kaynak başlığı ve bilgisinde eşleşiyor';
  }else if(!parsed.topic&&parsed.words.length>=3&&allHits>=Math.ceil(parsed.words.length*.75)&&titleHits){
   relation='related';
   score=5+titleHits*3+allHits;
   reason='Arama ifadesinin büyük bölümü kaynakla eşleşiyor';
  }else if(parsed.level&&!parsed.topic&&parsed.words.length===0&&item.level===parsed.level){
   relation='direct';
   score=4;
   reason=parsed.level+' kademesi';
  }

  if(!relation)continue;
  if(parsed.level&&(item.level===parsed.level||item.levels?.includes(parsed.level))){
   score+=7;
   reason+=' · '+parsed.level;
  }
  if(parsed.level&&item.level==='Belirtilmiyor')reason+=' · kademe kaynakta belirtilmiyor';
  results.push({item,kind,relation,reason,score});
 }
 results.sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'tr'));
 return {parsed,results};
}
