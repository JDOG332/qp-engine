/* qp-engine news.js: the news brief deck. Separate from engine.js; only news rounds load it.
   ND.mount({round, stories:[{t:topic, h:headline, g:gist, f:[facts], o:outlet, u:url}]})
   Facts and gist take **bold**; text is escaped. Rating 1 to 3 plus a More info toggle in the same row (v1.1). Send goes to the chat via sendPrompt. */
(function () {
  var V = "1.1.1";
  var C = ["#f2b8b5", "#cfd6e2", "#9fdcae"];
  var L = ["Don't want these", "Keep similar coming", "More often", "More info now"];
  var MI = "#c9b8f2";
  var CSS =
    "#nd{--bg:#1e2533;--card:#262f40;--mint:#A8E6B0;--ink:#eef1f6;--dim:#9aa4b5;font-family:ui-rounded,var(--font-sans),system-ui,sans-serif;background:var(--bg);color:var(--ink);border-radius:20px;padding:8px;box-sizing:border-box}" +
    "#nd *{box-sizing:border-box}" +
    "#nd .card{background:var(--card);border:2px solid var(--mint);border-radius:20px;padding:18px 16px;min-height:608px;display:flex;flex-direction:column;transition:opacity .25s,transform .25s}" +
    "#nd .card.out{opacity:0;transform:translateX(-32px)}" +
    "#nd .bar{height:4px;background:#2c3548;border-radius:4px;overflow:hidden;margin-bottom:13px}" +
    "#nd .bar i{display:block;height:100%;background:var(--mint)}" +
    "#nd .tp{font-size:12px;color:var(--mint);letter-spacing:.05em;text-transform:uppercase}" +
    "#nd h3{margin:5px 0 6px;font-size:24px;line-height:1.2;color:#fff}" +
    "#nd .gist{color:var(--dim);font-size:15px;line-height:1.35;margin-bottom:11px}" +
    "#nd ul{margin:0 0 11px;padding-left:18px;flex:1}" +
    "#nd li{margin:9px 0;font-size:17px;line-height:1.4}" +
    "#nd b{color:#fff}" +
    "#nd .src{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px;color:var(--dim);margin:3px 0 13px}" +
    "#nd .src a{color:#1e2533;background:var(--mint);padding:8px 14px;border-radius:999px;text-decoration:none;font-size:13px;font-weight:600;min-height:32px;display:inline-flex;align-items:center}" +
    "#nd textarea{width:100%;background:#2c3548;color:#fff;border:0;border-radius:13px;padding:11px;font:inherit;font-size:15px;min-height:46px;margin-bottom:11px;resize:none;display:block}" +
    "#nd textarea::placeholder{color:var(--dim)}" +
    "#nd .rate{display:flex;gap:6px}" +
    "#nd .rate [data-r],#nd .rate #nd-mi{flex:1;min-height:48px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;font-weight:700;user-select:none;-webkit-user-select:none}" +
    "#nd .ends{display:flex;justify-content:space-between;gap:6px;font-size:12px;color:var(--dim);margin-top:6px}" +
    "#nd .ends span{flex:1;text-align:center}" +
    "#nd .back{color:var(--dim);font-size:13px;cursor:pointer;padding:12px 4px 4px;display:inline-block;min-height:44px}" +
    "#nd .sum{font-size:15px;line-height:1.5;flex:1;margin:6px 0 12px}" +
    "#nd .sum div{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #2c3548;cursor:pointer}" +
    "#nd .sum span:last-child{font-weight:700;flex:none}" +
    "#nd .send{background:var(--mint);color:#1e2533;border-radius:999px;padding:14px;font-weight:700;cursor:pointer;text-align:center;font-size:15px;min-height:48px;user-select:none;-webkit-user-select:none}" +
    "#nd .sent{text-align:center;color:var(--mint);font-size:15px;padding:14px;cursor:pointer}";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function plain(s) { return String(s == null ? "" : s).replace(/\*\*/g, ""); }
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function mount(data, rootId) {
    var root = document.getElementById(rootId || "qp-root");
    if (!root) return;
    var S = (data && data.stories) || [];
    var key = "nd:" + (data && data.round || "news");
    var st = load(key) || {};
    var i = typeof st.i === "number" ? st.i : 0, R = st.R || {}, M = st.M || {}, N = st.N || {}, note = st.note || "", sent = !!st.sent;
    if (!document.getElementById("nd-css")) {
      var sty = document.createElement("style"); sty.id = "nd-css"; sty.textContent = CSS; document.head.appendChild(sty);
    }
    root.innerHTML = '<div id="nd"></div>';
    var el = root.firstChild;
    function keep() { save(key, { i: i, R: R, M: M, N: N, note: note, sent: sent }); }
    function sendText() {
      var w = Math.round(el.getBoundingClientRect().width);
      var t = "answers in \u00b7 " + (data.round || "news") + " \u00b7 news v" + V + " \u00b7 " + w + "w\n";
      S.forEach(function (s, k) {
        t += "\n" + (k + 1) + ". " + plain(s.t) + " \u00b7 " + plain(s.h) + ": " + (R[k] || "skipped") + (M[k] ? " \u00b7 more info" : "");
        if (N[k]) t += "\n   Note: " + N[k];
      });
      if (note) t += "\n\nNote: " + note;
      return t;
    }
    function draw() {
      var h;
      if (i >= S.length) {
        var done = Object.keys(R).length;
        h = '<div class="card"><div class="bar"><i style="width:100%"></i></div><div class="tp">Done</div><h3>' +
          (done === S.length ? "All " + S.length + " rated \u2713" : done + " of " + S.length + " rated") + '</h3><div class="sum">' +
          S.map(function (s, k) { return '<div data-go="' + k + '"><span>' + esc(plain(s.h)) + '</span><span' + (R[k] ? ' style="color:' + C[R[k] - 1] + '"' : '') + '>' + (R[k] || "\u2013") + (M[k] ? " +info" : "") + "</span></div>"; }).join("") +
          '</div><textarea id="nd-nt" placeholder="+ a note">' + esc(note) + "</textarea>" +
          (sent ? '<div class="sent" id="nd-sd">\u2713 Sent \u00b7 tap to send again</div>' : '<div class="send" id="nd-sd">Send</div>') +
          '</div><span class="back" id="nd-bk">\u21ba Back a story</span>';
      } else {
        var s = S[i];
        h = '<div class="card" id="nd-cd"><div class="bar"><i style="width:' + (i / S.length * 100) + '%"></i></div><div class="tp">' +
          esc(plain(s.t)) + " \u00b7 " + (i + 1) + " of " + S.length + "</div><h3>" + md(s.h) + '</h3><div class="gist">' + md(s.g) + "</div><ul>" +
          (s.f || []).map(function (f) { return "<li>" + md(f) + "</li>"; }).join("") + '</ul><div class="src">' + esc(s.o) +
          (s.u ? ' <a href="' + esc(s.u) + '" target="_blank" rel="noopener">Open</a>' : "") + "</div>" +
          '<textarea id="nd-sn" placeholder="+ a note on this story">' + esc(N[i] || "") + "</textarea>" +
          '<div class="rate">' + C.map(function (c, k) {
            var on = String(R[i]) === String(k + 1);
            return '<div data-r="' + (k + 1) + '" role="button" style="background:' + (on ? c : c + "22") + ";color:" + (on ? "#1e2533" : c) + ";border:2px solid " + c + '66">' + (k + 1) + "</div>";
          }).join("") + '<div id="nd-mi" role="button" style="background:' + (M[i] ? MI : MI + "22") + ";color:" + (M[i] ? "#1e2533" : MI) + ";border:2px solid " + MI + '66">' + (M[i] ? "\u2713 Info" : "Info") + "</div>" +
          '</div><div class="ends">' + L.map(function (t) { return "<span>" + t + "</span>"; }).join("") + '</div></div>' +
          (i > 0 ? '<span class="back" id="nd-bk">\u21ba Back a story</span>' : "");
      }
      el.innerHTML = h;
      var sn = document.getElementById("nd-sn");
      if (sn) {
        var grow = function () { sn.style.height = "auto"; sn.style.height = sn.scrollHeight + "px"; };
        sn.oninput = function () { N[i] = sn.value; keep(); grow(); };
        if (sn.value) grow();
      }
      var nt = document.getElementById("nd-nt");
      if (nt) nt.oninput = function () { note = nt.value; keep(); };
      Array.prototype.forEach.call(el.querySelectorAll("[data-r]"), function (d) {
        d.onclick = function () {
          var r = +d.getAttribute("data-r"); R[i] = r; keep();
          d.style.background = C[r - 1]; d.style.color = "#1e2533";
          var cd = document.getElementById("nd-cd");
          setTimeout(function () {
            if (cd) cd.classList.add("out");
            setTimeout(function () { i++; keep(); draw(); try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {} }, 220);
          }, 180);
        };
      });
      Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function (d) {
        d.onclick = function () { i = +d.getAttribute("data-go"); keep(); draw(); };
      });
      var mi = document.getElementById("nd-mi");
      if (mi) mi.onclick = function () { M[i] = !M[i]; if (!M[i]) delete M[i]; keep(); draw(); };
      var bk = document.getElementById("nd-bk");
      if (bk) bk.onclick = function () { i = Math.max(0, i - 1); keep(); draw(); };
      var sd = document.getElementById("nd-sd");
      if (sd) sd.onclick = function () {
        var t = sendText();
        if (typeof sendPrompt === "function") sendPrompt(t); else window.__ndLast = t;
        sent = true; keep(); draw();
      };
    }
    draw();
  }
  window.ND = { mount: mount, version: V };
})();
