/* Jeff's inline question page engine. Layout and behavior only: no round content, no answers. */
(function(){
var VERSION="4.1.3";
// v3.3.0 (Jeff 10/30): a round with a finish verdict ends on the verdict card itself (🗑️ or 💾, the three checks, the pickup point), with no Submit all and no note bars, so the page plainly needs no answer; anything Jeff wants to say goes in the chat box
// v3.2.1 (Jeff 10/30, iqp3 cut off): a grouped row too tall for one card goes on to the next card part by part (headline repeated), a long paragraph inside it splits by sentence, and a copy box over 280 characters shows its first lines with "Full text in Copy" (Copy still copies all of it), so nothing is ever cut off; a card still cut off shows in the Send header as "cut: N"
// v3.2.0 (Jeff 10/30, iqp2): grouping is the default: every ❌ ✅ 🧠 ⚠️ row of an idea sits on one card, fully shown, going on to 2/2, 3/3; only a step for Jeff or a question for Jeff gets a card of its own; "group":false keeps one card per row
// v3.1.0 (Jeff 10/30, iqp1): round "group":true puts every ❌ ✅ 🧠 ⚠️ row of an idea on one card, each row fully shown (headline, then its detail), going on to 2/2, 3/3 when long; steps and questions keep one card each
// v2.0.1: a row or step whose m is empty ("" or []) loses the m in prep, so it draws flat instead of failing the round as "row with an empty dropdown"; a step with no m draws flat (no arrow), like a row.
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
".qp .snap>.w{transition:none}.qp .qanc{position:absolute;left:0;width:1px;height:1px;pointer-events:none}.qp .qlow,.qp .qtop{flex:none;height:0}.qp,.qp *{overflow-anchor:none}"+
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
".qp .inote{border-top:1px solid var(--line);padding-top:12px}.qp .inote>.in{padding:0}.qp .icl{font:inherit;align-self:stretch;min-height:44px;padding:0 14px;border:1.5px solid var(--line);border-radius:10px;background:transparent;color:var(--muted);cursor:pointer}"+
".qp .cap{color:var(--muted);font-weight:400}.qp .cap.full{color:var(--accent);font-weight:600}"+
".qp .nm{display:grid;grid-template-columns:56px 1fr 56px;gap:8px}.qp .nm .bt{font-size:1.3em}"+
".qp input.nv{font:inherit;font-weight:600;min-height:48px;width:100%;box-sizing:border-box;text-align:center;border:1.5px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);padding:0 8px}"+
".qp input.nv.pick{border:2.5px dashed var(--accent)}.qp input.nv.set{border:2.5px solid var(--accent);background:var(--chosen)}.qp input.nv:focus{outline:none;border-color:var(--accent)}.qp input.nv::placeholder{color:var(--muted);opacity:.8}"+
".qp .gq{display:flex;flex-wrap:wrap;gap:8px}.qp .gq .bt{flex:1 1 auto}.qp .nu{color:var(--muted);text-align:center}"+
".qp textarea.tx.set{border-color:var(--accent)}"+
".qp .qn{font:inherit;align-self:flex-start;min-height:40px;padding:0 14px;border:1.5px solid var(--line);border-radius:10px;background:transparent;color:var(--muted);cursor:pointer}.qp .qn.has{border-color:var(--accent);color:var(--accent);font-weight:600}"+
".qp .qnb{display:none}.qp .qnb.on{display:block}.qp .qnb>.in{padding:0}.qp .qnb textarea{min-height:64px}";
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
// v1.10.0: the engine fills in a round's defaults and checks it itself, so a raw round can be mounted in one call.
// prep() is build.py's expand() and check() is check.py, ported line for line; both are safe to run on a round build.py already expanded.
var KEYCAP_RX="[1-9]️?⃣";
function guessKind(q){if(q.kind)return q.kind;if("options" in q)return "decide";if("ends" in q)return "scale";if(q.items&&q.items.length&&typeof q.items[0]==="object"&&q.items[0])return "pair";var rows=q.rows||[];if(rows.length&&new RegExp("^"+KEYCAP_RX).test(rows[0].s||""))return "todo";return "report"}
function fixPair(q){if(q.kind==="pair"){q.items=(q.items||[]).map(function(it){it=Object.assign({},it);var p=it.pick;if((p==="a"||p==="b")&&p!==it.a&&p!==it.b)it.pick=it[p];return it})}return q}
function codeQ(q){var o=[{label:"Not yet",more:q.wait||"Nothing changes."},{label:"🔐 Approve "+q.code+": "+q.action,more:q.more||q.action}];var r={id:q.id,kind:"decide",code:true,q:q.q,options:o};if(q.rows!=null)r.rows=q.rows;return r}
function memRows(ms){return(ms||[]).map(function(m){var inner=[{p:(m.was?"Updated ":"Added to ")+m.file},{c:m.line}];if(m.was)inner.push({p:"Was: "+m.was});var b=String(m.file||"").split("/").pop().replace(/\.md$/,"");return{s:"🧠 "+b+(m.sha?" "+m.sha:""),m:inner}})}
function emptyM(m){return m==null||(typeof m==="string"&&!m.trim())||(Array.isArray(m)&&!m.length)}
function tidyRows(rows){return(rows||[]).map(function(x){if(x==null||typeof x!=="object")return x;x=Object.assign({},x);if("m" in x){if(emptyM(x.m))delete x.m;else if(Array.isArray(x.m))x.m=tidyRows(x.m)}return x})}
function prepQ(q){q=Object.assign({},q);if(q.rows!=null)q.rows=tidyRows(q.rows);if(q.kind==="code")q=codeQ(q);if(q.kind==="multi"){q.kind="decide";q.multi=true}q.kind=guessKind(q);fixPair(q);return q}
// v2.0.6: the hard cap (Jeff 10/30): every top line (row, step, 🧠 row, answer button) is 30 characters or less after its emoji; a longer one is cut at a word and its whole text opens its dropdown, so nothing is lost and no page fails; the Send header counts them ("over 30: N") so Claude sees each miss
var CAP=35,OVER=0;
function cut(t,c){var w=String(t).split(" "),o="";for(var i=0;i<w.length;i++){var nx=o?o+" "+w[i]:w[i];if(Array.from(nx).length>c)break;o=nx}var SW=/^(the|a|an|to|of|and|or|for|in|on|at|with|by|from|then|but|so|is|are|was|be|its|it|this|that)$/i,ws=o.split(" ");while(ws.length>2&&SW.test(ws[ws.length-1]))ws.pop();o=ws.join(" ").replace(/[\s,;:\-\u2013\u00b7]+$/,"");return o||Array.from(String(t)).slice(0,c).join("")}
function withFull(full,m){var f={p:full};if(m==null)return full;if(Array.isArray(m))return [f].concat(m);return [f,{p:m}]}
function capRow(x,emo){if(!x||typeof x!=="object"||typeof x.s!=="string")return x;var s=x.s,e="",t=s;if(emo){var k=s.indexOf(" ");if(k>0&&k<6){e=s.slice(0,k+1);t=s.slice(k+1)}}
 if(Array.from(t).length<=CAP)return x;OVER++;x=Object.assign({},x);x.s=e+cut(t,CAP);x.m=withFull(t,x.m);return x}
function capOpts(q){if(q.code||!q.options)return q;q.options=q.options.map(function(o){if(!o||Array.from(String(o.label||"")).length<=CAP)return o;OVER++;o=Object.assign({},o);var full=o.label;o.label=cut(full,CAP);o.more=withFull(full,o.more);return o});return q}
function prep(R){if(R._prepped)return R;R=Object.assign({},R);var n=0;OVER=0;
 if(R.ideas!=null){R.ideas=R.ideas.map(function(I){I=Object.assign({},I);var rows=tidyRows(I.rows).concat(memRows(I.mem));delete I.mem;if(I.steps!=null)I.steps=tidyRows(I.steps);
  var asks=(I.asks||[]).map(function(q){q=capOpts(prepQ(q));n++;if(!q.id)q.id="q"+n;if(q.rows==null)delete q.rows;return q});I.rows=rows.map(function(x){return capRow(x,true)});if(I.steps)I.steps=I.steps.map(function(x){return capRow(x,false)});I.asks=asks;return I}).filter(function(I){return I.rows.length||I.asks.length||(I.steps||[]).length})}
 var out=[],report=null;(R.screens||[]).forEach(function(q){q=prepQ(q);if(q.kind==="report"&&!report)report=q;out.push(q)});
 if(!report&&R.ideas==null&&R.mem){report={kind:"report",rows:[]};out.unshift(report)}
 if(report){report.rows=tidyRows(report.rows).concat(memRows(R.mem))}
 var f=R.finish;if(f)R._finish=true;if(f){var v,inner;if(f.kind==="delete"){v="🗑️ Safe to close & delete";inner=[{p:"Pickup point: "+(f.pickup||"nothing to pick up")}]}else{v="💾 Safe to close, keep this chat";inner=[{p:f.why||f.pickup||"Worth keeping to look back at."}]}out.push({kind:"report",rows:[{s:v,m:inner}]})}
 out.forEach(function(q,i){if(!q.id)q.id="s"+(i+1);if(q.rows==null)delete q.rows});
 ["mem","title","finish","theme"].forEach(function(k){delete R[k]});R.screens=out;R._over=OVER;R._prepped=true;return R}
var KINDS=["report","todo","decide","do","pair","rank","drag","scale","date","number","text","check"],QKINDS=KINDS.slice(2);
var EMO_CK=new RegExp("^(?:"+KEYCAP_RX+"|[^\\p{L}\\p{N}_\\s]\\S*)\\s+\\S","u");
function rowsOk(rows,w,bad,emoji){(rows||[]).forEach(function(x){if(!("p" in x||"c" in x||"s" in x))bad(w,"row needs p, c or s");
 if("s" in x){if(emoji&&!EMO_CK.test(x.s||""))bad(w,"row needs its emoji and a space first: "+String(x.s).slice(0,30));var m=x.m;
  if(m!=null&&((typeof m==="string"&&!m.trim())||(Array.isArray(m)&&!m.length)))bad(w,"row with an empty dropdown: "+String(x.s).slice(0,30));
  if(Array.isArray(m))rowsOk(m,w+" > "+String(x.s).slice(0,18),bad,emoji)}})}
function check(R,errs){errs=errs||[];function bad(w,m){errs.push(w+": "+m)}
 if(!/^[a-z]{2,8}\d{1,4}$/.test(R.round||""))bad("round","id must look like iqp18");
 if(R.ideas!=null)return checkIdeas(R,errs,bad);
 var sc=R.screens||[];if(!sc.length)bad("screens","none");var ids={};
 sc.forEach(function(q,i){var w="screen "+(i+1),k=q.kind;if(KINDS.indexOf(k)<0)bad(w,"unknown kind "+k);
  if(!q.id||ids[q.id])bad(w,"missing or repeated id");ids[q.id]=1;
  if(JSON.stringify(q).indexOf("—")>=0)bad(w,"em dash");
  if(k==="report"||k==="todo"){if(!(q.rows||[]).length)bad(w,k+" with no rows");rowsOk(q.rows,w,bad,true)}
  var isQ=QKINDS.indexOf(k)>=0;if(isQ&&q.rows&&q.rows.length)rowsOk(q.rows,w,bad,false);
  if(isQ&&!String(q.q||"").trim())bad(w,"question needs a short title in q");
  if(k==="decide"||k==="do"){var o=q.options||[],p=o.filter(function(x){return x.pick});if(q.multi){if(o.length<2||o.length>8)bad(w,"pick-several needs 2 to 8 options");if(q.max!=null&&!(q.max>=1&&q.max<o.length&&q.max%1===0))bad(w,"max must be a whole number from 1 to one less than the options")}else if(o.length<2||o.length>4)bad(w,"needs 2 to 4 options");
   if(q.code){if(p.length)bad(w,"code screens take no Claude pick");if(!o.length||String(o[0].label||"").toLowerCase().indexOf("not yet")<0)bad(w,"code screens start with Not yet")}
   else if(q.multi){if(q.max!=null&&p.length>q.max)bad(w,"more Claude picks than max")}else if(p.length!==1)bad(w,"needs exactly one Claude pick")}
  if(k==="pair"){var it=q.items||[];if(it.length<1||it.length>4)bad(w,"pair needs 1 to 4 items");
   it.forEach(function(x){if(!(x.id&&x.text&&x.a&&x.b))bad(w,"pair item needs id, text, a, b");else if(x.pick!==x.a&&x.pick!==x.b)bad(w,'pair item "'+String(x.text).slice(0,30)+'": pick must be exactly "'+x.a+'" or "'+x.b+'"')})}
  if((k==="rank"||k==="drag")&&((q.items||[]).length<2||(q.items||[]).length>6))bad(w,"needs 2 to 6 items");
  if(k==="scale"&&(q.ends||[]).length!==2)bad(w,"needs two end labels");
  if(k==="number"){["min","max","step","pick"].forEach(function(f){if(q[f]!=null&&typeof q[f]!=="number")bad(w,f+" must be a number")});if(q.min!=null&&q.max!=null&&q.min>=q.max)bad(w,"min must be below max");if(q.pick!=null&&((q.min!=null&&q.pick<q.min)||(q.max!=null&&q.pick>q.max)))bad(w,"pick is outside min to max");if(q.quick!=null&&(!Array.isArray(q.quick)||q.quick.length>6||q.quick.some(function(v){return typeof v!=="number"})))bad(w,"quick must be up to 6 numbers")}
  if(k==="check"){var ci=q.items||[];if(ci.length<2||ci.length>8)bad(w,"check needs 2 to 8 items");if(ci.some(function(x){return typeof x!=="string"||!x.trim()}))bad(w,"check items are short text");if(q.pick!=null&&(!Array.isArray(q.pick)||q.pick.some(function(p){return ci.indexOf(p)<0})))bad(w,"check pick must list items it has")}
  if(k==="text"&&q.ph!=null&&typeof q.ph!=="string")bad(w,"ph must be text")});return errs}
function checkIdeas(R,errs,bad){var I=R.ideas||[];if(!I.length)bad("ideas","none");var seen={};
 I.forEach(function(x,i){var w="idea "+(i+1);if(JSON.stringify(x).indexOf("—")>=0)bad(w,"em dash");if(!String(x.t||"").trim())bad(w,"needs a short title in t");
  if(!((x.rows||[]).length||(x.steps||[]).length||(x.asks||[]).length))bad(w,"empty idea: give it rows, steps or asks");
  rowsOk(x.rows,w,bad,true);(x.steps||[]).forEach(function(s){if(!String(s.s||"").trim())bad(w,"step needs s")});
  var a=x.asks||[];a.forEach(function(q){if(seen[q.id])bad(w,"repeated question id "+q.id);seen[q.id]=1});
  if(a.length)check({round:R.round,screens:a}).forEach(function(e){if(e.indexOf("round")!==0)bad(w,e)})});
 (R.screens||[]).forEach(function(q){if(q.kind!=="report")bad("screens","a grouped round keeps its questions inside ideas")});
 if(R._finish){var left=I.filter(function(x){return (x.steps||[]).length||(x.asks||[]).length}).map(function(x){return x.t||""});
  if(left.length)bad("finish","refused: steps or questions still open in: "+left.join("; ")+" (core/inline-page.md, End of a chat)")}return errs}
function showErrors(host,errs){var b=document.createElement("div");b.style.cssText="font:16px/1.5 system-ui,sans-serif;color:#b42318;border:2px solid #b42318;border-radius:12px;padding:12px 16px";
 var h=document.createElement("b");h.textContent="This page was not drawn: the round failed its check. Claude fixes it and draws it again.";b.appendChild(h);
 var ul=document.createElement("ul");ul.style.margin="8px 0 0";errs.forEach(function(e){var li=document.createElement("li");li.textContent=e;ul.appendChild(li)});b.appendChild(ul);host.appendChild(b)}
function txt4(m){if(m==null)return"";if(Array.isArray(m))return m.map(function(x){return typeof x==="string"?x:(x&&(x.p||x.c||x.s))||""}).filter(Boolean).join(" ");return String(m)}
// v4.1.3: the fallback text is cleared before the round check too, so a failed check shows only its list
// v4.1.2 (Jeff 11/2): mount clears the card's own fallback text first, so the card can hold "The page engine did not load" in qp-root itself and no if/else line is needed
// v4.1.1 (Jeff 11/2): the 🗑️ and 💾 verdict box lists all seven checks
// v4.1.0 (Jeff 11/1, mocks 20 to 36): the calm look. Navy page; what Claude did sits in a mint-outlined top part (each line folds open with its arrow, a tap on a line hides it, one Close folds the whole part and turns into Open in the same spot); Jeff's part sits on a lighter band: every question and step in its own soft blue outline, the first one glowing, two at a time, the next sliding in as one is answered; answers are colored chips drawn as tap areas with inline colors (claude.ai's own button style strips color from real buttons), Claude's pick in a white dotted outline; a code ask has Not yet plus a gold Approve and never a pick; the dots ride in Send, which reads Send Claude's picks until Jeff changes an answer; all answered shows All set and a green Send; after Send, Jeff's part folds into one Sent line that opens again to edit; notes are soft bands (type or talk)
var C5={navy:"#1e2533",ink:"#f2f4f8",sub:"#9aa3b5",dim:"#6f7a8f",yel:"#F5C518",red:"#F04A3E",pink:"#F6A5B8",mint:"#A8E6B0",gold:"#F5C518",blue:"#8EC5FF",ac:["#8EC5FF","#F2B880","#A8E6B0","#C9B8FF"]};
function rgba5(c,a){var n=parseInt(c.slice(1),16);return "rgba("+(n>>16)+","+(n>>8&255)+","+(n&255)+","+a+")"}
var CSS5=[
".q5{box-sizing:border-box;background:"+C5.navy+";color:"+C5.ink+";border-radius:14px;padding:16px 16px 0;font-family:ui-rounded,'SF Pro Rounded',var(--font-sans,system-ui,-apple-system,sans-serif);-webkit-text-size-adjust:100%;line-height:1.4}",
".q5 *{box-sizing:border-box}",
".q5 .tp{border-radius:14px;padding:6px 6px 8px 14px;margin:0 0 14px;background:"+rgba5(C5.mint,.05)+";box-shadow:0 0 0 1px "+rgba5(C5.mint,.35)+"}",
".q5 .il{font-size:13px;color:"+C5.dim+";letter-spacing:.03em;padding:10px 0 0}",
".q5 .rw{display:flex;align-items:center;justify-content:space-between}",
".q5 .rt{flex:1;display:grid;grid-template-columns:30px 1fr;align-items:center;padding:8px 0;cursor:pointer;font-size:17px;line-height:1.3;overflow-wrap:anywhere}",
".q5 .ar{display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px;color:"+rgba5(C5.ink,.3)+";font-size:16px;cursor:pointer;transition:transform .15s}",
".q5 .dt{font-size:15px;line-height:1.5;color:"+C5.sub+";padding:0 0 8px 30px;overflow-wrap:anywhere}",
".q5 .dt ul{margin:0;padding-left:18px}.q5 .dt .sh{color:"+C5.ink+";margin-top:6px}",
".q5 .cp{display:flex;gap:8px;align-items:center;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 8px 8px 12px;margin:6px 0}",
".q5 .cp pre{flex:1;min-width:0;margin:0;font:13.5px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;color:"+C5.ink+"}",
".q5 .bd{background:rgba(255,255,255,.07);border-radius:14px;padding:4px 14px 12px}",
".q5 .qi{border-radius:14px;padding:12px 14px 8px;margin:10px -6px 4px;background:"+rgba5(C5.blue,.05)+";box-shadow:0 0 0 1px "+rgba5(C5.blue,.22)+";transition:opacity .22s}",
".q5 .qi.gl{background:"+rgba5(C5.blue,.08)+";box-shadow:0 0 0 1px "+rgba5(C5.blue,.45)+",0 0 22px "+rgba5(C5.blue,.25)+"}",
".q5 .qt{font-size:19px;line-height:1.3;color:"+C5.ink+";padding:0 0 10px;overflow-wrap:anywhere}",
".q5 .qr{font-size:15px;color:"+C5.sub+";line-height:1.5;padding:0 0 10px}",
".q5 .ch{display:flex;flex-wrap:wrap;gap:12px;padding:0 0 6px}.q5 .ch.col{flex-direction:column;gap:10px}",
".q5 .mo{font-size:14px;opacity:.75;margin-top:2px;line-height:1.35}",
".q5 .more{font-size:15px;color:"+C5.dim+";padding:6px 0 0}",
".q5 .ends{display:flex;justify-content:space-between;font-size:14px;color:"+C5.dim+";padding:0 0 6px}",
".q5 .pi{font-size:16px;color:"+C5.sub+";padding:2px 0 8px}",
".q5 .sr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 0}",
".q5 .fin{margin:0 0 14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.07)}",
".q5 .thumbs{display:flex;gap:8px;flex-wrap:wrap}.q5 .thumbs:not(:empty){margin-top:8px}.q5 .th{position:relative;width:56px;height:56px}.q5 .th img{width:56px;height:56px;object-fit:cover;border-radius:6px}",
".q5.drop{outline:2px dashed "+C5.blue+";outline-offset:4px}",
".q5 .stash{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}"].join("\n");
var TB5="display:inline-flex;align-items:center;box-sizing:border-box;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;";
function esc5(t){return String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function rich5(t){return esc5(t).split("**").map(function(p,i){return i%2?"<b>"+p+"</b>":p}).join("")}
function mount(R0){
 if(!document.getElementById("qp5-css")){var st=el("style");st.id="qp5-css";st.textContent=CSS5;document.head.appendChild(st)}
 if(R0.shots!==false&&!document.querySelector("form.elicit")){var fw=document.createElement("div");fw.innerHTML=FORM;document.body.appendChild(fw.firstElementChild)}
 var host=document.getElementById(R0.root||"qp-root"),FIN=R0.finish||null;if(host&&!host.querySelector(".q5"))host.textContent="";
 var R=prep(R0);
 if(R.ideas==null){var rows=[],steps=[],asks=[];(R.screens||[]).forEach(function(q){if(q.kind==="report"){(q.rows||[]).forEach(function(x){var e=first(x.s||"");if(FIN&&(e.indexOf("🗑")===0||e.indexOf("💾")===0))return;rows.push(x)})}else if(q.kind==="todo"){(q.rows||[]).forEach(function(x,j){steps.push({id:x.id||q.id+"_"+j,s:String(x.s||"").replace(/^\S+\s+/,""),m:x.m})})}else asks.push(q)});
  R.ideas=[{t:R0.title||"This round",rows:rows,steps:steps,asks:asks}].filter(function(I){return I.rows.length||I.steps.length||I.asks.length})}
 R.screens=[];var CE=check(R);if(CE.length){showErrors(host,CE);return}
 var qp=el("div","q5");host.appendChild(qp);
 var S={tuck:{},open:{},closed:false,sent:false,changed:false,auto:[]},A={},HID={},NT={},SH={},shotTarget=null,canShot=!!document.querySelector("form.elicit"),touch=false;try{touch=matchMedia("(pointer:coarse)").matches}catch(e){}
 var pick=el("input");pick.type="file";pick.multiple=true;pick.accept="image/*";
 // items: every step and question, in idea order, each with its idea index
 var ITEMS=[];R.ideas.forEach(function(I,k){I._n=KC[k]||String(k+1);(I.steps||[]).forEach(function(x,j){ITEMS.push({t:"step",k:k,id:"_st"+k+"_"+(x.id||String(j)),x:x})});(I.asks||[]).forEach(function(q){ITEMS.push({t:"q",k:k,id:q.id,q:q})})});
 function col(s){var e=first(s||"").replace(/️/g,"");return e==="⚠"?C5.yel:e==="❌"?C5.red:e==="🧠"?C5.pink:C5.ink}
 function wt(s){var e=first(s||"").replace(/️/g,"");return (e==="⚠"||e==="❌"||e==="🧠")?500:400}
 function split(s){var m=null;try{m=EMO.exec(s||"")}catch(x){}return m?[m[1],m[2]]:["",s||""]}
 var ORD=["❌","⚠","✅","🧠"];function rk(r){var e=first(r.s||"").replace(/️/g,""),i=ORD.indexOf(e);return i<0?3:i}
 // top rows: per idea, sorted; several 🧠 rows fold into one
 var TOP=R.ideas.map(function(I,k){var rs=(I.rows||[]).map(function(r,i){return{r:r,i:i}}).sort(function(a,b){return rk(a.r)-rk(b.r)||a.i-b.i}).map(function(o){return o.r});
  var mem=rs.filter(function(r){return first(r.s||"").indexOf("🧠")===0});if(mem.length>1){rs=rs.filter(function(r){return mem.indexOf(r)<0});rs.push({s:"🧠 Claude saved "+mem.length+" rules",m:mem.map(function(r){return{s:r.s.replace(/^🧠\s*/,""),m:r.m}})})}
  return {t:I.t,rows:rs.map(function(r,i){return{id:k+"_"+i,r:r}})}}).filter(function(g){return g.rows.length});
 function cpH(c){var text=typeof c==="string"?c:c.text,url=/^https?:\/\/\S+$/.test(String(text||"").trim());return '<div class="cp"><pre>'+esc5(text)+'</pre>'+tb('data-copy="'+esc5(text)+'"'+(url?' data-url="1"':''),chipS(C5.ac[0],false,false)+"font-size:14px;padding:6px 12px;min-height:36px;",url?"Copy & open":"Copy")+'</div>'}
 function detH(m){if(m==null)return"";if(!Array.isArray(m))return rich5(m);var allP=m.length>1&&m.every(function(x){return x&&typeof x==="object"&&x.p!=null&&x.c==null&&x.s==null});
  if(allP)return "<ul>"+m.map(function(x){return "<li>"+rich5(x.p)+"</li>"}).join("")+"</ul>";
  return m.map(function(x){if(x==null)return"";if(typeof x!=="object")return "<div>"+rich5(x)+"</div>";if(x.c!=null)return cpH(x.c);if(x.s!=null)return '<div class="sh">'+rich5(x.s)+'</div><div>'+detH(x.m)+'</div>';return "<div>"+rich5(x.p)+"</div>"}).join("")}
 function tb(at,s,t){return '<div role="button" tabindex="0" '+at+' style="'+s+'">'+t+'</div>'}
 function chipS(c,sel,pk,full){return TB5+"font-size:16px;padding:10px 16px;min-height:44px;border:none;border-radius:"+(full?"14px":"999px")+";"+(full?"display:flex;flex-direction:column;align-items:flex-start;width:100%;text-align:left;line-height:1.3;":"")+(sel?"background:"+c+";color:"+C5.navy+";":"background:"+rgba5(c,.2)+";color:"+c+";")+(pk?"outline:2px dashed "+rgba5(C5.ink,.85)+";outline-offset:3px;":"")}
 function pill(at,inner,c){return tb(at,TB5+"gap:10px;white-space:nowrap;font-size:17px;padding:11px 18px;border-radius:999px;border:1px solid "+(c||C5.dim)+";color:"+(c||C5.ink),inner)}
 function band(id,ph,bg){return '<textarea data-note="'+id+'" rows="1" placeholder="'+esc5(ph)+'" style="display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.4;color:'+C5.ink+';resize:none;overflow:hidden;outline:none;-webkit-appearance:none;appearance:none;min-height:0;background:'+bg+';border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin:10px 0 4px">'+esc5(NT[id]||"")+'</textarea>'+(canShot?'<div class="thumbs" data-thumbs="'+id+'"></div>':'')}
 function counts(){var c={};TOP.forEach(function(g){g.rows.forEach(function(o){if(S.tuck[o.id])return;var e=split(o.r.s)[0]||"•";c[e]=(c[e]||0)+1})});var ks=Object.keys(c);if(!ks.length)return '<span style="color:'+C5.dim+'">All read</span>';
  return ks.map(function(e){var cc=col(e+" x");return '<span style="color:'+(cc===C5.ink?C5.sub:cc)+'">'+e+" "+c[e]+"</span>"}).join('<span style="color:'+C5.dim+'"> · </span>')}
 function topH(){if(!TOP.length)return"";if(S.closed)return '<div class="tp"><div class="rw" style="padding:2px 0"><span style="font-size:15px">'+counts()+'</span>'+pill('data-close="1"',"Open ⌄")+'</div></div>';
  var multi=TOP.length>1,n=Object.keys(S.tuck).length,h="";
  TOP.forEach(function(g){var vis=g.rows.filter(function(o){return !S.tuck[o.id]});if(!vis.length)return;if(multi)h+='<div class="il">'+rich5(g.t)+'</div>';
   vis.forEach(function(o){var p=split(o.r.s),has=o.r.m!=null;h+='<div data-item="1"><div class="rw"><div class="rt" data-tuck="'+o.id+'" style="color:'+col(o.r.s)+';font-weight:'+wt(o.r.s)+'"><span>'+esc5(p[0])+'</span><span>'+rich5(p[1])+'</span></div>'+(has?'<span class="ar" data-arr="'+o.id+'" style="transform:rotate('+(S.open[o.id]?90:0)+'deg)">›</span>':'<span style="min-width:40px"></span>')+'</div>'+(has&&S.open[o.id]?'<div class="dt">'+detH(o.r.m)+'</div>':'')+'</div>'})});
  return '<div class="tp">'+h+band("_top","Add a note · type or talk","rgba(255,255,255,.05)")+'<div class="rw" style="margin:10px 0 2px">'+(n?tb('data-showtop="1"',TB5+"font-size:15px;color:"+C5.dim+";padding:8px 0","↺ "+n):"<span></span>")+pill('data-close="1"',"Close ⌃")+'</div></div>'}
 function isAns(it){var a=A[it.id];if(it.t==="step")return a!=null;var k=it.q.kind;if(k==="text")return !!(a&&String(a).trim());if(k==="pair")return a&&it.q.items.every(function(x){return a[x.id]});if(k==="check"||k==="rank"||k==="drag"||(k==="decide"&&it.q.multi)||k==="number")return !!HID[it.id];return a!=null&&a!==""}
 function hidden(it){if(it.q&&it.q.kind==="text")return !!HID[it.id];return isAns(it)||!!HID[it.id]}
 function dotC(it){var a=A[it.id];if(!isAns(it))return null;if(it.t==="step")return C5.mint;var q=it.q;if(q.code)return a&&String(a).indexOf("🔐")===0?C5.gold:C5.dim;if(q.kind==="decide"&&!q.multi){var i=q.options.map(function(o){return o.label}).indexOf(a);return C5.ac[(i<0?0:i)%4]}return C5.ac[ITEMS.indexOf(it)%4]}
 function dots(){return ITEMS.map(function(it){var c=dotC(it);var z=ITEMS.length>8?6:8,mg=ITEMS.length>8?1:2;return '<span style="display:inline-block;flex:none;width:'+z+'px;height:'+z+'px;border-radius:50%;margin:0 '+mg+'px;background:'+(c||"transparent")+';border:1.5px solid '+(c||C5.dim)+'"></span>'}).join("")}
 function full(opts){return opts.some(function(o){return o.more||Array.from(String(o.label||"")).length>18})}
 function doneChip(id){return tb('data-done="'+id+'"',TB5+"font-size:15px;padding:8px 14px;min-height:40px;border-radius:999px;color:"+C5.sub+";border:1px solid rgba(255,255,255,.15);margin-top:4px","Done ✓")}
 function itemH(it,glow){var h="",id=it.id;
  if(it.t==="step"){var x=it.x;h='<div class="qt">'+rich5(x.s)+'</div>'+(x.m!=null?'<div class="qr">'+detH(x.m)+'</div>':'')+'<div class="ch">'+tb('data-step="'+id+'"',chipS(C5.mint,false,false),"Done")+'</div>';return '<div class="qi'+(glow?" gl":"")+'" data-item="1">'+h+'</div>'}
  var q=it.q,k=q.kind,a=A[id];h='<div class="qt">'+(q.code?"🔐 ":"")+rich5(q.q)+'</div>';(q.rows||[]).forEach(function(r){h+='<div class="qr">'+rich5(r.s||r.p||"")+(r.m!=null?"<div>"+detH(r.m)+"</div>":"")+'</div>'});
  if(k==="decide"||k==="do"){var fl=q.code||full(q.options),cur=q.multi?String(a||"").split("; ").filter(Boolean):[];
   h+='<div class="ch'+(fl?" col":"")+'">'+q.options.map(function(o,i){var c=q.code?(i?C5.gold:C5.dim):C5.ac[i%4],sel=q.multi&&cur.indexOf(o.label)>=0;return tb('data-ans="'+id+'" data-i="'+i+'"',chipS(c,sel,!q.code&&o.pick,fl),'<span>'+rich5(o.label)+(sel?" ✓":"")+'</span>'+(o.more&&String(o.label).indexOf(txt5(o.more))<0?'<span class="mo">'+esc5(txt5(o.more))+'</span>':''))}).join("")+'</div>';
   if(q.multi)h+=(q.max?'<div class="more">Pick up to '+q.max+'</div>':'')+doneChip(id)}
  else if(k==="pair"){var v=a||{};q.items.forEach(function(x){if(v[x.id])return;h+='<div class="pi">'+rich5(x.text)+'</div><div class="ch">'+[x.a,x.b].map(function(o,i){return tb('data-pair="'+id+'" data-pid="'+esc5(x.id)+'" data-i="'+i+'"',chipS(C5.ac[i%4],false,x.pick===o),rich5(o))}).join("")+'</div>'})}
  else if(k==="scale"){h+='<div class="ch" style="gap:8px;flex-wrap:nowrap">'+[1,2,3,4,5].map(function(n){return tb('data-scale="'+id+'" data-i="'+n+'"',TB5+"justify-content:center;width:44px;height:44px;border-radius:50%;font-size:17px;background:"+rgba5(C5.blue,.08+n*.05)+";color:"+C5.blue+(q.pick===n?";outline:2px dashed "+rgba5(C5.ink,.85)+";outline-offset:3px":""),String(n))}).join("")+'</div><div class="ends"><span>1 · '+esc5((q.ends||[])[0]||"")+'</span><span>'+esc5((q.ends||[])[1]||"")+' · 5</span></div>'}
  else if(k==="date"){var t=new Date();t.setHours(0,0,0,0);var d1=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),sat=new Date(t.getFullYear(),t.getMonth(),t.getDate()+((6-t.getDay()+7)%7||7));
   h+='<div class="ch">'+[["Today",t],["Tomorrow",d1],["Saturday",sat]].map(function(x,i){return tb('data-date="'+id+'" data-v="'+esc5(dval(x[1],t))+'"',chipS(C5.ac[i%4],false,false),x[0]+" · "+dval(x[1],t))}).join("")+'</div><input data-datein="'+id+'" type="date" aria-label="Other day" style="font:inherit;font-size:16px;min-height:44px;width:100%;box-sizing:border-box;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:transparent;color:'+C5.sub+';color-scheme:dark;margin:6px 0 4px">'}
  else if(k==="number"){var val=a!=null&&a!==""?parseFloat(a):(q.pick!=null?q.pick:(q.min!=null?q.min:0)),u=q.unit?" "+q.unit:"",sb=TB5+"justify-content:center;width:44px;height:44px;border-radius:50%;font-size:22px;background:"+rgba5(C5.blue,.15)+";color:"+C5.blue;
   h+='<div style="display:flex;align-items:center;gap:14px;padding:0 0 10px">'+tb('data-num="'+id+'" data-d="-1"',sb,"−")+'<span style="font-size:24px;min-width:44px;text-align:center">'+esc5(fmt5(val)+u)+'</span>'+tb('data-num="'+id+'" data-d="1"',sb,"+")+'</div>';
   if((q.quick||[]).length)h+='<div class="ch">'+q.quick.map(function(v,i){return tb('data-nq="'+id+'" data-v="'+v+'"',chipS(C5.ac[i%4],a!=null&&parseFloat(a)===v,a==null&&q.pick===v),esc5(fmt5(v)+u))}).join("")+'</div>';
   if(q.min!=null||q.max!=null)h+='<div class="more">'+(q.min!=null?fmt5(q.min):"")+" to "+(q.max!=null?fmt5(q.max):"")+esc5(u)+'</div>';h+=doneChip(id)}
  else if(k==="check"){var cv=A[id]||(q.pick||[]).slice();h+='<div style="display:flex;flex-direction:column;gap:2px;padding:0 0 6px">'+q.items.map(function(o,i){var s=cv.indexOf(o)>=0,c=C5.ac[i%4];return tb('data-ck="'+id+'" data-i="'+i+'"',TB5+"gap:12px;min-height:44px;font-size:17px;color:"+(s?C5.ink:C5.sub),'<span style="width:22px;height:22px;border-radius:7px;border:2px solid '+c+';background:'+(s?c:"transparent")+';color:'+C5.navy+';font-size:14px;display:inline-flex;align-items:center;justify-content:center">'+(s?"✓":"")+'</span>'+rich5(o))}).join("")+'</div>'+doneChip(id)}
  else if(k==="rank"||k==="drag"){var rv=RK[id]||[];h+='<div class="ch col">'+q.items.map(function(o,i){var n=rv.indexOf(o);return tb('data-rk="'+id+'" data-i="'+i+'"',chipS(C5.ac[i%4],n>=0,false,true)+"flex-direction:row;align-items:center;gap:12px;",'<span style="width:26px;height:26px;flex:none;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:14px;border:1.5px solid '+(n>=0?C5.navy:C5.ac[i%4])+'">'+(n>=0?n+1:"")+'</span><span>'+rich5(o)+'</span>')}).join("")+'</div>'+doneChip(id)}
  else if(k==="text"){h+='<textarea data-text="'+id+'" rows="1" placeholder="'+esc5(q.ph||"Type or talk")+'" style="display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.4;color:'+C5.ink+';resize:none;overflow:hidden;outline:none;-webkit-appearance:none;appearance:none;min-height:0;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin:0 0 6px">'+esc5(A[id]||"")+'</textarea>'+doneChip(id)}
  return '<div class="qi'+(glow?" gl":"")+'" data-item="1">'+h+'</div>'}
 var RK={};
 function allDone(){return ITEMS.every(function(it){return isAns(it)||(it.q&&it.q.kind==="text")})}
 function jeffH(){if(FIN){var ok=FIN.kind==="delete";return '<div class="fin"><div style="font-size:19px;color:'+C5.ink+'">'+(ok?"🗑️ Safe to close & delete":"💾 Safe to close, keep this chat")+'</div><div class="dt" style="padding:6px 0 0"><ul>'+["Nothing left for Claude","Nothing left for Jeff","Nothing needed later lives only here","No file lives only here","Nothing still running","No chat must read it first","Nothing links to this chat"].map(function(x){return "<li>✓ "+x+"</li>"}).join("")+'</ul><div>'+rich5(ok?"Pickup point: "+(FIN.pickup||"nothing to pick up"):(FIN.why||FIN.pickup||"Worth keeping to look back at."))+'</div></div></div>'}
  if(S.sent)return tb('data-unsend="1"',TB5+"width:100%;justify-content:space-between;background:rgba(255,255,255,.07);border-radius:14px;padding:14px 16px;font-size:17px;color:"+C5.mint+";margin:0 0 14px",'<span>✓ Sent · '+esc5(S.words)+'</span><span style="display:inline-flex;align-items:center;gap:8px;color:'+C5.dim+';font-size:15px">'+dots()+' edit</span>');
  var vis=ITEMS.filter(function(it){return !hidden(it)}),nh=ITEMS.length-vis.length,done=allDone(),body="";
  if(ITEMS.length&&done&&!vis.length)body='<div style="font-size:17px;color:'+C5.mint+';padding:12px 0 2px">All set ✓</div>';
  else{body=vis.slice(0,2).map(function(it,j){return itemH(it,j===0)}).join("");if(vis.length>2)body+='<div class="more">'+(vis.length-2)+' more after these</div>'}
  var lbl=(!ITEMS.length||S.changed||!hasPicks())?"Send":"Send Claude's picks";
  return '<div class="bd">'+body+band("_jeff","Add a note · type or talk","rgba(0,0,0,.18)")+'<div class="sr">'+(nh?tb('data-showq="1"',TB5+"font-size:15px;color:"+C5.dim+";padding:8px 0","↺ "+nh):(canShot&&!touch?tb('data-clip="_jeff"',TB5+"font-size:18px;padding:6px 8px;color:"+C5.dim,"📎"):"<span></span>"))+pill('data-send="1"',(ITEMS.length?'<span style="display:inline-flex;flex-wrap:wrap;max-width:120px;row-gap:3px">'+dots()+'</span>':'')+lbl+" ↗",done&&ITEMS.length?C5.mint:null)+'</div></div><div style="height:14px"></div>'}
 function hasPicks(){return ITEMS.some(function(it){if(isAns(it)||it.t!=="q")return false;var q=it.q;if(q.code)return false;if(q.kind==="decide")return q.options.some(function(o){return o.pick});if(q.kind==="pair")return true;return q.pick!=null})}
 function grow(t){t.style.height="auto";t.style.height=t.scrollHeight+2+"px"}
 function thumbs(){[].forEach.call(qp.querySelectorAll("[data-thumbs]"),function(tbx){var id=tbx.getAttribute("data-thumbs");tbx.innerHTML="";(SH[id]||[]).forEach(function(f,k){var d=el("div","th"),im=el("img"),x=document.createElement("div");x.setAttribute("role","button");x.textContent="×";x.style.cssText="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:"+C5.navy+";color:"+C5.ink+";border:1px solid "+C5.dim+";display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer";try{im.src=URL.createObjectURL(f)}catch(e){}x.onclick=function(){SH[id].splice(k,1);thumbs()};d.append(im,x);tbx.appendChild(d)})})}
 function draw(){qp.innerHTML="";var stash=el("div","stash");stash.appendChild(pick);qp.appendChild(stash);var w=el("div");w.innerHTML=topH()+jeffH();while(w.firstChild)qp.appendChild(w.firstChild);
  [].forEach.call(qp.querySelectorAll("textarea"),function(t){grow(t);var nid=t.getAttribute("data-note"),tid=t.getAttribute("data-text");t.oninput=function(){if(nid)NT[nid]=t.value;if(tid){A[tid]=t.value;S.changed=true;var b=qp.querySelector("[data-send]");if(b)b.innerHTML=b.innerHTML.replace("Send Claude's picks","Send")}grow(t)};
   if(nid)t.addEventListener("paste",function(e){if(!canShot)return;var f=files(e.clipboardData);if(f.length){e.preventDefault();addShots(nid,f);thumbs()}})});
  [].forEach.call(qp.querySelectorAll("input[data-datein]"),function(inp){inp.onchange=function(){if(!inp.value)return;var p=inp.value.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]),t=new Date();t.setHours(0,0,0,0);A[inp.getAttribute("data-datein")]=dval(d,t);S.changed=true;fade(inp)}});
  thumbs();wraps()}
 function fade(node){var it=node.closest?node.closest("[data-item]"):null;if(!it){draw();return}it.style.opacity="0";setTimeout(draw,220)}
 function addShots(id,list){var imgs=[].slice.call(list||[]).filter(function(f){return f&&f.type&&f.type.indexOf("image/")===0});var all=Object.keys(SH).reduce(function(n,k){return n+SH[k].length},0);imgs=imgs.slice(0,Math.max(0,MAXSHOTS-all));SH[id]=(SH[id]||[]).concat(imgs.map(function(f,k){return f.name&&f.name!=="image.png"?f:new File([f],"screenshot-"+Date.now()+"-"+k+".png",{type:f.type})}))}
 function files(dt){try{return dt.files&&dt.files.length?[].slice.call(dt.files):[].slice.call(dt.items||[]).filter(function(x){return x.kind==="file"}).map(function(x){return x.getAsFile()}).filter(Boolean)}catch(e){return[]}}
 pick.onchange=function(){if(shotTarget){addShots(shotTarget,pick.files);thumbs()}pick.value=""};
 function byId(id){for(var i=0;i<ITEMS.length;i++)if(ITEMS[i].id===id)return ITEMS[i];return null}
 qp.addEventListener("click",function(e){var n=e.target.closest&&e.target.closest("[data-tuck],[data-arr],[data-close],[data-showtop],[data-showq],[data-ans],[data-pair],[data-scale],[data-date],[data-num],[data-nq],[data-ck],[data-rk],[data-done],[data-step],[data-copy],[data-clip],[data-send],[data-unsend]");if(!n)return;var d=n.dataset;
  if(d.copy!=null){var ok=syncCopy(d.copy);if(d.url)go(d.copy.trim());n.textContent=ok?(d.url?"Opened ✓":"Copied ✓"):"⌘C";return}
  if(d.clip){shotTarget=d.clip;pick.click();return}
  if(d.tuck){S.tuck[d.tuck]=true;return fade(n)}
  if(d.arr){S.open[d.arr]=!S.open[d.arr];return draw()}
  if(d.close){S.closed=!S.closed;return draw()}
  if(d.showtop){S.tuck={};return draw()}
  if(d.showq){ITEMS.forEach(function(it){if(it.q&&it.q.kind==="text"){delete HID[it.id];return}delete A[it.id];delete HID[it.id]});RK={};S.changed=false;return draw()}
  if(d.ans){var it=byId(d.ans),q=it.q,o=q.options[+d.i];if(q.multi){var cur=String(A[it.id]||"").split("; ").filter(Boolean),i=cur.indexOf(o.label);if(i<0&&q.max&&cur.length>=q.max)return;if(i>=0)cur.splice(i,1);else cur.push(o.label);A[it.id]=q.options.map(function(x){return x.label}).filter(function(x){return cur.indexOf(x)>=0}).join("; ");S.changed=true;return draw()}
   A[it.id]=o.label;S.changed=true;n.style.background=q.code?(+d.i?C5.gold:C5.dim):C5.ac[+d.i%4];n.style.color=C5.navy;return fade(n)}
  if(d.pair){var it2=byId(d.pair),x=null;it2.q.items.forEach(function(y){if(y.id===d.pid)x=y});A[it2.id]=A[it2.id]||{};A[it2.id][x.id]=[x.a,x.b][+d.i];S.changed=true;return isAns(it2)?fade(n):draw()}
  if(d.scale){A[d.scale]=d.i+" of 5";S.changed=true;return fade(n)}
  if(d.date){A[d.date]=d.v;S.changed=true;return fade(n)}
  if(d.num){var it3=byId(d.num),q3=it3.q,stp=q3.step||1,base=A[it3.id]!=null&&A[it3.id]!==""?parseFloat(A[it3.id]):(q3.pick!=null?q3.pick:(q3.min!=null?q3.min:0)),v=base+(+d.d)*stp;if(q3.min!=null&&v<q3.min)v=q3.min;if(q3.max!=null&&v>q3.max)v=q3.max;A[it3.id]=fmt5(v)+(q3.unit?" "+q3.unit:"");S.changed=true;return draw()}
  if(d.nq){var it4=byId(d.nq);A[it4.id]=fmt5(+d.v)+(it4.q.unit?" "+it4.q.unit:"");S.changed=true;return draw()}
  if(d.ck){var it5=byId(d.ck),cv=A[it5.id]||(it5.q.pick||[]).slice(),o5=it5.q.items[+d.i],j5=cv.indexOf(o5);if(j5>=0)cv.splice(j5,1);else cv.push(o5);cv.sort(function(a,b){return it5.q.items.indexOf(a)-it5.q.items.indexOf(b)});A[it5.id]=cv;S.changed=true;return draw()}
  if(d.rk){var it6=byId(d.rk),rv=RK[it6.id]=RK[it6.id]||[],o6=it6.q.items[+d.i],j6=rv.indexOf(o6);if(j6>=0)rv.splice(j6,1);else rv.push(o6);A[it6.id]=rv.length?rv.map(function(x,j){return(j+1)+". "+x}).join(" > ")+(rv.length<it6.q.items.length?" (partial)":""):"";S.changed=true;return draw()}
  if(d.done){var it7=byId(d.done);if(it7.q.kind==="check"&&!A[it7.id])A[it7.id]=(it7.q.pick||[]).slice();HID[d.done]=true;S.changed=true;return fade(n)}
  if(d.step){A[d.step]=true;n.style.background=C5.mint;n.style.color=C5.navy;return fade(n)}
  if(d.unsend){S.auto.forEach(function(id){delete A[id];delete HID[id]});S.auto=[];S.sent=false;return draw()}
  if(d.send){send()}});
 function txt5(m){return txt4(m)}
 function fmt5(v){return String(Math.round(v*1e6)/1e6)}
 function fillPicks(){S.auto=[];ITEMS.forEach(function(it){if(it.t!=="q"||isAns(it))return;var q=it.q,v=null;if(q.code)return;
   if(q.kind==="decide"){var ps=q.options.filter(function(o){return o.pick}).map(function(o){return o.label});if(!ps.length)return;v=q.multi?ps.join("; "):ps[0];if(q.multi)HID[it.id]=true}
   else if(q.kind==="pair"){v={};q.items.forEach(function(x){v[x.id]=(A[it.id]&&A[it.id][x.id])||x.pick})}
   else if(q.kind==="scale"&&q.pick!=null)v=q.pick+" of 5";else if(q.kind==="number"&&q.pick!=null){v=fmt5(q.pick)+(q.unit?" "+q.unit:"");HID[it.id]=true}
   else if(q.kind==="check"&&q.pick!=null){v=q.pick.slice();HID[it.id]=true}
   if(v!=null){A[it.id]=v;it._auto=true;S.auto.push(it.id)}})}
 function ansText(it){var q=it.q,a=A[it.id],k=q.kind;if(k==="pair")return q.items.map(function(x){return x.text+": "+((a&&a[x.id])||"(skipped)")}).join("; ");if(k==="check"){if(!isAns(it))return "";return a&&a.length?"checked: "+a.join(", "):"none checked"}if(!isAns(it)&&k!=="text")return "";return a||""}
 function transcript(extra){var L=["answers in · "+R.round+" · v"+VERSION+" · "+innerWidth+"w"+(R.file?" · from file":"")+(R._over?" · over 35: "+R._over:"")+(qp._wrap?" · wraps: "+qp._wrap:""),""],shotList=[];
  R.ideas.forEach(function(I,k){var its=ITEMS.filter(function(it){return it.k===k});if(!its.length)return;L.push(I._n+" "+I.t);var sts=its.filter(function(it){return it.t==="step"});if(sts.length)L.push("Steps: "+sts.map(function(it){return it.x.s+": "+(A[it.id]?"done":"not done")}).join("; "));
   its.filter(function(it){return it.t==="q"}).forEach(function(it){var a=ansText(it);L.push((it.q.code?"🔐 ":"Q: ")+it.q.q);L.push("Answer: "+(a||"(skipped)")+(S.auto.indexOf(it.id)>=0?" (Claude's pick)":""))});L.push("")});
  var nt=(NT._top||"").trim();if(nt)L.push("Note on what Claude did: "+nt);var nj=(NT._jeff||"").trim();if(nj)L.push("Note: "+nj);
  ["_top","_jeff"].forEach(function(id){var s=SH[id]||[];shotList=shotList.concat(s)});if(shotList.length)L.push("Screenshots: "+shotList.length);
  if(extra)L.push(extra);return{text:L.join("\n").trim(),shots:shotList}}
 function plain(t){try{sendPrompt(t)}catch(e){syncCopy(t)}}
 function send(){var wasChanged=S.changed;fillPicks();var n=ITEMS.filter(function(it){return isAns(it)&&S.auto.indexOf(it.id)<0}).length;
  S.words=!ITEMS.length?"note sent":(S.auto.length&&!wasChanged?"Claude's picks":(S.auto.length?n+" changed, rest Claude's picks":n+" answer"+(n===1?"":"s")));
  var T=transcript();S.sent=true;draw();
  if(!T.shots.length){plain(T.text);return}
  var form=document.querySelector("form.elicit"),fi=form&&form.querySelector("input[type=file]");
  if(!form||!fi){plain(transcript("(screenshots not sent: send form missing)").text);return}
  try{var dt=new DataTransfer();T.shots.forEach(function(f){dt.items.add(f)});fi.files=dt.files;fi.dispatchEvent(new Event("change",{bubbles:true}))}catch(e){plain(transcript("(screenshots not sent: "+(e&&e.message||e)+")").text);return}
  setTimeout(function(){var f2=document.querySelector("form.elicit")||form,ans=f2.querySelector("[data-name=answers]"),sub=f2.querySelector(".elicit-submit");if(!sub){plain(transcript("(screenshots not sent: no submit)").text);return}
   if(!ans){ans=el("textarea","elicit-textarea");ans.setAttribute("data-name","answers");ans.style.display="none";(f2.querySelector(".elicit-group")||f2).appendChild(ans)}ans.value=T.text;ans.dispatchEvent(new Event("input",{bubbles:true}));sub.click()},400)}
 if(canShot&&!FIN){["dragenter","dragover"].forEach(function(ev){qp.addEventListener(ev,function(e){e.preventDefault();qp.classList.add("drop")})});
  qp.addEventListener("dragleave",function(e){if(!qp.contains(e.relatedTarget))qp.classList.remove("drop")});
  qp.addEventListener("drop",function(e){e.preventDefault();qp.classList.remove("drop");var fs=e.dataTransfer&&e.dataTransfer.files;if(!fs||!fs.length)return;addShots("_jeff",fs);thumbs()})}
 function wraps(){var n=0;[].forEach.call(qp.querySelectorAll(".rt,.qt"),function(h){if(h.offsetHeight>52)n++});qp._wrap=n}
 draw();try{document.fonts.ready.then(wraps)}catch(x){}
 qp._A=A;qp._NT=NT;qp._transcript=transcript;QP.last=qp}

window.QP={mount:mount,prep:prep,check:check,version:VERSION};
})();
