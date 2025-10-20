// script.js
// Basit ses -> metin -> düzeltme -> konuşma akışı
// Not: SpeechRecognition yalnızca secure origin (https / localhost) ve destekleyen tarayıcılarda çalışır.

// const btnStart = document.getElementById('btnStart');
// const btnText = document.getElementById('btnText');
// const micIcon = document.getElementById('micIcon');
// const btnPlay = document.getElementById('btnPlay');
// const transcriptEl = document.getElementById('transcript');
// const correctedEl = document.getElementById('corrected');
// const suggestionsEl = document.getElementById('suggestions');
// const langSelect = document.getElementById('langSelect');

// let recognizing = false;
// let recognition = null;
// let finalTranscript = '';

// // Initialize SpeechRecognition (cross-browser)
// function initRecognition() {
//   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//   if (!SpeechRecognition) {
//     alert('Tarayıcınız Web Speech API (SpeechRecognition) desteklemiyor. Chrome tabanlı bir tarayıcı deneyin.');
//     return null;
//   }
//   const r = new SpeechRecognition();
//   r.continuous = false; // tek cümle için false daha iyi
//   r.interimResults = true;
//   r.lang = langSelect.value;
//   return r;
// }

// function startRecognition() {
//   if (!recognition) recognition = initRecognition();
//   if (!recognition) return;

//   finalTranscript = '';
//   transcriptEl.value = '';
//   correctedEl.value = '';
//   suggestionsEl.innerHTML = '';

//   recognition.lang = langSelect.value;
//   recognition.start();
//   recognizing = true;
//   btnStart.classList.add('recording');
//   micIcon.textContent = '🔴';
//   btnText.textContent = 'Dinliyor... (Durmak için tıkla)';
//   btnPlay.disabled = true;
// }

// function stopRecognition() {
//   if (recognition) recognition.stop();
//   recognizing = false;
//   btnStart.classList.remove('recording');
//   micIcon.textContent = '🎤';
//   btnText.textContent = 'Başlat';
// }

// // Events
// btnStart.addEventListener('click', () => {
//   if (recognizing) {
//     stopRecognition();
//   } else {
//     startRecognition();
//   }
// });

// // create or re-create on language change
// langSelect.addEventListener('change', () => {
//   if (recognition) recognition.lang = langSelect.value;
// });

// recognition = initRecognition();
// if (recognition) {
//   recognition.onresult = (event) => {
//     let interim = '';
//     for (let i = event.resultIndex; i < event.results.length; ++i) {
//       const transcript = event.results[i][0].transcript;
//       if (event.results[i].isFinal) {
//         finalTranscript += transcript + ' ';
//       } else {
//         interim += transcript;
//       }
//     }
//     transcriptEl.value = (finalTranscript + interim).trim();
//   };

//   recognition.onerror = (e) => {
//     console.error('Recognition error', e);
//     stopRecognition();
//   };

//   recognition.onend = async () => {
//     recognizing = false;
//     btnStart.classList.remove('recording');
//     micIcon.textContent = '🎤';
//     btnText.textContent = 'Başlat';
//     if (transcriptEl.value.trim()) {
//       // 1) Basit otomatik düzeltme
//       const auto = simpleAutoFix(transcriptEl.value);
//       correctedEl.value = auto;
//       // 2) LanguageTool ile daha güçlü kontrol isteğe bağlı
//       await checkWithLanguageTool(auto);
//       btnPlay.disabled = false;
//     }
//   };
// }

// // Basit otomatik düzeltmeler — çevrimdışı fallback
// function simpleAutoFix(text) {
//   let s = text.trim();
//   // Tekil büyük I düzelt
//   s = s.replace(/\bi\b/g, 'I');
//   // Fazla boşlukları temizle
//   s = s.replace(/\s{2,}/g, ' ');
//   // Cümlenin ilk harfini büyük yap
//   s = s.replace(/^[a-z]/, (m) => m.toUpperCase());
//   // yaygın kısaltma hataları (örnek)
//   s = s.replace(/\bisnt\b/gi, "isn't");
//   s = s.replace(/\bdont\b/gi, "don't");
//   s = s.replace(/\bdoesnt\b/gi, "doesn't");
//   return s;
// }

// // LanguageTool API ile kontrol (Ücretsiz endpoint, CORS olabilir — eğer CORS hatası alırsanız backend proxy kullanmanız gerekir)
// async function checkWithLanguageTool(text) {
//   suggestionsEl.innerHTML = 'Kontrol ediliyor...';
//   try {
//     const params = new URLSearchParams();
//     params.append('text', text);
//     params.append('language', 'en-US');

//     const resp = await fetch('https://api.languagetool.org/v2/check', {
//       method: 'POST',
//       headers: {'Content-Type': 'application/x-www-form-urlencoded'},
//       body: params.toString()
//     });

//     if (!resp.ok) {
//       throw new Error('LanguageTool yanıtı başarısız: ' + resp.status);
//     }

//     const data = await resp.json();
//     // Eğer hata yoksa data.matches içinde öneriler olacak
//     if (!data.matches || data.matches.length === 0) {
//       suggestionsEl.innerHTML = '<em>Dilbilgisi hatası bulunamadı.</em>';
//       correctedEl.value = text;
//       return;
//     }

//     // Uygulama: her match için öneri göster, otomatik olarak (en uygun öneriyi) uygula
//     const suggestions = [];
//     let fixed = text;
//     // Önerileri sondan başa uygula ki index kayması olmasın
//     const matches = data.matches.sort((a,b)=>b.offset - a.offset);
//     for (const m of matches) {
//       const from = m.offset;
//       const to = m.offset + m.length;
//       const replacement = (m.replacements && m.replacements[0] && m.replacements[0].value) || null;
//       suggestions.push({message: m.message, short: m.shortMessage, replacement, context: m.context && m.context.text});
//       if (replacement) {
//         fixed = fixed.slice(0, from) + replacement + fixed.slice(to);
//       }
//     }

//     correctedEl.value = fixed;
//     // Göster
//     suggestionsEl.innerHTML = suggestions.map(s => {
//       const rep = s.replacement ? `<strong>Öneri:</strong> "${escapeHtml(s.replacement)}"` : '<em>Öneri yok</em>';
//       return `<div style="margin-bottom:8px"><div><strong>Mesaj:</strong> ${escapeHtml(s.message)}</div><div>${rep}</div></div>`;
//     }).join('');
//   } catch (err) {
//     console.warn('LanguageTool hatası veya CORS:', err);
//     suggestionsEl.innerHTML = '<em>LanguageTool kontrolü başarısız oldu — yerel basit düzeltme kullanıldı.</em>';
//   }
// }

// // Dinleme (düzeltmeyi konuşma)
// btnPlay.addEventListener('click', () => {
//   const text = correctedEl.value.trim() || transcriptEl.value.trim();
//   if (!text) return;
//   speakText(text, langSelect.value);
// });

// // Basit TTS (konuşma)
// function speakText(text, lang) {
//   if (!('speechSynthesis' in window)) {
//     alert('Tarayıcınız speechSynthesis (konuşma) desteği sunmuyor.');
//     return;
//   }
//   const utter = new SpeechSynthesisUtterance(text);
//   utter.lang = lang || 'en-US';
//   speechSynthesis.cancel();
//   speechSynthesis.speak(utter);
// }

// // Güvenli HTML gösterimi için küçük kaçış
// function escapeHtml(str) {
//   return str.replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[s]));
// }



























// script.js (gelişmiş): history, seviye tahmini, değişen kısımları vurgulama
const btnStart = document.getElementById('btnStart');
const btnText = document.getElementById('btnText');
const micIcon = document.getElementById('micIcon');
const btnPlay = document.getElementById('btnPlay');
const btnSave = document.getElementById('btnSave');
const transcriptEl = document.getElementById('transcript');
const correctedDiv = document.getElementById('corrected');
const correctedWrap = document.getElementById('correctedWrap');
const suggestionsEl = document.getElementById('suggestions');
const langSelect = document.getElementById('langSelect');
const historyListEl = document.getElementById('historyList');
const levelBadge = document.getElementById('levelBadge');

let recognizing = false;
let recognition = null;
let finalTranscript = '';

let history = []; // {original, corrected, suggestions, level, time}

// --- SpeechRecognition init ---
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Tarayıcınız SpeechRecognition desteklemiyor. Chrome tabanlı bir tarayıcı deneyin.');
    return null;
  }
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = true;
  r.lang = langSelect.value;
  return r;
}

function startRecognition() {
  if (!recognition) recognition = initRecognition();
  if (!recognition) return;
  finalTranscript = '';
  transcriptEl.value = '';
  correctedDiv.innerHTML = '';
  suggestionsEl.innerHTML = '';
  recognition.lang = langSelect.value;
  recognition.start();
  recognizing = true;
  btnStart.classList.add('recording');
  micIcon.textContent = '🔴';
  btnText.textContent = 'Dinliyor... (Durmak için tıkla)';
  btnPlay.disabled = true;
  btnSave.disabled = true;
}

function stopRecognition() {
  if (recognition) recognition.stop();
  recognizing = false;
  btnStart.classList.remove('recording');
  micIcon.textContent = '🎤';
  btnText.textContent = 'Başlat';
}

btnStart.addEventListener('click', () => {
  if (recognizing) stopRecognition();
  else startRecognition();
});

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
    const orig = transcriptEl.value.trim();
    if (orig) {
      const auto = simpleAutoFix(orig);
      // dil-check (LanguageTool) - hata olursa fallback
      const ltResult = await checkWithLanguageTool(auto);
      // ltResult: {fixed, matches} veya null (hata)
      const fixed = ltResult && ltResult.fixed ? ltResult.fixed : auto;
      const matches = ltResult && ltResult.matches ? ltResult.matches : [];
      // vurgulu gösterim için diff
      const highlightedHtml = highlightDiffTokens(auto, fixed);
      correctedDiv.innerHTML = highlightedHtml;
      // suggestions göster
      renderSuggestions(matches);
      // seviye tahmini
      const level = estimateLevel(auto, fixed);
      levelBadge.textContent = `Seviye: ${level}`;
      // enable play/save
      btnPlay.disabled = false;
      btnSave.disabled = false;

      // Geçici otomatik kaydetme opsiyonel: biz kaydetme butonuyla kontrol ediyoruz
      // (İstersen burada history.push(...) ile otomatik ekleyebilirsin)
    }
  };
}

// ------------------ Basit otomatik düzeltme (fallback) ------------------
function simpleAutoFix(text) {
  let s = text.trim();
  s = s.replace(/\bi\b/g, 'I');
  s = s.replace(/\s{2,}/g, ' ');
  s = s.replace(/^[a-z]/, (m) => m.toUpperCase());
  s = s.replace(/\bisnt\b/gi, "isn't");
  s = s.replace(/\bdont\b/gi, "don't");
  s = s.replace(/\bdoesnt\b/gi, "doesn't");
  return s;
}

// ------------------ LanguageTool kullanımı (isteğe bağlı) ------------------
// Döndürülen değer: { fixed: "...", matches: [ ... ] }
// Eğer hataysa null döner.
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

    if (!resp.ok) throw new Error('LanguageTool yanıtı başarısız: ' + resp.status);
    const data = await resp.json();
    // build fixed using replacements (uygula)
    let fixed = text;
    if (data.matches && data.matches.length > 0) {
      // matches'i sondan başa uygula
      const matches = data.matches.sort((a,b)=>b.offset - a.offset);
      for (const m of matches) {
        const rep = (m.replacements && m.replacements[0] && m.replacements[0].value) || null;
        if (rep) {
          fixed = fixed.slice(0, m.offset) + rep + fixed.slice(m.offset + m.length);
        }
      }
    }
    // return matches for suggestions / stats
    return { fixed, matches: data.matches || [] };
  } catch (err) {
    console.warn('LanguageTool hatası veya CORS:', err);
    suggestionsEl.innerHTML = '<em>LanguageTool kullanılamadı — basit düzeltme gösterildi.</em>';
    return null;
  }
}

// ------------------ Suggestions gösterimi ------------------
function renderSuggestions(matches) {
  if (!matches || matches.length === 0) {
    suggestionsEl.innerHTML = '<em>Dilbilgisi hatası bulunamadı.</em>';
    return;
  }
  const lines = matches.map(m => {
    const rep = (m.replacements && m.replacements[0] && m.replacements[0].value) ? `Öneri: "${escapeHtml(m.replacements[0].value)}"` : 'Öneri yok';
    return `<div style="margin-bottom:8px"><div><strong>Hata:</strong> ${escapeHtml(m.message)}</div><div>${rep}</div></div>`;
  });
  suggestionsEl.innerHTML = lines.join('');
}

// ------------------ Kelime düzeyi diff + vurgulama ------------------
// Yaklaşım: token'ları ayır, LCS (longest common subsequence) ile eşleşen tokenları bul, kalan tokenları "changed" olarak işaretle.
function tokenizeForDiff(s) {
  // kelime ve noktalama biçiminde ayrım
  return s.match(/\b[\w']+\b|[.,!?;:"()\-]/g) || [];
}

function highlightDiffTokens(original, fixed) {
  const a = tokenizeForDiff(original);
  const b = tokenizeForDiff(fixed);
  const lcs = buildLCS(a, b);

  // lcs array of tokens which are common in order
  let i = 0, j = 0, k = 0;
  const out = [];

  while (i < a.length || j < b.length) {
    if (k < lcs.length && i < a.length && j < b.length && a[i] === lcs[k] && b[j] === lcs[k]) {
      // unchanged token from both sides -> render original (or fixed)
      out.push(escapeHtml(b[j]));
      i++; j++; k++;
    } else {
      // if b[j] is changed or inserted -> mark as changed (use fixed token display)
      if (j < b.length && (k >= lcs.length || b[j] !== lcs[k])) {
        out.push(`<span class="changed">${escapeHtml(b[j])}</span>`);
        j++;
        continue;
      }
      // if a[i] was deleted (exists in original but not in fixed) -> skip or show strike (opted to skip)
      if (i < a.length && (k >= lcs.length || a[i] !== lcs[k])) {
        // we can optionally show deletions as faded; skip for clarity
        i++;
        continue;
      }
    }
  }

  // join with spaces but keep punctuation attached: try to produce natural spacing
  // simple rule: if token is punctuation, don't add space before it
  const joined = out.reduce((acc, tok) => {
    // tok is either raw string like "Hello" or '<span...>word</span>'
    const plain = tok.replace(/<[^>]*>/g,'');
    const isPunct = /^[.,!?;:"()\-]$/.test(plain);
    if (acc === '') return tok;
    if (isPunct) return acc + tok; // no space before punctuation
    return acc + ' ' + tok;
  }, '');

  return joined;
}

// LCS (Longest Common Subsequence) on arrays (DP)
function buildLCS(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({length: n+1}, () => Array(m+1).fill(0));
  for (let i= n-1; i>=0; --i) {
    for (let j= m-1; j>=0; --j) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i+1][j+1];
      else dp[i][j] = Math.max(dp[i+1][j], dp[i][j+1]);
    }
  }
  // reconstruct sequence
  let i = 0, j = 0;
  const res = [];
  while (i<n && j<m) {
    if (a[i] === b[j]) { res.push(a[i]); i++; j++; }
    else if (dp[i+1][j] >= dp[i][j+1]) i++;
    else j++;
  }
  return res;
}

// ------------------ Seviye tahmini (basit heuristics) ------------------
// Hata oranı = (changed_token_count) / (total_token_count)
// Eşikler (örnek): > 0.20 -> Beginner, 0.05-0.20 -> Intermediate, <0.05 -> Advanced
function estimateLevel(original, fixed) {
  const a = tokenizeForDiff(original);
  const b = tokenizeForDiff(fixed);
  // compute LCS length -> unchanged tokens
  const lcs = buildLCS(a, b);
  const unchanged = lcs.length;
  const total = Math.max(b.length, 1);
  const changedCount = total - unchanged;
  const rate = changedCount / total;

  if (rate > 0.20) return 'Beginner';
  if (rate > 0.05) return 'Intermediate';
  return 'Advanced';
}

// ------------------ Play (TTS) ------------------
btnPlay.addEventListener('click', () => {
  const text = getPlainTextFromCorrected() || transcriptEl.value.trim();
  if (!text) return;
  speakText(text, langSelect.value);
});

function getPlainTextFromCorrected() {
  // correctedDiv contains HTML; extract textContent
  return correctedDiv.textContent && correctedDiv.textContent.trim() ? correctedDiv.textContent.trim() : null;
}

function speakText(text, lang) {
  if (!('speechSynthesis' in window)) { alert('Tarayıcınız speechSynthesis desteklemiyor.'); return; }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang || 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ------------------ Geçmiş (history) yönetimi ------------------
btnSave.addEventListener('click', () => {
  const original = transcriptEl.value.trim();
  const corrected = getPlainTextFromCorrected() || original;
  const suggestionsHtml = suggestionsEl.innerHTML;
  const level = levelBadge.textContent.replace('Seviye: ','') || '-';
  const time = new Date().toLocaleString();

  const entry = {original, corrected, suggestionsHtml, level, time};
  history.unshift(entry); // en yeni başa
  renderHistory();
  btnSave.disabled = true; // tekrar kaydetmeyi engelle (opsiyonel)
});

// Render history list
function renderHistory() {
  historyListEl.innerHTML = '';
  if (history.length === 0) {
    historyListEl.innerHTML = '<div class="empty">Henüz geçmiş yok. Konuşup kaydettiğinde burada görüntülenecek.</div>';
    return;
  }
  history.forEach((h, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="texts">
        <div class="meta">${escapeHtml(h.time)} • <strong>${escapeHtml(h.level)}</strong></div>
        <div class="history-original">${escapeHtml(h.original)}</div>
        <div class="history-corrected">${escapeHtml(h.corrected)}</div>
      </div>
      <div class="history-controls">
        <button class="small-btn" data-action="load" data-index="${idx}">Yükle</button>
        <button class="small-btn" data-action="play" data-index="${idx}">Dinle</button>
        <button class="small-btn" data-action="delete" data-index="${idx}">Sil</button>
      </div>
    `;
    historyListEl.appendChild(item);
  });
}

// history butonları (delegation)
historyListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const idx = Number(btn.dataset.index);
  if (Number.isNaN(idx) || idx < 0 || idx >= history.length) return;
  const entry = history[idx];
  if (action === 'load') {
    transcriptEl.value = entry.original;
    // show highlighted diff
    correctedDiv.innerHTML = highlightDiffTokens(entry.original, entry.corrected);
    suggestionsEl.innerHTML = entry.suggestionsHtml;
    levelBadge.textContent = `Seviye: ${entry.level}`;
    btnPlay.disabled = false;
  } else if (action === 'play') {
    speakText(entry.corrected, langSelect.value);
  } else if (action === 'delete') {
    history.splice(idx, 1);
    renderHistory();
  }
});

// ------------------ Utilities ------------------
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'}[s]));
}
