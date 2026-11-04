# Kie.ai Veo 3.1'i Claude'a bağlama — adım adım

Sonuç: Claude'la konuştuğun her yerde (claude.ai, masaüstü, mobil) "şunun videosunu üret" dediğinde Claude kie.ai üzerinden Veo 3.1 ile video üretir.

Toplam süre: ~15 dakika. Ücretsiz Cloudflare hesabı yeterli.

---

## Adım 1 — Kie.ai API anahtarını al
1. https://kie.ai/api-key adresine git (ya da sağ üstte profil → API Key).
2. Anahtarı kopyala, bir yere not et. **Kimseyle, Claude'la da sohbette paylaşma.**

## Adım 2 — Erişim kodu uydur
Bu, sunucunun adresinde şifre gibi çalışır; adresi bilmeyen kimse kredini harcayamaz.
- En az 24 karakter, sadece harf ve rakam. Örnek biçim: `k7Hq2mZp9WxR4vLt8NbY3cJs`
- Bunu da not et.

## Adım 3 — Cloudflare hesabı aç
1. https://dash.cloudflare.com/sign-up adresinden ücretsiz kayıt ol, e-postanı doğrula.

## Adım 4 — Worker oluştur
1. Sol menüde **Compute (Workers)** → **Workers & Pages**'e tıkla.
2. **Create** → **Create Worker** (ya da "Start with Hello World!").
3. İsim olarak `kie-veo` yaz → **Deploy**.
4. Açılan sayfada **Edit code** düğmesine bas.
5. Soldaki `worker.js` dosyasının içini **tamamen sil**.
6. Bu klasördeki `worker.js` dosyasının **tamamını** kopyalayıp yapıştır.
7. Sağ üstte **Deploy**'a bas.

## Adım 5 — Gizli değişkenleri ekle
1. Worker sayfasına geri dön → **Settings** sekmesi → **Variables and Secrets** → **Add**.
2. Birinci kayıt:
   - Type: **Secret**
   - Variable name: `KIE_API_KEY`
   - Value: Adım 1'deki kie.ai anahtarın
3. **Add variable** ile ikinci kayıt:
   - Type: **Secret**
   - Variable name: `ERISIM_KODU`
   - Value: Adım 2'deki kodun
4. **Deploy**'a bas.

## Adım 6 — Çalıştığını kontrol et
Worker sayfasında adresin yazar, örneğin `https://kie-veo.KULLANICIADIN.workers.dev`.

Tarayıcıda şunu aç:
```
https://kie-veo.KULLANICIADIN.workers.dev/mcp/ERISIM_KODUN
```
Ekranda **"Kie Veo MCP sunucusu çalışıyor."** yazmalı.
- "Bulunamadı" yazıyorsa: erişim kodu adreste yanlış yazılmış.
- "Sunucu ayarlanmamış" yazıyorsa: Adım 5'teki değişken isimlerini kontrol et.

## Adım 7 — Claude'a bağlayıcı olarak ekle
1. https://claude.ai adresinde sol altta adına tıkla → **Settings (Ayarlar)** → **Connectors (Bağlayıcılar)**.
2. **Add custom connector (Özel bağlayıcı ekle)**.
3. Name: `Kie Veo`
4. URL: Adım 6'daki tam adres (`.../mcp/ERISIM_KODUN`).
5. **Add**. OAuth alanlarını boş bırak.

> Team/Enterprise hesaplarda bağlayıcıyı organizasyon sahibinin eklemesi gerekebilir.

## Adım 8 — Kullan
Yeni bir sohbette, mesaj kutusundaki **+ / araçlar** menüsünden **Kie Veo**'nun açık olduğundan emin ol, sonra örneğin şunu yaz:

> Kie Veo ile, gün batımında sahilde koşan bir golden retriever'ın 16:9 videosunu veo3_fast modeliyle üret. Hazır olunca bağlantıyı ver.

Claude önce `veo_video_uret` ile görevi başlatır, sonra `veo_durum_sorgula` ile sonucu getirir. Video birkaç dakika sürer; Claude "hâlâ üretiliyor" derse "tekrar kontrol et" demen yeterli.

### Araçlar
| Araç | Ne yapar |
|---|---|
| `veo_video_uret` | Metinden ya da görselden video üretimini başlatır (kredi harcar) |
| `veo_durum_sorgula` | Görevin durumunu ve video bağlantısını getirir |
| `veo_1080p_al` | Tamamlanan 16:9 videonun 1080p sürümünü ister |
| `kie_kredi_sorgula` | Kalan krediyi gösterir |

## Güvenlik
- Worker adresini (erişim kodu dahil) paylaşma; bilen kişi kredini harcayabilir.
- Kod sızarsa: Adım 5'te `ERISIM_KODU`'nu değiştir, Claude'daki bağlayıcı adresini güncelle.
- Kie.ai panelinden harcama limitini/kredi durumunu düzenli kontrol et.
