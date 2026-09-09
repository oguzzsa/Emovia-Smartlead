import { fetch } from 'wix-fetch';

const API_BASE_URL = '';
const REQUEST_TIMEOUT_MS = 15000;
const REFRESH_INTERVAL_MS = 60000;

$w.onReady(async function () {
  $w('#panelTitle').text = 'EMOVIA Lead Merkezi';
  $w('#panelStatusText').text = 'Kayıtlar yükleniyor...';
  await loadLeads();
  setInterval(loadLeads, REFRESH_INTERVAL_MS);
});

function requestWithTimeout(url, options) {
  const request = fetch(url, options);
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('İstek zaman aşımına uğradı.')), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([request, timeout]);
}

async function loadLeads() {
  try {
    const response = await requestWithTimeout(`${API_BASE_URL}/api/leads`, { method: 'get' });
    const data = await response.json();
    if (!response.ok || !data.basari) {
      throw new Error('Lead kayıtları alınamadı.');
    }
    const leads = Array.isArray(data.leadler) ? data.leadler : [];

    $w('#leadRepeater').onItemReady(($item, itemData) => {
      $item('#leadNameText').text = itemData.isim || '-';
      $item('#leadPhoneText').text = itemData.telefon || '-';
      $item('#leadMessageText').text = itemData.mesaj || '-';
      $item('#leadDateText').text = formatDate(itemData.tarih);
    });
    $w('#leadRepeater').data = leads;
    $w('#panelStatusText').text = leads.length
      ? `${leads.length} kayıt bulundu · Son güncelleme: ${formatTime(new Date())}`
      : 'Henüz kayıt bulunmuyor.';
  } catch (error) {
    $w('#panelStatusText').text = 'Kayıtlar yüklenemedi. Lütfen tekrar deneyin.';
  }
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatTime(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}
