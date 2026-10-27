/* Jeff's inline question page engine. Layout and behavior only: no round content, no answers. */
(function(){
var VERSION="1.9.2";
// v1.9.2: report rows never fold: several ✅ or 🧠 rows show one per line instead of behind a "N done" or "N memory writes" row (Jeff, 10/27)
// v1.9.1: the engine injects the Source Sans font tag and the hidden screenshot form itself (unless R.shots===false or a form.elicit is already in the card), so a card is a 200-character wrapper plus the round
var FORM="<div id=\"qp-stash\" style=\"position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none\" aria-hidden=\"true\"><form class=\"elicit\"><div class=\"elicit-header\"><svg viewBox=\"0 0 20 20\" fill=\"currentColor\"><path d=\"M11.586 2a1.5 1.5 0 0 1 1.06.44l2.914 2.914a1.5 1.5 0 0 1 .44 1.06V16.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.492-1.347L4 16.5v-13A1.5 1.5 0 0 1 5.5 2zM5.5 3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h-2.5A1.5 1.5 0 0 1 11 5.5V3zm7.04 10.304a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696m0-4a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696M12 5.5a.5.5 0 0 0 .5.5h2.293L12 3.207z\"/></svg><span>Answer details</span></div><div class=\"elicit-body\"><div class=\"elicit-group\"><label class=\"elicit-question\">Screenshots</label><div class=\"elicit-files\" data-name=\"screenshots\"><label class=\"elicit-dropzone\"><svg viewBox=\"0 0 20 20\" fill=\"currentColor\"><path d=\"M16.5 13a.5.5 0 0 1 .5.5v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-2a.5.5 0 0 1 1 0v2a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 .5-.5M10 3a.5.5 0 0 1 .374.168l4 4.5.059.082a.5.5 0 0 1-.732.65l-.075-.068L10.5 4.814V13.5a.5.5 0 0 1-1 0V4.814L6.374 8.332a.5.5 0 0 1-.748-.664l4-4.5.08-.071A.5.5 0 0 1 10 3\"/></svg><span>Choose file</span><input type=\"file\" multiple></label></div><textarea class=\"elicit-textarea\" data-name=\"answers\" placeholder=\"answers\"></textarea></div></div><div class=\"elicit-footer\"><button type=\"button\" class=\"elicit-skip\">Skip</button><button type=\"button\" class=\"elicit-submit\">Send</button></div></form></div>";
var PAL={
light:{accent:"#24426f",chosen:"#d4def0",bg:"#eef1f5",card:"#fbfcfd",soft:"#f3f5f8",line:"#d3d9e2",ink:"#232831",muted:"#6b717a",on:"#ffffff",fin:"#1d2330",fini:"#ffffff",lock:"#9a6b12",lockbg:"#faf3e4"},
dark:{accent:"#a3bdea",chosen:"#3f5578",bg:"#232934",card:"#2c3341",soft:"#313946",line:"#434c5c",ink:"#e8e6e1",muted:"#a7adb6",on:"#232934",fin:"#e8e6e1",fini:"#232934",lock:"#e0b660",lockbg:"#3a3428"}};
var CSS=
".qp{box-sizing:border-box;position:relative;background:var(--bg);color:var(--ink);font:19.5px/1.4 'Source Sans 3',system-ui,-apple-system,sans-serif;border-radius:16px;padding:8px;display:flex;flex-direction:column}"+
".qp *{box-sizing:border-box;font-size:inherit}"+
".qp .ct{display:flex;flex-direction:column;gap:16px;padding:8px}"+
".qp .sec{flex:none;display:flex;flex-direction:column;gap:8px;padding:8px;border:1.5px solid var(--line);border-top:4px solid var(--accent);border-radius:14px;background:var(--soft)}"+
".qp .sec.lock{border:2px solid var(--lock);border-left:8px solid var(--lock);background:var(--lockbg)}"+
".qp .ex{flex:none;border:1px solid var(--line);border-radius:10px;background:var(--card)}"+
".qp .s{min-height:48px;padding:8px;display:flex;align-items:center;gap:8px;cursor:pointer;touch-action:pan-y;-webkit-tap-highlight-color:transparent}"+
".qp .s::after{content:'\\25C2';color:var(--accent);margin-left:auto;flex:none;padding-left:8px}"+
".qp .ex.open>.s::after{content:'\\25BE'}.ex.flat>.s{cursor:default}.ex.flat>.s::after{content:''}"+
".qp .ex.qh.has>.s::after{content:'\\25CF  \\25C2'}.qp .ex.qh.has.open>.s::after{content:'\\25CF  \\25BE'}"+
".qp .hi{display:flex;align-items:flex-start;gap:8px;min-width:0;flex:1}"+
".qp .em{flex:none;width:1.5em;text-align:center}.qp .tx{flex:1;min-width:0}"+
".qp .qt,.qp .td>.s{font-weight:700}"+
".qp .w{display:grid;grid-template-rows:0fr;transition:grid-template-rows .15s ease}"+
".qp .open>.w{grid-template-rows:1fr}"+
".qp .w>.m{overflow:hidden;min-height:0}"+
".qp .in{padding:0 8px 8px 8px;display:flex;flex-direction:column;gap:8px;line-height:1.45}"+
".qp .in p{margin:0}.qp .in>.sep{border-top:1px solid var(--line);padding-top:8px}"+
".qp .in .ex{background:var(--soft)}"+
"@media (prefers-reduced-motion:reduce){.qp .w{transition:none}}"+
".qp .box{flex:none;width:28px;height:28px;border:2px solid var(--accent);border-radius:7px;display:inline-flex;align-items:center;justify-content:center;color:var(--on);cursor:pointer}"+
".qp .td.done .box{background:var(--accent)}.qp .td.done>.s .tx{color:var(--muted);text-decoration:line-through}"+
".qp .op{flex:none;display:flex;flex-direction:column;border:1.5px solid var(--line);border-radius:10px;background:var(--card);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:pan-y}"+
".qp .op.pick{border:2.5px dashed var(--accent)}"+
".qp .op[aria-pressed=true]{border:2.5px solid var(--accent);background:var(--chosen)}"+
".qp .op .row{display:flex;align-items:center;min-height:48px}"+
".qp .op .lb{flex:1;min-width:0;padding:8px;display:flex;align-items:center;gap:8px}"+
".qp .op[aria-pressed=true] .lb::before{content:'\\2713';color:var(--accent);font-weight:700;flex:none}"+
".qp .op .mo{flex:none;width:40px;height:40px;margin:4px 8px 4px 0;border:1.5px solid var(--line);border-radius:10px;background:var(--soft);color:var(--accent);display:flex;align-items:center;justify-content:center}"+
".qp .op .mo::before{content:'\\25C2'}.qp .op.open .mo::before{content:'\\25BE'}"+
".qp .op .in{border-top:1px solid var(--line);padding-top:8px;font-weight:400}"+
".qp .pr{flex:none;display:flex;flex-direction:column;gap:8px;border:1.5px solid var(--line);border-radius:10px;padding:8px;background:var(--card)}"+
".qp .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.qp .g5{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}"+
".qp .bt{font:inherit;font-weight:600;min-height:48px;padding:0 8px;border:1.5px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);cursor:pointer;touch-action:pan-y;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".qp .bt.pick{border:2.5px dashed var(--accent)}"+
".qp .bt[aria-pressed=true]{border:2.5px solid var(--accent);background:var(--chosen)}.qp .bt[aria-pressed=true]::before{content:'\\2713\\00a0\\00a0';color:var(--accent);font-weight:700}"+
".qp .ends{display:flex;justify-content:space-between;color:var(--muted);margin:0}"+
".qp .dg{flex:none;display:flex;align-items:center;gap:8px;min-height:48px;padding:0 8px;border:1.5px solid var(--line);border-radius:10px;background:var(--card);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}"+
".qp .dg.lift{position:relative;z-index:3;border-color:var(--accent);box-shadow:0 6px 18px rgba(0,0,0,.25)}"+
".qp .dg .num{flex:none;width:1.5em;text-align:center;font-weight:700;color:var(--accent)}.qp .dg .hdl{margin-left:auto;color:var(--muted)}"+
".qp .rk .badge{flex:none;width:28px;height:28px;border-radius:50%;border:2px solid var(--muted);display:inline-flex;align-items:center;justify-content:center;font-weight:700}"+
".qp .rk[aria-pressed=true] .badge{background:var(--accent);border-color:var(--accent);color:var(--on)}"+
".qp .rk{display:flex;align-items:center;gap:8px;text-align:left}"+
".qp .cp{display:flex;gap:8px;align-items:center}"+
".qp .cp pre{flex:1;min-width:0;margin:0;padding:8px;overflow-wrap:anywhere;background:var(--bg);border:1.5px solid var(--line);border-radius:10px;font:15px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;color:var(--ink);user-select:all}"+
".qp .cp button,.qp .send{font:inherit;font-weight:700;border:0;cursor:pointer;background:var(--accent);color:var(--on);border-radius:10px}"+
".qp .cp button{flex:none;height:48px;padding:0 16px}"+
".qp textarea{width:100%;min-height:96px;font:inherit;color:var(--ink);background:var(--card);border:1.5px solid var(--line);border-radius:10px;padding:8px;resize:none;line-height:1.35}"+
".qp textarea:focus{border-color:var(--accent);outline:none}.qp textarea::placeholder{color:var(--muted);opacity:.55}"+
".qp .nrow{display:flex;align-items:center;gap:8px}.qp .nrow .at{font:inherit;height:40px;padding:0 16px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}"+
".qp .nrow .at.has{border-color:var(--accent);color:var(--accent)}.qp .nrow .ns{color:var(--muted);flex:1;min-width:0}"+
".qp .thumbs{display:flex;flex-wrap:wrap;gap:8px}.qp .thumbs:empty{display:none}.qp .th{position:relative}.qp .th img{display:block;height:80px;max-width:160px;object-fit:cover;border-radius:8px;border:1.5px solid var(--line)}.qp .th button{position:absolute;top:-8px;right:-8px;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:14px;line-height:1;cursor:pointer}"+
".qp .after{margin:0;color:var(--muted);opacity:.8;text-align:center}"+
".qp .send{flex:none;min-height:52px;background:var(--fin);color:var(--fini)}"+
".qp .bar{display:none;min-height:48px;align-items:center;justify-content:center;gap:8px;font-weight:700;cursor:pointer}"+
".qp.sent .ct{display:none}.qp.sent .bar{display:flex}"+
".qp.drop{outline:3px dashed var(--accent);outline-offset:-3px}"+
".qp .stash{position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}"+
".qp .sec.idea{padding:0}.qp .sec.idea>.ex{border:0;background:transparent}"+
".qp .ih{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.qp .ih .it{font-weight:700}"+
".qp .ih .il{color:var(--muted)}"+
".qp .sec.idea>.ex>.w>.m>.in{gap:12px;padding:0 8px 12px 8px}"+
".qp .ak{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:12px}.qp .ak.lock{border:2px solid var(--lock);border-left:8px solid var(--lock);background:var(--lockbg);border-radius:10px;padding:8px}"+
".qp .ak .aq{font-weight:700}.qp .st{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:8px}"+
".qp .inote{border-top:1px solid var(--line);padding-top:12px}.qp .inote>.in{padding:0}";
var KC=["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
var EMO=/^([\p{Extended_Pictographic}\p{Emoji_Component}⃣️‍\d]+)\s+(\S[\s\S]*)$/u;
var DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MAXSHOTS=10;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function rich(e,t){String(t||"").split("**").forEach(function(p,i){if(!p)return;e.appendChild(i%2?el("b",null,p):document.createTextNode(p))});return e}
function lbl(t,tag,c){var e=el(tag||"span",c),m=null;try{m=EMO.exec(t||"")}catch(x){}if(m&&/[\p{Extended_Pictographic}⃣]/u.test(m[1])){e.classList.add("hi");e.append(el("span","em",m[1]),rich(el("span","tx"),m[2]))}else rich(e,t);return e}
function first(t){var m=null;try{m=EMO.exec(t||"")}catch(x){}return m?m[1]:""}
function syncCopy(text){var ok=false;try{var t=document.createElement("textarea");t.value=text;t.style.position="absolute";t.style.opacity="0";document.body.appendChild(t);t.select();ok=document.execCommand("copy");t.remove()}catch(e){}if(!ok){try{navigator.clipboard.writeText(text);ok=true}catch(e){}}return ok}
function go(u){try{if(typeof openLink==="function"){openLink(u);return}}catch(e){}try{window.open(u,"_blank","noopener")}catch(e){}}
function dval(d,t){return DN[d.getDay()]+" "+(d.getMonth()+1)+"/"+d.getDate()+(d.getFullYear()!==t.getFullYear()?"/"+d.getFullYear():"")}
function mount(R){
 if(!document.getElementById("qp-css")){var st=el("style");st.id="qp-css";st.textContent=CSS;document.head.appendChild(st)}
 if(!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Source+Sans+3"]')){var lk=document.createElement("link");lk.rel="stylesheet";lk.href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap";document.head.appendChild(lk)}
 if(R.shots!==false&&!document.querySelector("form.elicit")){var fw=document.createElement("div");fw.innerHTML=FORM;document.body.appendChild(fw.firstElementChild)}
 var host=document.getElementById(R.root||"qp-root");
 var qp=el("div","qp"),ct=el("div","ct"),bar=el("div","bar");qp.append(ct,bar);host.appendChild(qp);
 var pick=el("input");pick.type="file";pick.multiple=true;pick.accept="image/*";var stash=el("div","stash");stash.appendChild(pick);qp.appendChild(stash);
 var A={},NT={},SH={},ORD={},sent=false,NUM=0,shotTarget=null;
 function dark(){var m=document.documentElement.getAttribute("data-mode");return m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)}
 function theme(){var v=PAL[dark()?"dark":"light"];Object.keys(v).forEach(function(k){qp.style.setProperty("--"+k,v[k])})}
 theme();try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",theme)}catch(e){}
 try{new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:["data-mode"]})}catch(e){}
 // v1.8.2: no fixed height anywhere; the card is as long as its content and the chat scrolls it (Jeff, iqp25)
 var H="full";
 // iPhone full screen: no inner scroller, the page grows and the full-screen view scrolls it natively



 function kc(){var k=KC[NUM]||String(NUM+1);NUM++;return k}
 function closeSibs(d){var p=d.parentNode;if(!p)return;[].forEach.call(p.children,function(o){if(o!==d&&o.classList)o.classList.remove("open")})}
 function drop(head,inner,cls){var d=el("div","ex"+(cls?" "+cls:"")),s=el("div","s"),w=el("div","w"),m=el("div","m");s.appendChild(head);m.appendChild(inner);w.appendChild(m);d.append(s,w);
  s.onclick=function(e){if(e.target.closest&&e.target.closest(".box"))return;e.stopPropagation();var o=d.classList.contains("open");closeSibs(d);d.classList.toggle("open",!o);if(!o){var ta=inner.querySelector("textarea");if(ta&&cls&&cls.indexOf("qh")>=0)setTimeout(function(){try{ta.focus()}catch(x){}},160)}};return d}
 function body(m){var b=el("div","in");if(Array.isArray(m)){var pk=null;m.forEach(function(x){var k=x.c!=null?"c":x.s!=null?"s":"p",r=x.c!=null?cpRow(x.c):x.s!=null?exRow(x.s,x.m):rich(el("p"),x.p);if(pk&&k!==pk)r.classList.add("sep");pk=k;b.appendChild(r)})}else b.appendChild(rich(el("p"),m||""));return b}
 function exRow(s,m,cls){if(m==null){var d=el("div","ex flat"+(cls?" "+cls:"")),h=el("div","s");h.appendChild(lbl(s,"span","t"));d.appendChild(h);return d}return drop(lbl(s,"span","t"),body(m),cls)}
 function cpRow(c){var text=typeof c==="string"?c:c.text,url=/^https?:\/\/\S+$/.test((text||"").trim()),lb=url?"Copy & open":"Copy",w=el("div","cp"),pre=el("pre",null,text),b=el("button",null,lb);b.type="button";
  b.onclick=function(e){e.stopPropagation();var ok=syncCopy(text);if(url)go(text.trim());b.textContent=ok?(url?"Opened ✓":"Copied ✓"):"⌘C";setTimeout(function(){b.textContent=lb},1800)};w.append(pre,b);return w}
 function sec(cls){var p=el("div","sec"+(cls?" "+cls:""));ct.appendChild(p);return p}
 // screenshots need the hidden send form, and that form stops the iPhone app from opening the card full screen; build.py adds it only when a round asks for screenshots
 var canShot=!!document.querySelector("form.elicit");
 function noteBox(id,ph){var w=el("div","in"),t=el("textarea"),nr=el("div","nrow"),ns=el("span","ns"),at=el("button","at","📎");at.type="button";t.placeholder=ph||"Add a note";
  t.oninput=function(){NT[id]=t.value;mark()};t.onclick=function(e){e.stopPropagation()};
  var tb=el("div","thumbs");
  function thumbs(){tb.innerHTML="";(SH[id]||[]).forEach(function(f,k){var d=el("div","th"),im=el("img"),x=el("button",null,"×");x.type="button";x.setAttribute("aria-label","Remove");try{im.src=URL.createObjectURL(f)}catch(e){}x.onclick=function(e){e.stopPropagation();SH[id].splice(k,1);mark()};d.append(im,x);tb.appendChild(d)})}
  function mark(){thumbs();var n=(SH[id]||[]).length;ns.textContent=n?n+" screenshot"+(n>1?"s":""):"";at.className="at"+(n?" has":"");var h=w.closest&&w.closest(".qh");if(h)h.classList.toggle("has",!!((NT[id]||"").trim()||n))}
  at.onclick=function(e){e.stopPropagation();shotTarget={id:id,done:mark};pick.click()};
  t.addEventListener("paste",function(e){if(!canShot)return;var f=files(e.clipboardData);if(f.length){e.preventDefault();addShots(id,f);mark()}});
  // Mac: paste (⌘V) or 📎; iPhone: the card can't send pictures, so no 📎 there (Jeff pastes into the chat box)
  var touch=false;try{touch=matchMedia("(pointer:coarse)").matches}catch(e){}
  if(canShot){if(!touch)nr.append(at);nr.append(ns);w.append(t,tb,nr)}else w.append(t);w._mark=mark;return w}
 function files(dt){try{return dt.files&&dt.files.length?[].slice.call(dt.files):[].slice.call(dt.items||[]).filter(function(x){return x.kind==="file"}).map(function(x){return x.getAsFile()}).filter(Boolean)}catch(e){return[]}}
 function addShots(id,list){var imgs=[].slice.call(list||[]).filter(function(f){return f&&f.type&&f.type.indexOf("image/")===0});var all=Object.keys(SH).reduce(function(n,k){return n+SH[k].length},0);imgs=imgs.slice(0,Math.max(0,MAXSHOTS-all));SH[id]=(SH[id]||[]).concat(imgs.map(function(f,k){return f.name&&f.name!=="image.png"?f:new File([f],"screenshot-"+Date.now()+"-"+k+".png",{type:f.type})}))}
 pick.onchange=function(){if(shotTarget){addShots(shotTarget.id,pick.files);shotTarget.done()}pick.value=""};
 function qhead(q,P,lock){q._n=kc();var t=(lock?"🔐 ":"")+(q.q||"Question");var h=el("span","hi qt");h.append(el("span","em",q._n),rich(el("span","tx"),t));P.appendChild(drop(h,noteBox(q.id),"qh"))}
 function choose(q,v){A[q.id]=A[q.id]===v?"":v;return A[q.id]}
 function optRow(q,o,group){var b=el("div","op"+(o.pick&&!q.multi&&!q.code?" pick":"")),row=el("div","row"),l=lbl(o.label,"span","lb");b.setAttribute("role","button");b.setAttribute("aria-pressed","false");row.appendChild(l);b.appendChild(row);
  if(o.more){var mo=el("span","mo");mo.setAttribute("aria-label","More");var w=el("div","w"),m=el("div","m");m.appendChild(body(o.more));w.appendChild(m);row.appendChild(mo);b.appendChild(w);mo.onclick=function(e){e.stopPropagation();var was=b.classList.contains("open");closeSibs(b);b.classList.toggle("open",!was)}}
  b.onclick=function(e){var ci=e.target.closest&&e.target.closest(".in");if(ci&&b.contains(ci))return;if(q.multi){var cur=(A[q.id]||"").split("; ").filter(Boolean),i=cur.indexOf(o.label);if(i>=0)cur.splice(i,1);else cur.push(o.label);A[q.id]=q.options.map(function(x){return x.label}).filter(function(x){return cur.indexOf(x)>=0}).join("; ");b.setAttribute("aria-pressed",i>=0?"false":"true");return}
   var v=choose(q,o.label);group.forEach(function(x){x.setAttribute("aria-pressed","false")});if(v)b.setAttribute("aria-pressed","true")};group.push(b);return b}
 function decide(q,P){var g=[];q.options.forEach(function(o){P.appendChild(optRow(q,o,g))})}
 function pair(q,P){A[q.id]={};q.items.forEach(function(it){var r=el("div","pr"),sg=el("div","g2"),bs=[];r.appendChild(lbl(it.text,"span"));[it.a,it.b].forEach(function(v){var b=el("button","bt"+(it.pick===v?" pick":""),v);b.type="button";b.setAttribute("aria-pressed","false");b.onclick=function(){var on=A[q.id][it.id]!==v;A[q.id][it.id]=on?v:"";bs.forEach(function(x){x.setAttribute("aria-pressed","false")});if(on)b.setAttribute("aria-pressed","true")};bs.push(b);sg.appendChild(b)});r.appendChild(sg);P.appendChild(r)})}
 function scale(q,P){var g=el("div","g5"),bs=[];[1,2,3,4,5].forEach(function(n){var v=n+" of 5",b=el("button","bt"+(q.pick===n?" pick":""),String(n));b.type="button";b.setAttribute("aria-pressed","false");b.onclick=function(){var x=choose(q,v);bs.forEach(function(y){y.setAttribute("aria-pressed","false")});if(x)b.setAttribute("aria-pressed","true")};bs.push(b);g.appendChild(b)});var e=el("p","ends");e.append(el("span",null,"1 · "+((q.ends||[])[0]||"")),el("span",null,((q.ends||[])[1]||"")+" · 5"));P.append(g,e)}
 function datePick(q,P){var t=new Date();t.setHours(0,0,0,0);var d1=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),sat=new Date(t.getFullYear(),t.getMonth(),t.getDate()+((6-t.getDay()+7)%7||7));var g=el("div","g2"),bs=[];
  [["Today",t],["Tomorrow",d1],["Saturday",sat]].forEach(function(x){var v=dval(x[1],t),b=el("button","bt",x[0]+" · "+v);b.type="button";b.setAttribute("aria-pressed","false");b.onclick=function(){var y=choose(q,v);bs.forEach(function(z){z.setAttribute("aria-pressed","false")});if(y)b.setAttribute("aria-pressed","true");inp.value=""};bs.push(b);g.appendChild(b)});
  var inp=el("input","bt");inp.type="date";inp.setAttribute("aria-label","Other day");inp.onchange=function(){if(!inp.value)return;var p=inp.value.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);A[q.id]=dval(d,t);bs.forEach(function(z){z.setAttribute("aria-pressed","false")})};g.appendChild(inp);P.appendChild(g)}
 function rank(q,P){var cur=ORD[q.id]=[],bs=[];function paint(){bs.forEach(function(b){var i=cur.indexOf(b._it);b.setAttribute("aria-pressed",i>=0?"true":"false");b.firstChild.textContent=i>=0?String(i+1):""});A[q.id]=cur.length?cur.map(function(x,j){return(j+1)+". "+x}).join(" > ")+(cur.length<q.items.length?" (partial)":""):""}
  q.items.forEach(function(it){var b=el("button","bt rk");b.type="button";b._it=it;b.append(el("span","badge"),lbl(it,"span"));b.onclick=function(){var i=cur.indexOf(it);if(i>=0)cur.splice(i,1);else cur.push(it);paint()};bs.push(b);P.appendChild(b)});paint()}
 function drag(q,P){var ord=ORD[q.id]=q.items.slice(),box=el("div");box.style.cssText="display:flex;flex-direction:column;gap:8px";P.appendChild(box);
  function paint(){box.innerHTML="";var rows=[];ord.forEach(function(it,k){var r=el("div","dg");r.append(el("span","num",String(k+1)),lbl(it,"span"),el("span","hdl","☰"));rows.push(r);box.appendChild(r);var y0=0,dy=0,h=0,on=false;
   r.addEventListener("pointerdown",function(e){on=true;y0=e.clientY;dy=0;h=r.offsetHeight+8;try{r.setPointerCapture(e.pointerId)}catch(x){}r.classList.add("lift")});
   r.addEventListener("pointermove",function(e){if(!on)return;dy=e.clientY-y0;r.style.transform="translateY("+dy+"px)";var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));rows.forEach(function(o,j){if(o===r)return;var s=0;if(k<to&&j>k&&j<=to)s=-h;if(k>to&&j<k&&j>=to)s=h;o.style.transform=s?"translateY("+s+"px)":""})});
   function end(){if(!on)return;on=false;var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));if(to!==k){var m=ord.splice(k,1)[0];ord.splice(to,0,m);A[q.id]=ord.map(function(x,j){return(j+1)+". "+x}).join(" > ")}paint()}
   r.addEventListener("pointerup",end);r.addEventListener("pointercancel",end)})}paint()}
 function todo(q,P){A[q.id]={};q.rows.forEach(function(x,k){var id=x.id||String(k),n=kc(),txt=String(x.s||"").replace(/^\S+\s+/,"");var h=el("span","hi"),bx=el("span","box","");bx.setAttribute("role","checkbox");bx.setAttribute("aria-checked","false");h.append(bx,el("span","em",n),rich(el("span","tx"),txt));
  var d=drop(h,body(x.m),"td");x._n=n;x._t=txt;bx.onclick=function(e){e.stopPropagation();var on=!A[q.id][id];A[q.id][id]=on;bx.textContent=on?"✓":"";bx.setAttribute("aria-checked",on?"true":"false");d.classList.toggle("done",on)};P.appendChild(d)})}
 function report(q,P){var rows=q.rows||[],ord=["❌","✅","🧠","⚠"];
  function key(r){var e=first(r.s).replace(/️/g,""),i=ord.indexOf(e);return i<0?4:i}
  // v1.9.2: no folding (Jeff, 10/27): every row shows as its own line once its idea is open, ordered ❌ ✅ 🧠 ⚠️; each row keeps its own dropdown for detail
  rows.map(function(r,i){return {r:r,i:i}}).sort(function(a,b){return key(a.r)-key(b.r)||a.i-b.i}).forEach(function(o){P.appendChild(exRow(o.r.s,o.r.m))})}
 var KIND={decide:decide,do:decide,pair:pair,scale:scale,date:datePick,rank:rank,drag:drag};
 // v1.9.0: the page is grouped by main idea (Jeff, 10/25): each idea is one numbered box, collapsed on load, with its rows, steps, questions and its own note box
 function idea(I,k){var P=sec("idea"),n=KC[k]||String(k+1);I._n=n;var h=el("span","hi"),ih=el("span","ih");ih.appendChild(rich(el("span","it"),I.t));if(I.line)ih.appendChild(rich(el("span","il"),I.line));h.append(el("span","em",n),ih);
  var inner=el("div","in");if((I.rows||[]).length){var rp=el("div");rp.style.cssText="display:flex;flex-direction:column;gap:8px";report({rows:I.rows},rp);inner.appendChild(rp)}
  if((I.steps||[]).length){var st=el("div","st");A["_st"+k]={};I.steps.forEach(function(x,j){var id=x.id||String(j),txt=String(x.s||"");var hh=el("span","hi"),bx=el("span","box","");bx.setAttribute("role","checkbox");hh.append(bx,rich(el("span","tx"),txt));var d=drop(hh,body(x.m),"td");bx.onclick=function(e){e.stopPropagation();var on=!A["_st"+k][id];A["_st"+k][id]=on;bx.textContent=on?"✓":"";d.classList.toggle("done",on)};st.appendChild(d)});inner.appendChild(st)}
  (I.asks||[]).forEach(function(q){var a=el("div","ak"+(q.code?" lock":""));var t=el("div","aq");t.appendChild(rich(el("span"),(q.code?"🔐 ":"❓ ")+q.q));a.appendChild(t);(q.rows||[]).forEach(function(r){a.appendChild(exRow(r.s,r.m))});(KIND[q.kind]||decide)(q,a);inner.appendChild(a)});
  var nb=el("div","inote");nb.appendChild(noteBox("_i"+k,"Add a note about this idea"));inner.appendChild(nb);
  P.appendChild(drop(h,inner,"ihd"))}
 if(R.ideas){R.ideas.forEach(idea)}
 (R.screens||[]).forEach(function(q){if(q.kind==="report"){report(q,sec());return}if(q.kind==="todo"){todo(q,sec());return}var lock=!!q.code,P=sec(lock?"lock":"");qhead(q,P,lock);(q.rows||[]).forEach(function(r){P.appendChild(exRow(r.s,r.m))});(KIND[q.kind]||decide)(q,P)});
 // grouped rounds have no page note: every note goes in an idea's own note box (Jeff, 10/25)
 var pn=R.ideas?el("div"):noteBox("_page","Add a note");if(!R.ideas){pn.style.padding="0";ct.appendChild(pn)}
 if(R.after){ct.appendChild(rich(el("p","after"),R.after))}
 var sb=el("button","send","Send ↗");sb.type="button";ct.appendChild(sb);ct.appendChild(el("div")).style.cssText="flex:none;height:8px";
 function nAnswered(){var n=0;(R.ideas||[]).forEach(function(I){(I.asks||[]).forEach(function(q){var a=A[q.id];if(a&&typeof a==="object"){if(Object.keys(a).some(function(k){return a[k]}))n++}else if(a)n++})});(R.screens||[]).forEach(function(q){var a=A[q.id];if(q.kind==="report")return;if(a&&typeof a==="object"){if(Object.keys(a).some(function(k){return a[k]}))n++}else if(a)n++});return n}
 function transcript(extra){var L=["answers in · "+R.round+" · v"+VERSION+" · "+innerWidth+"w"+(R.file?" · from file":""),""],shotList=[];
  (R.ideas||[]).forEach(function(I,k){L.push(I._n+" "+I.t);if((I.steps||[]).length)L.push("Steps: "+I.steps.map(function(x,j){return x.s+": "+(A["_st"+k][x.id||String(j)]?"done":"not done")}).join("; "));(I.asks||[]).forEach(function(q){var a=A[q.id];if(q.kind==="pair")a=q.items.map(function(it){return it.text+": "+(A[q.id][it.id]||"(skipped)")}).join("; ");L.push((q.code?"🔐 ":"Q: ")+q.q);L.push("Answer: "+(a||"(skipped)"))});var nt=(NT["_i"+k]||"").trim();if(nt)L.push("Note: "+nt);var s=SH["_i"+k]||[];if(s.length){L.push("Screenshots: "+s.length);shotList=shotList.concat(s)}L.push("")});
  (R.screens||[]).forEach(function(q){if(q.kind==="report")return;
   if(q.kind==="todo"){L.push("Steps");L.push("Answer: "+q.rows.map(function(x,k){return x._n+" "+x._t+": "+(A[q.id][x.id||String(k)]?"done":"not done")}).join("; "));L.push("");return}
   var a=A[q.id];if(q.kind==="pair")a=q.items.map(function(it){return it.text+": "+(A[q.id][it.id]||"(skipped)")}).join("; ");
   L.push(q._n+" "+(q.code?"🔐 ":"")+(q.q||"Question"));L.push("Answer: "+(a||"(skipped)"));var nt=(NT[q.id]||"").trim();if(nt)L.push("Note: "+nt);var s=SH[q.id]||[];if(s.length){L.push("Screenshots: "+s.length);shotList=shotList.concat(s)}L.push("")});
  var pn=(NT._page||"").trim();if(pn)L.push("Page note: "+pn);var ps=SH._page||[];if(ps.length){L.push("Page screenshots: "+ps.length);shotList=shotList.concat(ps)}
  if(extra)L.push(extra);return{text:L.join("\n").trim(),shots:shotList}}
 function plain(t){try{sendPrompt(t)}catch(e){syncCopy(t)}}
 function fold(){sent=true;qp.classList.add("sent");bar.textContent="Sent ✓ · "+nAnswered()+" answered"}
 bar.onclick=function(){qp.classList.remove("sent")};
 sb.onclick=function(){var T=transcript();fold();sb.textContent="Send again ↗";
  if(!T.shots.length){plain(T.text);return}
  var form=document.querySelector("form.elicit"),fin=form&&form.querySelector("input[type=file]");
  if(!form||!fin){plain(transcript("(screenshots not sent: send form missing)").text);return}
  try{var dt=new DataTransfer();T.shots.forEach(function(f){dt.items.add(f)});fin.files=dt.files;fin.dispatchEvent(new Event("change",{bubbles:true}))}catch(e){plain(transcript("(screenshots not sent: "+(e&&e.message||e)+")").text);return}
  setTimeout(function(){var f2=document.querySelector("form.elicit")||form,ans=f2.querySelector("[data-name=answers]"),sub=f2.querySelector(".elicit-submit");if(!sub){plain(transcript("(screenshots not sent: no submit)").text);return}
   if(!ans){ans=el("textarea","elicit-textarea");ans.setAttribute("data-name","answers");ans.style.display="none";(f2.querySelector(".elicit-group")||f2).appendChild(ans)}ans.value=T.text;ans.dispatchEvent(new Event("input",{bubbles:true}));sub.click()},400)};
 if(canShot)["dragenter","dragover"].forEach(function(ev){qp.addEventListener(ev,function(e){e.preventDefault();qp.classList.add("drop")})});
 qp.addEventListener("dragleave",function(e){if(!qp.contains(e.relatedTarget))qp.classList.remove("drop")});
 qp.addEventListener("drop",function(e){if(!canShot)return;e.preventDefault();qp.classList.remove("drop");var fs=e.dataTransfer&&e.dataTransfer.files;if(!fs||!fs.length)return;var h=e.target.closest&&e.target.closest(".qh"),id="_page";if(h){var s=h.closest(".sec");(R.screens||[]).forEach(function(q){if(q._sec===s)id=q.id})}addShots(id,fs);var w=h?h.querySelector(".in"):pn;if(w&&w._mark)w._mark()});
 [].forEach.call(ct.querySelectorAll(".sec"),function(s,i){var q=(R.screens||[])[i];if(q)q._sec=s});


}
window.QP={mount:mount,version:VERSION};
})();
