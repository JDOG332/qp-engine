/* Jeff's inline question page engine. Layout and behavior only: no round content, no answers. */
(function(){
var VERSION="4.0.0";
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
// v4.0.0 (Jeff 10/31): one long scroll. No cards, no paging, no Back, Next or dots; ideas flow down under a small gray label with a thin line and about 50 px above it; every title (row, step, question) is one size and colored by its emoji; details always shown, never in a dropdown; short answers in 2 columns; a check kind for keep-or-change lists; one note line at the end of every idea; Submit all at the bottom; the chat font throughout
var PAL4={light:{bg:"#ffffff",ink:"#16213a",muted:"#5b6478",line:"#e3e7ef",line2:"#c9cfdc",btn:"#f4f6fa",acc:"#2b4f9a",pick:"#dbe5fb",gn:"#1d7a44",am:"#9a6a00",bl:"#2b4f9a",pu:"#6b4aa0",rd:"#b3261e"},
 dark:{bg:"#2e3342",ink:"#f1f2f5",muted:"#a8adba",line:"#3d4353",line2:"#535a6c",btn:"#353a4a",acc:"#9db8ff",pick:"#3d4a6e",gn:"#8fd6a8",am:"#f2c46d",bl:"#9db8ff",pu:"#c3a8f0",rd:"#ff9b94"}};
var CSS4=[
".q4{box-sizing:border-box;background:var(--bg);color:var(--ink);border:1px solid var(--line2);border-radius:16px;padding:18px 16px 14px;font-family:var(--font-sans,system-ui,-apple-system,'Segoe UI',sans-serif);-webkit-text-size-adjust:100%;line-height:1.4}",
".q4 *{box-sizing:border-box}",
".q4 .il{font-size:15.5px;color:var(--muted);padding:30px 0 8px;border-top:1px solid var(--line2);margin-top:22px}",
".q4 .il.first{border-top:0;padding-top:0;margin-top:0}",
".q4 .it{padding:10px 0;border-top:1px solid var(--line)}",
".q4 .il+.it{border-top:0}",
".q4 .hd{font-size:22px;font-weight:500;line-height:1.3;color:var(--x,var(--ink));overflow-wrap:anywhere}",
".q4 .k-ok{--x:var(--gn)}.q4 .k-warn{--x:var(--am)}.q4 .k-mem{--x:var(--pu)}.q4 .k-err{--x:var(--rd)}.q4 .k-q{--x:var(--bl)}.q4 .k-lock{--x:var(--rd)}",
".q4 .dt{font-size:15.5px;color:var(--muted);line-height:1.45;margin-top:3px;overflow-wrap:anywhere}",
".q4 ul.dt{margin:3px 0 0;padding-left:20px}",
".q4 .sub{margin-top:8px}.q4 .sub .sh{font-size:17.5px;font-weight:500;color:var(--ink)}",
".q4 .cp{display:flex;gap:8px;align-items:stretch;margin-top:7px}",
".q4 .cp pre{flex:1;min-width:0;margin:0;padding:8px 10px;font:14px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--btn);border:1px solid var(--line2);border-radius:8px;color:var(--ink)}",
".q4 .cp button{flex:none;font:inherit;font-size:15.5px;padding:0 12px;border-radius:8px;border:1px solid var(--line2);background:var(--btn);color:var(--ink);cursor:pointer}",
".q4 .o{display:block;width:100%;text-align:left;margin-top:7px;padding:8px 12px;font:inherit;font-size:17.5px;line-height:1.3;background:var(--btn);color:var(--ink);border:1px solid var(--line2);border-radius:8px;cursor:pointer}",
".q4 .o small{display:block;font-size:15.5px;color:var(--muted);margin-top:2px;line-height:1.4}",
".q4 .o.pre{outline:2px dotted var(--acc);outline-offset:-4px}",
".q4 .o[aria-pressed=true]{background:var(--pick);border-color:var(--acc)}",
".q4 .o[aria-pressed=true]>.lb::before{content:'\\2713  '}",
".q4 .o.ck[aria-pressed=true]>.lb::before,.q4 .o.rk[aria-pressed=true]>.lb::before{content:none}",
".q4 .g2{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.q4 .g2 .o{margin-top:0}",
".q4 .g5{display:flex;gap:6px;margin-top:7px}.q4 .g5 .o{margin-top:0;text-align:center;padding:9px 0}",
".q4 .ends{display:flex;justify-content:space-between;font-size:15.5px;color:var(--muted);margin-top:4px}",
".q4 .ck,.q4 .rk{display:flex;gap:11px;align-items:center}",
".q4 .bx{flex:0 0 20px;height:20px;border:2px solid var(--muted);border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1}",
".q4 .on>.bx,.q4 [aria-pressed=true]>.bx{border-color:var(--acc);background:var(--acc);color:var(--bg)}",
".q4 .st{display:flex;gap:11px;align-items:flex-start;cursor:pointer}.q4 .st>.bx{margin-top:6px}.q4 .st.on .hd{opacity:.6}",
".q4 .badge{flex:0 0 26px;height:26px;border-radius:50%;border:2px solid var(--muted);display:inline-flex;align-items:center;justify-content:center;font-size:14px}",
".q4 .rk[aria-pressed=true] .badge{border-color:var(--acc);background:var(--acc);color:var(--bg)}",
".q4 .pi{font-size:17.5px;margin-top:10px}",
".q4 textarea{display:block;width:100%;font:inherit;font-size:15.5px;line-height:1.4;margin-top:7px;padding:8px 10px;border-radius:8px;border:1px solid var(--line2);background:var(--btn);color:var(--ink);resize:none;overflow:hidden;min-height:40px}",
".q4 .nl{display:flex;gap:8px;align-items:flex-start;margin-top:12px}.q4 .nl textarea{margin-top:0;flex:1}",
".q4 .at{flex:none;width:44px;height:40px;border-radius:8px;border:1px solid var(--line2);background:var(--btn);color:var(--ink);cursor:pointer;font-size:18px}.q4 .at.has{border-color:var(--acc)}",
".q4 .thumbs{display:flex;gap:8px;flex-wrap:wrap}.q4 .thumbs:not(:empty){margin-top:8px}.q4 .th{position:relative;width:56px;height:56px}.q4 .th img{width:56px;height:56px;object-fit:cover;border-radius:6px}",
".q4 .th button{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:1px solid var(--line2);background:var(--bg);color:var(--ink);cursor:pointer;font-size:13px;line-height:1;padding:0}",
".q4 .nm{display:flex;gap:7px;margin-top:7px}.q4 .nm .o{flex:0 0 56px;text-align:center;margin:0}",
".q4 .nm input,.q4 input.dp{flex:1;min-width:0;font:inherit;font-size:17.5px;text-align:center;border:1px solid var(--line2);border-radius:8px;background:var(--btn);color:var(--ink);padding:8px}",
".q4 .nm input.pk{outline:2px dotted var(--acc);outline-offset:-4px}.q4 .nm input.set,.q4 input.dp.set{background:var(--pick);border-color:var(--acc);outline:0}",
".q4 .dg{display:flex;align-items:center;gap:10px;padding:8px 12px;margin-top:7px;border:1px solid var(--line2);border-radius:8px;background:var(--btn);font-size:17.5px;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}",
".q4 .dg .num{color:var(--acc);font-weight:500;width:1.4em;text-align:center}.q4 .dg .hdl{margin-left:auto;color:var(--muted)}.q4 .dg.lift{border-color:var(--acc);position:relative;z-index:2}",
".q4 .cap{font-size:15.5px;color:var(--muted);margin-top:3px}.q4 .cap.full{color:var(--am)}",
".q4 .send{display:block;width:100%;margin-top:22px;font:inherit;font-size:17.5px;font-weight:500;padding:12px;border-radius:8px;border:1px solid var(--acc);background:var(--pick);color:var(--ink);cursor:pointer}",
".q4 .sl{font-size:15.5px;color:var(--muted);text-align:center;margin-top:8px}.q4 .sl:empty{display:none}",
".q4 .fin{margin-top:22px;padding-top:18px;border-top:1px solid var(--line2)}",
".q4.drop{outline:2px dashed var(--acc);outline-offset:4px}",
".q4 .stash{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}",
"@media (hover:hover){.q4 .o:hover,.q4 .send:hover,.q4 .cp button:hover{border-color:var(--acc)}}"].join("\n");
function txt4(m){if(m==null)return"";if(Array.isArray(m))return m.map(function(x){return typeof x==="string"?x:(x&&(x.p||x.c||x.s))||""}).filter(Boolean).join(" ");return String(m)}
function mount(R0){
 if(!document.getElementById("qp4-css")){var st=el("style");st.id="qp4-css";st.textContent=CSS4;document.head.appendChild(st)}
 if(R0.shots!==false&&!document.querySelector("form.elicit")){var fw=document.createElement("div");fw.innerHTML=FORM;document.body.appendChild(fw.firstElementChild)}
 var host=document.getElementById(R0.root||"qp-root"),FIN=R0.finish||null;
 var R=prep(R0);
 if(R.ideas==null){var rows=[],steps=[],asks=[];(R.screens||[]).forEach(function(q){if(q.kind==="report"){(q.rows||[]).forEach(function(x){var e=first(x.s||"");if(FIN&&(e.indexOf("🗑")===0||e.indexOf("💾")===0))return;rows.push(x)})}else if(q.kind==="todo"){(q.rows||[]).forEach(function(x,j){steps.push({id:x.id||q.id+"_"+j,s:String(x.s||"").replace(/^\S+\s+/,""),m:x.m})})}else asks.push(q)});
  R.ideas=[{t:R0.title||"This round",rows:rows,steps:steps,asks:asks}].filter(function(I){return I.rows.length||I.steps.length||I.asks.length})}
 R.screens=[];var CE=check(R);if(CE.length){showErrors(host,CE);return}
 var qp=el("div","q4");host.appendChild(qp);
 function dark(){var m=document.documentElement.getAttribute("data-mode");return m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)}
 function theme(){var v=PAL4[dark()?"dark":"light"];Object.keys(v).forEach(function(k){qp.style.setProperty("--"+k,v[k])})}
 theme();try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",theme)}catch(e){}
 try{new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:["data-mode"]})}catch(e){}
 var A={},NT={},SH={},ORD={},shotTarget=null,canShot=!!document.querySelector("form.elicit"),touch=false;try{touch=matchMedia("(pointer:coarse)").matches}catch(e){}
 var pick=el("input");pick.type="file";pick.multiple=true;pick.accept="image/*";var stash=el("div","stash");stash.appendChild(pick);qp.appendChild(stash);
 function kindOf(s){var e=first(s||"").replace(/️/g,"");return e==="✅"?"ok":e==="⚠"?"warn":e==="🧠"?"mem":e==="❌"?"err":e==="❓"?"q":e==="🔐"?"lock":"pin"}
 function cpRow(c){var text=typeof c==="string"?c:c.text,url=/^https?:\/\/\S+$/.test((text||"").trim()),lb=url?"Copy & open":"Copy",w=el("div","cp"),pre=el("pre",null,text),b=el("button",null,lb);b.type="button";
  b.onclick=function(e){e.stopPropagation();var ok=syncCopy(text);if(url)go(text.trim());b.textContent=ok?(url?"Opened ✓":"Copied ✓"):"⌘C";setTimeout(function(){b.textContent=lb},1800)};w.append(pre,b);return w}
 function detail(m,box){if(m==null)return;if(!Array.isArray(m)){box.appendChild(rich(el("div","dt"),m));return}
  var allP=m.length>1&&m.every(function(x){return x&&typeof x==="object"&&x.p!=null&&x.c==null&&x.s==null});
  if(allP){var ul=el("ul","dt");m.forEach(function(x){ul.appendChild(rich(el("li"),x.p))});box.appendChild(ul);return}
  m.forEach(function(x){if(x==null)return;if(typeof x!=="object"){box.appendChild(rich(el("div","dt"),x));return}
   if(x.c!=null){box.appendChild(cpRow(x.c));return}
   if(x.s!=null){var sb=el("div","sub");sb.appendChild(rich(el("div","sh"),x.s));detail(x.m,sb);box.appendChild(sb);return}
   box.appendChild(rich(el("div","dt"),x.p))})}
 function row(x,P){var it=el("div","it k-"+kindOf(x.s));it.appendChild(rich(el("div","hd"),x.s));detail(x.m,it);P.appendChild(it)}
 function ob(label,more,pre,cls){var b=el("button","o"+(cls?" "+cls:"")+(pre?" pre":""));b.type="button";b.setAttribute("aria-pressed","false");b.appendChild(rich(el("span","lb"),label));if(more)b.appendChild(rich(el("small"),txt4(more)));return b}
 function two(opts){return opts.length>=2&&opts.every(function(o){return !o.more&&Array.from(String(o.label||"")).length<=18})}
 function press(g,b){g.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")})}
 function decide(q,P){var g=[],box=P,multi=!!q.multi;if(multi){q._cap=el("div","cap",q.max?"Pick up to "+q.max:"Pick all that fit");P.appendChild(q._cap)}
  if(!q.code&&two(q.options)){box=el("div","g2");P.appendChild(box)}
  q.options.forEach(function(o){var b=ob(o.label,o.more,o.pick&&!q.code);
   b.onclick=function(){if(multi){var cur=(A[q.id]||"").split("; ").filter(Boolean),i=cur.indexOf(o.label);if(i<0&&q.max&&cur.length>=q.max){q._cap.classList.add("full");setTimeout(function(){q._cap.classList.remove("full")},1200);return}if(i>=0)cur.splice(i,1);else cur.push(o.label);A[q.id]=q.options.map(function(x){return x.label}).filter(function(x){return cur.indexOf(x)>=0}).join("; ");b.setAttribute("aria-pressed",i>=0?"false":"true");return}
    var on=A[q.id]!==o.label;A[q.id]=on?o.label:"";press(g,on?b:null)};g.push(b);box.appendChild(b)})}
 function pair(q,P){A[q.id]={};q.items.forEach(function(it){P.appendChild(rich(el("div","pi"),it.text));var sg=el("div","g2"),bs=[];[it.a,it.b].forEach(function(v){var b=ob(v,null,it.pick===v);b.onclick=function(){var on=A[q.id][it.id]!==v;A[q.id][it.id]=on?v:"";press(bs,on?b:null)};bs.push(b);sg.appendChild(b)});P.appendChild(sg)})}
 function checkQ(q,P){var cur=A[q.id]=(q.pick||[]).slice();q.items.forEach(function(v){var b=ob(v,null,false,"ck");b.insertBefore(el("span","bx"),b.firstChild);
  function paint(){var on=cur.indexOf(v)>=0;b.setAttribute("aria-pressed",on?"true":"false");b.firstChild.textContent=on?"✓":""}
  b.onclick=function(){var i=cur.indexOf(v);if(i>=0)cur.splice(i,1);else cur.push(v);cur.sort(function(x,y){return q.items.indexOf(x)-q.items.indexOf(y)});paint()};paint();P.appendChild(b)})}
 function scale(q,P){var g=el("div","g5"),bs=[];[1,2,3,4,5].forEach(function(n){var v=n+" of 5",b=ob(String(n),null,q.pick===n);b.onclick=function(){var on=A[q.id]!==v;A[q.id]=on?v:"";press(bs,on?b:null)};bs.push(b);g.appendChild(b)});
  var e=el("div","ends");e.append(el("span",null,"1 · "+((q.ends||[])[0]||"")),el("span",null,((q.ends||[])[1]||"")+" · 5"));P.append(g,e)}
 function datePick(q,P){var t=new Date();t.setHours(0,0,0,0);var d1=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),sat=new Date(t.getFullYear(),t.getMonth(),t.getDate()+((6-t.getDay()+7)%7||7));var g=el("div","g2"),bs=[];
  [["Today",t],["Tomorrow",d1],["Saturday",sat]].forEach(function(x){var v=dval(x[1],t),b=ob(x[0]+" · "+v);b.onclick=function(){var on=A[q.id]!==v;A[q.id]=on?v:"";press(bs,on?b:null);inp.value="";inp.classList.remove("set")};bs.push(b);g.appendChild(b)});
  var inp=el("input","dp");inp.type="date";inp.setAttribute("aria-label","Other day");inp.onchange=function(){if(!inp.value)return;var p=inp.value.split("-"),d=new Date(+p[0],+p[1]-1,+p[2]);A[q.id]=dval(d,t);press(bs,null);inp.classList.add("set")};g.appendChild(inp);P.appendChild(g)}
 function fmtN(v){return String(Math.round(v*1e6)/1e6)}
 function number(q,P){var stp=q.step||1,u=q.unit?" "+q.unit:"",val=null,w=el("div","nm"),mi=ob("−"),pl=ob("+"),inp=el("input",q.pick!=null?"pk":"");mi.setAttribute("aria-label","Less");pl.setAttribute("aria-label","More");
  inp.type="text";inp.setAttribute("inputmode","decimal");inp.placeholder=q.pick!=null?fmtN(q.pick)+u:(q.unit||"Number");
  function clamp(v){if(q.min!=null&&v<q.min)v=q.min;if(q.max!=null&&v>q.max)v=q.max;return v}
  function set(v){val=v;if(v==null){inp.value="";A[q.id]="";inp.classList.remove("set")}else{inp.value=fmtN(v);A[q.id]=fmtN(v)+u;inp.classList.add("set")}qb.forEach(function(b){b.setAttribute("aria-pressed",v!=null&&b._v===v?"true":"false")})}
  function bump(d){var base=val!=null?val:(q.pick!=null?q.pick:(q.min!=null?q.min:0));set(clamp(val==null&&q.pick!=null?base:base+d*stp))}
  mi.onclick=function(){bump(-1)};pl.onclick=function(){bump(1)};
  inp.oninput=function(){var t=inp.value.replace(/[^0-9.\-]/g,"");if(t===""||isNaN(+t)){val=null;A[q.id]="";inp.classList.remove("set");return}val=+t;A[q.id]=fmtN(val)+u;inp.classList.add("set")};
  inp.onblur=function(){if(val!=null)set(clamp(val))};w.append(mi,inp,pl);P.appendChild(w);var qb=[];
  if((q.quick||[]).length){var g=el("div","g2");q.quick.forEach(function(v){var b=ob(fmtN(v)+u,null,q.pick===v);b._v=v;b.onclick=function(){set(val===v?null:v)};qb.push(b);g.appendChild(b)});P.appendChild(g)}
  if(q.min!=null||q.max!=null)P.appendChild(el("div","cap",(q.min!=null?fmtN(q.min):"")+" to "+(q.max!=null?fmtN(q.max):"")+u))}
 function grow(t){t.style.height="auto";t.style.height=t.scrollHeight+2+"px"}
 function textQ(q,P){var t=el("textarea");t.rows=1;t.placeholder=q.ph||"Type or dictate";t.oninput=function(){A[q.id]=t.value.trim();grow(t)};P.appendChild(t)}
 function rank(q,P){var cur=ORD[q.id]=[],bs=[];function paint(){bs.forEach(function(b){var i=cur.indexOf(b._it);b.setAttribute("aria-pressed",i>=0?"true":"false");b.firstChild.textContent=i>=0?String(i+1):""});A[q.id]=cur.length?cur.map(function(x,j){return(j+1)+". "+x}).join(" > ")+(cur.length<q.items.length?" (partial)":""):""}
  q.items.forEach(function(it){var b=ob(it,null,false,"rk");b.insertBefore(el("span","badge"),b.firstChild);b._it=it;b.onclick=function(){var i=cur.indexOf(it);if(i>=0)cur.splice(i,1);else cur.push(it);paint()};bs.push(b);P.appendChild(b)});paint()}
 function drag(q,P){var ord=ORD[q.id]=q.items.slice(),box=el("div");P.appendChild(box);
  function paint(){box.innerHTML="";var rows=[];ord.forEach(function(it,k){var r=el("div","dg");r.append(el("span","num",String(k+1)),rich(el("span"),it),el("span","hdl","☰"));rows.push(r);box.appendChild(r);var y0=0,dy=0,h=0,on=false;
   r.addEventListener("pointerdown",function(e){on=true;y0=e.clientY;dy=0;h=r.offsetHeight+7;try{r.setPointerCapture(e.pointerId)}catch(x){}r.classList.add("lift")});
   r.addEventListener("pointermove",function(e){if(!on)return;dy=e.clientY-y0;r.style.transform="translateY("+dy+"px)";var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));rows.forEach(function(o,j){if(o===r)return;var s=0;if(k<to&&j>k&&j<=to)s=-h;if(k>to&&j<k&&j>=to)s=h;o.style.transform=s?"translateY("+s+"px)":""})});
   function end(){if(!on)return;on=false;var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));if(to!==k){var m=ord.splice(k,1)[0];ord.splice(to,0,m);A[q.id]=ord.map(function(x,j){return(j+1)+". "+x}).join(" > ")}paint()}
   r.addEventListener("pointerup",end);r.addEventListener("pointercancel",end)})}paint()}
 var KIND={decide:decide,do:decide,pair:pair,check:checkQ,scale:scale,date:datePick,rank:rank,drag:drag,number:number,text:textQ};
 function addShots(id,list){var imgs=[].slice.call(list||[]).filter(function(f){return f&&f.type&&f.type.indexOf("image/")===0});var all=Object.keys(SH).reduce(function(n,k){return n+SH[k].length},0);imgs=imgs.slice(0,Math.max(0,MAXSHOTS-all));SH[id]=(SH[id]||[]).concat(imgs.map(function(f,k){return f.name&&f.name!=="image.png"?f:new File([f],"screenshot-"+Date.now()+"-"+k+".png",{type:f.type})}))}
 function files(dt){try{return dt.files&&dt.files.length?[].slice.call(dt.files):[].slice.call(dt.items||[]).filter(function(x){return x.kind==="file"}).map(function(x){return x.getAsFile()}).filter(Boolean)}catch(e){return[]}}
 pick.onchange=function(){if(shotTarget){addShots(shotTarget.id,pick.files);shotTarget.done()}pick.value=""};
 var MARK={};
 function noteLine(id,ph,P){var nl=el("div","nl"),t=el("textarea"),at=el("button","at","📎"),tb=el("div","thumbs");t.rows=1;t.placeholder=ph;at.type="button";at.setAttribute("aria-label","Add a screenshot");
  function mark(){tb.innerHTML="";(SH[id]||[]).forEach(function(f,k){var d=el("div","th"),im=el("img"),x=el("button",null,"×");x.type="button";x.setAttribute("aria-label","Remove");try{im.src=URL.createObjectURL(f)}catch(e){}x.onclick=function(){SH[id].splice(k,1);mark()};d.append(im,x);tb.appendChild(d)});at.classList.toggle("has",!!(SH[id]||[]).length)}
  MARK[id]=mark;t.oninput=function(){NT[id]=t.value;grow(t)};
  t.addEventListener("paste",function(e){if(!canShot)return;var f=files(e.clipboardData);if(f.length){e.preventDefault();addShots(id,f);mark()}});
  at.onclick=function(){shotTarget={id:id,done:mark};pick.click()};
  nl.appendChild(t);if(canShot&&!touch)nl.appendChild(at);P.appendChild(nl);if(canShot)P.appendChild(tb)}
 var ORDR=["❌","✅","🧠","⚠"];function rk(r){var e=first(r.s||"").replace(/️/g,""),i=ORDR.indexOf(e);return i<0?4:i}
 R.ideas.forEach(function(I,k){I._n=KC[k]||String(k+1);var W=el("div","idea");W.setAttribute("data-k",String(k));qp.appendChild(W);
  W.appendChild(rich(el("div","il"+(k?"":" first")),I.t));
  (I.rows||[]).map(function(r,i){return{r:r,i:i}}).sort(function(a,b){return rk(a.r)-rk(b.r)||a.i-b.i}).forEach(function(o){row(o.r,W)});
  if((I.steps||[]).length){A["_st"+k]={};I.steps.forEach(function(x,j){var id=x.id||String(j),it=el("div","it"),r=el("div","st"),bx=el("span","bx"),c=el("div");c.style.flex="1";c.appendChild(rich(el("div","hd"),x.s));detail(x.m,c);r.append(bx,c);it.appendChild(r);r.setAttribute("role","checkbox");r.setAttribute("aria-checked","false");
   r.onclick=function(e){if(e.target.closest&&e.target.closest("button,textarea,input,a,pre"))return;var on=!A["_st"+k][id];A["_st"+k][id]=on;bx.textContent=on?"✓":"";r.classList.toggle("on",on);r.setAttribute("aria-checked",on?"true":"false")};W.appendChild(it)})}
  (I.asks||[]).forEach(function(q){var a=el("div","it ak "+(q.code?"k-lock":"k-q"));a.appendChild(rich(el("div","hd"),(q.code?"🔐 ":"❓ ")+q.q));(q.rows||[]).forEach(function(r){var d=el("div","sub");d.appendChild(rich(el("div","sh"),r.s||r.p||""));detail(r.m,d);a.appendChild(d)});(KIND[q.kind]||decide)(q,a);W.appendChild(a)});
  if(!FIN)noteLine("_i"+k,"📝 Note on "+String(I.t).replace(/\*\*/g,""),W)});
 var sb=null,sl=null;
 if(FIN){var f=el("div","fin"),ok=FIN.kind==="delete";f.appendChild(el("div","hd",ok?"🗑️ Safe to close & delete":"💾 Safe to close, keep this chat"));
  var ul=el("ul","dt");["Nothing left for Jeff","Nothing left for Claude","Nothing needed later"].forEach(function(x){ul.appendChild(el("li",null,"✓ "+x))});f.appendChild(ul);
  f.appendChild(rich(el("div","dt"),ok?"Pickup point: "+(FIN.pickup||"nothing to pick up"):(FIN.why||FIN.pickup||"Worth keeping to look back at.")));qp.appendChild(f)}
 else{sb=el("button","send","Submit all");sb.type="button";sl=el("div","sl");qp.append(sb,sl)}
 function nAnswered(){var n=0;R.ideas.forEach(function(I){(I.asks||[]).forEach(function(q){var a=A[q.id];if(Array.isArray(a)){if(a.length)n++}else if(a&&typeof a==="object"){if(Object.keys(a).some(function(k){return a[k]}))n++}else if(a)n++})});return n}
 function transcript(extra){var L=["answers in · "+R.round+" · v"+VERSION+" · "+innerWidth+"w"+(R.file?" · from file":"")+(R._over?" · over 35: "+R._over:"")+(qp._wrap?" · wraps: "+qp._wrap:""),""],shotList=[];
  R.ideas.forEach(function(I,k){L.push(I._n+" "+I.t);if((I.steps||[]).length)L.push("Steps: "+I.steps.map(function(x,j){return x.s+": "+(A["_st"+k][x.id||String(j)]?"done":"not done")}).join("; "));
   (I.asks||[]).forEach(function(q){var a=A[q.id];if(q.kind==="pair")a=q.items.map(function(it){return it.text+": "+(A[q.id][it.id]||"(skipped)")}).join("; ");if(q.kind==="check")a=a.length?"checked: "+a.join(", "):"none checked";L.push((q.code?"🔐 ":"Q: ")+q.q);L.push("Answer: "+(a||"(skipped)"))});
   var nt=(NT["_i"+k]||"").trim();if(nt)L.push("Note: "+nt);var s=SH["_i"+k]||[];if(s.length){L.push("Screenshots: "+s.length);shotList=shotList.concat(s)}L.push("")});
  if(extra)L.push(extra);return{text:L.join("\n").trim(),shots:shotList}}
 function plain(t){try{sendPrompt(t)}catch(e){syncCopy(t)}}
 if(sb)sb.onclick=function(){var T=transcript();sb.textContent="Send again";sl.textContent="Sent ✓ · "+nAnswered()+" answered";
  if(!T.shots.length){plain(T.text);return}
  var form=document.querySelector("form.elicit"),fi=form&&form.querySelector("input[type=file]");
  if(!form||!fi){plain(transcript("(screenshots not sent: send form missing)").text);return}
  try{var dt=new DataTransfer();T.shots.forEach(function(f){dt.items.add(f)});fi.files=dt.files;fi.dispatchEvent(new Event("change",{bubbles:true}))}catch(e){plain(transcript("(screenshots not sent: "+(e&&e.message||e)+")").text);return}
  setTimeout(function(){var f2=document.querySelector("form.elicit")||form,ans=f2.querySelector("[data-name=answers]"),sub=f2.querySelector(".elicit-submit");if(!sub){plain(transcript("(screenshots not sent: no submit)").text);return}
   if(!ans){ans=el("textarea","elicit-textarea");ans.setAttribute("data-name","answers");ans.style.display="none";(f2.querySelector(".elicit-group")||f2).appendChild(ans)}ans.value=T.text;ans.dispatchEvent(new Event("input",{bubbles:true}));sub.click()},400)};
 if(canShot&&!FIN){["dragenter","dragover"].forEach(function(ev){qp.addEventListener(ev,function(e){e.preventDefault();qp.classList.add("drop")})});
  qp.addEventListener("dragleave",function(e){if(!qp.contains(e.relatedTarget))qp.classList.remove("drop")});
  qp.addEventListener("drop",function(e){e.preventDefault();qp.classList.remove("drop");var fs=e.dataTransfer&&e.dataTransfer.files;if(!fs||!fs.length)return;var w=e.target.closest&&e.target.closest(".idea"),k=w?w.getAttribute("data-k"):"0",id="_i"+k;addShots(id,fs);if(MARK[id])MARK[id]()})}
 function wraps(){var n=0;[].forEach.call(qp.querySelectorAll(".hd"),function(h){if(h.offsetHeight>46)n++});qp._wrap=n}
 try{document.fonts.ready.then(wraps)}catch(x){}setTimeout(wraps,800);
 qp._A=A;qp._NT=NT;qp._transcript=transcript;QP.last=qp}

window.QP={mount:mount,prep:prep,check:check,version:VERSION};
})();
