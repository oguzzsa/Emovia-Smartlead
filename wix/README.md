# EMOVIA Wix Velo arayuzleri

Wix Editor'de iki sayfa olusturun ve ilgili JS kodunu sayfa koduna yapistirin. Tum sayfalarda gorunecek sohbet icin `global-chat.js` kodunu Wix Site Code / Master Page alanina ekleyin. `API_BASE_URL` degerini Render uzerindeki Flask servisinin herkese acik URL'si ile degistirin.

## Tum sayfalarda sabit EMOVIA chat widget'i

`global-chat.js`, Wix Site Code veya Master Page icinde bir kez calistirilmalidir. Header veya footer bolgesine su bilesenleri ekleyin ve ID'lerini birebir verin:

- `#emoviaChatOpenButton`: sag alt kosede kapali durumdaki EMOVIA butonu
- `#emoviaChatPanel`: butonun ustunde acilan chat paneli
- `#emoviaChatCloseButton`: paneli kapatma butonu
- `#emoviaChatTitle`: `EMOVIA` basligi
- `#emoviaChatIntro`: `Nasıl yardımcı olabilirim?` acilis metni
- `#emoviaChatInput`: mesaj input'u
- `#emoviaChatAskButton`: `Sor` butonu
- `#emoviaChatAnswer`: AI yanit metni
- `#emoviaChatStatus`: durum metni

Widget tasarimi:

- Masaustunde sagdan 24px, alttan 24px; mobilde sagdan 12px, alttan 12px konumlandirin.
- Panel genisligini masaustunde 340px, mobilde ekranin yaklasik yuzde 90'i yapin.
- Panelde EMOVIA gece laciverti `#102A43`, mercan `#F26B5B` ve sis beyazi `#F7FAFC` renklerini kullanin.
- Yari seffaf beyaz arka plan, ince kenarlik ve hafif blur ile Glassmorphism uygulayin.
- Bu bilesenleri her sayfaya ayri ayri kopyalamayin; Wix Site Code / Master Page uzerinden global ekleyin.

Widget davranisi:

- Sayfa acildiginda panel kapali, kose butonu gorunur.
- Butona basildiginda panel acilir ve mesaj alani otomatik odaklanir.
- Gonderim sirasinda input ve buton pasiflesir; panelde `Emovia dusunuyor...` durumu gorunur.
- Basarili yanitta cevap alani guncellenir, mesaj alani temizlenir ve yeni mesaja hazir kalir.
- Baglanti veya API hatasinda kullaniciya sade bir hata mesaji gosterilir.
- Son konusma Wix local storage icinde tutulur; kullanici sayfalar arasinda dolassa bile son cevap gorunur.
- Son alt mesaj kontrollu bicimde backend'e `gecmis` alaniyla gonderilir.
- Mesajlar 600 karakterle sinirlidir ve istekler 20 saniye sonra zaman asimina ugrar.
- `global-chat.js` sohbeti yonetir; `karsilama.js` yalnizca lead formunu yonetir. Boylece ayni sayfada iki sohbet olusmaz.

Ilk mesaj `Nasıl yardımcı olabilirim?` olmali. Backend'e gonderilen alan adi `mesaj`, yanit alan adi `cevap` olarak kalmalidir.

## Arayuz 1: Karsilama sayfasi (B2C)

Marka: EMOVIA
Baslik: Kendine don, iyi hisset.
Slogan: Duygularini anlamak icin kendine alan ac.
Sektor kartlari: Duygusal farkindalik, Gunluk denge, Iliskilerde iletisim
Renk paleti: gece laciverti `#102A43`, mercan `#F26B5B`, sis beyazi `#F7FAFC`, ada cayi `#B8D8D8`

Z-Pattern yerlesimi:

- Sol ust: `#logoText` metin elementi, degeri `EMOVIA`
- Sag ust: `#chatCard` container; `rgba(247, 250, 252, 0.72)` arka plan, `backdrop-filter: blur(18px)` ve ince beyaz kenarlik ile Glassmorphism
- Lead formu: `#isimInput`, `#telefonInput`, `#kaydetButton`, `#durumText`. Sohbet bu sayfada da global widget tarafindan saglanir.
- Alt bolge: `#leadForm`, icinde `#isimInput`, `#telefonInput`, `#kaydetButton`, `#durumText`
- Sektor kartlari: `#sektorRepeater`; kart metni `#sektorText`

Lead formu davranisi:

- Isim en az iki karakter olmali, telefon en az 10 rakam icermeli.
- Mesaj 600 karakterle sinirlidir.
- Basarili kayittan sonra alanlar temizlenir ve kullaniciya onay mesaji gosterilir.

## Arayuz 2: Yonetim paneli (B2B)

F-Pattern yerlesimi:

- Sol ust: `#panelTitle`, degeri `EMOVIA Lead Merkezi`
- Altinda: `#panelStatusText`
- Tablo basliklari: `#nameHeader`, `#phoneHeader`, `#messageHeader`, `#dateHeader`
- Repeater: `#leadRepeater`
- Repeater icindeki elementler: `#leadNameText`, `#leadPhoneText`, `#leadMessageText`, `#leadDateText`

`yonetim-paneli.js`, `/api/leads` cevabini Repeater'a verir. Her nesnede backend tarafindan uretilen `_id` bulunur ve satir ici gosterim icin `$item` kullanilir.

Yonetim paneli her 60 saniyede bir listeyi otomatik yeniler, kayit sayisini ve son guncelleme saatini gosterir. Tarihler `tr-TR` yerel formatinda sunulur.

## Backend sozlesmesi

- `POST /api/sohbet` -> `{ "mesaj": "..." }` -> `{ "cevap": "..." }`
- `POST /api/leads` -> `{ "isim": "...", "telefon": "...", "mesaj": "..." }`
- `GET /api/leads` -> `{ "basari": true, "leadler": [...] }`; her lead `_id`, `isim`, `telefon`, `mesaj`, `tarih` alanlarini tasir

API anahtari Wix'e aktarilmaz; yalnizca Flask sunucusunun `.env` dosyasinda veya Render Environment Variables alaninda tutulur.
