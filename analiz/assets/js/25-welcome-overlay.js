(function(){
  const overlay=document.getElementById("rk-welcome-overlay");
  const enter=document.getElementById("rk-welcome-enter");
  const storageKey="pdrkampus_welcome_seen_v1";
  if(!overlay||!enter){document.body.classList.remove("rk-welcome-pending");return}
  let seen=false;
  try{seen=window.localStorage.getItem(storageKey)==="1"}catch(error){}
  if(seen){
    overlay.hidden=true;
    document.body.classList.remove("rk-welcome-pending");
    return;
  }
  window.requestAnimationFrame(function(){enter.focus({preventScroll:true})});
  enter.addEventListener("click",function(){
    enter.disabled=true;
    try{window.localStorage.setItem(storageKey,"1")}catch(error){}
    overlay.classList.add("is-closing");
    window.setTimeout(function(){
      overlay.hidden=true;
      document.body.classList.remove("rk-welcome-pending");
      document.querySelector(".rk-main")?.focus?.({preventScroll:true});
    },540);
  });
})();