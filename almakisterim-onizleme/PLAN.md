# almakisterim.com — Proje Planı (taslak v1)

> Tersine pazaryeri: Alıcı ne almak istediğini yazar, satıcılar teklif verir, alıcı en iyisini seçer.

## 1. Kimler kullanacak?

| Rol | Ne yapar | Ücret |
|---|---|---|
| **Alıcı** | Talep ilanı verir, teklifleri karşılaştırır, birini kabul eder | Her zaman ücretsiz |
| **Bireysel satıcı** | Talepleri görür, teklif verir | Ayda 5 ücretsiz teklif, sonrası kredi |
| **Mağaza / kurumsal satıcı** | Galerici, emlakçı, mağaza, usta, toptancı. Eşleşme alarmı alır, çok teklif verir | Kredi paketi veya aylık üyelik |
| **Yönetici (sen)** | Kategorileri açar/gizler, içerik denetler, fiyatları belirler | — |

## 2. Para nasıl kazanılacak? (önerilen, değiştirilebilir)

1. **Teklif kredisi:** Her teklif 1 kredi. Paketler: 10 / 50 / 200 kredi.
2. **Mağaza üyeliği (aylık):** Sınırsız teklif, doğrulanmış rozet, yapay zekâ eşleşme alarmı.
3. **Öne çıkarma:** Satıcı teklifini üste taşır; alıcı "acil" ya da vitrin etiketi alır.
4. **İleride:** Güvenli ödeme ile başarı komisyonu.

Fiyatların hepsi yönetim panelinden ayarlanacak.

## 3. İlan (talep) ve teklif nasıl işleyecek?

**Talep yaşam döngüsü:** `taslak → denetimde → yayında → anlaşıldı / süresi doldu / kapatıldı`

1. Alıcı tek cümle yazar. **Claude** başlığı, kategoriyi, bütçe aralığını, şehri, durumu (sıfır/2. el/hizmet) ve özellikleri çıkarır.
2. **Claude içerik denetimi:** Yasa dışı/yasaklı içerik → incelemeye düşer. Telefon/e-posta → otomatik gizlenir.
3. Yayınlanınca eşleşen satıcılara bildirim gider (SMS/e-posta/uygulama). Satıcılar alarm kurabilir: kategori + şehir + bütçe.
4. Satıcı teklif verir: fiyat, durum, teslimat, garanti, not, fotoğraf. 1 kredi düşer.
5. **Kapalı teklif:** Fiyatları sadece alıcı görür, diğer satıcılar yalnızca teklif sayısını görür.
6. Alıcı teklifleri sıralar: akıllı (fiyat + puan + garanti), en ucuz, en yüksek puan. Birini kabul eder → platform içi sohbet açılır, diğer satıcılara "talep kapandı" bildirimi gider.
7. İki taraf da birbirine puan verir.

**Gizlilik:** Alıcının telefonu hiçbir zaman satıcıya gösterilmez. İletişim sohbet üzerinden olur.

## 4. Kategoriler

Hepsi başta açık: Elektronik, Vasıta, Emlak, Ev & Yaşam, Moda & Giyim, Hizmet & Usta, Yedek Parça, İş Makinesi & Sanayi, Hobi & Oyun, Anne & Bebek, Spor & Outdoor, Toptan & B2B.
**Yönetim panelinden her kategori tek tıkla gizlenir.** Gizlenen kategori sitenin hiçbir yerinde görünmez ama içindeki talepler silinmez.

## 5. Teknik mimari

```
almakisterim/                 (tek GitHub deposu, ayrı ve özel)
├─ apps/api        Node.js + TypeScript + Fastify  → Cloud Run (europe-west3, Frankfurt)
├─ apps/web        Next.js                         → Cloud Run, önünde Cloudflare Worker
├─ apps/mobile     Expo (sonraki aşama)
├─ db/migrations   0001_init.sql, 0002_... (sıralı .sql dosyaları)
└─ .github/workflows   test → (senin onayınla) yayın
```

- **Veritabanı:** Neon PostgreSQL (Frankfurt)
- **Gizli anahtarlar:** Google Secret Manager. Kodda, GitHub'da, tarayıcıda ve loglarda asla bulunmaz.
- **Zamanlanmış işler:** Cloud Scheduler (süresi dolan talepler, özet e-postalar, alarm eşleşmeleri)
- **Dosyalar:** Cloudflare R2 (tarayıcıdan imzalı URL ile doğrudan yükleme)
- **E-posta:** Resend · **SMS:** Netgsm (giriş kodu + bildirim) · **Yapay zekâ:** Anthropic Claude (sadece sunucuda)
- **Giriş:** E-posta kodu, telefon SMS kodu, Google ile devam et
- **Yayın:** GitHub Actions. Her push'ta testler çalışır. Canlıya yayın, GitHub'da senin "Onayla" butonuna basmanla olur (environment protection).

## 6. Aşamalar

| # | Aşama | Çıktı |
|---|---|---|
| 0 | **Tasarım önizlemesi** ✅ | `almakisterim-onizleme/index.html` |
| 1 | Depo iskeleti + CI testleri | Monorepo, lint, test, ilk migration |
| 2 | Hesaplar ve giriş | E-posta/SMS/Google girişi, oturum |
| 3 | Talep oluşturma + Claude yardım + denetim | Talep API + web formu |
| 4 | Teklif, karşılaştırma, kabul, sohbet | Uçtan uca akış |
| 5 | Bildirimler + alarmlar + Cloud Scheduler | SMS/e-posta |
| 6 | Kredi ve üyelik (ödeme altyapısı seçilecek) | Gelir |
| 7 | Yönetim paneli (kategori, denetim, fiyat) | Yönetim |
| 8 | Google Cloud + Cloudflare kurulumu, **"canlıya al" sonrası** yayın | almakisterim.com |
| 9 | Expo mobil uygulama | iOS/Android |

## 7. Senden karar bekleyenler

- Ödeme altyapısı: iyzico mu, PayTR mı, Stripe mı?
- Kredi ve üyelik fiyatları (önizlemedekiler örnektir).
- Satıcı doğrulaması: Mağazalardan vergi levhası istensin mi?
- Bireysel satıcıya ayda kaç ücretsiz teklif verilsin?
