async function loadLost() {
  const wrap = document.getElementById("lostList");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="card pad">
      Yükleniyor...
    </div>
  `;

  const { data, error } = await window.sb
    .from("lost_posts")
    .select("id, pet_name, pet_type, city, district, created_at, status")
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
        Aktif kayıp ilanı yok.
      </div>
    `;
    return;
  }

  wrap.innerHTML = data.map(p => `
    <div class="card item">
      <div class="item-title">
        ${p.pet_name || "İsimsiz"}
      </div>
      <div class="muted">
        ${p.city || ""}
        ${p.district ? " / " + p.district : ""}
        • ${p.pet_type}
      </div>
      <a class="btn" href="/kayip-ilan.html?id=${p.id}">
        Detay
      </a>
    </div>
  `).join("");
}

loadLost();
