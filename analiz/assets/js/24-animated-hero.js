(function(){
  const target=document.getElementById("rk-animated-hero-word");
  if(!target)return;
  const words=["ölç","analiz et","karşılaştır","geliştir"];
  const markers=Array.from(document.querySelectorAll("[data-rk-hero-word]"));
  let index=Math.max(0,words.indexOf(target.textContent.trim()));
  let timer=null;
  function showNext(){
    target.classList.remove("is-entering");
    target.classList.add("is-leaving");
    window.setTimeout(function(){
      index=(index+1)%words.length;
      const next=words[index];
      target.textContent=next;
      markers.forEach(function(marker){marker.classList.toggle("is-active",marker.dataset.rkHeroWord===next)});
      target.classList.remove("is-leaving");
      target.classList.add("is-entering");
      requestAnimationFrame(function(){requestAnimationFrame(function(){target.classList.remove("is-entering")})});
    },280);
  }
  function start(){if(timer===null)timer=window.setInterval(showNext,2400)}
  function stop(){if(timer!==null){window.clearInterval(timer);timer=null}}
  document.addEventListener("visibilitychange",function(){document.hidden?stop():start()});
  start();
})();