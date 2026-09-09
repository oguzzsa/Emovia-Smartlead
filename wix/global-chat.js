import { fetch } from 'wix-fetch';
import { local } from 'wix-storage';

const API_BASE_URL = 'https://YOUR-EMOVIA-API.onrender.com';
const CHAT_STORAGE_KEY = 'emovia-chat-history-v1';
const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_ITEMS = 6;
const REQUEST_TIMEOUT_MS = 20000;
const DEFAULT_STATUS = 'Nasıl yardımcı olabilirim?';
const THINKING_STATUS = 'Emovia düşünüyor...';
const ERROR_STATUS = 'Şu anda bağlantı kurulamadı.';

$w.onReady(function () {
  $w('#emoviaChatPanel').collapse();
  $w('#emoviaChatTitle').text = 'EMOVIA';
  $w('#emoviaChatIntro').text = 'Nasıl yardımcı olabilirim?';
  $w('#emoviaChatStatus').text = DEFAULT_STATUS;
  $w('#emoviaChatAnswer').text = 'Duygularını, günlük dengeni veya kafandaki soruları paylaşabilirsin.';
  $w('#emoviaChatInput').placeholder = 'Mesajını buraya yaz...';
  $w('#emoviaChatInput').maxLength = MAX_MESSAGE_LENGTH;
  $w('#emoviaChatAskButton').label = 'Sor';
  $w('#emoviaChatOpenButton').label = 'EMOVIA\nNasıl yardımcı olabilirim?';
  restoreLastConversation();
  $w('#emoviaChatOpenButton').onClick(openChat);
  $w('#emoviaChatCloseButton').onClick(closeChat);
  $w('#emoviaChatAskButton').onClick(askEmovia);
  $w('#emoviaChatInput').onKeyPress((event) => {
    if (event.key === 'Enter') {
      askEmovia();
    }
  });
});

function openChat() {
  $w('#emoviaChatOpenButton').collapse();
  $w('#emoviaChatPanel').expand();
  $w('#emoviaChatInput').focus();
}

function closeChat() {
  $w('#emoviaChatPanel').collapse();
  $w('#emoviaChatOpenButton').expand();
}

function restoreLastConversation() {
  const history = readHistory();
  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant');
  if (lastAssistantMessage) {
    $w('#emoviaChatAnswer').text = lastAssistantMessage.content;
    $w('#emoviaChatStatus').text = 'Kaldığımız yerden devam edebiliriz.';
  }
}

function readHistory() {
  try {
    const storedHistory = JSON.parse(local.getItem(CHAT_STORAGE_KEY) || '[]');
    return Array.isArray(storedHistory)
      ? storedHistory.filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
      : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  try {
    local.setItem(CHAT_STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY_ITEMS)));
  } catch (error) {
    // Storage is optional; the chat should still work when it is unavailable.
  }
}

function addToHistory(role, content) {
  const history = readHistory();
  history.push({ role, content });
  saveHistory(history);
}

function requestWithTimeout(url, options) {
  const request = fetch(url, options);
  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('İstek zaman aşımına uğradı.')), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([request, timeout]);
}

function setBusy(isBusy) {
  if (isBusy) {
    $w('#emoviaChatAskButton').disable();
    $w('#emoviaChatInput').disable();
    $w('#emoviaChatStatus').text = THINKING_STATUS;
    return;
  }

  $w('#emoviaChatAskButton').enable();
  $w('#emoviaChatInput').enable();
}

async function askEmovia() {
  const mesaj = $w('#emoviaChatInput').value.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!mesaj) {
    $w('#emoviaChatStatus').text = DEFAULT_STATUS;
    $w('#emoviaChatInput').focus();
    return;
  }

  setBusy(true);
  $w('#emoviaChatAnswer').text = 'Mesajını dikkatle okuyorum...';
  addToHistory('user', mesaj);

  try {
    const gecmis = readHistory().slice(-MAX_HISTORY_ITEMS);
    const response = await requestWithTimeout(`${API_BASE_URL}/api/sohbet`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesaj, gecmis })
    });
    const data = await response.json();
    if (!response.ok || !data.basari) {
      throw new Error(data.cevap || 'Yanıt alınamadı.');
    }
    $w('#emoviaChatAnswer').text = data.cevap || 'Şu anda yanıt veremiyoruz.';
    $w('#emoviaChatStatus').text = 'Başka bir konuda da yanındayım.';
    addToHistory('assistant', data.cevap || 'Şu anda yanıt veremiyoruz.');
    $w('#emoviaChatInput').value = '';
  } catch (error) {
    $w('#emoviaChatAnswer').text = 'Yanıtını şu anda getiremiyorum. Lütfen biraz sonra tekrar dene.';
    $w('#emoviaChatStatus').text = ERROR_STATUS;
  } finally {
    setBusy(false);
    $w('#emoviaChatInput').focus();
  }
}
