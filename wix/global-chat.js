import { fetch } from 'wix-fetch';
import { local } from 'wix-storage';

const API_URL = 'https://emovia-smartlead.onrender.com/api/sohbet';
const REQUEST_TIMEOUT_MS = 60000;
const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_ITEMS = 6;
const CHAT_STORAGE_KEY = 'emovia-wix-chat-v2';
const WELCOME_MESSAGE = 'Merhaba, ben Emovia. Duyguların veya günlük iyi oluşun hakkında konuşabiliriz.';

let messages = [];
let isSending = false;

$w.onReady(function () {
    console.log('EMOVIA: Wix kodu hazır.');

    setChatOpen(true);
    $w('#box36').expand();
    $w('#box37').expand();
    $w('#box38').expand();
    $w('#button7').onClick(toggleChat);
    $w('#button9').onClick(closeChat);
    $w('#button8').onClick(sendMessage);
    $w('#button8').label = 'Gönder';
    $w('#input1').placeholder = 'Mesajınızı buraya yazın...';

    $w('#input1').onKeyPress((event) => {
        if (event.key === 'Enter' && !isSending) {
            sendMessage();
        }
    });

    $w('#repeater1').onItemReady(($item, itemData) => {
        if (itemData.type === 'user') {
            $item('#box42').show();
            $item('#box41').hide();
            $item('#text44').text = itemData.message;
        } else {
            $item('#box41').show();
            $item('#box42').hide();
            $item('#text43').text = itemData.message;
        }
    });

    messages = loadMessages();
    if (!messages.length) {
        messages = [{
            _id: `${Date.now()}_welcome`,
            type: 'ai',
            message: WELCOME_MESSAGE
        }];
        saveMessages();
    }
    updateRepeater();
});

function toggleChat() {
    setChatOpen($w('#box40').collapsed);
}

function closeChat() {
    setChatOpen(false);
}

function setChatOpen(isOpen) {
    if (isOpen) {
        $w('#box40').expand();
        $w('#box37').expand();
        $w('#box36').expand();
        $w('#box38').expand();
        $w('#button7').collapse();
        $w('#button9').expand();
    } else {
        $w('#box36').collapse();
        $w('#box37').collapse();
        $w('#box40').collapse();
        $w('#button9').collapse();
        $w('#button7').expand();
    }
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
        $w('#button8').disable();
        $w('#input1').disable();
    } else {
        $w('#button8').enable();
        $w('#input1').enable();
    }
}

async function sendMessage() {
    console.log('EMOVIA: SEND MESSAGE ÇALIŞTI');

    if (isSending) {
        return;
    }

    const userMessage = $w('#input1').value.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!userMessage) {
        console.log('EMOVIA: Boş mesaj gönderilmedi.');
        return;
    }

    isSending = true;

    const userId = `${Date.now()}_user`;
    const loadingId = `${Date.now()}_loading`;

    messages.push({ _id: userId, type: 'user', message: userMessage });
    messages.push({ _id: loadingId, type: 'ai', message: 'Emovia düşünüyor...' });
    updateRepeater();

    $w('#input1').value = '';
    setBusy(true);

    try {
        console.log('EMOVIA: API isteği gönderiliyor:', API_URL);

        const response = await requestWithTimeout(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesaj: userMessage,
                gecmis: messages
                    .filter((item) => item._id !== userId && item._id !== loadingId)
                    .slice(-MAX_HISTORY_ITEMS)
                    .map((item) => ({
                        role: item.type === 'user' ? 'user' : 'assistant',
                        content: item.message
                    }))
            })
        });

        console.log('EMOVIA: API yanıtı:', response.status);
        const data = await response.json();
        messages = messages.filter((item) => item._id !== loadingId);

        if (!response.ok || !data.basari) {
            throw new Error(data.cevap || data.error || 'Sunucudan yanıt alınamadı.');
        }

        const reply = data.cevap || data.reply || data.message || 'Yanıt alınamadı.';
        messages.push({
            _id: `${Date.now()}_ai`,
            type: 'ai',
            message: reply
        });
        saveMessages();
    } catch (error) {
        console.error('EMOVIA: API HATASI:', error);
        messages = messages.filter((item) => item._id !== loadingId);
        messages.push({
            _id: `${Date.now()}_error`,
            type: 'ai',
            message: getFriendlyError(error)
        });
        saveMessages();
    } finally {
        updateRepeater();
        setBusy(false);
        isSending = false;
        $w('#input1').focus();
    }
}

function updateRepeater() {
    $w('#repeater1').data = messages.slice(-MAX_HISTORY_ITEMS);
    scrollMessagesToBottom();
}

function scrollMessagesToBottom() {
    setTimeout(() => {
        $w('#box38').scrollTo();
    }, 100);
}

function loadMessages() {
    try {
        const stored = JSON.parse(local.getItem(CHAT_STORAGE_KEY) || '[]');
        return Array.isArray(stored)
            ? stored.filter((item) => item && (item.type === 'user' || item.type === 'ai'))
            : [];
    } catch (error) {
        console.warn('EMOVIA: Sohbet geçmişi okunamadı.', error);
        return [];
    }
}

function saveMessages() {
    try {
        local.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY_ITEMS)));
    } catch (error) {
        console.warn('EMOVIA: Sohbet geçmişi kaydedilemedi.', error);
    }
}

function getFriendlyError(error) {
    const message = error && error.message ? error.message : '';

    if (message.includes('zaman aşım')) {
        return 'Sunucu geç yanıt veriyor. Lütfen birkaç saniye sonra tekrar deneyin.';
    }

    if (message.includes('AI sağlayıcısı')) {
        return 'Emovia şu anda yanıt üretemiyor. Lütfen biraz sonra tekrar deneyin.';
    }

    return 'Mesajınız şu anda gönderilemedi. Lütfen tekrar deneyin.';
}
