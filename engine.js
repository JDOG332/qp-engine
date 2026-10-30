/* Jeff's inline question page engine. Layout and behavior only: no round content, no answers. */
(function(){
var VERSION="2.0.4";
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
function memRows(ms){return(ms||[]).map(function(m){var inner=[{c:m.line}];if(m.was)inner.push({p:"Was: "+m.was});return{s:"🧠 "+(m.was?"Updated":"Added to")+" "+m.file+(m.sha?" · "+m.sha:""),m:inner}})}
function emptyM(m){return m==null||(typeof m==="string"&&!m.trim())||(Array.isArray(m)&&!m.length)}
function tidyRows(rows){return(rows||[]).map(function(x){if(x==null||typeof x!=="object")return x;x=Object.assign({},x);if("m" in x){if(emptyM(x.m))delete x.m;else if(Array.isArray(x.m))x.m=tidyRows(x.m)}return x})}
function prepQ(q){q=Object.assign({},q);if(q.rows!=null)q.rows=tidyRows(q.rows);if(q.kind==="code")q=codeQ(q);if(q.kind==="multi"){q.kind="decide";q.multi=true}q.kind=guessKind(q);fixPair(q);return q}
function prep(R){if(R._prepped)return R;R=Object.assign({},R);var n=0;
 if(R.ideas!=null){R.ideas=R.ideas.map(function(I){I=Object.assign({},I);var rows=tidyRows(I.rows).concat(memRows(I.mem));delete I.mem;if(I.steps!=null)I.steps=tidyRows(I.steps);
  var asks=(I.asks||[]).map(function(q){q=prepQ(q);n++;if(!q.id)q.id="q"+n;if(q.rows==null)delete q.rows;return q});I.rows=rows;I.asks=asks;return I}).filter(function(I){return I.rows.length||I.asks.length||(I.steps||[]).length})}
 var out=[],report=null;(R.screens||[]).forEach(function(q){q=prepQ(q);if(q.kind==="report"&&!report)report=q;out.push(q)});
 if(!report&&R.ideas==null&&R.mem){report={kind:"report",rows:[]};out.unshift(report)}
 if(report){report.rows=tidyRows(report.rows).concat(memRows(R.mem))}
 var f=R.finish;if(f)R._finish=true;if(f){var v,inner;if(f.kind==="delete"){v="🗑️ Safe to close & delete";inner=[{p:"Pickup point: "+(f.pickup||"nothing to pick up")}]}else{v="💾 Safe to close, keep this chat";inner=[{p:f.why||f.pickup||"Worth keeping to look back at."}]}out.push({kind:"report",rows:[{s:v,m:inner}]})}
 out.forEach(function(q,i){if(!q.id)q.id="s"+(i+1);if(q.rows==null)delete q.rows});
 ["mem","title","finish","theme"].forEach(function(k){delete R[k]});R.screens=out;R._prepped=true;return R}
var KINDS=["report","todo","decide","do","pair","rank","drag","scale","date","number","text"],QKINDS=KINDS.slice(2);
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
function mount(R){
 if(!document.getElementById("qp-css")){var st=el("style");st.id="qp-css";st.textContent=CSS;document.head.appendChild(st)}
 if(!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Source+Sans+3"]')){var lk=document.createElement("link");lk.rel="stylesheet";lk.href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap";document.head.appendChild(lk)}
 if(R.shots!==false&&!document.querySelector("form.elicit")){var fw=document.createElement("div");fw.innerHTML=FORM;document.body.appendChild(fw.firstElementChild)}
 var host=document.getElementById(R.root||"qp-root");
 R=prep(R);var CE=check(R);if(CE.length){showErrors(host,CE);return}
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
 // v1.16.0: one idea box open at a time (Jeff, iqp1 10/29: the iPhone cuts off long cards). Opening a box closes the open one; the tapped header stays at the same spot on screen
 try{document.documentElement.style.overflowAnchor="none";document.body.style.overflowAnchor="none"}catch(x){}
 function seen(cb){var done=false;function fin(v){if(!done){done=true;cb(v)}}try{var io=new IntersectionObserver(function(es){io.disconnect();var e=es[es.length-1];if(!e||!e.isIntersecting){fin(null);return}var b=e.boundingClientRect,r=e.intersectionRect;fin({t:r.top-b.top,b:r.bottom-b.top,h:b.height})});io.observe(qp);setTimeout(function(){try{io.disconnect()}catch(x){}fin(null)},250)}catch(x){fin(null)}}
 function jumpTo(y,end){var a=el("div","qanc");a.style.top=y+"px";qp.appendChild(a);try{a.scrollIntoView({block:end?"end":"start",behavior:"instant"})}catch(x){try{a.scrollIntoView(!end)}catch(z){}}qp.removeChild(a)}
 // a closing box would shorten the card, and a chat already near its end then pulls everything down; a blank pad under Send keeps the length, and only its part on screen is kept, so it melts away as Jeff scrolls back up
 var low=el("div","qlow"),top=null,lowIO=null;qp.appendChild(low);
 var busy=0;function trim(){if(!low.offsetHeight&&!top)return;if(Date.now()-busy<350)return;seen(function(v){if(!v||Date.now()-busy<350)return;if(top&&v.t>=top.offsetHeight){var r0=qp.getBoundingClientRect().top;top.remove();top=null;window.scrollBy(0,qp.getBoundingClientRect().top-r0);setTimeout(trim,60);return}var lt=low.offsetTop,h=low.offsetHeight;if(h){var k=Math.max(0,Math.min(h,Math.ceil(v.b-lt)));if(k<h)low.style.height=k+"px"}})}
 function watch(){if(lowIO)return;window.addEventListener("scroll",trim,{passive:true});try{var th=[];for(var i=0;i<=50;i++)th.push(i/50);lowIO=new IntersectionObserver(trim,{threshold:th});lowIO.observe(low)}catch(x){lowIO=1}}
 function openIdea(d){var others=[].filter.call(qp.querySelectorAll(".ex.ihd.open"),function(x){return x!==d});if(!others.length){d.classList.add("open");return}
  var hd=d.firstChild,big=0,se=document.documentElement,own=se.scrollHeight>innerHeight+1||window.pageYOffset>0;others.forEach(function(x){big+=x.offsetHeight});var l0=low.offsetHeight;low.style.height=(l0+big)+"px";
  // in the chat the card's frame grows to fit after a moment; wait for it so the screen is measured right
  var t0=Date.now();(function fit(){if(own||se.scrollHeight<=innerHeight+1||Date.now()-t0>400)seen(go);else requestAnimationFrame(fit)})();
  busy=Date.now();setTimeout(trim,400);function go(v){busy=Date.now();var y0=hd.getBoundingClientRect().top,s0=window.pageYOffset||0;
   others.forEach(function(x){x.classList.add("snap");x.classList.remove("open")});d.classList.add("snap");d.classList.add("open");var s1=window.pageYOffset||0,dy=(y0+s0)-(hd.getBoundingClientRect().top+s1);setTimeout(function(){others.forEach(function(x){x.classList.remove("snap")});d.classList.remove("snap")},60);
   low.style.height=(l0+Math.max(0,Math.ceil(dy)))+"px";watch();if(dy<1){trim();return}
   if(own){var gap=s0-dy<0?Math.ceil(dy-s0):0;if(gap){if(!top){top=el("div","qtop");qp.insertBefore(top,qp.firstChild)}top.style.height=(top.offsetHeight+gap)+"px"}window.scrollBy(0,hd.getBoundingClientRect().top-y0);QP.last="own dy"+Math.round(dy);return}
   // v1.16.1: when the card can't tell where the screen is (the iPhone app), the tapped header goes to the top of the screen (Jeff, iqp3: it landed at the bottom of the new box)
   // v1.16.2: the iPhone app may move the card again as its frame resizes, so the header is sent to the top again a few times, stopping as soon as Jeff touches the screen (Jeff, iqp6: "it should jump to the top of the box that was just opened")
   function topIt(why){QP.last=why+" dy"+Math.round(dy)+" v"+(v?Math.round(v.t)+"-"+Math.round(v.b)+"/"+Math.round(v.h):"null");low.style.height=l0+"px";var stop=false;function off(){stop=true}["touchstart","wheel","keydown"].forEach(function(t){window.addEventListener(t,off,{passive:true,once:true})});
    function up(){if(stop)return;try{hd.scrollIntoView({block:"start",behavior:"instant"})}catch(x){try{hd.scrollIntoView(true)}catch(z){}}}up();[60,150,300,500,800].forEach(function(t){setTimeout(up,t)});setTimeout(function(){["touchstart","wheel","keydown"].forEach(function(t){window.removeEventListener(t,off)})},900)}
   if(!v||v.t<=0){topIt("top");return}
   QP.last="";var want=v.t-dy,V=v.b-v.t,full=v.b<v.h-1;
   if(want>=0){jumpTo(want);seen(function(w){if(w&&w.t>0&&Math.abs(w.t-want)>2)jumpTo(want+(want-w.t))})}
   else if(full&&want+V>0){jumpTo(want+V,true);seen(function(w){if(w&&Math.abs(w.b-(want+V))>2)jumpTo(2*(want+V)-w.b,true)})}
   else topIt("top2");QP.last=QP.last||"held";}}
 function drop(head,inner,cls){var d=el("div","ex"+(cls?" "+cls:"")),s=el("div","s"),w=el("div","w"),m=el("div","m");s.appendChild(head);m.appendChild(inner);w.appendChild(m);d.append(s,w);
  s.onclick=function(e){if(e.target.closest&&e.target.closest(".box"))return;e.stopPropagation();var o=d.classList.contains("open");if(!o&&cls==="ihd"){openIdea(d);return}closeSibs(d);d.classList.toggle("open",!o);if(!o){var ta=inner.querySelector("textarea");if(ta&&cls&&cls.indexOf("qh")>=0)setTimeout(function(){try{ta.focus()}catch(x){}},160)}};return d}
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
 function noteBtn(P,id,label,ph){var qb=el("button","qn",label),qw=el("div","qnb"),nbx=noteBox(id,ph);qb.type="button";qw.appendChild(nbx);
  var ta=nbx.querySelector("textarea");if(ta)ta.addEventListener("input",function(){var on=!!ta.value.trim();qb.classList.toggle("has",on);qb.textContent=on?"Note added":label});
  qb.onclick=function(e){e.stopPropagation();var on=!qw.classList.contains("on");qw.classList.toggle("on",on);if(on&&ta)setTimeout(function(){try{ta.focus()}catch(x){}},60)};
  P.append(qb,qw)}
 function qhead(q,P,lock){q._n=kc();var t=(lock?"🔐 ":"")+(q.q||"Question");var h=el("span","hi qt");h.append(el("span","em",q._n),rich(el("span","tx"),t));P.appendChild(drop(h,noteBox(q.id),"qh"))}
 function choose(q,v){A[q.id]=A[q.id]===v?"":v;return A[q.id]}
 function optRow(q,o,group){var b=el("div","op"+(o.pick&&!q.code?" pick":"")),row=el("div","row"),l=lbl(o.label,"span","lb");b.setAttribute("role","button");b.setAttribute("aria-pressed","false");row.appendChild(l);b.appendChild(row);
  if(o.more){var mo=el("span","mo");mo.setAttribute("aria-label","More");var w=el("div","w"),m=el("div","m");m.appendChild(body(o.more));w.appendChild(m);row.appendChild(mo);b.appendChild(w);mo.onclick=function(e){e.stopPropagation();var was=b.classList.contains("open");closeSibs(b);b.classList.toggle("open",!was)}}
  b.onclick=function(e){var ci=e.target.closest&&e.target.closest(".in");if(ci&&b.contains(ci))return;if(q.multi){var cur=(A[q.id]||"").split("; ").filter(Boolean),i=cur.indexOf(o.label);if(i<0&&q.max&&cur.length>=q.max){if(q._cap){q._cap.classList.add("full");setTimeout(function(){q._cap.classList.remove("full")},1200)}return}if(i>=0)cur.splice(i,1);else cur.push(o.label);A[q.id]=q.options.map(function(x){return x.label}).filter(function(x){return cur.indexOf(x)>=0}).join("; ");b.setAttribute("aria-pressed",i>=0?"false":"true");return}
   var v=choose(q,o.label);group.forEach(function(x){x.setAttribute("aria-pressed","false")});if(v)b.setAttribute("aria-pressed","true")};group.push(b);return b}
 function decide(q,P){var g=[];if(q.multi){q._cap=el("p","cap",q.max?"Pick up to "+q.max:"Pick all that fit");q._cap.style.margin="0";P.appendChild(q._cap)}q.options.forEach(function(o){P.appendChild(optRow(q,o,g))})}
 // v1.11.0: number and text, carried over from the deep-interview widget (Jeff, 10/29)
 function fmtN(v){return String(Math.round(v*1e6)/1e6)}
 function number(q,P){var st=q.step||1,u=q.unit?" "+q.unit:"",val=null,w=el("div","nm"),mi=el("button","bt","\u2212"),pl=el("button","bt","+"),inp=el("input","nv"+(q.pick!=null?" pick":""));mi.type=pl.type="button";mi.setAttribute("aria-label","Less");pl.setAttribute("aria-label","More");
  inp.type="text";inp.setAttribute("inputmode","decimal");inp.placeholder=q.pick!=null?fmtN(q.pick)+u:(q.unit||"Number");inp.onclick=function(e){e.stopPropagation()};
  function clamp(v){if(q.min!=null&&v<q.min)v=q.min;if(q.max!=null&&v>q.max)v=q.max;return v}
  function set(v){val=v;if(v==null){inp.value="";A[q.id]="";inp.classList.remove("set")}else{inp.value=fmtN(v);A[q.id]=fmtN(v)+u;inp.classList.add("set")}qb.forEach(function(b){b.setAttribute("aria-pressed",v!=null&&b._v===v?"true":"false")})}
  function bump(d){var base=val!=null?val:(q.pick!=null?q.pick:(q.min!=null?q.min:0));set(clamp(val==null&&q.pick!=null?base:base+d*st))}
  mi.onclick=function(e){e.stopPropagation();bump(-1)};pl.onclick=function(e){e.stopPropagation();bump(1)};
  inp.oninput=function(){var t=inp.value.replace(/[^0-9.\-]/g,"");if(t===""||isNaN(+t)){val=null;A[q.id]="";inp.classList.remove("set");return}val=+t;A[q.id]=fmtN(val)+u;inp.classList.add("set")};
  inp.onblur=function(){if(val!=null)set(clamp(val))};
  w.append(mi,inp,pl);P.appendChild(w);var qb=[];if((q.quick||[]).length){var g=el("div","gq");q.quick.forEach(function(v){var b=el("button","bt"+(q.pick===v?" pick":""),fmtN(v)+u);b.type="button";b._v=v;b.setAttribute("aria-pressed","false");b.onclick=function(e){e.stopPropagation();set(val===v?null:v)};qb.push(b);g.appendChild(b)});P.appendChild(g)}
  if(q.min!=null||q.max!=null){P.appendChild(el("p","nu",(q.min!=null?fmtN(q.min):"")+" to "+(q.max!=null?fmtN(q.max):"")+u)).style.margin="0"}}
 function textQ(q,P){var t=el("textarea","tx");t.placeholder=q.ph||"Type or dictate";t.onclick=function(e){e.stopPropagation()};t.oninput=function(){A[q.id]=t.value.trim();t.classList.toggle("set",!!A[q.id])};P.appendChild(t)}
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
 var KIND={decide:decide,do:decide,pair:pair,scale:scale,date:datePick,rank:rank,drag:drag,number:number,text:textQ};
 // v1.9.0: the page is grouped by main idea (Jeff, 10/25): each idea is one numbered box, collapsed on load, with its rows, steps, questions and its own note box
 function idea(I,k){var P=sec("idea"),n=KC[k]||String(k+1);I._n=n;var h=el("span","hi"),ih=el("span","ih");ih.appendChild(rich(el("span","it"),I.t));if(I.line)ih.appendChild(rich(el("span","il"),I.line));h.append(el("span","em",n),ih);
  var inner=el("div","in");if((I.rows||[]).length){var rp=el("div");rp.style.cssText="display:flex;flex-direction:column;gap:8px";report({rows:I.rows},rp);inner.appendChild(rp)}
  if((I.steps||[]).length){var st=el("div","st");A["_st"+k]={};I.steps.forEach(function(x,j){var id=x.id||String(j),txt=String(x.s||"");var hh=el("span","hi"),bx=el("span","box","");bx.setAttribute("role","checkbox");hh.append(bx,rich(el("span","tx"),txt));var d;if(x.m==null){d=el("div","ex flat td");var hs=el("div","s");hs.appendChild(hh);d.appendChild(hs)}else d=drop(hh,body(x.m),"td");bx.onclick=function(e){e.stopPropagation();var on=!A["_st"+k][id];A["_st"+k][id]=on;bx.textContent=on?"✓":"";d.classList.toggle("done",on)};st.appendChild(d)});inner.appendChild(st)}
  (I.asks||[]).forEach(function(q){var a=el("div","ak"+(q.code?" lock":""));var t=el("div","aq");t.appendChild(rich(el("span"),(q.code?"🔐 ":"❓ ")+q.q));a.appendChild(t);(q.rows||[]).forEach(function(r){a.appendChild(exRow(r.s,r.m))});(KIND[q.kind]||decide)(q,a);
   // v1.12.0: a note under every question, closed until tapped (Jeff, iqp6: the old deep-interview widget had one)
   noteBtn(a,q.id,"Add a note","Note on this question");inner.appendChild(a)});
  // v1.14.0: the idea's note box hides behind a button too, so no note box shows until Jeff taps (Jeff, iqp7)
  // v1.15.0: an idea with questions has a note under each question, so no idea note on top of that; an idea with no questions keeps its one note button (Jeff, iqp9: "it's doubled up")
  if(!(I.asks||[]).length){var nb=el("div","inote ak");noteBtn(nb,"_i"+k,"Add a note about this idea","Note about this idea");inner.appendChild(nb)}
  // v1.13.0: a Close button at the end of every idea box, so a finished box folds without scrolling back up to its header (Jeff, bathroom interview 10/28)
  var D=drop(h,inner,"ihd"),cb=el("button","icl","Close this box \u25B4");cb.type="button";inner.appendChild(cb);
  cb.onclick=function(e){e.stopPropagation();D.classList.remove("open");var hd=D.firstChild;setTimeout(function(){try{hd.scrollIntoView({block:"nearest"})}catch(x){try{hd.scrollIntoView()}catch(y){}}},20)};
  P.appendChild(D)}
 if(R.ideas){R.ideas.forEach(idea)}
 (R.screens||[]).forEach(function(q){if(q.kind==="report"){report(q,sec());return}if(q.kind==="todo"){todo(q,sec());return}var lock=!!q.code,P=sec(lock?"lock":"");qhead(q,P,lock);(q.rows||[]).forEach(function(r){P.appendChild(exRow(r.s,r.m))});(KIND[q.kind]||decide)(q,P)});
 // grouped rounds have no page note: every note goes in an idea's own note box (Jeff, 10/25)
 var pn=el("div");if(!R.ideas){pn.style.cssText="display:flex;flex-direction:column;gap:8px";noteBtn(pn,"_page","Add a note","Add a note");ct.appendChild(pn)}
 if(R.after){ct.appendChild(rich(el("p","after"),R.after))}
 var sb=el("button","send","Send ↗");sb.type="button";ct.appendChild(sb);ct.appendChild(el("div")).style.cssText="flex:none;height:8px";
 function nAnswered(){var n=0;(R.ideas||[]).forEach(function(I){(I.asks||[]).forEach(function(q){var a=A[q.id];if(a&&typeof a==="object"){if(Object.keys(a).some(function(k){return a[k]}))n++}else if(a)n++})});(R.screens||[]).forEach(function(q){var a=A[q.id];if(q.kind==="report")return;if(a&&typeof a==="object"){if(Object.keys(a).some(function(k){return a[k]}))n++}else if(a)n++});return n}
 function transcript(extra){var L=["answers in · "+R.round+" · v"+VERSION+" · "+innerWidth+"w"+(R.file?" · from file":""),""],shotList=[];
  (R.ideas||[]).forEach(function(I,k){L.push(I._n+" "+I.t);if((I.steps||[]).length)L.push("Steps: "+I.steps.map(function(x,j){return x.s+": "+(A["_st"+k][x.id||String(j)]?"done":"not done")}).join("; "));(I.asks||[]).forEach(function(q){var a=A[q.id];if(q.kind==="pair")a=q.items.map(function(it){return it.text+": "+(A[q.id][it.id]||"(skipped)")}).join("; ");L.push((q.code?"🔐 ":"Q: ")+q.q);L.push("Answer: "+(a||"(skipped)"));var qn=(NT[q.id]||"").trim();if(qn)L.push("Note on this question: "+qn);var qs=SH[q.id]||[];if(qs.length){L.push("Screenshots: "+qs.length);shotList=shotList.concat(qs)}});var nt=(NT["_i"+k]||"").trim();if(nt)L.push("Note: "+nt);Object.keys(NT).filter(function(x){return x.indexOf("_p"+k+"_")===0}).sort().forEach(function(x){var v=(NT[x]||"").trim();if(v)L.push("Note on screen "+x.split("_")[2]+": "+v)});var s=SH["_i"+k]||[];if(s.length){L.push("Screenshots: "+s.length);shotList=shotList.concat(s)}L.push("")});
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
 qp.addEventListener("drop",function(e){if(!canShot)return;e.preventDefault();qp.classList.remove("drop");var fs=e.dataTransfer&&e.dataTransfer.files;if(!fs||!fs.length)return;var h=e.target.closest&&e.target.closest(".qh"),id="_page";if(h){var s=h.closest(".sec");(R.screens||[]).forEach(function(q){if(q._sec===s)id=q.id})}addShots(id,fs);var w=h?h.querySelector(".in"):pn.querySelector(".in");if(w&&w._mark)w._mark()});
 [].forEach.call(ct.querySelectorAll(".sec"),function(s,i){var q=(R.screens||[])[i];if(q)q._sec=s});
 if(R.ideas&&R.layout!=="boxes"){qp._NT=NT;qp._fit=R.fit||"";screensMode(qp,ct)}


}
// v2.0.0: one screen per idea (Jeff, iqp8 to iqp14, 10/29): Back and Next, a faint number bar to jump, one note bar per screen, Submit all answers on the last screen; every card 680 tall on the iPhone and the Mac; a topic too tall moves its last items onto its own next screen (1/2, 2/2). layout:"boxes" in a round keeps the v1.16 boxes.
function screensMode(qp,ct){var CARD=680;var fit=function(){};
var S=[].filter.call(ct.children,function(x){return x.querySelector&&x.querySelector(":scope > .ex.ihd")});if(!S.length)return;S.forEach(function(x,k){x._k=k});
var send=ct.querySelector(".send");if(send)send.style.display="none";qp.classList.add("scr");
var st=document.createElement("style");st.textContent=
".qp .icl{display:none!important}.qp .ex.ihd>.s{pointer-events:none}.qp .ex.ihd>.s::after{content:''!important}"+
".qp .ct{gap:8px;padding:2px}.qp .sec{padding:4px 6px;gap:4px}.qp .in{gap:5px;padding:0 4px 4px 4px}.qp .ex>.s{padding-top:7px!important;padding-bottom:7px!important}.qp .il{font-size:16px!important}"+
".qp .qdots{display:flex;justify-content:center;gap:2px;margin:-2px 0 -4px}.qp .qdots button{background:none;border:0;font:inherit;font-size:14px!important;line-height:1;padding:6px 9px;color:var(--ink);opacity:.38;cursor:pointer;border-radius:8px}.qp .qdots button.on{opacity:.9;font-weight:700;text-decoration:underline;text-underline-offset:3px}"+
".qp .ak.qdiag{display:none!important}.qp .ak .g2:has(input[type=date]){display:flex!important;flex-direction:column;gap:5px}.qp .ak .g2:has(input[type=date])>*{width:100%;min-height:40px;text-align:left;padding:5px 12px;white-space:nowrap}"+
".qp .ex:not(.ihd)>.s>.t{flex:1;min-width:0}.qp .ex:not(.ihd)>.s>.t>.tx{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
".qp .ex:not(.ihd)>.s{display:flex;align-items:center}.qp .il{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}"+
".qp .ak{gap:5px!important}.qp .op .row{min-height:40px!important;padding:0!important}.qp .op .lb{padding:5px 12px!important}.qp .op .mo{width:34px;height:32px;margin:3px 6px 3px 0}"+
".qp .nbar~.qnb .at,.qp .nbar~.qnb textarea{display:none}.qp .nbar~.qnb{display:block!important}.qp .nbar{display:flex;gap:8px;margin-top:4px;align-items:stretch}.qp .nbar .qn{display:none!important}.qp .nbar textarea.nt{flex:1;min-width:0;min-height:46px;height:46px;resize:none;overflow:hidden;max-height:150px;box-sizing:border-box;padding:10px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;line-height:1.3}.qp .nbar .clip{flex:none;width:56px;min-height:46px;max-height:46px;align-self:flex-end;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;cursor:pointer}"+
".qp .qnav{display:flex;gap:8px}.qp .qnav button{flex:1;min-height:46px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;cursor:pointer}.qp .qnav button{flex:1 1 0;white-space:nowrap;padding:0 6px}.qp .qnav.last button{flex:0 0 24%}.qp .qnav.last button.sub{flex:1 1 0;font-weight:700;background:var(--ink);border-color:var(--ink);color:var(--bg)}";
document.head.appendChild(st);
var FIT={wrap:".qp .ex:not(.ihd)>.s>.t>.tx,.qp .il{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}",
 clamp2:".qp .ex:not(.ihd)>.s>.t>.tx,.qp .il{white-space:normal!important;overflow:hidden!important;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
 tap:".qp .ex.open>.s>.t>.tx,.qp .ex.full>.s>.t>.tx{white-space:normal!important;overflow:visible!important}.qp .ex.cut>.s>.t>.tx::after{content:''}"};
if(FIT[qp._fit]){var fs=document.createElement("style");fs.textContent=FIT[qp._fit];document.head.appendChild(fs)}
if(qp._fit==="tap")ct.addEventListener("click",function(e){var x=e.target.closest&&e.target.closest(".ex.flat");if(x&&!x.classList.contains("ihd")){x.classList.toggle("full");setTimeout(fit,30)}});
if(qp._fit==="shrink")[].forEach.call(ct.querySelectorAll(".ex:not(.ihd)>.s>.t>.tx,.il"),function(t){var f=19.5;var vis=[];var p=t;while(p&&p!==ct){if(p.style&&p.style.display==="none"){vis.push(p);p.style.display=""}p=p.parentNode}
 while(t.scrollWidth>t.clientWidth+1&&f>15){f-=0.5;t.style.setProperty("font-size",f+"px","important")}vis.forEach(function(v){v.style.display="none"})});
S.forEach(function(s){var inn=s.querySelector(":scope > .ex.ihd .in");if(!inn)return;var qs=[].slice.call(inn.querySelectorAll(".qn")),keep=qs[0];if(!keep)return;qs.slice(1).forEach(function(b){b.style.display="none"});
 var nb=keep.nextElementSibling&&keep.nextElementSibling.classList.contains("qnb")?keep.nextElementSibling:null;var host=keep.parentNode;
 var bar=document.createElement("div");bar.className="nbar";var clip=document.createElement("button");clip.type="button";clip.className="clip";clip.textContent="📎";clip.setAttribute("aria-label","Add a screenshot");
 var ta=nb&&nb.querySelector("textarea");if(ta){ta.classList.add("nt");ta.placeholder="Add a note";ta.rows=1;var grow=function(){ta.style.height="46px";ta.style.height=Math.min(150,Math.max(46,ta.scrollHeight))+"px";ta.style.overflowY=ta.scrollHeight>150?"auto":"hidden";setTimeout(fit,20)};ta.addEventListener("input",grow);bar.append(keep,ta,clip)}else bar.append(keep,clip);inn.appendChild(bar);if(nb)inn.appendChild(nb);if(host.classList&&host.classList.contains("inote")&&!host.children.length)host.style.display="none";
 clip.onclick=function(e){e.stopPropagation();if(/iPhone|iPad/.test(navigator.userAgent)){var tip=s.querySelector(".cliptip");if(!tip){tip=document.createElement("div");tip.className="cliptip";tip.style.cssText="font-size:16px;opacity:.75";tip.textContent="On the iPhone, paste screenshots into the chat box after Submit.";inn.appendChild(tip);setTimeout(fit,50)}return}var at=nb&&nb.querySelector(".at");if(at)at.click()}});
var box=document.createElement("div");ct.insertBefore(box,S[0]);S.forEach(function(s,k){box.appendChild(s);if(k)s.style.display="none";var d=s.querySelector(":scope > .ex.ihd");if(d){d.classList.add("snap");d.classList.add("open")}});
[].forEach.call(ct.querySelectorAll(":scope > .sec"),function(x){var last=S[S.length-1].querySelector(":scope > .ex.ihd .in");if(last)last.insertBefore(x,last.querySelector(":scope > .nbar"))});
var nav=document.createElement("div");nav.className="qnav";ct.insertBefore(nav,send||null);
// auto split: a screen taller than the room moves its last items onto a new screen right after it, titled 1/2, 2/2
// v2.0.4: every screen gets its own note bar; a split topic's later screens keep their own notes ("Note on screen 2: ..."), never joined into one box, so nothing repeats (Jeff 10/30, iqp3)
function mkBar(s,n){var b0=s.querySelector(":scope > .ex.ihd .in > .nbar");if(!b0)return null;var c0=b0.querySelector(".clip"),NTm=qp._NT||{},key="_p"+s._k+"_"+n;
 var bar=document.createElement("div");bar.className="nbar";var t=document.createElement("textarea");t.className="nt";t.rows=1;t.placeholder="Add a note";
 t.addEventListener("input",function(){NTm[key]=t.value;t.style.height="46px";t.style.height=Math.min(150,Math.max(46,t.scrollHeight))+"px";t.style.overflowY=t.scrollHeight>150?"auto":"hidden";setTimeout(fit,20)});bar.appendChild(t);
 var c=document.createElement("button");c.type="button";c.className="clip";c.textContent="📎";c.setAttribute("aria-label","Add a screenshot");
 c.onclick=function(e){e.stopPropagation();if(/iPhone|iPad/.test(navigator.userAgent)){var h=bar.parentNode;if(h&&!h.querySelector(".cliptip")){var tip=document.createElement("div");tip.className="cliptip";tip.style.cssText="font-size:16px;opacity:.75";tip.textContent="On the iPhone, paste screenshots into the chat box after Submit.";h.appendChild(tip);setTimeout(fit,50)}return}if(c0)c0.click()};bar.appendChild(c);return bar}
function SPLIT(){var probe=S[0];S.forEach(function(s){s.style.display="none"});probe.style.display="";var b0=box.style.minHeight;box.style.minHeight="0px";var dn=document.createElement("div");dn.style.height="20px";ct.insertBefore(dn,box);nav.style.minHeight="46px";var chrome=qp.offsetHeight-box.offsetHeight;dn.remove();var room=CARD-chrome;probe.style.display="none";
 var out=[];S.forEach(function(s){var parts=[s];var cur=s;cur.style.display="";var guard=0;
  while(cur.offsetHeight>room&&guard++<400){var inn=cur.querySelector(":scope > .ex.ihd .in");var units=[];[].forEach.call(inn.children,function(c){if(c.classList.contains("icl")||c.classList.contains("nbar")||c.classList.contains("qnb")||c.classList.contains("qdiag")||c.style.display==="none")return;if(!c.className&&c.children.length>1||c.classList.contains("st")||c.classList.contains("ak")&&c.children.length>2&&c.offsetHeight>room*0.8)[].forEach.call(c.children,function(x){units.push(x)});else units.push(c)});
   if(units.length<2)break;var nx=cur._next||null;
   if(!nx){nx=cur.cloneNode(true);var ni=nx.querySelector(":scope > .ex.ihd .in");while(ni.firstChild)ni.removeChild(ni.firstChild);var xb=mkBar(s,parts.length+1);if(xb)ni.appendChild(xb);cur._next=nx;nx._orig=s;parts.push(nx);cur.parentNode.insertBefore(nx,cur.nextSibling);nx.style.display="none"}
   var u=units[units.length-1],grp=u.parentNode===inn?null:u.parentNode,ni2=nx.querySelector(":scope > .ex.ihd .in");
   if(grp){var g2=ni2.firstChild&&ni2.firstChild._src===grp?ni2.firstChild:null;if(!g2){g2=grp.cloneNode(false);g2._src=grp;ni2.insertBefore(g2,ni2.firstChild)}g2.insertBefore(u,g2.firstChild)}else ni2.insertBefore(u,ni2.firstChild);
   if(cur.offsetHeight<=room){cur.style.display="none";cur=nx;cur.style.display=""}}
  cur.style.display="none";parts.forEach(function(p){out.push(p)});if(parts.length>1)parts.forEach(function(p,k){var it=p.querySelector(".it");if(it)it.textContent=it.textContent.replace(/ \d+\/\d+$/,"")+" "+(k+1)+"/"+parts.length})});
 S=out;box.style.minHeight=b0}
function START(){SPLIT();var dots=document.createElement("div");dots.className="qdots";ct.insertBefore(dots,box);S.forEach(function(s,k){var b=document.createElement("button");b.type="button";b.textContent=String(k+1);b.onclick=function(e){e.stopPropagation();show(k)};dots.appendChild(b)});
var diagT=null;[].forEach.call(qp.querySelectorAll("textarea.tx"),function(t){if(/fills in by itself/i.test(t.placeholder||"")){var a=t.closest(".ak");if(a)a.classList.add("qdiag");diagT=t}});
var i=0;function btn(t,c,f){var b=document.createElement("button");b.type="button";b.textContent=t;if(c)b.className=c;b.onclick=function(e){e.stopPropagation();f()};nav.appendChild(b)}
fit=function(){[].forEach.call(box.querySelectorAll(".nbar"),function(x){x.style.marginTop=""});box.style.minHeight="0px";var chrome=qp.offsetHeight-box.offsetHeight,m=Math.max(0,CARD-chrome);box.style.minHeight=m+"px";/* v2.0.3: the note bar sits at the bottom of every screen, right above Back and Next (Jeff 10/30) */var cs=S[i],cb=cs&&cs.querySelector(".nbar");if(cb){var gp=m-cs.offsetHeight;if(gp>0)cb.style.marginTop=(4+gp)+"px"}var HS=S.map(function(s){var o=s.style.display;s.style.display="";var h=s.offsetHeight;s.style.display=o;return h});if(diagT){diagT.value="scr "+screen.width+"x"+screen.height+" vh"+innerHeight+" card"+qp.offsetHeight+" screens "+HS.join(",")+" room "+box.style.minHeight+" over "+HS.filter(function(h){return h>parseInt(box.style.minHeight)}).length+" ua "+(/iPhone/.test(navigator.userAgent)?"iPhone":/Mac/.test(navigator.userAgent)?"Mac":"other");diagT.dispatchEvent(new Event("input"))}}
function show(n){i=(n+S.length)%S.length;S.forEach(function(s,k){s.style.display=k===i?"":"none"});[].forEach.call(dots.children,function(b,k){b.classList.toggle("on",k===i)});
nav.innerHTML="";nav.className="qnav"+(i===S.length-1?" last":"");btn("Back","",function(){show(i-1)});btn("Next","",function(){show(i+1)});if(i===S.length-1)btn("Submit all answers","sub",function(){if(send)send.click()});fit()}
show(0);setTimeout(fit,300);document.addEventListener("click",function(){setTimeout(fit,250)},true)}
var started=false;function go(){if(started)return;started=true;START()}try{document.fonts.ready.then(go)}catch(x){}setTimeout(go,1200)}

window.QP={mount:mount,prep:prep,check:check,version:VERSION};
})();
