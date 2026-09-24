/* Чат поддержки «Алексей» для verstio.ru.
   Один файл: стили + разметка + стрим ответа по буквам.
   Подключение:  <script src="/assets/support-widget.js" defer></script>
   Настройки можно переопределить до подключения:
     window.SUPPORT_WIDGET = { api: 'https://api.verstio.ru', avatar: '/assets/alexey.jpg' }
*/
(function () {
  'use strict';
  if (window.__verstioSupport) return;
  window.__verstioSupport = true;

  var CFG = Object.assign({
    api: 'https://api.verstio.ru',
    avatar: '/assets/alexey.jpg',
    name: 'Алексей',
    role: 'Verstio · поддержка',
    greeting: 'Здравствуйте. Я Алексей, консультант Verstio. Расскажите, чем занимается ваш бизнес, — прикину, сколько страниц имеет смысл делать и что это будет стоить. Пилот на 20 страниц бесплатный.',
    chips: ['Сколько стоит?', 'Что такое пилот?', 'Какие данные нужны?', 'Это не дорвеи?'],
    footer: 'Отвечает ИИ-консультант. Сложные вопросы передаём Тимуру.'
  }, window.SUPPORT_WIDGET || {});

  var LS_KEY = 'verstio_support_v1';
  var MAX_KEEP = 30;

  /* ---------------- состояние ---------------- */
  var state = load();
  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      if (raw && Array.isArray(raw.messages)) return {
        sid: raw.sid || sid(),
        messages: raw.messages.slice(-MAX_KEEP),
        opened: false, seen: !!raw.seen
      };
    } catch (e) {}
    return { sid: sid(), messages: [], opened: false, seen: false };
  }
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        sid: state.sid, messages: state.messages.slice(-MAX_KEEP), seen: state.seen
      }));
    } catch (e) {}
  }
  function sid() { return 's' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

  /* ---------------- стили ---------------- */
  var CSS = `
.vsw,.vsw *{box-sizing:border-box}
.vsw{--w-ink:#11161C;--w-ink2:#171E26;--w-line:rgba(255,255,255,.10);--w-text:#DCE2EA;--w-dim:#8B95A2;--w-acc:#5E9FE8;--w-me:#24445F;
position:fixed;right:20px;bottom:20px;z-index:2147483000;font:400 15px/1.55 'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--w-text)}
@media(max-width:560px){.vsw{right:12px;bottom:12px;left:12px}}

.vsw-launch{margin-left:auto;display:flex;align-items:center;gap:10px;background:var(--w-ink);border:1px solid var(--w-line);color:var(--w-text);
border-radius:999px;padding:7px 18px 7px 7px;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.35);transition:transform .18s cubic-bezier(.2,.8,.2,1),opacity .18s}
.vsw-launch:hover{transform:translateY(-2px)}
.vsw-launch img,.vsw-ava{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#2A3542;flex:none}
.vsw-launch b{font-weight:500;font-size:14.5px;white-space:nowrap}
.vsw-dot{width:9px;height:9px;border-radius:50%;background:#5FA97F;box-shadow:0 0 0 2px var(--w-ink)}
.vsw-launch .vsw-dot{position:absolute;left:38px;bottom:9px}
.vsw-launch{position:relative}
.vsw.is-open .vsw-launch{opacity:0;pointer-events:none;transform:scale(.9)}
@media(max-width:560px){.vsw-launch b{display:none}.vsw-launch{padding:7px}}

.vsw-panel{position:absolute;right:0;bottom:0;width:392px;height:min(620px,calc(100vh - 40px));display:flex;flex-direction:column;
background:var(--w-ink);border:1px solid var(--w-line);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);
opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .2s,transform .22s cubic-bezier(.2,.8,.2,1)}
.vsw.is-open .vsw-panel{opacity:1;transform:none;pointer-events:auto}
.vsw.is-wide .vsw-panel{width:min(720px,calc(100vw - 40px));height:min(80vh,820px)}
@media(max-width:560px){.vsw-panel,.vsw.is-wide .vsw-panel{width:100%;height:min(78vh,620px)}}

.vsw-head{display:flex;align-items:center;gap:11px;padding:13px 12px 13px 14px;border-bottom:1px solid var(--w-line);background:var(--w-ink2);position:relative}
.vsw-head .vsw-who{min-width:0;flex:1}
.vsw-head .vsw-nm{font-weight:500;font-size:15px;color:#fff;display:flex;align-items:center;gap:7px}
.vsw-head .vsw-sub{font-size:12.5px;color:var(--w-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vsw-ico{width:32px;height:32px;border:0;background:transparent;color:var(--w-dim);border-radius:8px;cursor:pointer;display:grid;place-items:center;transition:background .15s,color .15s}
.vsw-ico:hover{background:rgba(255,255,255,.07);color:#fff}
@media(max-width:860px){.vsw-ico[data-act="wide"]{display:none}}

.vsw-body{flex:1;overflow-y:auto;padding:16px 14px 6px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;
background-image:radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px);background-size:22px 22px}
.vsw-body::-webkit-scrollbar{width:8px}.vsw-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px}

.vsw-row{display:flex;gap:9px;align-items:flex-end;max-width:100%}
.vsw-row.me{justify-content:flex-end}
.vsw-row img{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none;background:#2A3542}
.vsw-msg{max-width:78%;padding:10px 13px;border-radius:14px;background:var(--w-ink2);border:1px solid var(--w-line);border-bottom-left-radius:5px;
font-size:14.7px;line-height:1.58;word-wrap:break-word;overflow-wrap:anywhere;animation:vswIn .18s ease-out}
.vsw-row.me .vsw-msg{background:var(--w-me);border-color:transparent;border-radius:14px;border-bottom-right-radius:5px;color:#EAF1F8}
@keyframes vswIn{from{opacity:0;transform:translateY(6px)}}
.vsw-msg p{margin:0 0 8px}.vsw-msg p:last-child{margin:0}
.vsw-msg ul,.vsw-msg ol{margin:6px 0;padding-left:19px}.vsw-msg li{margin:3px 0}
.vsw-msg a{color:var(--w-acc);text-decoration:underline;text-underline-offset:2px}
.vsw-msg code{background:rgba(255,255,255,.08);padding:1px 5px;border-radius:5px;font-size:13px}
.vsw-time{font-size:11px;color:var(--w-dim);margin-top:5px;opacity:.75}

.vsw-typing{display:inline-flex;gap:4px;padding:3px 0}
.vsw-typing i{width:6px;height:6px;border-radius:50%;background:var(--w-dim);animation:vswB 1s infinite ease-in-out}
.vsw-typing i:nth-child(2){animation-delay:.15s}.vsw-typing i:nth-child(3){animation-delay:.3s}
@keyframes vswB{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}

.vsw-chips{display:flex;flex-wrap:wrap;gap:7px;padding:2px 14px 10px}
.vsw-chips button{background:transparent;border:1px solid var(--w-line);color:var(--w-text);border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;transition:background .15s,border-color .15s}
.vsw-chips button:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.22)}

.vsw-foot{border-top:1px solid var(--w-line);background:var(--w-ink2);padding:10px 12px 8px}
.vsw-input{display:flex;align-items:flex-end;gap:8px}
.vsw-input textarea{flex:1;resize:none;max-height:120px;min-height:40px;background:rgba(255,255,255,.05);border:1px solid var(--w-line);
border-radius:12px;padding:10px 12px;color:var(--w-text);font-size:14.7px;line-height:1.45;outline:none;transition:border-color .15s}
.vsw-input textarea:focus{border-color:rgba(94,159,232,.55)}
.vsw-input textarea::placeholder{color:var(--w-dim)}
.vsw-send{width:40px;height:40px;border-radius:12px;border:0;background:var(--w-acc);color:#08131F;cursor:pointer;display:grid;place-items:center;flex:none;transition:opacity .15s,transform .15s}
.vsw-send:disabled{opacity:.4;cursor:default}
.vsw-send:not(:disabled):hover{transform:translateY(-1px)}
.vsw-note{text-align:center;font-size:11.5px;color:var(--w-dim);padding:7px 4px 2px}
.vsw-note a{color:var(--w-dim)}
`;

  /* ---------------- разметка ---------------- */
  function icon(n) {
    var p = {
      close: '<path d="M5 5l10 10M15 5L5 15"/>',
      wide: '<path d="M12 4h4v4M8 16H4v-4M16 4l-5 5M4 16l5-5"/>',
      narrow: '<path d="M16 8h-4V4M4 12h4v4M12 8l4-4M8 12l-4 4"/>',
      send: '<path d="M3 10l14-6-6 14-2-6-6-2z"/>'
    }[n];
    return '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  }

  var root = document.createElement('div');
  root.className = 'vsw';
  root.innerHTML =
    '<style>' + CSS + '</style>' +
    '<div class="vsw-panel" role="dialog" aria-label="Чат поддержки Verstio">' +
      '<div class="vsw-head">' +
        '<img class="vsw-ava" alt="" src="' + CFG.avatar + '">' +
        '<div class="vsw-who"><div class="vsw-nm">' + CFG.name + ' <span class="vsw-dot"></span></div>' +
        '<div class="vsw-sub">' + CFG.role + '</div></div>' +
        '<button class="vsw-ico" data-act="wide" title="Развернуть">' + icon('wide') + '</button>' +
        '<button class="vsw-ico" data-act="close" title="Закрыть">' + icon('close') + '</button>' +
      '</div>' +
      '<div class="vsw-body"></div>' +
      '<div class="vsw-chips"></div>' +
      '<div class="vsw-foot">' +
        '<div class="vsw-input">' +
          '<textarea rows="1" placeholder="Введите ваше сообщение…" aria-label="Сообщение"></textarea>' +
          '<button class="vsw-send" title="Отправить" disabled>' + icon('send') + '</button>' +
        '</div>' +
        '<div class="vsw-note">' + CFG.footer + '</div>' +
      '</div>' +
    '</div>' +
    '<button class="vsw-launch" aria-label="Открыть чат поддержки">' +
      '<img alt="" src="' + CFG.avatar + '"><span class="vsw-dot"></span><b>Спросить ' + CFG.name + 'а</b>' +
    '</button>';

  var body, input, sendBtn, chipsBox, busy = false;

  function mount() {
    document.body.appendChild(root);
    body = root.querySelector('.vsw-body');
    input = root.querySelector('textarea');
    sendBtn = root.querySelector('.vsw-send');
    chipsBox = root.querySelector('.vsw-chips');

    root.querySelector('.vsw-launch').onclick = open;
    root.querySelector('[data-act=close]').onclick = function () { root.classList.remove('is-open'); };
    var wideBtn = root.querySelector('[data-act=wide]');
    wideBtn.onclick = function () {
      root.classList.toggle('is-wide');
      wideBtn.innerHTML = icon(root.classList.contains('is-wide') ? 'narrow' : 'wide');
      scroll();
    };

    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = busy || !input.value.trim();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    sendBtn.onclick = send;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') root.classList.remove('is-open');
    });

    if (!state.messages.length) state.messages.push({ role: 'assistant', content: CFG.greeting, t: Date.now() });
    state.messages.forEach(function (m) { addMsg(m.role, m.content, m.t, true); });
    renderChips();
    scroll();

    // открыть чат по ссылке вида <a href="#support">
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#support"],[data-support-open]');
      if (a) { e.preventDefault(); open(); }
    });
  }

  function open() {
    root.classList.add('is-open');
    state.seen = true; save();
    setTimeout(function () { input.focus(); scroll(); }, 120);
  }

  function renderChips() {
    var show = state.messages.filter(function (m) { return m.role === 'user'; }).length === 0;
    chipsBox.innerHTML = '';
    if (!show) return;
    CFG.chips.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c;
      b.onclick = function () { input.value = c; send(); };
      chipsBox.appendChild(b);
    });
  }

  function hhmm(ts) {
    var d = new Date(ts || Date.now());
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function addMsg(role, text, ts, silent) {
    var row = document.createElement('div');
    row.className = 'vsw-row ' + (role === 'user' ? 'me' : 'bot');
    var html = '';
    if (role !== 'user') html += '<img alt="" src="' + CFG.avatar + '">';
    html += '<div class="vsw-msg">' + (text ? md(text) : '') +
            '<div class="vsw-time">' + hhmm(ts) + '</div></div>';
    row.innerHTML = html;
    body.appendChild(row);
    if (!silent) scroll();
    return row.querySelector('.vsw-msg');
  }

  function scroll() { if (body) body.scrollTop = body.scrollHeight; }

  /* ---------------- мини-markdown ---------------- */
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      var ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + u.replace(/"/g, '') + '"' + ext + '>' + t + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    s = s.replace(/(^|[\s(<])((?:https?:\/\/|www\.)[^\s<)]+)/g, function (m, p, u) {
      var href = u.indexOf('http') === 0 ? u : 'https://' + u;
      return p + '<a href="' + href + '" target="_blank" rel="noopener">' + u + '</a>';
    });
    s = s.replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');
    return s;
  }
  function md(text) {
    var out = [], list = null;
    text.split('\n').forEach(function (line) {
      var li = line.match(/^\s*[-•*]\s+(.*)$/);
      var ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (li) {
        if (list !== 'ul') { if (list) out.push('</' + list + '>'); out.push('<ul>'); list = 'ul'; }
        out.push('<li>' + inline(li[1]) + '</li>');
      } else if (ol) {
        if (list !== 'ol') { if (list) out.push('</' + list + '>'); out.push('<ol>'); list = 'ol'; }
        out.push('<li>' + inline(ol[2]) + '</li>');
      } else {
        if (list) { out.push('</' + list + '>'); list = null; }
        if (line.trim()) out.push('<p>' + inline(line) + '</p>');
      }
    });
    if (list) out.push('</' + list + '>');
    return out.join('');
  }

  /* ---------------- отправка и стрим ---------------- */
  function send() {
    var text = (input.value || '').trim();
    if (!text || busy) return;
    input.value = ''; input.style.height = 'auto';
    busy = true; sendBtn.disabled = true;

    state.messages.push({ role: 'user', content: text, t: Date.now() });
    addMsg('user', text, Date.now());
    renderChips(); save();

    var bubble = addMsg('assistant', '', Date.now());
    bubble.innerHTML = '<span class="vsw-typing"><i></i><i></i><i></i></span>';
    stream(text, bubble);
  }

  function finish(bubble, acc, ok) {
    bubble.innerHTML = md(acc) + '<div class="vsw-time">' + hhmm() + '</div>';
    if (ok) { state.messages.push({ role: 'assistant', content: acc, t: Date.now() }); save(); }
    busy = false;
    sendBtn.disabled = !input.value.trim();
    scroll();
  }

  function stream(text, bubble) {
    var history = state.messages.slice(0, -1).slice(-16).map(function (m) {
      return { role: m.role, content: m.content };
    });
    var acc = '', queue = '', typing = null, done = false, started = false;

    // печать по буквам: показываем накопленное плавно, а не рывками
    function pump() {
      if (queue.length) {
        var step = Math.max(1, Math.ceil(queue.length / 18));
        acc += queue.slice(0, step);
        queue = queue.slice(step);
        bubble.innerHTML = md(acc) + '<span class="vsw-time">&nbsp;</span>';
        scroll();
      } else if (done) {
        clearInterval(typing);
        finish(bubble, acc || 'Не получилось получить ответ. Напишите, пожалуйста, в @VerstioBot.', !!acc);
        return;
      }
    }

    fetch(CFG.api.replace(/\/$/, '') + '/api/public/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text, history: history, session_id: state.sid,
        page: location.pathname + location.hash
      })
    }).then(function (res) {
      if (res.status === 429) throw new Error('rate');
      if (!res.ok || !res.body) throw new Error('http ' + res.status);
      typing = setInterval(pump, 28);
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      return (function read() {
        return reader.read().then(function (r) {
          if (r.done) { done = true; return; }
          buf += dec.decode(r.value, { stream: true });
          var parts = buf.split('\n\n'); buf = parts.pop();
          parts.forEach(function (p) {
            var line = p.split('\n').filter(function (l) { return l.indexOf('data:') === 0; })[0];
            if (!line) return;
            try {
              var d = JSON.parse(line.slice(5).trim());
              if (d.t) { started = true; queue += d.t; }
              if (d.done) done = true;
            } catch (e) {}
          });
          return read();
        });
      })();
    }).catch(function (e) {
      done = true;
      if (typing) clearInterval(typing);
      var msg = e && e.message === 'rate'
        ? 'Слишком много сообщений подряд. Подождите минуту или напишите в [@VerstioBot](https://t.me/VerstioBot).'
        : 'Связь оборвалась. Попробуйте ещё раз или напишите в [@VerstioBot](https://t.me/VerstioBot) — Тимур ответит в течение рабочего дня.';
      finish(bubble, acc || msg, !!acc);
    }).then(function () {
      if (!typing) { done = true; return; }
      if (!started && !acc) { /* пусто — pump закроет сам */ }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
