const DEFAULT = {
  settings: {
    name: "عمار",
    sub: "للتعريب",
    tagline: "نحو محتوى أوسع .. بلغتك",
    telegram: "",
    logo: "",
    footer: "جميع الحقوق محفوظة © عمار للتعريب"
  },
  games: []
};

let state = JSON.parse(JSON.stringify(DEFAULT));
let loaded = false;
let editing = null;
let tmp = { cover: "", shots: [] };
let curShots = [];
let lbIndex = 0;
let homeScroll = 0;
let lastRoute = null;
let currentFilter = "all";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const safeUrl = u => /^(https?:|data:image\/|tg:)/i.test(u || "") ? u : "";

function toast(t) {
  const e = $("toast");
  if (!e) return;
  e.textContent = t;
  e.style.display = "block";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { e.style.display = "none"; }, 2800);
}

function closeM(id) {
  const el = $(id);
  if (el) el.classList.remove("on");
}

function openM(id) {
  const el = $(id);
  if (el) el.classList.add("on");
}

function openGuideModal() {
  openM("mGuide");
}

function scrollToSection(id) {
  const el = $(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function clearSearchInput() {
  const q = $("q");
  if (q) {
    q.value = "";
    const clr = $("clearSearch");
    if (clr) clr.style.display = "none";
    renderHome();
  }
}

const ls = {
  get: k => {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch (e) { toast("المتصفح رفض الحفظ (الصور كبيرة؟)"); }
  },
  del: k => {
    try { localStorage.removeItem(k); } catch (e) { }
  }
};

/* ===== الأيقونات ===== */
const I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  platform: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
};

/* ===== تحميل البيانات واسترجاعها بدون أي فقدان ===== */
async function load() {
  let pub = null;
  try {
    const r = await fetch("data.json?" + Date.now());
    if (r.ok) pub = await r.json();
  } catch (e) {
    console.warn("Could not load data.json:", e);
  }

  if (pub) {
    state = {
      settings: { ...DEFAULT.settings, ...(pub.settings || {}) },
      games: Array.isArray(pub.games) ? pub.games : []
    };
  }

  // إذا كنا في وضع الإدارة ولديه مسودة محفوظة محلياً
  if (window.ADMIN) {
    let ok = false;
    try { ok = sessionStorage.getItem("ammar_ok") === "1"; } catch (e) { }
    if (ok) enableAdmin();
    else showLock();
  }

  loaded = true;
  initFilterTabs();
  render();
}

function persist() {
  ls.set("ammar_draft", JSON.stringify(state));
  render();
}

/* ===== فلاتر التصنيف ===== */
function initFilterTabs() {
  const tabs = $("filterTabs");
  if (!tabs) return;
  tabs.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
      setFilter(btn.dataset.filter || "all");
    };
  });
}

function setFilter(filter) {
  currentFilter = filter;
  const tabs = $("filterTabs");
  if (tabs) {
    tabs.querySelectorAll(".filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
  }
  renderHome();
}

/* ===== التحقق من رمز الإدارة ===== */
const ADMIN_HASH = window.ADMIN_HASH || "";
const SALT = "ammar-taareeb-v1";

async function sha(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function enableAdmin() {
  document.body.classList.add("admin");
  const d = ls.get("ammar_draft");
  if (d) {
    try {
      const x = JSON.parse(d);
      state = {
        settings: { ...DEFAULT.settings, ...(x.settings || {}) },
        games: Array.isArray(x.games) ? x.games : []
      };
    } catch (e) { }
  }
  render();
}

function showLock() {
  const m = document.createElement("div");
  m.className = "modal on";
  m.id = "mLock";
  m.innerHTML = `<div class="box" style="max-width:380px;margin-top:90px">
    <h2>لوحة الإدارة</h2>
    <label>الرمز السري</label>
    <input id="lCode" type="password" dir="ltr" autocomplete="off">
    <div id="lMsg" style="color:var(--red);font-size:13px;margin-top:8px;min-height:18px"></div>
    <button class="btn" style="width:100%;margin-top:10px" id="lBtn">دخول</button>
    <a href="index.html" style="display:block;text-align:center;margin-top:14px;color:var(--mut);font-size:13px">رجوع للموقع</a>
  </div>`;
  document.body.appendChild(m);

  const go = async () => {
    const msg = $("lMsg");
    if (!ADMIN_HASH) { msg.textContent = "لسه ما اتحطش رمز. حط البصمة في config.js."; return; }
    if (!(window.crypto && crypto.subtle)) { msg.textContent = "المتصفح لا يدعم التحقق. افتح الموقع عبر HTTPS."; return; }
    const h = await sha($("lCode").value);
    if (h === ADMIN_HASH) {
      try { sessionStorage.setItem("ammar_ok", "1"); } catch (e) { }
      m.remove();
      enableAdmin();
    } else {
      msg.textContent = "الرمز غير صحيح";
      $("lCode").value = "";
    }
  };

  $("lBtn").onclick = go;
  $("lCode").onkeydown = e => { if (e.key === "Enter") go(); };
  $("lCode").focus();
}

function logout() {
  try { sessionStorage.removeItem("ammar_ok"); } catch (e) { }
  location.href = "index.html";
}

function discardDraft() {
  if (!confirm("هتتمسح التعديلات اللي لسه ما اتنشرتش وترجع للنسخة المنشورة. متأكد؟")) return;
  ls.del("ammar_draft");
  location.reload();
}

/* ===== التوجيه (#/game/ID) ===== */
function currentId() {
  const m = location.hash.match(/^#\/game\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function gameHref(id) {
  return "#/game/" + encodeURIComponent(id);
}

function publicLink(id) {
  return location.origin + location.pathname.replace(/admin(\.html)?$/, "") + gameHref(id);
}

window.addEventListener("hashchange", () => {
  const wasHome = lastRoute === null;
  if (wasHome) homeScroll = window.scrollY;
  render(true);
  if (currentId()) window.scrollTo(0, 0);
  else window.scrollTo(0, homeScroll);
});

/* ===== العرض الرئيسي للموقع ===== */
function render(animate) {
  renderChrome();
  const id = currentId();
  const home = $("home");
  const gv = $("game");

  if (id) {
    if (home) home.hidden = true;
    if (gv) {
      gv.hidden = false;
      renderGame(id);
      if (animate) replay(gv);
    }
  } else {
    if (gv) {
      gv.hidden = true;
      gv.innerHTML = "";
    }
    curShots = [];
    if (home) {
      home.hidden = false;
      renderHome();
      if (animate) replay(home);
    }
  }
  lastRoute = id;
}

function replay(el) {
  el.classList.remove("enter");
  void el.offsetWidth;
  el.classList.add("enter");
}

/* تحديث العناصر الثابتة وشريط التنقل والتذييل */
function renderChrome() {
  const s = state.settings;
  const id = currentId();
  const g = id && state.games.find(x => x.id === id);
  const site = (s.name + " " + s.sub).trim();

  document.title = window.ADMIN ? "لوحة الإدارة — " + site : (g ? g.title + " — " + site : site);

  // تحديث الشعار في شريط التنقل
  const navTitle = $("navTitle");
  if (navTitle) navTitle.textContent = site;
  const navSub = $("navSub");
  if (navSub) navSub.textContent = s.tagline || "نحو محتوى أوسع .. بلغتك";

  // تحديث روابط تيليجرام
  const tg = safeUrl(s.telegram);
  const navTg = $("navTgLink");
  if (navTg) {
    if (tg) {
      navTg.href = tg;
      navTg.style.display = "inline-flex";
    } else {
      navTg.style.display = "none";
    }
  }

  const sideTg = $("sideTgBtn");
  if (sideTg) {
    if (tg) {
      sideTg.href = tg;
      sideTg.style.display = "inline-flex";
    } else {
      sideTg.style.display = "none";
    }
  }

  const footTg = $("footTgLink");
  if (footTg) {
    if (tg) {
      footTg.href = tg;
      footTg.style.display = "inline-block";
    } else {
      footTg.style.display = "none";
    }
  }

  // التذييل
  const foot = $("foot");
  if (foot) foot.textContent = s.footer || `جميع الحقوق محفوظة © ${site}`;
  const footTitle = $("footTitle");
  if (footTitle) footTitle.textContent = site;
  const footTagline = $("footTagline");
  if (footTagline) footTagline.textContent = s.tagline || "";

  // إشعار المسودة في لوحة الإدارة
  const dn = $("draftNote");
  if (dn) dn.style.display = ls.get("ammar_draft") ? "block" : "none";
}

/* بطاقة اللعبة في الشبكة (Modern Game Card) */
function cardHTML(g, i) {
  const cover = safeUrl(g.cover);
  const d = (g.desc || "").replace(/\s+/g, " ").trim().slice(0, 100);
  const isCompleted = (g.status || "").includes("مكتمل");

  return `<article class="card" style="--i:${i % 8}">
    <a class="stretch" href="${gameHref(g.id)}" aria-label="${esc(g.title)}"></a>
    ${g.status ? `<span class="card-badge ${isCompleted ? 'completed' : 'wip'}">${esc(g.status)}</span>` : ""}
    <div class="cover">
      ${cover ? `<img src="${esc(cover)}" alt="${esc(g.title)}" loading="lazy" decoding="async">` : `<div class="ph">🎮</div>`}
      <span class="card-platform-chip">${I.platform} <span>PC</span></span>
      <i class="shine"></i>
    </div>
    <div class="card-body">
      <h3>${esc(g.title)}</h3>
      <p>${esc(d || "تعريب احترافي متكامل متوفر للتحميل المباشر.")}</p>
      <div class="card-footer">
        <span class="card-action-link">عرض التفاصيل والتحميل ←</span>
      </div>
    </div>
    <div class="acts">
      <button class="btn s" data-edit="${esc(g.id)}">تعديل</button>
      <button class="btn d s" data-del="${esc(g.id)}">حذف</button>
    </div>
  </article>`;
}

/* عرض الصفحة الرئيسية */
function renderHome() {
  const grid = $("grid");
  const cnt = $("count");
  const qInput = $("q");
  const clr = $("clearSearch");

  if (!loaded) {
    if (grid) grid.innerHTML = Array(6).fill('<div class="sk card-sk"></div>').join("");
    if (cnt) cnt.textContent = "";
    return;
  }

  const q = (qInput ? qInput.value : "").trim().toLowerCase();
  if (clr) clr.style.display = q ? "block" : "none";

  let list = state.games.slice().sort((a, b) => (b.created || 0) - (a.created || 0));

  // فلترة حسب التصنيف
  if (currentFilter === "completed") {
    list = list.filter(g => (g.status || "").includes("مكتمل"));
  } else if (currentFilter === "wip") {
    list = list.filter(g => (g.status || "").includes("عمل") || (g.status || "").includes("قيد"));
  }

  // فلترة حسب البحث
  if (q) {
    list = list.filter(g => (g.title + " " + (g.desc || "") + " " + (g.status || "")).toLowerCase().includes(q));
  }

  // تحديث البانر البارز (Hero Spotlight Banner)
  renderHeroSpotlight(list[0] || state.games[0]);

  // تحديث ويدجت أشهر الألعاب في الشريط الجانبي
  renderTopGames();

  // تحديث الشبكة
  if (grid) {
    grid.innerHTML = list.length
      ? list.map(cardHTML).join("")
      : `<div class="empty">
          <div style="font-size:44px;margin-bottom:12px;">🔍</div>
          <h3>${q ? "لم يتم العثور على أي تعريب يطابق بحثك" : "لا توجد ألعاب مضافة بعد"}</h3>
          <p style="color:var(--mut);margin-top:6px;">جرب البحث بكلمات مختلفة أو تصفح كل الأقسام.</p>
        </div>`;
  }

  // تحديث العداد
  if (cnt) {
    cnt.textContent = state.games.length
      ? (q ? `${list.length} نتيجة بحث` : `${state.games.length} ${state.games.length > 10 ? "لعبة" : "ألعاب"}`)
      : "لا توجد ألعاب";
  }

  // تحديث عداد الألعاب الكاملة
  const catCount = $("catFullCount");
  if (catCount) {
    catCount.textContent = `${state.games.length} ألعاب مضافة`;
  }
}

/* تحديث قسم البانر البارز (Hero Spotlight) */
function renderHeroSpotlight(featured) {
  const bg = $("heroBg");
  const title = $("heroTitle");
  const desc = $("heroDesc");
  const cta = $("heroCta");
  const badgeText = $("heroBadgeText");

  if (!featured) {
    if (bg) bg.style.backgroundImage = "none";
    if (title) title.textContent = (state.settings.name + " " + state.settings.sub).trim() || "عمار للتعريب";
    if (desc) desc.textContent = state.settings.tagline || "نحو محتوى أوسع وأشمل.. نقدم لكم أفضل الترجمات للألعاب لتستمتعوا بتجربة كاملة باللغة العربية.";
    if (cta) {
      cta.href = "#/";
      cta.onclick = () => scrollToSection("gamesSection");
    }
    if (badgeText) badgeText.textContent = "بوابة التعريب العربي";
    return;
  }

  const cover = safeUrl(featured.cover);
  if (bg && cover) {
    bg.style.backgroundImage = `url('${cover}')`;
  }

  if (title) title.textContent = featured.title || "تعريب جديد";
  if (desc) {
    const d = (featured.desc || "").replace(/\s+/g, " ").trim().slice(0, 180);
    desc.textContent = d || "تعريب عربي احترافي كامل للقوائم والنصوص مع دعم كامل للخطوط الأصلية.";
  }
  if (badgeText) {
    badgeText.textContent = featured.status ? `تعريب ${featured.status}` : "تعريب مميز";
  }
  if (cta) {
    cta.href = gameHref(featured.id);
    cta.onclick = null;
  }
}

/* تحديث ويدجت أبرز الألعاب */
function renderTopGames() {
  const listEl = $("topGamesList");
  if (!listEl) return;

  const top = state.games.slice(0, 5);
  if (!top.length) {
    listEl.innerHTML = `<div style="color:var(--mut);font-size:13px;text-align:center;padding:16px 0;">سيتم عرض أبرز الألعاب هنا</div>`;
    return;
  }

  listEl.innerHTML = top.map((g, idx) => {
    const cover = safeUrl(g.cover);
    return `<a href="${gameHref(g.id)}" class="top-game-item">
      <span class="top-rank">${idx + 1}</span>
      <div class="top-thumb">
        ${cover ? `<img src="${esc(cover)}" alt="">` : `<div style="font-size:18px;text-align:center;line-height:48px;">🎮</div>`}
      </div>
      <div class="top-info">
        <div class="top-title">${esc(g.title)}</div>
        <div class="top-sub">${esc(g.status || "تعريب كامل")} • PC</div>
      </div>
    </a>`;
  }).join("");
}

/* تنسيق الروابط داخل الوصف */
function fmtDesc(t) {
  return esc(t).replace(/(https?:\/\/[^\s<]*[^\s<.,،)!؟])/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
}

/* عرض صفحة اللعبة المنفردة */
function renderGame(id) {
  const el = $("game");
  if (!loaded) {
    if (el) el.innerHTML = '<div class="wrap"><div class="sk" style="height:340px;margin-top:40px"></div></div>';
    return;
  }

  const g = state.games.find(x => x.id === id);
  if (!g) {
    if (el) {
      el.innerHTML = `
      <div class="wrap nf">
        <div style="font-size:64px">🎮</div>
        <h2>عذراً، هذه اللعبة غير موجودة</h2>
        <p style="color:var(--mut);">ربما تم حذفها أو أن الرابط غير صحيح.</p>
        <a class="btn" href="#/">الرجوع للرئيسية</a>
      </div>`;
    }
    curShots = [];
    return;
  }

  const cover = safeUrl(g.cover);
  const shots = (g.shots || []).filter(safeUrl);
  curShots = shots;
  const links = (g.links || []).filter(l => safeUrl(l.url));
  const date = g.created ? new Date(g.created).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "";
  const others = state.games.filter(x => x.id !== g.id).slice(0, 4);

  el.innerHTML = `
  <section class="gv-hero">
    ${cover ? `<div class="gv-bg" style="background-image:url('${esc(cover)}')"></div>` : ""}
    <div class="gv-shade"></div>
    <div class="wrap gv-top">
      <a class="back" href="#/">${I.back}<span>كل التعريبات</span></a>
      <div class="side" style="display:flex;gap:10px;align-items:center;">
        <button class="iconbtn adm-only" data-edit="${esc(g.id)}">تعديل</button>
        <button class="iconbtn adm-only" style="color:var(--red);border-color:var(--red)" data-del="${esc(g.id)}">حذف</button>
        <button class="iconbtn" data-share="${esc(g.id)}">${I.share}<span>مشاركة</span></button>
      </div>
    </div>
    <div class="wrap gv-main">
      <div class="gv-cover">
        ${cover ? `<img src="${esc(cover)}" alt="${esc(g.title)}">` : `<div class="ph">🎮</div>`}
      </div>
      <div class="gv-info">
        ${g.status ? `<span class="chip">${esc(g.status)}</span>` : ""}
        <h1>${esc(g.title)}</h1>
        ${date ? `<div class="gv-meta">أُضيف التعريب في ${esc(date)} • متوفر لمنصة الحاسوب (PC)</div>` : ""}
        ${links.length ? `<button class="cta" data-scroll="dl">${I.dl}<span>تحميل ملفات التعريب</span></button>` : ""}
      </div>
    </div>
  </section>

  <div class="wrap gv-body">
    ${g.desc ? `<section class="panel"><h2>تفاصيل التعريب</h2><div class="desc">${fmtDesc(g.desc)}</div></section>` : ""}

    ${shots.length ? `<section class="panel">
      <h2>صور ولقطات من داخل اللعبة</h2>
      <div class="shots">
        ${shots.map((u, i) => `<button class="shot" data-shot="${i}" aria-label="لقطة ${i + 1}"><img src="${esc(u)}" alt="" loading="lazy" decoding="async"></button>`).join("")}
      </div>
    </section>` : ""}

    ${links.length ? `<section class="panel" id="dl">
      <h2>روابط التحميل المباشرة</h2>
      <div class="dl">
        ${links.map(l => `
        <a class="dlbtn" href="${esc(l.url)}" target="_blank" rel="noopener">
          <span class="ic">${I.dl}</span>
          <span class="t">
            <b>${esc(l.label || "تحميل التعريب")}</b>
            <small>${esc(hostOf(l.url) || "رابط مباشر")}</small>
          </span>
          <span class="go">${I.go}</span>
        </a>`).join("")}
      </div>
    </section>` : ""}

    ${others.length ? `<section style="margin-top:20px;">
      <div class="panel" style="margin-bottom:18px;">
        <h2 style="margin:0">تعريبات أخرى قد تعجبك</h2>
      </div>
      <div class="grid" style="padding-bottom:10px;">
        ${others.map(cardHTML).join("")}
      </div>
    </section>` : ""}
  </div>`;
}

/* ===== تأثير ميل الكروت ثلاثي الأبعاد (3D Card Tilt) ===== */
const finePointer = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
if (finePointer) {
  document.addEventListener("pointermove", e => {
    const c = e.target.closest && e.target.closest(".card");
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    c.classList.add("tilting");
    c.style.setProperty("transform", `translateY(-6px) rotateY(${x * -8}deg) rotateX(${y * 7}deg)`);
  });

  document.addEventListener("pointerout", e => {
    const c = e.target.closest && e.target.closest(".card");
    if (!c || c.contains(e.relatedTarget)) return;
    c.classList.remove("tilting");
    c.style.removeProperty("transform");
  });
}

/* ===== معرض الصور المكبرة (Lightbox) ===== */
function ensureLB() {
  if ($("lb")) return;
  const d = document.createElement("div");
  d.id = "lb";
  d.className = "lb";
  d.innerHTML = '<button class="lx" aria-label="إغلاق">×</button><button class="lp" aria-label="السابق">›</button><img alt=""><button class="ln" aria-label="التالي">‹</button><div class="lc"></div>';
  document.body.appendChild(d);

  d.addEventListener("click", e => {
    if (e.target.closest(".lx") || e.target === d) closeLB();
    else if (e.target.closest(".lp")) stepLB(-1);
    else if (e.target.closest(".ln")) stepLB(1);
  });

  let sx = 0;
  d.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  d.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) stepLB(dx < 0 ? 1 : -1);
  });
}

function showLB() {
  const d = $("lb");
  const im = d.querySelector("img");
  im.style.animation = "none";
  void im.offsetWidth;
  im.style.animation = "";
  im.src = curShots[lbIndex];
  d.querySelector(".lc").textContent = (lbIndex + 1) + " / " + curShots.length;
  const multi = curShots.length > 1;
  d.querySelector(".lp").style.display = d.querySelector(".ln").style.display = multi ? "" : "none";
}

function openLB(i) {
  if (!curShots.length) return;
  ensureLB();
  lbIndex = i;
  showLB();
  $("lb").classList.add("on");
  document.body.style.overflow = "hidden";
}

function closeLB() {
  const d = $("lb");
  if (d) d.classList.remove("on");
  document.body.style.overflow = "";
}

function stepLB(n) {
  lbIndex = (lbIndex + n + curShots.length) % curShots.length;
  showLB();
}

document.addEventListener("keydown", e => {
  const d = $("lb");
  if (e.key === "Escape") {
    if (d && d.classList.contains("on")) closeLB();
    else document.querySelectorAll(".modal.on:not(#mLock)").forEach(m => m.classList.remove("on"));
  }
  if (d && d.classList.contains("on")) {
    if (e.key === "ArrowLeft") stepLB(1);
    if (e.key === "ArrowRight") stepLB(-1);
  }
});

/* ===== تفويض أحداث النقر (Delegated Clicks) ===== */
document.addEventListener("click", async e => {
  const t = e.target.closest("[data-edit],[data-del],[data-shot],[data-share],[data-scroll]");
  if (!t) return;

  if (t.dataset.edit) editGame(t.dataset.edit);
  else if (t.dataset.del) delGame(t.dataset.del);
  else if (t.dataset.shot !== undefined) openLB(+t.dataset.shot);
  else if (t.dataset.scroll) {
    const x = $(t.dataset.scroll);
    if (x) x.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (t.dataset.share) {
    const url = publicLink(t.dataset.share);
    const g = state.games.find(x => x.id === t.dataset.share);
    try {
      if (navigator.share) {
        await navigator.share({ title: g ? g.title : "", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("تم نسخ الرابط إلى الحافظة ✨");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(url);
        toast("تم نسخ الرابط إلى الحافظة ✨");
      } catch (e2) {
        prompt("انسخ الرابط:", url);
      }
    }
  }
});

/* ===== الإدارة: الإضافة والتعديل والحفظ ===== */
function readImage(file, max, q) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = im.width * k;
        c.height = im.height * k;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", q));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function thumbs() {
  const tc = $("tCover");
  if (tc) {
    tc.innerHTML = tmp.cover ? `<div><img src="${esc(tmp.cover)}"><b onclick="tmp.cover='';thumbs()">×</b></div>` : "";
  }
  const ts = $("tShots");
  if (ts) {
    ts.innerHTML = tmp.shots.map((u, i) => `<div><img src="${esc(u)}"><b onclick="tmp.shots.splice(${i},1);thumbs()">×</b></div>`).join("");
  }
}

function editGame(id) {
  const g = state.games.find(x => x.id === id) || {};
  editing = g.id || null;
  tmp = { cover: g.cover || "", shots: [...(g.shots || [])] };

  const editBox = $("editBox");
  if (!editBox) return;

  editBox.innerHTML = `
    <button class="x" onclick="closeM('mEdit')">×</button>
    <h2>${id ? "تعديل لعبة" : "إضافة لعبة جديدة"}</h2>
    <label>اسم اللعبة</label>
    <input id="fTitle" value="${esc(g.title)}">
    <label>الحالة / الإصدار <small>(مثال: مكتملة، قيد العمل، تحديث v1.2)</small></label>
    <input id="fStatus" value="${esc(g.status || 'مكتملة')}">
    <label>صورة الغلاف (Poster)</label>
    <input type="file" accept="image/*" onchange="upCover(this)">
    <input placeholder="أو ضع رابط صورة مباشر" dir="ltr" style="margin-top:6px" value="${esc(g.cover && g.cover.startsWith('http') ? g.cover : '')}" onchange="tmp.cover=this.value;thumbs()">
    <div class="thumbs" id="tCover"></div>
    <label>لقطات الشاشة (Screenshots)</label>
    <input type="file" accept="image/*" multiple onchange="upShots(this)">
    <div class="thumbs" id="tShots"></div>
    <label>الوصف وتفاصيل التعريب</label>
    <textarea id="fDesc" style="min-height:140px">${esc(g.desc)}</textarea>
    <label>روابط التحميل <small>(سطر لكل رابط بالشكل: الاسم | الرابط)</small></label>
    <textarea id="fLinks" dir="ltr" placeholder="تحميل التعريب | https://...&#10;ملف الخطوط | https://...">${esc((g.links || []).map(l => l.label + " | " + l.url).join("\n"))}</textarea>
    <button class="btn" style="width:100%;margin-top:20px" onclick="submitGame()">حفظ اللعبة</button>`;

  thumbs();
  openM("mEdit");
}

async function upCover(i) {
  if (i.files[0]) {
    tmp.cover = await readImage(i.files[0], 800, .75);
    thumbs();
  }
}

async function upShots(i) {
  for (const f of i.files) {
    tmp.shots.push(await readImage(f, 900, .65));
  }
  thumbs();
}

function submitGame() {
  const title = $("fTitle").value.trim();
  if (!title) return toast("يرجى كتابة اسم اللعبة");

  const links = $("fLinks").value.split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const p = l.split("|");
      return p.length > 1
        ? { label: p[0].trim(), url: p.slice(1).join("|").trim() }
        : { label: "تحميل", url: l };
    });

  const old = state.games.find(x => x.id === editing);
  const g = {
    id: editing || ("g" + Date.now()),
    title,
    status: $("fStatus").value.trim(),
    cover: tmp.cover,
    shots: tmp.shots,
    desc: $("fDesc").value,
    links,
    created: old ? old.created : Date.now()
  };

  if (old) Object.assign(old, g);
  else state.games.unshift(g);

  persist();
  closeM("mEdit");
  toast("تم الحفظ بنجاح! لا تنسَ تصدير data.json ورفعه على GitHub");
}

function delGame(id) {
  if (!confirm("هل أنت متأكد من حذف هذه اللعبة؟")) return;
  state.games = state.games.filter(g => g.id !== id);
  if (currentId() === id) location.hash = "#/";
  persist();
  toast("تم حذف اللعبة");
}

function editSettings() {
  const s = state.settings;
  const editBox = $("editBox");
  if (!editBox) return;

  editBox.innerHTML = `
    <button class="x" onclick="closeM('mEdit')">×</button>
    <h2>إعدادات الموقع</h2>
    <label>الاسم الرئيسي</label>
    <input id="sName" value="${esc(s.name)}">
    <label>الاسم الفرعي</label>
    <input id="sSub" value="${esc(s.sub)}">
    <label>الشعار والوصف المختصر</label>
    <input id="sTag" value="${esc(s.tagline)}">
    <label>رابط قناة تيليجرام</label>
    <input id="sTg" dir="ltr" placeholder="https://t.me/..." value="${esc(s.telegram)}">
    <label>نص حقوق الفوتر</label>
    <input id="sFoot" value="${esc(s.footer)}">
    <button class="btn" style="width:100%;margin-top:20px" onclick="submitSettings()">حفظ الإعدادات</button>`;

  openM("mEdit");
}

function submitSettings() {
  state.settings = {
    name: $("sName").value.trim(),
    sub: $("sSub").value.trim(),
    tagline: $("sTag").value.trim(),
    logo: (state.settings.logo || "").trim(),
    telegram: $("sTg").value.trim(),
    footer: $("sFoot").value.trim()
  };
  persist();
  closeM("mEdit");
  toast("تم حفظ الإعدادات");
}

function exportData() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
  a.download = "data.json";
  a.click();
  toast("تم تحميل data.json — ارفعه على مستودع GitHub");
}

function importData(i) {
  const f = i.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      state = {
        settings: { ...DEFAULT.settings, ...(d.settings || {}) },
        games: Array.isArray(d.games) ? d.games : []
      };
      persist();
      toast("تم استيراد البيانات بنجاح ✨");
    } catch (e) {
      toast("ملف JSON غير صالح!");
    }
  };
  r.readAsText(f);
}

// بدء التشغيل
load();
