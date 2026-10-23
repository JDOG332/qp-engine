/* Jeff's inline question page engine. Layout and behavior only: no round content, no answers. */
(function(){
var VERSION="1.7.0";
var THEMES={
navy:{l:["#1f3a68","#e1e7f2","#f0f2f6","#ffffff","#d5dbe6"],d:["#8fb0ea","#1f2a40","#12151b","#1b1f27","#2f3644"]},
blue:{l:["#2563c9","#e2ecfb","#f1f4f9","#ffffff","#d9e0ea"],d:["#6aa2ff","#1e2a3d","#14171c","#1d2128","#313845"]},
ngu:{l:["#d90a4c","#fde3ea","#f7f3f1","#ffffff","#e8dcd7"],d:["#ff5c8d","#3d1f29","#18151a","#221d20","#3b3236"]},
plum:{l:["#7a3b8f","#f1e4f5","#f5f2f6","#ffffff","#e2dae6"],d:["#c98ae0","#33243a","#18151a","#211d24","#3a3240"]},
scarlet:{l:["#ba0c2f","#f8e1e5","#f2f2f3","#ffffff","#dcdcdf"],d:["#ff4d6a","#3a1f24","#17181a","#212225","#36373b"]},
teal:{l:["#0f7a7a","#dff2f1","#f1f4f4","#ffffff","#d6e0e0"],d:["#4fd1c5","#1a3233","#131819","#1c2224","#2f393b"]},
gold:{l:["#a86f00","#f7ecd2","#f3f2ef","#ffffff","#e0ddd5"],d:["#f2b84b","#3a2f18","#161616","#202020","#363636"]},
forest:{l:["#2f6b45","#e1efe5","#f2f4ef","#fdfefb","#dbe2d6"],d:["#6cc28c","#1f3127","#141815","#1d221e","#323a33"]}};
var CSS=".qp{box-sizing:border-box;height:780px;background:var(--bg);color:var(--ink);font:17px/1.4 'Source Sans 3',system-ui,-apple-system,sans-serif;border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:10px;overflow:hidden;position:relative}"+
".qp *{box-sizing:border-box}.qp .dots{height:14px;flex:none;display:flex;gap:7px;align-items:center;justify-content:center}"+
".qp .dots i{width:9px;height:9px;border-radius:50%;background:var(--line);display:block}.qp .dots i.done{background:var(--accent)}.qp .dots i.cur{background:transparent;box-shadow:0 0 0 2px var(--accent)}"+
".qp .card{flex:1;min-height:0;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;grid-template-rows:38px minmax(0,1fr) auto;row-gap:16px}"+
".qp .dots i.go{cursor:pointer}"+
".qp .pr{flex:none;display:flex;flex-direction:column;gap:6px;border:1.5px solid var(--line);border-radius:10px;padding:8px 10px}.qp .pr b{font-weight:600;line-height:1.25}"+
".qp .pr .sg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.qp .pr .sg button{font:inherit;font-size:16px;font-weight:600;min-height:40px;padding:0 10px;border:1.5px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;touch-action:manipulation}"+
".qp .pr .sg button.pick{border:2px solid var(--accent);padding:0 9.5px}.qp .pr .sg button[aria-pressed=true]{background:var(--chosen)!important;border:1.5px solid var(--accent);padding:0 10px}"+
".qp .ex .m .ex{background:var(--card);margin-top:6px}.qp .ex .m .ex .s{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:44px;padding:0 10px}.qp .ex .m .ex .m{font-size:15px;line-height:1.35;padding:0 10px 10px 24px}.qp .ex .m .cp{margin-top:6px}.qp .ex .m p{margin:4px 0}"+
".qp .card{grid-template-rows:0 minmax(0,1fr) auto;row-gap:0}.qp .card.rep{}.qp .hd{height:0!important;overflow:hidden;visibility:hidden}.qp .nav{margin-top:12px}.qp .h{flex:none;margin:2px 0 4px;font-weight:700;font-size:18px;line-height:1.3}.qp .ct.list{overflow-y:auto}.qp .ct.list{gap:6px}.qp .ct.list>.ex .s{min-height:42px}.qp .ct.list>.ex .s{display:flex}.qp .ct.list>.ex .s>span.t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qp .ct.list>.ex.open .s>span.t{white-space:normal}"+
".qp .ex.td .s{padding-left:10px}.qp .ex.td .s::before{content:none}.qp .ex.td .box{flex:none;width:26px;height:26px;border:2px solid var(--accent);border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;color:var(--ai);background:transparent;cursor:pointer}.qp .ex.td.done .box{background:var(--accent)}.qp .ex.td.done .s{color:var(--muted);text-decoration:line-through}.qp .ex.td .s::after{content:'\\25B8';color:var(--accent);margin-left:auto}.qp .ex.td.open .s::after{content:'\\25BE'}.qp .tiny.wrap{white-space:normal}.qp .r.cb{flex-direction:column;align-items:stretch;gap:4px;padding:12px 12px 10px}.qp .r.cb b{white-space:normal;max-width:100%;line-height:1.3}.qp .r.cb .dt{white-space:normal;font-size:15px}.qp .r.cb .pk{display:none}.qp .r.cb{position:relative}.qp .r.cb[aria-pressed=true]::before{position:absolute;left:24px;top:24px}.qp .r.cb[aria-pressed=true] b{padding-left:32px}.qp .r.cb .more{color:var(--accent);font-size:15px;font-weight:600;margin-top:10px;display:flex;align-items:center;min-height:44px;padding:0 10px;border:1.5px solid var(--line);border-radius:8px;background:var(--soft)}.qp .r.cb b{display:flex;align-items:center;min-height:44px;padding:0 10px;border:1.5px solid var(--line);border-radius:8px;background:var(--card)}.qp .r.cb[aria-pressed=true] b{border-color:var(--accent)}.qp .r.cb .more::before{content:'\\25B8 '}.qp .r.cb.open .more::before{content:'\\25BE '}.qp .r.cb .md{display:none;font-size:15px;color:var(--ink);font-weight:400;white-space:normal;line-height:1.35;border-top:1px solid var(--line);padding-top:6px;margin-top:2px}.qp .r.cb.open .md{display:block}.qp .nav.last .btns{grid-template-columns:.85fr .95fr 2fr}.qp .nav.last .nx.fin{font-size:17px}"+
".qp .hd{display:flex;align-items:center;gap:12px;min-width:0}.qp .tag{flex:none;height:36px;display:inline-flex;align-items:center;font-size:18px;font-weight:700;color:var(--accent);border:1.5px solid var(--accent);border-radius:99px;padding:0 14px;white-space:nowrap}"+
".qp h1{flex:1;min-width:0;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:18px;line-height:36px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
".qp .ct{display:flex;flex-direction:column;gap:8px;overflow:hidden;min-height:0}.qp .ct.scroll{overflow-y:auto}"+
".qp .lead{flex:none;height:48px;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}"+
".qp .r{flex:none;min-height:44px;border:1.5px solid var(--line);border-radius:10px;padding:0 12px;display:flex;align-items:center;gap:8px;font:inherit;color:var(--ink);background:var(--card);text-align:left;cursor:pointer;touch-action:manipulation;width:100%}"+
".qp .r b{font-weight:600;flex:none;max-width:72%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qp .r .dt{color:var(--muted);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}"+
".qp .r .pk{margin-left:auto;flex:none;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}"+
".qp .r[aria-pressed=true]{border-color:var(--accent);background:var(--chosen)!important}.qp .r[aria-pressed=true]::before{content:'\\2713';color:var(--accent);font-weight:700}"+
".qp .r.pick{border:2px dashed var(--accent)!important;padding:0 11.5px}.qp .r.skip{color:var(--muted);border-style:dashed}"+
".qp .r.nock[aria-pressed=true]::before{content:none}.qp .badge{flex:none;width:28px;height:28px;border-radius:50%;border:2px solid var(--muted);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}.qp .badge.on{background:var(--accent);border-color:var(--accent);color:var(--ai)}"+
".qp .r.dg{touch-action:none;cursor:grab;user-select:none;transition:transform .12s}.qp .r.dg.lift{transition:none;z-index:3;position:relative;border-color:var(--accent);box-shadow:0 6px 18px rgba(0,0,0,.25)}.qp .r.dg .hdl{color:var(--muted);font-size:18px;flex:none;margin-left:auto}.qp .r.dg .num{flex:none;font-weight:700;color:var(--accent);width:18px}"+
".qp .grid5{flex:none;display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.qp .grid2{flex:none;display:grid;grid-template-columns:1fr 1fr;gap:10px}.qp .grid3{flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}"+
".qp .big{min-height:60px;justify-content:center;font-size:22px;font-weight:700;padding:0}.qp .grid3 .r{justify-content:center}"+
".qp .ends{flex:none;display:flex;justify-content:space-between;color:var(--muted);font-size:15px;margin:0}"+
".qp .cal{justify-content:center;font-weight:700;border:2px solid var(--accent)!important;color:var(--accent);background:var(--chosen)!important}.qp .qd{flex-direction:column;align-items:flex-start;justify-content:center;gap:0;min-height:56px}.qp .qd b{max-width:100%}.qp .qd .dt{flex:none}"+
".qp .calhd{flex:none;display:grid;grid-template-columns:44px 1fr 44px auto;gap:8px;align-items:center}.qp .calhd .r{justify-content:center;padding:0 10px}.qp .calhd>b{text-align:center;font-weight:700}"+
".qp .calg{flex:none;display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.qp .calg .dow{text-align:center;font-size:13px;color:var(--muted);height:18px}"+
".qp .cd{height:34px;border:1.5px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit;font-size:16px;cursor:pointer;padding:0;touch-action:manipulation}.qp .cd.today{border-color:var(--accent);color:var(--accent);font-weight:700}.qp .cd.past{opacity:.45}.qp .cd[aria-pressed=true]{background:var(--accent)!important;border-color:var(--accent);color:var(--ai)!important}"+
".qp .ex{flex:none;border:1px solid var(--line);border-radius:10px;background:var(--soft);cursor:pointer}.qp .ex .s{min-height:44px;padding:0 12px;font-weight:600;display:flex;align-items:center;gap:8px}.qp .ex .s::before{content:'\\25B8';color:var(--accent);flex:none}"+
".qp .ex.open .s::before{content:'\\25BE'}.qp .ex .m{display:none;font-size:16px;padding:0 12px 10px 30px}.qp .ex.open .m{display:block}.qp .ex.why .s{font-weight:400;color:var(--muted)}"+
".qp .cp{flex:none;display:flex;gap:8px;align-items:center}.qp .cp pre{flex:1;min-width:0;margin:0;padding:8px 10px;max-height:124px;overflow:auto;background:var(--bg);border:1.5px solid var(--line);border-radius:10px;font:15px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;color:var(--ink);user-select:all}"+
".qp .cp button,.qp .th button{font:inherit;font-weight:600;cursor:pointer;border:0;background:var(--accent)!important;color:var(--ai)!important}.qp .cp button{flex:none;height:44px;padding:0 16px;border-radius:10px}"+
".qp .tiny{flex:none;margin:0;color:var(--muted);font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qp .tiny.ok{color:var(--accent);font-weight:600}"+
".qp .paste{flex:none;height:96px;border:2px dashed var(--accent);border-radius:12px;background:var(--soft);display:flex;align-items:center;justify-content:center;text-align:center;padding:10px;color:var(--accent);font-weight:600;outline:none;cursor:text;overflow:hidden;caret-color:transparent}.qp .paste:focus{background:var(--chosen)}"+
".qp .thumbs{flex:none;height:92px;display:flex;gap:10px;align-items:center}.qp .th{position:relative;width:84px;height:84px;border:1.5px solid var(--line);border-radius:10px;overflow:hidden;background:var(--soft);flex:none}.qp .th img{width:100%;height:100%;object-fit:cover;display:block}"+
".qp .th button{position:absolute;top:4px;right:4px;width:26px;height:26px;border-radius:50%;padding:0;background:var(--fin)!important;color:var(--fini)!important}.qp .th.more{display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:600}.qp .th.empty{border-style:dashed;opacity:.5}"+
".qp .nav{display:flex;flex-direction:column;gap:6px}.qp .nav .btns{display:grid;grid-template-columns:1fr 1.15fr 1.6fr;gap:8px;height:52px}.qp .nav .btns button{font:inherit;font-weight:600;font-size:17px;border-radius:11px;border:1.5px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}"+
".qp .nav .rv{display:none;height:20px;line-height:20px;text-align:center;font-size:14px;color:var(--muted);background:none;border:0;padding:0;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:3px}.qp .nav .rv.on{display:block}"+
".qp .nav .nx{background:var(--accent)!important;border-color:var(--accent);color:var(--ai)!important}.qp .nav .nx.fin{background:var(--fin)!important;border-color:var(--fin);color:var(--fini)!important;font-weight:700;font-size:18px}.qp .nav .has{border-color:var(--accent);color:var(--accent)}"+
".qp .pop{position:absolute;inset:10px;background:var(--card);border:1.5px solid var(--accent);border-radius:14px;padding:12px;display:none;flex-direction:column;gap:12px;z-index:5}.qp .pop.on{display:flex}"+
".qp .pop textarea{flex:1;min-height:160px;width:100%;font:inherit;color:var(--ink);background:var(--bg);border:1.5px solid var(--line);border-radius:11px;padding:10px 12px;resize:none}"+
".qp .pop .row{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px;height:52px;flex:none}.qp .pop .row .at{padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qp .pop .row .at.has{border-color:var(--accent);color:var(--accent)}.qp .mini{display:none;flex-direction:column;gap:8px;flex:none}.qp .mini.on{display:flex}.qp .mini .paste{height:56px;font-size:15px}.qp .mini .thumbs{height:64px}.qp .mini .th{width:56px;height:56px}.qp .mini .th button{width:22px;height:22px;top:2px;right:2px}.qp .pop .row button{font:inherit;font-weight:600;border-radius:11px;border:1.5px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}.qp .pop .row .sv{background:var(--accent)!important;border-color:var(--accent);color:var(--ai)!important}"+
".qp .stash{position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}"+
/* One type size everywhere (Jeff, iqp14 and iqp15): every piece of text inside the card and the note pop-out inherits one size, 17px on the phone and 18px on the Mac. Send included. Only the row heights and padding change with the frame. */
".qp .card *,.qp .pop *{font-size:inherit!important}"+
"@media (min-width:520px){.qp{font-size:18px}.qp .lead{height:52px}"+
".qp .ct.list>.ex .s{min-height:48px}.qp .ex .m{line-height:1.45;padding:0 14px 12px 32px}.qp .ex .m .ex .s{line-height:46px}.qp .ex .m p{margin:5px 0}.qp .r{min-height:48px}.qp .r.cb{padding:11px 13px;gap:5px}.qp .r.cb .md{line-height:1.45}"+
".qp .ex.td .box{width:28px;height:28px}.qp .cp pre{max-height:150px}.qp .cp button{height:46px}.qp .nav .btns{height:54px}.qp .pr .sg button{min-height:44px}.qp .big{min-height:64px}.qp .cd{height:38px}}"+
/* Content button, Jeff iqp18: one row, the label fills the left, a boxed arrow on the right opens the facts. No word Details. */
".qp .r.cb,.qp .r.cb.pick{display:grid;grid-template-columns:minmax(0,1fr) 52px;align-items:stretch;gap:0;padding:0!important;min-height:48px;overflow:hidden;-webkit-tap-highlight-color:transparent}.qp .r.cb:not(.has) {grid-template-columns:minmax(0,1fr)}"+
".qp .r.cb b{display:flex;align-items:center;min-height:48px;padding:10px 12px;border:0;border-radius:10px 0 0 10px;background:transparent;margin:0}.qp .r.cb[aria-pressed=true] b{border:0}"+
".qp .r.cb .more{width:52px;min-height:48px;margin:0;padding:0;display:flex;align-items:center;justify-content:center;border:0;border-left:1.5px solid var(--line);border-radius:0 10px 10px 0;background:var(--soft);color:var(--accent)}.qp .r.cb .more::before{content:'\\25BE'}.qp .r.cb.open .more::before{content:'\\25B4'}"+
".qp .r.cb .md{grid-column:1/-1;margin:0;padding:8px 12px 10px;border-top:1px solid var(--line)}.qp .r.cb[aria-pressed=true]::before{left:12px;top:13px}.qp .r.cb[aria-pressed=true] b{padding-left:34px}"+
"@media (min-width:520px){.qp .r.cb,.qp .r.cb.pick{padding:0!important}.qp .r.cb b{min-height:52px}.qp .r.cb .more{min-height:52px}.qp .r.cb[aria-pressed=true]::before{top:15px}}"+
/* Top bar and always-open note (Jeff iqp20): Back at top left, dots in the middle, Got it / Next / Send at top right; the note box sits open under every screen, saves as he types, takes a pasted screenshot. */
".qp .top{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;height:48px}.qp .top .bk{justify-self:start}.qp .top .nx{justify-self:end}"+
".qp .top button{font:inherit;font-weight:600;height:44px;padding:0 16px;border-radius:11px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;white-space:nowrap;touch-action:manipulation}.qp .top .nx{background:var(--accent)!important;border-color:var(--accent);color:var(--ai)!important}.qp .top .nx.fin{background:var(--fin)!important;border-color:var(--fin);color:var(--fini)!important;font-weight:700}"+
".qp .note{flex:none;margin-top:10px;display:flex;flex-direction:column;gap:4px}.qp .note textarea{width:100%;height:62px;font:inherit;color:var(--ink);background:var(--bg);border:1.5px solid var(--line);border-radius:11px;padding:8px 12px;resize:none;line-height:1.35}.qp .note textarea:focus{border-color:var(--accent);outline:none}.qp .note textarea::placeholder{color:var(--muted)}"+
".qp .nrow{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:30px}.qp .nst{color:var(--muted);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qp .nrow .at{font:inherit;height:30px;padding:0 10px;border-radius:8px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}.qp .nrow .at.has{border-color:var(--accent);color:var(--accent)}"+
"@media (min-width:520px){.qp .note textarea{height:70px}}"+
/* Jeff iqp21: a wrapped label hangs under its first word, not under the emoji; every dropdown arrow sits at the right end, points left when closed and down when open. */
".qp .hi,.qp .r.cb b.hi{display:flex;align-items:flex-start;gap:8px;min-width:0}.qp .hi .em{flex:none}.qp .hi .tx{flex:1;min-width:0}.qp .ct.list>.ex .s>span.t.hi{white-space:normal}.qp .ct.list>.ex .s>span.t.hi .tx{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qp .ct.list>.ex.open .s>span.t.hi .tx{white-space:normal}"+
".qp .ex .s::before{content:none!important}.qp .ex .s::after{content:'\\25C2';color:var(--accent);margin-left:auto;flex:none;padding-left:8px}.qp .ex.open .s::after{content:'\\25BE'}.qp .ex.td .s::after{content:'\\25C2'}.qp .ex.td.open .s::after{content:'\\25BE'}.qp .ex .m .ex .s{display:flex;align-items:center;white-space:normal}"+
".qp .r.cb .more::before{content:'\\25C2'}.qp .r.cb.open .more::before{content:'\\25BE'}@media (hover:hover){.qp .r.cb b:hover{background:var(--chosen)}.qp .r.cb .more:hover{background:var(--chosen)}}"+
".qp .ex .m>.sep{border-top:1px solid var(--line);margin-top:8px;padding-top:8px}.qp .ex .m>p.sep{margin-top:8px}"+
".qp.drop{outline:3px dashed var(--accent);outline-offset:-3px}.qp.drop .note textarea{background:var(--chosen)}"+
".qp .r.cb,.qp .r.cb.pick{grid-template-columns:minmax(0,1fr) 56px;align-items:start}.qp .r.cb:not(.has){grid-template-columns:minmax(0,1fr)}"+
".qp .r.cb .more{width:40px;height:40px;min-height:0;margin:4px 8px 4px 0;align-self:center;border:1.5px solid var(--line);border-radius:10px;background:var(--soft);font-size:22px;line-height:1}.qp .r.cb.open .more{background:var(--chosen);border-color:var(--accent)}"+
".qp .r.cb b{border-radius:10px}.qp .r.pick{border-style:solid!important}@media (min-width:520px){.qp .r.cb .more{width:44px;height:44px;min-height:0;margin:4px 8px 4px 0}}";
var DN=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],SEP="; ",MAXSHOTS=10;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var EMO=/^([\p{Extended_Pictographic}\p{Emoji_Component}️‍⃣\d]+)\s+(\S[\s\S]*)$/u;
function lbl(t,c){var e=el(c?"span":"b",c),m=null;try{m=EMO.exec(t||"")}catch(x){}if(m&&/[\p{Extended_Pictographic}⃣]/u.test(m[1])){e.classList.add("hi");e.append(el("span","em",m[1]),el("span","tx",m[2]))}else e.textContent=t||"";return e}
function fmt(d){return DN[d.getDay()]+" "+(d.getMonth()+1)+"/"+d.getDate()}
function syncCopy(text){var ok=false;try{var t=document.createElement("textarea");t.value=text;t.style.position="absolute";t.style.opacity="0";document.body.appendChild(t);t.select();ok=document.execCommand("copy");t.remove()}catch(e){}if(!ok){try{navigator.clipboard.writeText(text);ok=true}catch(e){}}return ok}
function mount(R){
 if(!document.getElementById("qp-css")){var st=el("style");st.id="qp-css";st.textContent=CSS;document.head.appendChild(st)}
 var host=document.getElementById(R.root||"qp-root");
 var qp=el("div","qp"),dotsEl=el("div","dots"),card=el("div","card"),hd=el("div","hd"),tag=el("span","tag"),ttl=el("h1"),ct=el("div","ct");
 var top=el("div","top"),back=el("button","bk","‹ Back"),next=el("button","nx","Next");back.type=next.type="button";top.append(back,dotsEl,next);
 var nb=el("div","note"),ta=el("textarea"),nrow=el("div","nrow"),nst=el("span","nst"),pa=el("button","at","📎");pa.type="button";ta.setAttribute("aria-label","Note");ta.placeholder="Note or paste a screenshot. Saves as you type.";nrow.append(nst,pa);nb.append(ta,nrow);
 hd.append(tag,ttl);card.append(hd,ct,nb);
 var pick=el("input");pick.type="file";pick.multiple=true;pick.accept="image/*";var stash=el("div","stash");stash.appendChild(pick);card.appendChild(stash);
 qp.append(top,card);host.appendChild(qp);
 var Q=[],A={},ORD={},shots=[],log=[],i=0,summary=false,editing=false,sent=false,advT=null;
 function dark(){var m=document.documentElement.getAttribute("data-mode");return m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)}
 function theme(){var t=THEMES[R.theme]||THEMES.navy,d=dark(),v=d?t.d:t.l,ks=["accent","chosen","bg","card","line"];ks.forEach(function(k,j){qp.style.setProperty("--"+k,v[j])});
  var x=d?{ink:"#eceae6",muted:"#a2a5aa",ai:"#16181b",fin:"#ffffff",fini:"#0b0b0b",soft:"#20252f"}:{ink:"#1f2328",muted:"#6a6e73",ai:"#ffffff",fin:"#0b0b0b",fini:"#ffffff",soft:"#f5f7fa"};Object.keys(x).forEach(function(k){qp.style.setProperty("--"+k,x[k])})}
 var H=780;try{if(innerWidth<520){var sh=(screen&&screen.availHeight)||800;H=Math.round(Math.max(520,Math.min(660,(sh-230)*0.85)))}}catch(e){}qp.style.height=H+"px";
 function exRow(s,m,cls){var d=el("div","ex"+(cls?" "+cls:"")),body=el("div","m");if(Array.isArray(m)){var pk=null;m.forEach(function(x){var kd=x.c!=null?"c":x.s!=null?"s":"p",r=mkRow(x);if(pk&&kd!==pk)r.classList.add("sep");pk=kd;body.appendChild(r)})}else body.textContent=m||"";var sd=el("div","s");sd.appendChild(lbl(s,"t"));d.append(sd,body);
  d.onclick=function(e){e.stopPropagation();if(e.target&&e.target.closest&&e.target.closest(".cp"))return;var was=d.classList.contains("open");var sib=d.parentNode?d.parentNode.children:[];[].forEach.call(sib,function(o){if(o!==d&&o.classList&&o.classList.contains("ex"))o.classList.remove("open")});if(!was)d.classList.add("open");else d.classList.remove("open");if(!ct.classList.contains("list"))ct.classList.toggle("scroll",!!ct.querySelector(".ex.open"));if(!was)try{var par=d.parentNode&&d.parentNode.closest?d.parentNode.closest(".ex"):null,tg=par||d,tr=tg.getBoundingClientRect(),cr=ct.getBoundingClientRect();if(tr.top<cr.top||tr.bottom>cr.bottom)ct.scrollTop+=tr.top-cr.top}catch(e2){}};return d}
 function go(u){try{if(typeof openLink==="function"){openLink(u);return}}catch(e){}try{window.open(u,"_blank","noopener")}catch(e){}}
 function cpRow(c){var url=/^https?:\/\/\S+$/.test((c.text||"").trim()),lb=url?"Copy & open":"Copy",w=el("div","cp"),pre=el("pre",null,c.text),b=el("button",null,lb);b.type="button";b.onclick=function(){var ok=syncCopy(c.text);if(url)go(c.text.trim());b.textContent=ok?(url?"Opened ✓":"Copied ✓"):"⌘C";setTimeout(function(){b.textContent=lb},1800)};w.append(pre,b);return w}
 function mkRow(x){if(x.c!=null)return cpRow(typeof x.c==="string"?{text:x.c}:x.c);if(x.s!=null)return exRow(x.s,x.m);return el("p",null,x.p)}
 function fill(lead,rows){ct.className="ct";ct.innerHTML="";if(lead)ct.appendChild(el("p","lead",lead));rows.forEach(function(x){ct.appendChild(mkRow(x))});return ct.scrollHeight<=ct.clientHeight+1}
 function expand(){var out=[];R.screens.forEach(function(q){if((q.kind==="report"||q.kind==="todo")&&q.rows&&q.rows.length>8){for(var k=0;k<q.rows.length;k+=8)out.push(Object.assign({},q,{id:k?q.id+"-p"+(k/8+1):q.id,rows:q.rows.slice(k,k+8)}));return}if(q.kind!=="info"||!q.rows){out.push(q);return}
  var pages=[],cur=[];q.rows.forEach(function(x){if(fill(q.lead,cur.concat([x])))cur.push(x);else{if(cur.length)pages.push(cur);cur=[x]}});pages.push(cur);
  if(pages.length===1)out.push(q);else pages.forEach(function(pg,k){out.push(Object.assign({},q,{id:k===pages.length-1?q.id:q.id+"-p"+(k+1),text:q.text+" · "+(k+1)+"/"+pages.length,rows:pg}))})});return out}
 function isAns(q){if(q.kind==="shot"&&shots.length)return true;var a=A[q.id];return!!(a&&(a.choice||(a.note||"").trim()))}
 function isLast(){return i===Q.length-1} function firstOpen(){for(var k=0;k<Q.length;k++)if(!isAns(Q[k]))return k;return Q.length}
 function picksOf(a){return(a&&a.choice)?a.choice.split(SEP).filter(Boolean):[]}
 function setA(q,o){A[q.id]=Object.assign({},A[q.id],o)}
 function transcript(extra){var L=["answers in · "+R.round+" · v"+VERSION+" · "+H+"px",""];var hasShotQ=Q.some(function(q){return q.kind==="shot"});Q.forEach(function(q,k){var a=A[q.id]||{},note=(a.note||"").trim(),ans=a.choice;
  if(q.kind==="shot")ans=shots.length?shots.length+" screenshot(s) attached":"(none added)";
  else if((q.kind==="info"||q.kind==="report")&&!note)return;
  else if(q.kind==="step")ans=ans||"(not done)";
  else if(q.kind==="pair")ans=pairTextWith(q,a.sub||{});
  else if(q.kind==="todo")ans=todoText(q,a.sub||{});
  L.push((k+1)+". "+(q.text||(q.kind==="report"?"Report":q.kind==="todo"?"To do":q.kind==="pair"?"Quick ones":"Question")));L.push("Answer: "+(ans||"(skipped)"));if(note)L.push("Note: "+note);L.push("")});if(!hasShotQ&&shots.length)L.push("Screenshots: "+shots.length+" attached","");if(extra)L.push(extra);return L.join("\n").trim()}
 function dots(){if(typeof paBadge==="function")paBadge();dotsEl.innerHTML="";Q.forEach(function(q,k){var x=el("i","go");x.setAttribute("role","button");x.setAttribute("aria-label","Screen "+(k+1));if(!summary&&k===i)x.className="go cur";else if(isAns(q))x.className="go done";x.onclick=function(){summary=false;editing=false;i=k;render()};dotsEl.appendChild(x)})}
 function noteBtn(){var q=Q[i],v=q?((A[q.id]||{}).note||""):"";if(ta.value!==v)ta.value=v;paBadge()}
 function choose(q,label){var pd=(A[q.id]||{}).choice===label?"":label;setA(q,{choice:pd});var stay=editing||isLast();render();if(pd&&!stay){clearTimeout(advT);advT=setTimeout(function(){if(!summary&&Q[i]===q){i++;render()}},150)}if(pd&&editing){clearTimeout(advT);advT=setTimeout(function(){if(!summary&&Q[i]===q){summary=true;editing=false;render()}},150)}}
 function toggleMulti(q,label){var cur=picksOf(A[q.id]),nx=cur.indexOf(label)>=0?cur.filter(function(x){return x!==label}):q.options.map(function(x){return x.label}).filter(function(l){return l===label||cur.indexOf(l)>=0});setA(q,{choice:nx.join(SEP)});render()}
 function optRow(q,o,on){var b=el("div","r cb"+(o.pick&&!q.multi?" pick":""));b.setAttribute("role","button");b.tabIndex=0;b.setAttribute("aria-pressed",on?"true":"false");b.appendChild(lbl(o.label));if(o.detail)b.appendChild(el("span","dt",o.detail));if(o.pick&&!q.multi)b.appendChild(el("span","pk","Claude's pick"));var md=o.more||(o.pick&&!q.multi&&q.why?"Why my pick: "+q.why:"");if(md){var m=el("span","more",""),d=el("span","md",md);m.setAttribute("role","button");m.setAttribute("aria-label","Details");b.classList.add("has");m.onclick=function(e){e.stopPropagation();b.classList.toggle("open")};b.append(m,d)}return b}
 function decide(q,a){var pk=picksOf(a);q.options.forEach(function(o){var on=q.multi?pk.indexOf(o.label)>=0:a.choice===o.label,b=optRow(q,o,on);b.onclick=function(){q.multi?toggleMulti(q,o.label):choose(q,o.label)};ct.appendChild(b)});

}
 function rank(q){var cur=(ORD[q.id]=ORD[q.id]||[]);q.items.forEach(function(it){var n=cur.indexOf(it),b=el("button","r nock");b.type="button";b.setAttribute("aria-pressed",n>=0?"true":"false");b.append(el("span","badge"+(n>=0?" on":""),n>=0?String(n+1):""),el("b",null,it));
  b.onclick=function(){var k=cur.indexOf(it);if(k>=0)cur.splice(k,1);else cur.push(it);setA(q,{choice:cur.length?cur.map(function(x,j){return(j+1)+". "+x}).join(" > ")+(cur.length<q.items.length?" (partial)":""):""});render()};ct.appendChild(b)});
}
 function drag(q){var ord=(ORD[q.id]=ORD[q.id]||q.items.slice()),rows=[];ord.forEach(function(it,k){var r=el("div","r dg");r.append(el("span","num",String(k+1)),el("b",null,it),el("span","hdl","☰"));rows.push(r);ct.appendChild(r);
  var y0=0,dy=0,h=0,on=false;
  r.addEventListener("pointerdown",function(e){on=true;y0=e.clientY;dy=0;h=r.offsetHeight+8;try{r.setPointerCapture(e.pointerId)}catch(x){}r.classList.add("lift")});
  r.addEventListener("pointermove",function(e){if(!on)return;dy=e.clientY-y0;r.style.transform="translateY("+dy+"px)";var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));rows.forEach(function(o,j){if(o===r)return;var s=0;if(k<to&&j>k&&j<=to)s=-h;if(k>to&&j<k&&j>=to)s=h;o.style.transform=s?"translateY("+s+"px)":""})});
  function end(){if(!on)return;on=false;var to=Math.max(0,Math.min(ord.length-1,k+Math.round(dy/h)));if(to!==k){var m=ord.splice(k,1)[0];ord.splice(to,0,m);setA(q,{choice:ord.map(function(x,j){return(j+1)+". "+x}).join(" > ")})}render()}
  r.addEventListener("pointerup",end);r.addEventListener("pointercancel",end)});
}
 function scale(q,a){var g=el("div","grid5");[1,2,3,4,5].forEach(function(n){var v=n+" of 5",b=el("button","r big nock",String(n));b.type="button";b.setAttribute("aria-pressed",a.choice===v?"true":"false");b.onclick=function(){choose(q,v)};g.appendChild(b)});
  var e=el("p","ends");e.append(el("span",null,"1 · "+((q.ends||[])[0]||"")),el("span",null,((q.ends||[])[1]||"")+" · 5"));ct.append(g,e)}
 var CALM={},MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
 function dval(d,t){return fmt(d)+(d.getFullYear()!==t.getFullYear()?"/"+d.getFullYear():"")}
 function datePick(q,a){var t=new Date();t.setHours(0,0,0,0);if(CALM[q.id])return calGrid(q,a,t);
  var t1=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),sat=new Date(t.getFullYear(),t.getMonth(),t.getDate()+((6-t.getDay()+7)%7||7));
  var g=el("div","grid2"),quick=[];[["Today",t],["Tomorrow",t1],["Saturday",sat]].forEach(function(x){var v=dval(x[1],t),b=el("button","r nock qd");b.type="button";quick.push(v);b.append(el("b",null,x[0]),el("span","dt",v));b.setAttribute("aria-pressed",a.choice===v?"true":"false");b.onclick=function(){choose(q,v)};g.appendChild(b)});
  var other=a.choice&&a.choice!=="Skip"&&quick.indexOf(a.choice)<0,c=el("button","r nock qd cal");c.type="button";c.append(el("b",null,"📅 Other day"),el("span","dt",other?a.choice:"Opens a calendar"));c.setAttribute("aria-pressed",other?"true":"false");
  c.onclick=function(){CALM[q.id]={y:t.getFullYear(),m:t.getMonth()};render()};g.appendChild(c);
  ct.appendChild(g)}
 function calGrid(q,a,t){var s=CALM[q.id];ct.innerHTML="";var hd=el("div","calhd"),pv=el("button","r nock","‹"),nx=el("button","r nock","›"),x=el("button","r nock","✕ Quick picks");[pv,nx,x].forEach(function(b){b.type="button"});
  pv.setAttribute("aria-label","Previous month");nx.setAttribute("aria-label","Next month");
  var idx=s.y*12+s.m,base=t.getFullYear()*12+t.getMonth();pv.disabled=idx<=base;nx.disabled=idx>=base+12;if(pv.disabled)pv.style.opacity=".35";if(nx.disabled)nx.style.opacity=".35";
  pv.onclick=function(){if(pv.disabled)return;s.m--;if(s.m<0){s.m=11;s.y--}render()};nx.onclick=function(){if(nx.disabled)return;s.m++;if(s.m>11){s.m=0;s.y++}render()};x.onclick=function(){delete CALM[q.id];render()};
  hd.append(pv,el("b",null,MN[s.m]+" "+s.y),nx,x);var g=el("div","calg");DN.forEach(function(d){g.appendChild(el("span","dow",d.slice(0,2)))});
  var pad=new Date(s.y,s.m,1).getDay(),n=new Date(s.y,s.m+1,0).getDate();for(var k=0;k<pad;k++)g.appendChild(el("span"));
  for(var d=1;d<=n;d++)(function(dd){var v=dval(dd,t),b=el("button","cd"+(dd.getTime()===t.getTime()?" today":dd<t?" past":""),String(dd.getDate()));b.type="button";b.setAttribute("aria-label",v);b.setAttribute("aria-pressed",a.choice===v?"true":"false");b.onclick=function(){delete CALM[q.id];choose(q,v)};g.appendChild(b)})(new Date(s.y,s.m,d));
  ct.append(hd,g)}
 function addFiles(list,how){var imgs=[].slice.call(list||[]).filter(function(f){return f&&f.type&&f.type.indexOf("image/")===0});if(!imgs.length){log.push(how+": no image");return}
  var room=MAXSHOTS-shots.length;if(room<=0){log.push(how+": over "+MAXSHOTS);return}imgs=imgs.slice(0,room);imgs.forEach(function(f,k){shots.push(f.name&&f.name!=="image.png"?f:new File([f],"screenshot-"+Date.now()+"-"+k+".png",{type:f.type}))});log.push(how+" +"+imgs.length)}
 function shotUI(host,isMini){var pz=el("div","paste");pz.contentEditable="true";pz.tabIndex=0;pz.setAttribute("aria-label","Paste a screenshot here");
  var tb=el("div","thumbs"),st=el("p","tiny"),ch=el("button","r");ch.type="button";ch.append(el("b",null,"📎 Choose a file"),el("span","dt","Or drop one on the dashed box"));
  function show(){pz.innerHTML="";pz.appendChild(el("span",null,shots.length>=MAXSHOTS?"That's 10, the most one Send can take":(shots.length?"Paste again to add another":"Click here, then press ⌘V")));tb.innerHTML="";
   shots.slice(0,4).forEach(function(f,k){var t=el("div","th"),im=document.createElement("img");try{im.src=URL.createObjectURL(f)}catch(e){}var x=el("button",null,"×");x.type="button";x.setAttribute("aria-label","Remove screenshot "+(k+1));x.onclick=function(e){e.stopPropagation();e.preventDefault();shots.splice(k,1);log.push("removed 1");show();dots()};t.append(im,x);tb.appendChild(t)});
   if(shots.length>4)tb.appendChild(el("div","th more","+"+(shots.length-4)));if(!shots.length)tb.appendChild(el("div","th empty"));
   st.textContent=shots.length?"📎 "+shots.length+" screenshot"+(shots.length>1?"s":"")+" will go with your answers":"Nothing pasted yet";st.className="tiny"+(shots.length?" ok":"")}
  pz.addEventListener("paste",function(e){e.preventDefault();var cd=e.clipboardData,files=[];try{files=cd.files&&cd.files.length?[].slice.call(cd.files):[].slice.call(cd.items||[]).filter(function(x){return x.kind==="file"}).map(function(x){return x.getAsFile()}).filter(Boolean)}catch(err){log.push("paste blocked")}if(files.length)addFiles(files,"pasted");else log.push("paste: no image");show();dots()});
  pz.addEventListener("dragover",function(e){e.preventDefault()});pz.addEventListener("drop",function(e){e.preventDefault();addFiles(e.dataTransfer.files,"dropped");show();dots()});pz.addEventListener("input",show);
  ch.onclick=function(){pick.click()};pick.onchange=function(){addFiles(pick.files,"chosen");pick.value="";show();dots()};
  if(isMini)host.append(pz,tb,st);else host.append(pz,tb,st,ch);show();setTimeout(function(){try{pz.focus()}catch(e){}},50);return show}
 function shot(q){shotUI(ct,false)}
 function todo(q,a){var s=a.sub||{};ct.className="ct list";ct.innerHTML="";q.rows.forEach(function(x,k){var id=x.id||String(k),d=exRow(x.s,x.m,"td"+(s[id]?" done":""));var box=el("span","box",s[id]?"✓":"");box.setAttribute("role","checkbox");box.setAttribute("aria-checked",s[id]?"true":"false");box.onclick=function(e){e.stopPropagation();var n=Object.assign({},(A[q.id]||{}).sub||{});if(n[id])delete n[id];else n[id]=1;var c=Object.keys(n).length;setA(q,{sub:n,choice:c?todoText(q,n):""});render();if(c===q.rows.length&&!isLast()&&!editing){clearTimeout(advT);advT=setTimeout(function(){if(!summary&&Q[i]===q){i++;render()}},250)}};d.querySelector(".s").prepend(box);ct.appendChild(d)})}
 function todoText(q,s){return q.rows.map(function(x,k){var id=x.id||String(k);return x.s+": "+(s[id]?"done":"not done")}).join("; ")}
 function pair(q,a){var s=a.sub||{};q.items.forEach(function(it){var r=el("div","pr"),sg=el("div","sg");r.appendChild(el("b",null,it.text));[it.a,it.b].forEach(function(v){var b=el("button",null,v);b.type="button";if(it.pick===v)b.className="pick";b.setAttribute("aria-pressed",s[it.id]===v?"true":"false");
   b.onclick=function(){var n=Object.assign({},(A[q.id]||{}).sub||{});if(n[it.id]===v)delete n[it.id];else n[it.id]=v;var any=Object.keys(n).length;setA(q,{sub:n,choice:any?pairTextWith(q,n):""});render()};sg.appendChild(b)});r.appendChild(sg);ct.appendChild(r)});
}
 function pairTextWith(q,s){return q.items.map(function(it){return it.text+": "+(s[it.id]||"(skipped)")}).join("; ")}
 function render(){theme();
  if(summary||i>=Q.length){summary=true;dots();return renderSummary()}
  dots();var q=Q[i],a=A[q.id]||{},info=q.kind==="info"||q.kind==="report",last=isLast();tag.textContent=q.pill||"";ttl.textContent=q.text||"";card.className="card"+(q.kind==="report"?" rep":"");
  if(q.kind==="report"){ct.className="ct list";ct.innerHTML="";(q.rows||[]).forEach(function(x){ct.appendChild(mkRow(x))})}
  else if(info)fill(q.lead,q.rows||[]);
  else{ct.className="ct scroll";ct.innerHTML="";if(q.lead)ct.appendChild(el("p","lead",q.lead));
   (q.rows||[]).forEach(function(x){ct.appendChild(mkRow(x))});
   ({decide:decide,do:decide,rank:rank,drag:drag,scale:scale,date:datePick,shot:shot,pair:pair,todo:todo}[q.kind]||decide)(q,a)}
  noteBtn();
  if(last){next.className="nx fin";next.textContent=sent?"Send again ↗":"Send ↗"}else{next.className="nx";next.textContent=q.kind==="step"?"Done ›":info?"Got it ›":"Next ›"}}
 function renderSummary(){card.className="card";tag.textContent="📤 Review";ttl.textContent=sent?"Sent ✓":"Your answers";ct.className="ct scroll";ct.innerHTML="";
  ct.appendChild(el("p","lead",(shots.length?"📎 "+shots.length+" screenshot"+(shots.length>1?"s":"")+" go with your answers. ":"")+"Tap a row to change it."));
  Q.forEach(function(q,k){var a=A[q.id]||{},note=(a.note||"").trim();if((q.kind==="info"||q.kind==="report")&&!note)return;var ans=q.kind==="shot"?(shots.length?"📎 "+shots.length+" added":"none added"):(a.choice||(q.kind==="step"?"Not done":"Skipped"));
   var b=el("button","r");b.type="button";b.append(el("b",null,q.text||(q.kind==="todo"?"To do":"Question")),el("span","dt",ans+(note?" · "+note:"")));b.onclick=function(){summary=false;editing=true;i=k;render()};ct.appendChild(b)});
  next.className="nx fin";next.textContent=sent?"Send again ↗":"Send ↗"}
 function plain(t){try{sendPrompt(t)}catch(e){syncCopy(t)}}
 function send(){sent=true;render();if(log.length)log=log.slice(-12);
  if(!shots.length){plain(transcript());return}
  var form=document.querySelector("form.elicit"),fin=form&&form.querySelector("input[type=file]");
  if(!form||!fin){plain(transcript("(screenshots not sent: send form missing)"));return}
  try{var dt=new DataTransfer();shots.forEach(function(f){dt.items.add(f)});fin.files=dt.files;fin.dispatchEvent(new Event("change",{bubbles:true}))}catch(e){plain(transcript("(screenshots not sent: "+(e&&e.message||e)+")"));return}
  setTimeout(function(){var f2=document.querySelector("form.elicit")||form,ans=f2.querySelector("[data-name=answers]"),sub=f2.querySelector(".elicit-submit");
   if(!sub){plain(transcript("(screenshots not sent: no submit)"));return}
   if(!ans){ans=el("textarea","elicit-textarea");ans.setAttribute("data-name","answers");ans.style.display="none";(f2.querySelector(".elicit-group")||f2).appendChild(ans)}
   ans.value=transcript();ans.dispatchEvent(new Event("input",{bubbles:true}));sub.click()},400)}
 back.onclick=function(){if(summary){summary=false;editing=false;i=Q.length-1}else if(i>0)i--;render()};
 function mark(q){if(q.kind==="info"||q.kind==="report")setA(q,{choice:"Got it"});if(q.kind==="step")setA(q,{choice:"Done"});
  if(q.kind==="drag"&&!(A[q.id]||{}).choice)setA(q,{choice:"kept: "+(ORD[q.id]||q.items).join(" > ")})}
 next.onclick=function(){if(summary){send();return}var q=Q[i];mark(q);
  if(isLast()){send();return}if(editing){summary=true;editing=false}else i++;render()};
 function paBadge(){nst.textContent=shots.length?"📎 "+shots.length+" screenshot"+(shots.length>1?"s":"")+" go with your Send":"";pa.textContent="📎"+(shots.length?" "+shots.length:"");pa.className="at"+(shots.length?" has":"")}
 ta.oninput=function(){if(summary||!Q[i])return;setA(Q[i],{note:ta.value});dots()};
 ta.addEventListener("paste",function(e){var cd=e.clipboardData,files=[];try{files=cd.files&&cd.files.length?[].slice.call(cd.files):[].slice.call(cd.items||[]).filter(function(x){return x.kind==="file"}).map(function(x){return x.getAsFile()}).filter(Boolean)}catch(err){}if(files.length){e.preventDefault();addFiles(files,"pasted");paBadge();dots()}});
 pa.onclick=function(){pick.click()};pick.onchange=function(){addFiles(pick.files,"chosen");pick.value="";paBadge();dots()};
 ["dragenter","dragover"].forEach(function(ev){qp.addEventListener(ev,function(e){e.preventDefault();qp.classList.add("drop")})});qp.addEventListener("dragleave",function(e){if(!qp.contains(e.relatedTarget))qp.classList.remove("drop")});
 qp.addEventListener("drop",function(e){e.preventDefault();qp.classList.remove("drop");var fs=e.dataTransfer&&e.dataTransfer.files;if(fs&&fs.length){addFiles(fs,"dropped");paBadge();dots()}});
 document.addEventListener("keydown",function(e){var t=e.target;if(t&&(t.tagName==="TEXTAREA"||t.tagName==="INPUT"||t.isContentEditable))return;if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key==="Enter"||e.key==="ArrowRight"){e.preventDefault();if(!summary&&isLast())return;next.click()}else if(e.key==="ArrowLeft"){e.preventDefault();back.click()}});
 try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",theme)}catch(e){}
 var started=false;function start(){if(started)return;started=true;theme();Q=expand();i=firstOpen();render()}
 try{document.fonts.ready.then(function(){requestAnimationFrame(start)})}catch(e){}setTimeout(start,1500);
}
window.QP={mount:mount,version:VERSION};
})();

