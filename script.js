const DEFAULT = {settings:{name:"عمار",sub:"للتعريب",tagline:"نحو محتوى أوسع .. بلغتك",telegram:"",logo:"",footer:"جميع الحقوق محفوظة © عمار للتعريب"}, games:[]};
let state = JSON.parse(JSON.stringify(DEFAULT));
let editing=null, tmp={cover:"",shots:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^(https?:|data:image\/|tg:)/i.test(u||"")?u:"";
function toast(t){const e=$("toast");e.textContent=t;e.style.display="block";setTimeout(()=>e.style.display="none",2400)}
function closeM(id){$(id).classList.remove("on")}
function openM(id){$(id).classList.add("on")}
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){toast("المتصفح رفض الحفظ (الصور كبيرة؟)")}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};

async function load(){
  let pub=null;
  try{const r=await fetch("data.json?"+Date.now());if(r.ok)pub=await r.json()}catch(e){}
  if(pub)state={settings:{...DEFAULT.settings,...pub.settings},games:pub.games||[]};
  if(window.ADMIN){
    let ok=false;try{ok=sessionStorage.getItem("ammar_ok")==="1"}catch(e){}
    if(ok)enableAdmin();else showLock();
  }
  render();
}

/* ===== رمز الإدارة =====
   الرمز نفسه مش مكتوب هنا، المكتوب بس بصمته (Hash).
   ولّد البصمة من صفحة make-code.html وحطها هنا بين العلامتين.
   لو فاضية، محدش يقدر يدخل. */
const ADMIN_HASH = "73e959a69bc73c588f770300c1a4daeb2b23a052b3251e35d724cbd735d9941c";
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
    if(!ADMIN_HASH){msg.textContent="لسه ما اتحطش رمز. شوف التعليمات.";return}
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
function persist(){ls.set("ammar_draft",JSON.stringify(state));render()}

const crownSVG='<svg class="crown" viewBox="0 0 64 40" fill="currentColor"><path d="M4 34 8 10l14 12L32 4l10 18 14-12 4 24z"/><rect x="4" y="35" width="56" height="4" rx="2"/></svg>';
function render(){
  const s=state.settings;
  document.title=(s.name+" "+s.sub).trim();
  $("logoBox").innerHTML=safeUrl(s.logo)?`<img class="logo-img" src="${esc(s.logo)}" alt="">`:`${crownSVG}<div class="logo">${esc(s.name)}</div><div class="sub">${esc(s.sub)}</div>`;
  $("tagline").textContent=s.tagline||"";
  const t=$("tgLink");if(safeUrl(s.telegram)){t.href=s.telegram;t.style.display="inline-block"}else t.style.display="none";
  $("foot").textContent=s.footer||"";
  if($("draftNote"))$("draftNote").style.display=ls.get("ammar_draft")?"block":"none";
  const q=$("q").value.trim().toLowerCase();
  const list=state.games.filter(g=>!q||(g.title+" "+(g.desc||"")).toLowerCase().includes(q)).sort((a,b)=>(b.created||0)-(a.created||0));
  $("grid").innerHTML=list.length?list.map(g=>`
    <div class="card" onclick="viewGame('${g.id}')">
      ${g.status?`<span class="badge">${esc(g.status)}</span>`:""}
      <div class="cover" style="${safeUrl(g.cover)?`background-image:url('${esc(g.cover)}')`:""}">${safeUrl(g.cover)?"":"🎮"}</div>
      <div class="b"><h3>${esc(g.title)}</h3><p>${esc((g.desc||"").slice(0,60))}</p></div>
      <div class="acts" onclick="event.stopPropagation()">
        <button class="btn s" onclick="editGame('${g.id}')">تعديل</button>
        <button class="btn d s" onclick="delGame('${g.id}')">حذف</button>
      </div></div>`).join(""):`<div class="empty">لا توجد ألعاب بعد</div>`;
}
function viewGame(id){
  const g=state.games.find(x=>x.id===id);if(!g)return;
  $("viewBox").innerHTML=`<button class="x" onclick="closeM('mView')">×</button>
    <h2>${esc(g.title)}</h2>${g.status?`<small>${esc(g.status)}</small>`:""}
    ${(g.shots&&g.shots.length)?`<div class="shots">${g.shots.filter(safeUrl).map(u=>`<img src="${esc(u)}" onclick="window.open(this.src)">`).join("")}</div>`:""}
    <div class="desc">${esc(g.desc)}</div>
    <div class="dl">${(g.links||[]).filter(l=>safeUrl(l.url)).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label||"تحميل")}</a>`).join("")}</div>`;
  openM("mView");
}

/* الإدارة: التعديل بيتم على جهازك بس، والنشر الفعلي بيكون برفع data.json على GitHub */
function logout(){try{sessionStorage.removeItem("ammar_ok")}catch(e){}location.href="index.html"}
function discardDraft(){
  if(!confirm("هتتمسح التعديلات اللي لسه ما اتنشرتش وترجع للنسخة المنشورة. متأكد؟"))return;
  ls.del("ammar_draft");location.reload();
}

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
  state.games=state.games.filter(g=>g.id!==id);persist();
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
