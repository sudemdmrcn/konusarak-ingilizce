// script.js
// Basit ses -> metin -> düzeltme -> konuşma akışı
// Not: SpeechRecognition yalnızca secure origin (https / localhost) ve destekleyen tarayıcılarda çalışır.

const btnStart = document.getElementById('btnStart');
const btnText = document.getElementById('btnText');
const micIcon = document.getElementById('micIcon');
const btnPlay = document.getElementById('btnPlay');
const transcriptEl = document.getElementById('transcript');
const correctedEl = document.getElementById('corrected');
const suggestionsEl = document.getElementById('suggestions');
const langSelect = document.getElementById('langSelect');

let recognizing = false;
let recognition = null;
let finalTranscript = '';

// Initialize SpeechRecognition (cross-browser)
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Tarayıcınız Web Speech API (SpeechRecognition) desteklemiyor. Chrome tabanlı bir tarayıcı deneyin.');
    return null;
  }
  const r = new SpeechRecognition();
  r.continuous = false; // tek cümle için false daha iyi
  r.interimResults = true;
  r.lang = langSelect.value;
  return r;
}

function startRecognition() {
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;

  finalTranscript = '';
  transcriptEl.value = '';
  correctedEl.value = '';
  suggestionsEl.innerHTML = '';

  recognition.lang = langSelect.value;
  recognition.start();
  recognizing = true;
  btnStart.classList.add('recording');
  micIcon.textContent = '🔴';
  btnText.textContent = 'Dinliyor... (Durmak için tıkla)';
  btnPlay.disabled = true;
}

function stopRecognition() {
  if (recognition) recognition.stop();
  recognizing = false;
  btnStart.classList.remove('recording');
  micIcon.textContent = '🎤';
  btnText.textContent = 'Başlat';
}

// Events
btnStart.addEventListener('click', () => {
  if (recognizing) {
    stopRecognition();
  } else {
    startRecognition();
  }
});

// create or re-create on language change
langSelect.addEventListener('change', () => {
  if (recognition) recognition.lang = langSelect.value;
});

recognition = initRecognition();
if (recognition) {
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    transcriptEl.value = (finalTranscript + interim).trim();
  };

  recognition.onerror = (e) => {
    console.error('Recognition error', e);
    stopRecognition();
  };

  recognition.onend = async () => {
    recognizing = false;
    btnStart.classList.remove('recording');
    micIcon.textContent = '🎤';
    btnText.textContent = 'Başlat';
    if (transcriptEl.value.trim()) {
      // 1) Basit otomatik düzeltme
      const auto = simpleAutoFix(transcriptEl.value);
      correctedEl.value = auto;
      // 2) LanguageTool ile daha güçlü kontrol isteğe bağlı
      await checkWithLanguageTool(auto);
      btnPlay.disabled = false;
    }
  };
}

// Basit otomatik düzeltmeler — çevrimdışı fallback
function simpleAutoFix(text) {
  let s = text.trim();
  // Tekil büyük I düzelt
  s = s.replace(/\bi\b/g, 'I');
  // Fazla boşlukları temizle
  s = s.replace(/\s{2,}/g, ' ');
  // Cümlenin ilk harfini büyük yap
  s = s.replace(/^[a-z]/, (m) => m.toUpperCase());
  // yaygın kısaltma hataları (örnek)
  s = s.replace(/\bisnt\b/gi, "isn't");
  s = s.replace(/\bdont\b/gi, "don't");
  s = s.replace(/\bdoesnt\b/gi, "doesn't");
  return s;
}

// LanguageTool API ile kontrol (Ücretsiz endpoint, CORS olabilir — eğer CORS hatası alırsanız backend proxy kullanmanız gerekir)
async function checkWithLanguageTool(text) {
  suggestionsEl.innerHTML = 'Kontrol ediliyor...';
  try {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'en-US');

    const resp = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: params.toString()
    });

    if (!resp.ok) {
      throw new Error('LanguageTool yanıtı başarısız: ' + resp.status);
    }

    const data = await resp.json();
    // Eğer hata yoksa data.matches içinde öneriler olacak
    if (!data.matches || data.matches.length === 0) {
      suggestionsEl.innerHTML = '<em>Dilbilgisi hatası bulunamadı.</em>';
      correctedEl.value = text;
      return;
    }

    // Uygulama: her match için öneri göster, otomatik olarak (en uygun öneriyi) uygula
    const suggestions = [];
    let fixed = text;
    // Önerileri sondan başa uygula ki index kayması olmasın
    const matches = data.matches.sort((a,b)=>b.offset - a.offset);
    for (const m of matches) {
      const from = m.offset;
      const to = m.offset + m.length;
      const replacement = (m.replacements && m.replacements[0] && m.replacements[0].value) || null;
      suggestions.push({message: m.message, short: m.shortMessage, replacement, context: m.context && m.context.text});
      if (replacement) {
        fixed = fixed.slice(0, from) + replacement + fixed.slice(to);
      }
    }

    correctedEl.value = fixed;
    // Göster
    suggestionsEl.innerHTML = suggestions.map(s => {
      const rep = s.replacement ? `<strong>Öneri:</strong> "${escapeHtml(s.replacement)}"` : '<em>Öneri yok</em>';
      return `<div style="margin-bottom:8px"><div><strong>Mesaj:</strong> ${escapeHtml(s.message)}</div><div>${rep}</div></div>`;
    }).join('');
  } catch (err) {
    console.warn('LanguageTool hatası veya CORS:', err);
    suggestionsEl.innerHTML = '<em>LanguageTool kontrolü başarısız oldu — yerel basit düzeltme kullanıldı.</em>';
  }
}

// Dinleme (düzeltmeyi konuşma)
btnPlay.addEventListener('click', () => {
  const text = correctedEl.value.trim() || transcriptEl.value.trim();
  if (!text) return;
  speakText(text, langSelect.value);
});

// Basit TTS (konuşma)
function speakText(text, lang) {
  if (!('speechSynthesis' in window)) {
    alert('Tarayıcınız speechSynthesis (konuşma) desteği sunmuyor.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang || 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Güvenli HTML gösterimi için küçük kaçış
function escapeHtml(str) {
  return str.replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[s]));
}
