# EMOVIA

EMOVIA, insanların duygularını fark etmesine, kendini daha iyi anlamasına ve günlük psikolojik iyi oluşunu desteklemesine yardımcı olan etik, insan odaklı bir platformdur. Proje; Wix Velo arayüzlerine bağlanan Flask tabanlı bir backend, Groq destekli AI sohbet servisi ve lead kayıt sistemi içerir.

EMOVIA klinik tanı koymaz, terapi yerine geçmez ve riskli durumlarda kullanıcıyı güvenilir bir uzmana veya yerel acil destek kaynaklarına yönlendirir.

## Proje Ne Yapar?

- Wix sitelerinde tüm sayfalarda görünen küçük bir EMOVIA sohbet widget'ı sağlar.
- Kullanıcının `mesaj` alanındaki sorusuna AI yanıtı üretir.
- Kullanıcıdan `isim`, `telefon` ve isteğe bağlı `mesaj` bilgilerini alır.
- Lead kayıtlarını SQLite veritabanında saklar.
- Yönetim panelinde lead kayıtlarını Wix Repeater ile tablo gibi gösterir.
- Groq API anahtarı yokken uygulamayı demo modunda çalıştırır.
- API anahtarını frontend'e veya GitHub'a göndermeden backend'de tutar.

## Mimari

Proje spagetti kod kullanmaz; her modülün tek sorumluluğu vardır:

- `config.py`: `.env` ayarlarını, gizli anahtarları ve ortam sınıflarını yönetir.
- `app/database.py`: SQLite bağlantısı, tablo oluşturma, lead ekleme ve listeleme işlemlerini yönetir. SQL yalnızca bu dosyadadır.
- `app/services/ai_service.py`: `AIService`, Groq API çağrısı, prompt ve demo modunu yönetir. AI çağrısı yalnızca bu dosyadadır.
- `app/routes.py`: HTTP isteklerini doğrular, doğru servis katmanını çağırır ve JSON döndürür. SQL veya AI kodu içermez.
- `app/__init__.py`: Flask application factory, CORS, veritabanı başlatma ve Blueprint kayıtlarını yönetir.
- `run.py`: Uygulamayı başlatır.
- `wix/`: Wix Velo sayfa ve global chat kodlarını içerir.

## Proje Yapısı

```text
smartlead_ai/
├── run.py
├── config.py
├── requirements.txt
├── .env                 # Git'e gönderilmez
├── .gitignore
├── README.md
├── emovia.db            # Git'e gönderilmez, uygulama çalışınca oluşur
├── wix/
│   ├── global-chat.js
│   ├── karsilama.js
│   ├── yonetim-paneli.js
│   └── README.md
└── app/
    ├── __init__.py
    ├── database.py
    ├── routes.py
    ├── services/
    │   ├── __init__.py
    │   └── ai_service.py
    └── templates/
        ├── index.html
        └── dashboard.html
```

## Gereksinimler

- Python 3.10 veya üzeri
- Groq API anahtarı: gerçek AI yanıtları için gereklidir
- Wix Velo: frontend entegrasyonu için
- Render veya benzeri bir Python hosting servisi: canlı yayın için

## Kurulum

PowerShell ile proje klasörüne geçin:

```powershell
cd C:\Users\oguz_\Desktop\smartlead\smartlead_ai
```

Sanal ortam oluşturun ve aktif edin:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Bağımlılıkları yükleyin:

```powershell
python -m pip install -r requirements.txt
```

## Ortam Değişkenleri

`.env` dosyası proje kökünde bulunur ve GitHub'a gönderilmez. Gerçek API anahtarını yalnızca bu dosyaya veya Render Environment Variables alanına yazın.

```env
SECRET_KEY=guclu-ve-gizli-bir-deger
GROQ_API_KEY=gercek-groq-api-anahtari
AI_PROVIDER=groq
GROQ_API_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
DATABASE_URL=sqlite:///emovia.db
CORS_ORIGINS=*
BUSINESS_CONTEXT=Sen EMOVIA'nin etik ve insan odakli psikolojik iyi olus asistanisin. Tani koyma ve terapi yerine gecme.
```

### Demo Modu

`GROQ_API_KEY` boş bırakılırsa uygulama çökmez. `/api/sohbet` demo yanıtı döndürür. Gerçek Groq yanıtları için geçerli bir anahtar gerekir.

## Yerel Çalıştırma

Doğru proje klasöründe şu komutu çalıştırın:

```powershell
cd C:\Users\oguz_\Desktop\smartlead\smartlead_ai
.\venv\Scripts\python.exe run.py
```

Uygulama şu adreslerde çalışır:

- Ana sayfa: http://127.0.0.1:5000/
- Sağlık kontrolü: http://127.0.0.1:5000/health
- API sağlık kontrolü: http://127.0.0.1:5000/api/health
- Yönetim paneli: http://127.0.0.1:5000/dashboard

## Test ve Doğrulama

Python dosyalarını derleyin:

```powershell
.\venv\Scripts\python.exe -m compileall app run.py config.py
```

Uygulama ve endpoint kontrolleri:

```powershell
.\venv\Scripts\python.exe -c "from app import create_app; app=create_app(); client=app.test_client(); print(client.get('/health').get_json()); print(client.get('/api/leads').get_json())"
```

Wix JavaScript dosyalarının söz dizimini kontrol edin:

```powershell
node --check wix\global-chat.js
node --check wix\karsilama.js
node --check wix\yonetim-paneli.js
```

## API Sözleşmesi

Frontend alan adları backend ile birebir aynı olmalıdır.

### `GET /health`

```json
{
  "basari": true,
  "status": "ok",
  "service": "EMOVIA",
  "message": "API is running."
}
```

### `GET /api/health`

Sunucunun API prefix'i üzerinden sağlık kontrolüdür. `/health` ile aynı yapıda yanıt verir.

### `POST /api/sohbet`

İstek:

```json
{
  "mesaj": "Bugün kendimi çok yorgun hissediyorum.",
  "gecmis": []
}
```

Başarılı cevap:

```json
{
  "basari": true,
  "status": "success",
  "cevap": "Seni dinliyorum. Bugün kendine küçük bir alan açmak iyi gelebilir."
}
```

Eksik `mesaj` için `400`, AI sağlayıcısı hatası için `503` döner.

### `POST /api/leads`

İstek:

```json
{
  "isim": "Ayşe Yılmaz",
  "telefon": "05551234567",
  "mesaj": "Duygusal destek almak istiyorum."
}
```

Başarılı kayıt `201` durum kodu döndürür:

```json
{
  "basari": true,
  "status": "success",
  "message": "İletişim bilgileriniz kaydedildi.",
  "id": 1
}
```

Eksik `isim` veya `telefon` için `400` döner.

### `GET /api/leads`

Wix Repeater için lead listesini döndürür. Her kayıt Wix için zorunlu `_id` alanına sahiptir:

```json
{
  "basari": true,
  "leadler": [
    {
      "_id": "1",
      "isim": "Ayşe Yılmaz",
      "telefon": "05551234567",
      "mesaj": "Duygusal destek almak istiyorum.",
      "tarih": "2026-09-08 12:00:00"
    }
  ]
}
```

## Wix Velo Entegrasyonu

Wix Python çalıştırmaz. Önce Flask backend'i Render gibi bir serviste yayınlayın. Daha sonra Wix kodlarında şu satırı canlı backend adresinizle değiştirin:

```javascript
const API_BASE_URL = 'https://YOUR-EMOVIA-API.onrender.com';
```

### Global Chat Widget

[wix/global-chat.js](wix/global-chat.js) kodunu Wix Site Code veya Master Page alanına bir kez ekleyin. Her sayfaya ayrı ayrı kopyalamayın.

Gerekli bileşen ID'leri:

```text
#emoviaChatOpenButton
#emoviaChatPanel
#emoviaChatCloseButton
#emoviaChatTitle
#emoviaChatIntro
#emoviaChatInput
#emoviaChatAskButton
#emoviaChatAnswer
#emoviaChatStatus
```

Widget sağ alt köşede açılır; “Nasıl yardımcı olabilirim?” mesajıyla başlar. Konuşma geçmişini Wix local storage içinde hatırlar, son altı mesajı kontrollü şekilde backend'e gönderir ve 600 karakterlik mesaj sınırı uygular.

### Karşılama Sayfası

[wix/karsilama.js](wix/karsilama.js) kodunu B2C karşılama sayfasına ekleyin. Gerekli bileşenler:

```text
#isimInput
#telefonInput
#mesajInput
#kaydetButton
#durumText
```

Form isim, telefon ve isteğe bağlı mesajı `/api/leads` endpoint'ine gönderir. İsim, telefon ve mesaj doğrulaması yapar; başarılı kayıttan sonra alanları temizler.

### Yönetim Paneli

[wix/yonetim-paneli.js](wix/yonetim-paneli.js) kodunu B2B yönetim paneline ekleyin. Gerekli bileşenler:

```text
#panelTitle
#panelStatusText
#leadRepeater
#leadNameText
#leadPhoneText
#leadMessageText
#leadDateText
```

Kod `GET /api/leads` cevabındaki `leadler` listesini Repeater'a bağlar. Her satırda `$item` kullanılır ve `_id` zorunluluğu karşılanır. Liste 60 saniyede bir yenilenir.

Renk ve yerleşim detayları için [wix/README.md](wix/README.md) dosyasına bakın. EMOVIA tasarım dili: gece laciverti `#102A43`, mercan `#F26B5B`, sis beyazı `#F7FAFC` ve ada çayı `#B8D8D8`.

## Render'da Yayınlama

1. `.env`, `venv/`, `__pycache__/` ve `emovia.db` GitHub'a gönderilmemelidir.
2. GitHub'a `.env` hariç projeyi yükleyin.
3. Render'da yeni bir Web Service oluşturup GitHub reposunu bağlayın.
4. Build Command:

   ```text
   pip install -r requirements.txt
   ```

5. Start Command:

   ```text
   gunicorn run:app
   ```

6. Render Environment Variables alanına şunları ekleyin:

   ```text
   SECRET_KEY
   GROQ_API_KEY
   AI_PROVIDER
   GROQ_API_BASE_URL
   GROQ_MODEL
   DATABASE_URL
   CORS_ORIGINS
   BUSINESS_CONTEXT
   ```

7. Deploy tamamlandıktan sonra şu adresi kontrol edin:

   ```text
   https://YOUR-EMOVIA-API.onrender.com/health
   ```

8. Sağlık kontrolü başarılıysa bu URL'yi Wix dosyalarındaki `API_BASE_URL` değerine yazın.

## Güvenlik

- Gerçek `GROQ_API_KEY` yalnızca yerel `.env` veya Render Environment Variables içinde tutulur.
- API anahtarı Wix frontend koduna yazılmaz.
- `.env` dosyası `.gitignore` içinde bulunur.
- API anahtarı loglara yazdırılmaz.
- Anahtar yanlışlıkla GitHub'a gönderilirse hemen Groq panelinden iptal edilip yenilenmelidir.
- `/api/leads` yönetim paneli için canlı ortamda erişim koruması eklenmelidir.

## Production Notu

Bu proje EMOVIA için modüler bir öğrenci/ürün prototipi olarak hazırlanmıştır. Production ortamında kimlik doğrulama, rate limit, log izleme, yedekleme ve veritabanı erişim güvenliği ayrıca yapılandırılmalıdır.
