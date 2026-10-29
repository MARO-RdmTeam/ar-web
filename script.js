const DEFAULT = {settings:{name:"عمار",sub:"للتعريب",tagline:"نحو محتوى أوسع .. بلغتك",telegram:"",logo:"",footer:"جميع الحقوق محفوظة © عمار للتعريب"}, games:[]};
let state = JSON.parse(JSON.stringify(DEFAULT));
let loaded = false, editing = null, tmp = {cover:"",shots:[]};
let curShots = [], lbIndex = 0, homeScroll = 0, lastRoute = null;

const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => /^(https?:|data:image\/|tg:)/i.test(u||"") ? u : "";
function toast(t){const e=$("toast");if(!e)return;e.textContent=t;e.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display="none",2600)}
function closeM(id){$(id).classList.remove("on")}
function openM(id){$(id).classList.add("on")}
const ls = {
  get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},
  set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){toast("المتصفح رفض الحفظ (الصور كبيرة؟)")}},
  del:k=>{try{localStorage.removeItem(k)}catch(e){}}
};

/* ===== أيقونات ===== */
const I = {
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
  go:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
};
const crownSVG='<svg class="crown" viewBox="0 0 64 40" fill="currentColor"><path d="M4 34 8 10l14 12L32 4l10 18 14-12 4 24z"/><rect x="4" y="35" width="56" height="4" rx="2"/></svg>';

/* ===== تحميل البيانات ===== */
async function load(){
  let pub=null;
  try{const r=await fetch("data.json?"+Date.now());if(r.ok)pub=await r.json()}catch(e){}
  if(pub)state={settings:{...DEFAULT.settings,...pub.settings},games:pub.games||[]};
  loaded=true;
  if(window.ADMIN){
    let ok=false;try{ok=sessionStorage.getItem("ammar_ok")==="1"}catch(e){}
    if(ok)enableAdmin();else showLock();
  }
  render();
}
function persist(){ls.set("ammar_draft",JSON.stringify(state));render()}

/* ===== رمز الإدارة =====
   البصمة (Hash) موجودة في ملف config.js، مش هنا. */
const ADMIN_HASH = window.ADMIN_HASH || "";
const SALT = "ammar-taareeb-v1";
async function sha(t){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(SALT+t));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function enableAdmin(){
  document.body.classList.add("admin");
  const d=ls.get("ammar_draft");
  if(d){try{const x=JSON.parse(d);state={settings:{...DEFAULT.settings,...x.settings},games:x.games||[]}}catch(e){}}
  render();
}
function showLock(){
  const m=document.createElement("div");m.className="modal on";m.id="mLock";
  m.innerHTML=`<div class="box" style="max-width:380px;margin-top:90px">
    <h2>لوحة الإدارة</h2>
    <label>الرمز السري</label>
    <input id="lCode" type="password" dir="ltr" autocomplete="off">
    <div id="lMsg" style="color:var(--red);font-size:13px;margin-top:8px;min-height:18px"></div>
    <button class="btn" style="width:100%;margin-top:10px" id="lBtn">دخول</button>
    <a href="index.html" style="display:block;text-align:center;margin-top:14px;color:var(--mut);font-size:13px">رجوع للموقع</a>
  </div>`;
  document.body.appendChild(m);
  const go=async()=>{
    const msg=$("lMsg");
    if(!ADMIN_HASH){msg.textContent="لسه ما اتحطش رمز. حط البصمة في config.js.";return}
    if(!(window.crypto&&crypto.subtle)){msg.textContent="المتصفح لا يدعم التحقق. افتح الموقع عبر HTTPS.";return}
    const h=await sha($("lCode").value);
    if(h===ADMIN_HASH){
      try{sessionStorage.setItem("ammar_ok","1")}catch(e){}
      m.remove();enableAdmin();
    }else{msg.textContent="الرمز غلط";$("lCode").value=""}
  };
  $("lBtn").onclick=go;
  $("lCode").onkeydown=e=>{if(e.key==="Enter")go()};
  $("lCode").focus();
}
function logout(){try{sessionStorage.removeItem("ammar_ok")}catch(e){}location.href="index.html"}
function discardDraft(){
  if(!confirm("هتتمسح التعديلات اللي لسه ما اتنشرتش وترجع للنسخة المنشورة. متأكد؟"))return;
  ls.del("ammar_draft");location.reload();
}

/* ===== التوجيه (كل لعبة ليها صفحة: #/game/ID) ===== */
function currentId(){const m=location.hash.match(/^#\/game\/([^/?]+)/);return m?decodeURIComponent(m[1]):null}
function gameHref(id){return "#/game/"+encodeURIComponent(id)}
function publicLink(id){
  return location.origin+location.pathname.replace(/admin(\.html)?$/,"")+gameHref(id);
}
window.addEventListener("hashchange",()=>{
  const wasHome=lastRoute===null;
  if(wasHome)homeScroll=window.scrollY;
  render(true);
  if(currentId())window.scrollTo(0,0);
  else window.scrollTo(0,homeScroll);
});

/* ===== العرض ===== */
function render(animate){
  renderChrome();
  const id=currentId();
  const home=$("home"),gv=$("game");
  if(id){
    home.hidden=true;gv.hidden=false;renderGame(id);
    if(animate)replay(gv);
  }else{
    gv.hidden=true;gv.innerHTML="";curShots=[];home.hidden=false;renderHome();
    if(animate)replay(home);
  }
  lastRoute=id;
  observeReveals();
}
function replay(el){el.classList.remove("enter");void el.offsetWidth;el.classList.add("enter")}

function renderChrome(){
  const s=state.settings;
  const id=currentId();const g=id&&state.games.find(x=>x.id===id);
  const site=(s.name+" "+s.sub).trim();
  document.title=window.ADMIN?"لوحة الإدارة":(g?g.title+" — "+site:site);
  const lb=$("logoBox");
  const key=(s.logo||"")+"|"+s.name+"|"+s.sub;
  if(lb.dataset.k!==key){
    lb.dataset.k=key;
    lb.innerHTML=safeUrl(s.logo)?`<img class="logo-img" src="${esc(s.logo)}" alt="">`:`${crownSVG}<div class="logo">${esc(s.name)}</div><div class="sub">${esc(s.sub)}</div>`;
  }
  $("tagline").textContent=s.tagline||"";
  const t=$("tgLink");if(safeUrl(s.telegram)){t.href=s.telegram;t.style.display="inline-block"}else t.style.display="none";
  $("foot").textContent=s.footer||"";
  const dn=$("draftNote");if(dn)dn.style.display=ls.get("ammar_draft")?"block":"none";
}

function cardHTML(g,i){
  const cover=safeUrl(g.cover);
  const d=(g.desc||"").replace(/\s+/g," ").trim().slice(0,110);
  return `<article class="card reveal" style="--i:${i%8}">
    <a class="stretch" href="${gameHref(g.id)}" aria-label="${esc(g.title)}"></a>
    ${g.status?`<span class="badge">${esc(g.status)}</span>`:""}
    <div class="cover">${cover?`<img src="${esc(cover)}" alt="" loading="lazy" decoding="async">`:`<div class="ph">🎮</div>`}<i class="shine"></i></div>
    <div class="b"><h3>${esc(g.title)}</h3><p>${esc(d)}</p></div>
    <div class="acts">
      <button class="btn s" data-edit="${esc(g.id)}">تعديل</button>
      <button class="btn d s" data-del="${esc(g.id)}">حذف</button>
    </div>
  </article>`;
}

function renderHome(){
  const grid=$("grid"),cnt=$("count");
  if(!loaded){grid.innerHTML=Array(6).fill('<div class="sk card-sk"></div>').join("");cnt.textContent="";return}
  const q=$("q").value.trim().toLowerCase();
  const list=state.games.filter(g=>!q||(g.title+" "+(g.desc||"")).toLowerCase().includes(q)).sort((a,b)=>(b.created||0)-(a.created||0));
  grid.innerHTML=list.length?list.map(cardHTML).join(""):`<div class="empty">${q?"مفيش نتائج للبحث":"لا توجد ألعاب بعد"}</div>`;
  cnt.textContent=state.games.length?(q?`${list.length} نتيجة`:`${state.games.length} ${state.games.length>10?"لعبة":"لعبة"}`):"";
}

function fmtDesc(t){
  return esc(t).replace(/(https?:\/\/[^\s<]*[^\s<.,،)!؟])/g,u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}
function hostOf(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}}

function renderGame(id){
  const el=$("game");
  if(!loaded){el.innerHTML='<div class="wrap"><div class="sk" style="height:320px;margin-top:40px"></div></div>';return}
  const g=state.games.find(x=>x.id===id);
  if(!g){
    el.innerHTML=`<div class="wrap nf"><div style="font-size:60px">🎮</div><h2>اللعبة دي مش موجودة</h2><a class="btn" href="#/">رجوع للرئيسية</a></div>`;
    curShots=[];return;
  }
  const cover=safeUrl(g.cover);
  const shots=(g.shots||[]).filter(safeUrl);curShots=shots;
  const links=(g.links||[]).filter(l=>safeUrl(l.url));
  const date=g.created?new Date(g.created).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"";
  const others=state.games.filter(x=>x.id!==g.id).sort((a,b)=>(b.created||0)-(a.created||0)).slice(0,4);
  el.innerHTML=`
  <section class="gv-hero">
    ${cover?`<div class="gv-bg" style="background-image:url('${esc(cover)}')"></div>`:""}
    <div class="gv-shade"></div>
    <div class="wrap gv-top">
      <a class="back" href="#/">${I.back}<span>كل الألعاب</span></a>
      <div class="side">
        <button class="iconbtn adm-only" data-edit="${esc(g.id)}">تعديل</button>
        <button class="iconbtn adm-only" style="color:var(--red);border-color:var(--red)" data-del="${esc(g.id)}">حذف</button>
        <button class="iconbtn" data-share="${esc(g.id)}">${I.share}<span>مشاركة</span></button>
      </div>
    </div>
    <div class="wrap gv-main">
      <div class="gv-cover">${cover?`<img src="${esc(cover)}" alt="${esc(g.title)}">`:`<div class="ph">🎮</div>`}</div>
      <div class="gv-info">
        ${g.status?`<span class="chip">${esc(g.status)}</span>`:""}
        <h1>${esc(g.title)}</h1>
        ${date?`<div class="gv-meta">أُضيفت في ${esc(date)}</div>`:""}
        ${links.length?`<button class="cta" data-scroll="dl">${I.dl}<span>تحميل التعريب</span></button>`:""}
      </div>
    </div>
  </section>
  <div class="wrap gv-body">
    ${g.desc?`<section class="panel reveal"><h2>عن التعريب</h2><div class="desc">${fmtDesc(g.desc)}</div></section>`:""}
    ${shots.length?`<section class="panel reveal"><h2>لقطات من اللعبة</h2><div class="shots">${shots.map((u,i)=>`<button class="shot" data-shot="${i}" aria-label="لقطة ${i+1}"><img src="${esc(u)}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div></section>`:""}
    ${links.length?`<section class="panel reveal" id="dl"><h2>روابط التحميل</h2><div class="dl">${links.map(l=>`
      <a class="dlbtn" href="${esc(l.url)}" target="_blank" rel="noopener">
        <span class="ic">${I.dl}</span>
        <span class="t"><b>${esc(l.label||"تحميل")}</b><small>${esc(hostOf(l.url))}</small></span>
        <span class="go">${I.go}</span>
      </a>`).join("")}</div></section>`:""}
    ${others.length?`<section class="more"><div class="panel reveal" style="margin-bottom:18px"><h2 style="margin:0">ألعاب أخرى</h2></div><div class="grid" style="padding-bottom:20px">${others.map(cardHTML).join("")}</div></section>`:""}
  </div>`;
}

/* ===== حركة الظهور عند التمرير + ميل الكروت ===== */
let io=null;
function observeReveals(){
  const els=document.querySelectorAll(".reveal:not(.in)");
  if(!("IntersectionObserver" in window)){els.forEach(e=>e.classList.add("in"));return}
  if(!io)io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08,rootMargin:"0px 0px -30px 0px"});
  els.forEach(e=>io.observe(e));
}
const fine=window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches;
if(fine){
  document.addEventListener("pointermove",e=>{
    const c=e.target.closest&&e.target.closest(".card");
    if(!c)return;
    const r=c.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.classList.add("tilting");
    c.style.setProperty("--ry",(x*-7)+"deg");
    c.style.setProperty("--rx",(y*6)+"deg");
  });
  document.addEventListener("pointerout",e=>{
    const c=e.target.closest&&e.target.closest(".card");
    if(!c||c.contains(e.relatedTarget))return;
    c.classList.remove("tilting");c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg");
  });
}

/* ===== معرض الصور ===== */
function ensureLB(){
  if($("lb"))return;
  const d=document.createElement("div");d.id="lb";d.className="lb";
  d.innerHTML='<button class="lx" aria-label="إغلاق">×</button><button class="lp" aria-label="السابق">›</button><img alt=""><button class="ln" aria-label="التالي">‹</button><div class="lc"></div>';
  document.body.appendChild(d);
  d.addEventListener("click",e=>{
    if(e.target.closest(".lx")||e.target===d)closeLB();
    else if(e.target.closest(".lp"))stepLB(-1);
    else if(e.target.closest(".ln"))stepLB(1);
  });
  let sx=0;
  d.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});
  d.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)stepLB(dx<0?1:-1)});
}
function showLB(){
  const d=$("lb"),im=d.querySelector("img");
  im.style.animation="none";void im.offsetWidth;im.style.animation="";
  im.src=curShots[lbIndex];
  d.querySelector(".lc").textContent=(lbIndex+1)+" / "+curShots.length;
  const multi=curShots.length>1;
  d.querySelector(".lp").style.display=d.querySelector(".ln").style.display=multi?"":"none";
}
function openLB(i){if(!curShots.length)return;ensureLB();lbIndex=i;showLB();$("lb").classList.add("on");document.body.style.overflow="hidden"}
function closeLB(){const d=$("lb");if(d)d.classList.remove("on");document.body.style.overflow=""}
function stepLB(n){lbIndex=(lbIndex+n+curShots.length)%curShots.length;showLB()}
document.addEventListener("keydown",e=>{
  const d=$("lb");
  if(e.key==="Escape"){if(d&&d.classList.contains("on"))closeLB();else document.querySelectorAll(".modal.on:not(#mLock)").forEach(m=>m.classList.remove("on"))}
  if(d&&d.classList.contains("on")){
    if(e.key==="ArrowLeft")stepLB(1);
    if(e.key==="ArrowRight")stepLB(-1);
  }
});

/* ===== النقرات (تفويض) ===== */
document.addEventListener("click",async e=>{
  const t=e.target.closest("[data-edit],[data-del],[data-shot],[data-share],[data-scroll]");
  if(!t)return;
  if(t.dataset.edit)editGame(t.dataset.edit);
  else if(t.dataset.del)delGame(t.dataset.del);
  else if(t.dataset.shot!==undefined)openLB(+t.dataset.shot);
  else if(t.dataset.scroll){const x=$(t.dataset.scroll);if(x)x.scrollIntoView({behavior:"smooth",block:"center"})}
  else if(t.dataset.share){
    const url=publicLink(t.dataset.share);
    const g=state.games.find(x=>x.id===t.dataset.share);
    try{
      if(navigator.share){await navigator.share({title:g?g.title:"",url})}
      else{await navigator.clipboard.writeText(url);toast("تم نسخ الرابط")}
    }catch(err){
      try{await navigator.clipboard.writeText(url);toast("تم نسخ الرابط")}catch(e2){prompt("انسخ الرابط:",url)}
    }
  }
});

/* ===== الإدارة: إضافة وتعديل ===== */
function readImage(file,max,q){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q))};im.src=r.result};r.readAsDataURL(file)})}
function thumbs(){
  $("tCover").innerHTML=tmp.cover?`<div><img src="${esc(tmp.cover)}"><b onclick="tmp.cover='';thumbs()">×</b></div>`:"";
  $("tShots").innerHTML=tmp.shots.map((u,i)=>`<div><img src="${esc(u)}"><b onclick="tmp.shots.splice(${i},1);thumbs()">×</b></div>`).join("");
}
function editGame(id){
  const g=state.games.find(x=>x.id===id)||{};
  editing=g.id||null;tmp={cover:g.cover||"",shots:[...(g.shots||[])]};
  $("editBox").innerHTML=`<button class="x" onclick="closeM('mEdit')">×</button>
    <h2>${id?"تعديل لعبة":"إضافة لعبة"}</h2>
    <label>اسم اللعبة</label><input id="fTitle" value="${esc(g.title)}">
    <label>الحالة / الإصدار <small>(مثال: مكتملة، v1.2، قيد العمل)</small></label><input id="fStatus" value="${esc(g.status)}">
    <label>صورة الغلاف</label>
    <input type="file" accept="image/*" onchange="upCover(this)">
    <input placeholder="أو حط رابط صورة" dir="ltr" style="margin-top:6px" value="${esc(g.cover&&g.cover.startsWith('http')?g.cover:'')}" onchange="tmp.cover=this.value;thumbs()">
    <div class="thumbs" id="tCover"></div>
    <label>لقطات شاشة</label><input type="file" accept="image/*" multiple onchange="upShots(this)">
    <div class="thumbs" id="tShots"></div>
    <label>الوصف / الكلام</label><textarea id="fDesc" style="min-height:140px">${esc(g.desc)}</textarea>
    <label>روابط التحميل والملفات <small>(سطر لكل رابط بالشكل: الاسم | الرابط)</small></label>
    <textarea id="fLinks" dir="ltr" placeholder="تحميل الباتش | https://...&#10;ملف الترجمة | https://...">${esc((g.links||[]).map(l=>l.label+" | "+l.url).join("\n"))}</textarea>
    <button class="btn" style="width:100%;margin-top:18px" onclick="submitGame()">حفظ</button>`;
  thumbs();openM("mEdit");
}
async function upCover(i){if(i.files[0]){tmp.cover=await readImage(i.files[0],700,.7);thumbs()}}
async function upShots(i){for(const f of i.files)tmp.shots.push(await readImage(f,800,.6));thumbs()}
function submitGame(){
  const title=$("fTitle").value.trim();if(!title)return toast("اكتب اسم اللعبة");
  const links=$("fLinks").value.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split("|");return p.length>1?{label:p[0].trim(),url:p.slice(1).join("|").trim()}:{label:"تحميل",url:l}});
  const old=state.games.find(x=>x.id===editing);
  const g={id:editing||("g"+Date.now()),title,status:$("fStatus").value.trim(),cover:tmp.cover,shots:tmp.shots,desc:$("fDesc").value,links,created:old?old.created:Date.now()};
  if(old)Object.assign(old,g);else state.games.push(g);
  persist();closeM("mEdit");toast("اتحفظ — لا تنسى التصدير والرفع");
}
function delGame(id){
  if(!confirm("متأكد إنك عايز تحذف اللعبة؟"))return;
  state.games=state.games.filter(g=>g.id!==id);
  if(currentId()===id)location.hash="#/";
  persist();
}
function editSettings(){
  const s=state.settings;
  $("editBox").innerHTML=`<button class="x" onclick="closeM('mEdit')">×</button><h2>إعدادات الموقع</h2>
    <label>الاسم الكبير</label><input id="sName" value="${esc(s.name)}">
    <label>الاسم الفرعي</label><input id="sSub" value="${esc(s.sub)}">
    <label>الشعار تحت الاسم</label><input id="sTag" value="${esc(s.tagline)}">
    <label>رابط اللوجو <small>(اختياري — بيظهر بدل الكتابة)</small></label><input id="sLogo" dir="ltr" value="${esc(s.logo)}">
    <label>رابط تيليجرام</label><input id="sTg" dir="ltr" placeholder="https://t.me/..." value="${esc(s.telegram)}">
    <label>نص الفوتر</label><input id="sFoot" value="${esc(s.footer)}">
    <button class="btn" style="width:100%;margin-top:18px" onclick="submitSettings()">حفظ</button>`;
  openM("mEdit");
}
function submitSettings(){
  state.settings={name:$("sName").value,sub:$("sSub").value,tagline:$("sTag").value,logo:$("sLogo").value.trim(),telegram:$("sTg").value.trim(),footer:$("sFoot").value};
  persist();closeM("mEdit");toast("اتحفظ");
}
function exportData(){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:"application/json"}));
  a.download="data.json";a.click();
  toast("ارفع الملف ده على GitHub بنفس الاسم data.json");
}
function importData(i){
  const f=i.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);state={settings:{...DEFAULT.settings,...d.settings},games:d.games||[]};persist();toast("تم الاستيراد")}catch(e){toast("ملف غلط")}};
  r.readAsText(f);
}
load();
