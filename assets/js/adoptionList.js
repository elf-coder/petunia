async function loadAdoptions() {
  const wrap = document.getElementById("adoptionList");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="card pad">
      Yükleniyor...
    </div>
  `;

  const { data, error } = await window.sb
    .from("adoption_posts")
    .select("id, title, pet_name, pet_type, city, district, created_at, status")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    wrap.innerHTML = `
      <div class="card pad">
        Hata: ${error.message}
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    wrap.innerHTML = `
      <div class="card pad">
        Henüz sahiplendirme ilanı yok.
      </div>
    `;
    return;
  }

  wrap.innerHTML = data.map(p => `
    <div class="card item">
      <div class="item-head">
        <div>
          <div class="item-title">
            ${p.pet_name || p.title || "İlan"}
          </div>
          <div class="muted">
            ${p.city || ""}
            ${p.district ? " / " + p.district : ""}
            • ${p.pet_type}
          </div>
        </div>
        <a class="btn" href="/ilan.html?id=${p.id}">
          Detay
        </a>
      </div>
    </div>
  `).join("");
}

loadAdoptions();
