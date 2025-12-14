(() => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Demo data loader (static mock)
  // TODO: Replace with real API/Supabase calls.
  window.PETUNIA = window.PETUNIA || {};
})();


/* =========================
   Petunia Dynamic App (Supabase)
   - Sayfa algılar (path'e göre)
   - Liste çeker
   - Form submit eder
   - Login/Kayıt/Çıkış
   ========================= */

const SUPABASE_URL = "https://iecxlcysxtyenzfeukoo.supabase.co";
const SUPABASE_KEY = "sb_publishable_mFkD5RMG5kKq-Fy7S7j7rg_1jDayPqx";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
const toType = (path) => {
  if (path.includes("/sahiplendirme/kedi")) return "cat";
  if (path.includes("/sahiplendirme/kopek")) return "dog";
  return null;
};

async function getUser() {
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}

async function ensureProfile(user) {
  if (!user) return;
  // profiles tablosu varsa: kayıt sonrası yoksa ekle
  await sb.from("profiles").upsert({
    id: user.id,
    display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "Kullanıcı"
  }, { onConflict: "id" });
}

/* ---------- UI helpers ---------- */
function setLoading(el, text="Yükleniyor...") {
  if (!el) return;
  el.innerHTML = `<div class="card pad">${esc(text)}</div>`;
}
function setError(el, msg) {
  if (!el) return;
  el.innerHTML = `<div class="card pad">Hata: ${esc(msg)}</div>`;
}

/* ---------- Lists ---------- */
async function loadAdoptionList() {
  const wrap = $("#adoptionList");
  if (!wrap) return;

  setLoading(wrap);

  const path = location.pathname;
  const petType = toType(path);

  // Filtre inputların varsa (opsiyonel)
  const city = $("#filterCity")?.value?.trim() || "";
  const q = $("#filterQ")?.value?.trim() || "";

  let query = sb.from("adoption_posts")
    .select("id,title,pet_name,pet_type,city,district,created_at,status")
    .eq("status","active")
    .order("created_at",{ ascending:false });

  if (petType) query = query.eq("pet_type", petType);
  if (city) query = query.ilike("city", `%${city}%`);
  if (q) query = query.or(`pet_name.ilike.%${q}%,title.ilike.%${q}%`);

  const { data, error } = await query;

  if (error) return setError(wrap, error.message);
  if (!data?.length) return wrap.innerHTML = `<div class="card pad">Henüz ilan yok.</div>`;

  wrap.innerHTML = data.map(p => `
    <div class="card item">
      <div class="item-head">
        <div>
          <div class="item-title">${esc(p.pet_name || p.title || "İlan")}</div>
          <div class="muted">${esc(p.city || "")}${p.district ? " / " + esc(p.district) : ""} • ${esc(p.pet_type)}</div>
        </div>
        <a class="btn" href="/ilan/?id=${encodeURIComponent(p.id)}">Detay</a>
      </div>
    </div>
  `).join("");
}

async function loadLostList() {
  const wrap = $("#lostList");
  if (!wrap) return;

  setLoading(wrap);

  const city = $("#filterCity")?.value?.trim() || "";
  const q = $("#filterQ")?.value?.trim() || "";

  let query = sb.from("lost_posts")
    .select("id,pet_name,pet_type,city,district,lost_at,created_at,status")
    .eq("status","active")
    .order("created_at",{ ascending:false });

  if (city) query = query.ilike("city", `%${city}%`);
  if (q) query = query.or(`pet_name.ilike.%${q}%,distinctive_marks.ilike.%${q}%`);

  const { data, error } = await query;

  if (error) return setError(wrap, error.message);
  if (!data?.length) return wrap.innerHTML = `<div class="card pad">Aktif kayıp ilanı yok.</div>`;

  wrap.innerHTML = data.map(p => `
    <div class="card item">
      <div class="item-head">
        <div>
          <div class="item-title">${esc(p.pet_name || "İsimsiz")}</div>
          <div class="muted">${esc(p.city || "")}${p.district ? " / " + esc(p.district) : ""} • ${esc(p.pet_type)}</div>
        </div>
        <a class="btn" href="/kayip-hayvanlar/bulundu-bildir/?id=${encodeURIComponent(p.id)}">Bulundu bildir</a>
      </div>
    </div>
  `).join("");
}

/* ---------- Detail / actions ---------- */
async function markLostFound() {
  const id = new URLSearchParams(location.search).get("id");
  const out = $("#foundResult");
  if (!id) return out && (out.textContent = "id yok");

  const user = await getUser();
  if (!user) {
    out && (out.textContent = "Önce giriş yapmalısın.");
    return;
  }

  const { error } = await sb.from("lost_posts")
    .update({ status: "found" })
    .eq("id", id);

  if (error) return out && (out.textContent = "Hata: " + error.message);
  out && (out.textContent = "✅ Bulundu olarak işaretlendi.");
}

/* ---------- Forms (create) ---------- */
async function createAdoptionPost(e) {
  e.preventDefault();
  const out = $("#formResult");
  out && (out.textContent = "Gönderiliyor...");

  const user = await getUser();
  if (!user) return out && (out.textContent = "Önce giriş yapmalısın.");

  const fd = new FormData(e.currentTarget);
  const payload = {
    user_id: user.id,
    title: fd.get("title") || "Sahiplendirme ilanı",
    pet_name: fd.get("pet_name") || null,
    pet_type: fd.get("pet_type") || "cat",
    city: fd.get("city") || null,
    district: fd.get("district") || null,
    description: fd.get("description") || null,
    conditions: fd.get("conditions") || null,
    status: "active"
  };

  const { error } = await sb.from("adoption_posts").insert(payload);
  if (error) return out && (out.textContent = "Hata: " + error.message);
  out && (out.textContent = "✅ İlan eklendi.");
  e.currentTarget.reset();
}

async function createLostPost(e) {
  e.preventDefault();
  const out = $("#formResult");
  out && (out.textContent = "Gönderiliyor...");

  const user = await getUser();
  if (!user) return out && (out.textContent = "Önce giriş yapmalısın.");

  const fd = new FormData(e.currentTarget);
  const payload = {
    user_id: user.id,
    pet_name: fd.get("pet_name") || null,
    pet_type: fd.get("pet_type") || "cat",
    city: fd.get("city") || null,
    district: fd.get("district") || null,
    last_seen_location: fd.get("last_seen_location") || null,
    distinctive_marks: fd.get("distinctive_marks") || null,
    status: "active"
  };

  const { error } = await sb.from("lost_posts").insert(payload);
  if (error) return out && (out.textContent = "Hata: " + error.message);
  out && (out.textContent = "✅ Kayıp ilanı eklendi.");
  e.currentTarget.reset();
}

/* ---------- Auth pages ---------- */
async function handleLogin(e) {
  e.preventDefault();
  const out = $("#authResult");
  out && (out.textContent = "Giriş yapılıyor...");

  const fd = new FormData(e.currentTarget);
  const email = String(fd.get("email") || "");
  const password = String(fd.get("password") || "");

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return out && (out.textContent = "Hata: " + error.message);

  await ensureProfile(data.user);
  out && (out.textContent = "✅ Giriş başarılı.");
  location.href = "/profil/";
}

async function handleRegister(e) {
  e.preventDefault();
  const out = $("#authResult");
  out && (out.textContent = "Kayıt yapılıyor...");

  const fd = new FormData(e.currentTarget);
  const email = String(fd.get("email") || "");
  const password = String(fd.get("password") || "");
  const display_name = String(fd.get("display_name") || "");

  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { display_name } }
  });
  if (error) return out && (out.textContent = "Hata: " + error.message);

  await ensureProfile(data.user);
  out && (out.textContent = "✅ Kayıt tamam. Giriş yapabilirsin.");
}

async function renderProfile() {
  const el = $("#profileBox");
  if (!el) return;

  const user = await getUser();
  if (!user) {
    el.innerHTML = `<div class="card pad">Giriş yok. <a class="btn" href="/giris/">Giriş</a></div>`;
    return;
  }

  el.innerHTML = `
    <div class="card pad">
      <div><b>${esc(user.email)}</b></div>
      <button class="btn" id="logoutBtn">Çıkış</button>
    </div>
  `;

  $("#logoutBtn")?.addEventListener("click", async () => {
    await sb.auth.signOut();
    location.href = "/";
  });
}

/* ---------- Page Router ---------- */
function route() {
  const path = location.pathname.replace(/index\.html$/,"");

  // Filtre inputların varsa: input değişince listeyi yenile
  if ($("#filterCity") || $("#filterQ")) {
    $("#filterCity")?.addEventListener("input", () => {
      if (path.includes("/sahiplendirme")) loadAdoptionList();
      if (path.includes("/kayip-hayvanlar")) loadLostList();
    });
    $("#filterQ")?.addEventListener("input", () => {
      if (path.includes("/sahiplendirme")) loadAdoptionList();
      if (path.includes("/kayip-hayvanlar")) loadLostList();
    });
  }

  if (path.includes("/sahiplendirme")) loadAdoptionList();
  if (path.includes("/kayip-hayvanlar") && !path.includes("/bulundu-bildir")) loadLostList();

  if (path.includes("/kayip-hayvanlar/bulundu-bildir")) {
    $("#markFoundBtn")?.addEventListener("click", markLostFound);
  }

  if (path.includes("/ilan-ver/sahiplendirme")) {
    $("#adoptionCreateForm")?.addEventListener("submit", createAdoptionPost);
  }

  if (path.includes("/kayip-hayvanlar/ilan-ver")) {
    $("#lostCreateForm")?.addEventListener("submit", createLostPost);
  }

  if (path.includes("/giris")) $("#loginForm")?.addEventListener("submit", handleLogin);
  if (path.includes("/kayit")) $("#registerForm")?.addEventListener("submit", handleRegister);
  if (path.includes("/profil")) renderProfile();
}

document.addEventListener("DOMContentLoaded", route);
