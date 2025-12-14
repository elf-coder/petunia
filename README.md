# Petunia (Starter)

Açık mavi tonlarında, statik HTML/CSS/JS starter proje.
- Sahiplendirme
- Kayıp Hayvanlar
- Bakım Rehberi
- Bakıcı Bul/Ol
- Topluluk
- Kurumsal sayfalar

## Çalıştırma
Bu proje statik olduğu için iki kolay yol:

1) VS Code Live Server
- Klasörü aç → `index.html` üzerinde "Open with Live Server"

2) Python basit sunucu
- Klasöre girip:
  python -m http.server 5173
- Sonra tarayıcı: http://localhost:5173

## Geliştirilecek Yerler (TODO)
- `assets/data/mock.json` yerine gerçek veri (Supabase/DB)
- Formların backend'e bağlanması (ilan ver, kayıp ilan ver, bakıcı ol, konu aç)
- Auth (giriş/kayıt) + kullanıcı paneli
- İlan doğrulama / moderasyon / raporlama akışı
- Harita entegrasyonu (kayıp ilan detayında)
- SEO: dinamik meta, sitemap.xml, robots.txt
- AdSense: onay sonrası uygun sayfalara yerleşim + `ads.txt`

## Not
İletişim/hakkımızda gibi sayfalarda reklam konumlandırmayı minimal tut.
Kayıp ilan sayfalarında agresif reklamdan kaçın.
