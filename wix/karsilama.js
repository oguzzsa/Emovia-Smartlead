import { fetch } from 'wix-fetch';

const API_BASE_URL = '';
const REQUEST_TIMEOUT_MS = 15000;
const MIN_NAME_LENGTH = 2;
const MIN_PHONE_DIGITS = 10;
const DEFAULT_STATUS = 'Bilgilerini bırak, birlikte bir başlangıç yapalım.';

$w.onReady(function () {
  $w('#durumText').text = DEFAULT_STATUS;
  $w('#kaydetButton').label = 'Güvenle kaydet';
  $w('#isimInput').placeholder = 'Adın soyadın';
  $w('#telefonInput').placeholder = 'Telefon numaran';
  $w('#mesajInput').placeholder = 'Sana nasıl destek olabiliriz?';
  $w('#kaydetButton').onClick(saveLead);
});

function requestWithTimeout(url, options) {
  const request = fetch(url, options);
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('İstek zaman aşımına uğradı.')), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([request, timeout]);
}

function isValidPhone(telefon) {
  const digits = telefon.replace(/\D/g, '');
  return digits.length >= MIN_PHONE_DIGITS;
}

async function saveLead() {
  const isim = $w('#isimInput').value.trim();
  const telefon = $w('#telefonInput').value.trim();
  const mesaj = $w('#mesajInput').value.trim();

  if (isim.length < MIN_NAME_LENGTH) {
    $w('#durumText').text = 'Lütfen en az iki karakterlik bir isim yazmalısın.';
    $w('#isimInput').focus();
    return;
  }

  if (!telefon || !isValidPhone(telefon)) {
    $w('#durumText').text = 'Lütfen geçerli bir telefon numarası yazmalısın.';
    $w('#telefonInput').focus();
    return;
  }

  if (mesaj.length > 600) {
    $w('#durumText').text = 'Mesajını 600 karakterden kısa tutmalısın.';
    $w('#mesajInput').focus();
    return;
  }

  $w('#kaydetButton').disable();
  $w('#durumText').text = 'Bilgilerin güvenle kaydediliyor...';
  try {
    const response = await requestWithTimeout(`${API_BASE_URL}/api/leads`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isim, telefon, mesaj })
    });
    const data = await response.json();
    if (!response.ok || !data.basari) {
      throw new Error(data.message || 'Kayıt sırasında bir sorun oluştu.');
    }
    $w('#durumText').text = 'Bilgilerin güvenle kaydedildi. Teşekkür ederiz.';
    $w('#isimInput').value = '';
    $w('#telefonInput').value = '';
    $w('#mesajInput').value = '';
  } catch (error) {
    $w('#durumText').text = 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar dene.';
  } finally {
    $w('#kaydetButton').enable();
  }
}
