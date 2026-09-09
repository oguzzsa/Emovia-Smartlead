import { fetch } from 'wix-fetch';
import { local } from 'wix-storage';


const API_BASE_URL = '';

const CHAT_STORAGE_KEY = 'emovia-chat-history-v1';
const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_ITEMS = 6;
const REQUEST_TIMEOUT_MS = 20000;

const DEFAULT_STATUS = 'Nasıl yardımcı olabilirim?';
const THINKING_STATUS = 'Emovia düşünüyor...';
const ERROR_STATUS = 'Şu anda bağlantı kurulamadı.';

$w.onReady(function () {

    // Chat başlangıçta açık
    $w('#emoviaChatPanel').expand();

    // Başlangıç metinleri
    $w('#emoviaChatTitle1').text = 'EMOVIA';
    $w('#emoviaChatIntro').text = 'Nasıl yardımcı olabilirim?';
    $w('#emoviaChatStatus').text = DEFAULT_STATUS;

    $w('#emoviaChatAnswer').text =
        'Duygularını, günlük dengeni veya kafandaki soruları paylaşabilirsin.';

    $w('#emoviaChatInput').placeholder = 'Mesajını buraya yaz...';
    $w('#emoviaChatInput').maxLength = MAX_MESSAGE_LENGTH;

    $w('#emoviaChatAskButton').label = 'Sor';
    $w('#emoviaChatOpenButton').label =
        'EMOVIA\nNasıl yardımcı olabilirim?';

    // Önceki konuşmayı getir
    restoreLastConversation();

    // Buton olayları
    $w('#emoviaChatOpenButton').onClick(openChat);
    $w('#emoviaChatCloseButton').onClick(closeChat);
    $w('#emoviaChatAskButton').onClick(askEmovia);

    // Enter ile mesaj gönderme
    $w('#emoviaChatInput').onKeyPress((event) => {
        if (event.key === 'Enter') {
            askEmovia();
        }
    });
});


/* =========================
   CHAT AÇ
========================= */

function openChat() {

    $w('#emoviaChatOpenButton').collapse();

    $w('#emoviaChatPanel').expand();

    $w('#emoviaChatTitle1').expand();
    $w('#emoviaChatIntro').expand();
    $w('#emoviaChatStatus').expand();
    $w('#emoviaChatAnswer').expand();
    $w('#emoviaChatInput').expand();
    $w('#emoviaChatAskButton').expand();
    $w('#emoviaChatCloseButton').expand();

    $w('#emoviaChatInput').focus();
}


/* =========================
   CHAT KAPAT
========================= */

function closeChat() {

    $w('#emoviaChatPanel').collapse();

    $w('#emoviaChatTitle1').collapse();
    $w('#emoviaChatIntro').collapse();
    $w('#emoviaChatStatus').collapse();
    $w('#emoviaChatAnswer').collapse();
    $w('#emoviaChatInput').collapse();
    $w('#emoviaChatAskButton').collapse();
    $w('#emoviaChatCloseButton').collapse();

    $w('#emoviaChatOpenButton').expand();
}


/* =========================
   ÖNCEKİ KONUŞMAYI GETİR
========================= */

function restoreLastConversation() {

    const history = readHistory();

    const lastAssistantMessage =
        [...history]
            .reverse()
            .find((item) => item.role === 'assistant');

    if (lastAssistantMessage) {

        $w('#emoviaChatAnswer').text =
            lastAssistantMessage.content;

        $w('#emoviaChatStatus').text =
            'Kaldığımız yerden devam edebiliriz.';
    }
}


/* =========================
   GEÇMİŞİ OKU
========================= */

function readHistory() {

    try {

        const storedHistory =
            JSON.parse(
                local.getItem(CHAT_STORAGE_KEY) || '[]'
            );

        return Array.isArray(storedHistory)
            ? storedHistory.filter(
                (item) =>
                    item &&
                    (
                        item.role === 'user' ||
                        item.role === 'assistant'
                    )
            )
            : [];

    } catch (error) {

        return [];
    }
}


/* =========================
   GEÇMİŞİ KAYDET
========================= */

function saveHistory(history) {

    try {

        local.setItem(
            CHAT_STORAGE_KEY,
            JSON.stringify(
                history.slice(-MAX_HISTORY_ITEMS)
            )
        );

    } catch (error) {

        // Storage kullanılamazsa chatbot çalışmaya devam eder.
    }
}


/* =========================
   GEÇMİŞE MESAJ EKLE
========================= */

function addToHistory(role, content) {

    const history = readHistory();

    history.push({
        role: role,
        content: content
    });

    saveHistory(history);
}


/* =========================
   TIMEOUT İLE FETCH
========================= */

function requestWithTimeout(url, options) {

    const request = fetch(url, options);

    const timeout = new Promise((resolve, reject) => {

        setTimeout(() => {

            reject(
                new Error(
                    'İstek zaman aşımına uğradı.'
                )
            );

        }, REQUEST_TIMEOUT_MS);
    });

    return Promise.race([
        request,
        timeout
    ]);
}


/* =========================
   CHAT MEŞGUL / HAZIR
========================= */

function setBusy(isBusy) {

    if (isBusy) {

        $w('#emoviaChatAskButton').disable();
        $w('#emoviaChatInput').disable();

        $w('#emoviaChatStatus').text =
            THINKING_STATUS;

        return;
    }

    $w('#emoviaChatAskButton').enable();
    $w('#emoviaChatInput').enable();
}


/* =========================
   EMOVIA'YA SOR
========================= */

async function askEmovia() {

    console.log('EMOVIA: Mesaj gönderme başladı.');

    const mesaj =
        $w('#emoviaChatInput')
            .value
            .trim()
            .slice(0, MAX_MESSAGE_LENGTH);

    // Boş mesaj kontrolü
    if (!mesaj) {

        $w('#emoviaChatStatus').text =
            DEFAULT_STATUS;

        $w('#emoviaChatInput').focus();

        return;
    }

    setBusy(true);

    $w('#emoviaChatAnswer').text =
        'Mesajını dikkatle okuyorum...';

    addToHistory(
        'user',
        mesaj
    );

    try {

        const gecmis =
            readHistory()
                .slice(-MAX_HISTORY_ITEMS);

        const endpoint =
            `${API_BASE_URL}/api/sohbet`;

        console.log(
            'EMOVIA: Render isteği gönderiliyor:',
            endpoint
        );

        const response =
            await requestWithTimeout(
                endpoint,
                {
                    method: 'post',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        mesaj: mesaj,
                        gecmis: gecmis
                    })
                }
            );

        console.log(
            'EMOVIA: Render response:',
            response.status
        );

        const data =
            await response.json();

        console.log(
            'EMOVIA: Backend cevabı:',
            data
        );

        if (
            !response.ok ||
            !data.basari
        ) {

            throw new Error(
                data.cevap ||
                'Yanıt alınamadı.'
            );
        }

        // Cevabı ekrana yaz
        $w('#emoviaChatAnswer').text =
            data.cevap ||
            'Şu anda yanıt veremiyoruz.';

        $w('#emoviaChatStatus').text =
            'Başka bir konuda da yanındayım.';

        // Assistant mesajını kaydet
        addToHistory(
            'assistant',
            data.cevap ||
            'Şu anda yanıt veremiyoruz.'
        );

        // Input temizle
        $w('#emoviaChatInput').value = '';

    } catch (error) {

        console.error(
            'EMOVIA CHAT HATASI:',
            error
        );

        $w('#emoviaChatAnswer').text =
            'Yanıtını şu anda getiremiyorum. Lütfen biraz sonra tekrar dene.';

        $w('#emoviaChatStatus').text =
            ERROR_STATUS;

    } finally {

        setBusy(false);

        $w('#emoviaChatInput').focus();
    }
}