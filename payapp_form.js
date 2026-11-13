/* ---------- subcontractor pay application form ----------
   One form, two places: the public link a sub opens (payapp.html) and "Fill in for the sub" inside the app.
   model: {gcName, gcAddress, gcPhone, project, appNo, periodTo, due, note, returnNote, status, retPct, editItems,
           lines:[{id,desc,value,prev,relPrev}], prevCert, sub:{name,trade}, submission}
   opts:  {onSubmit: async payload => void, draftKey, inApp, onCancel} */
(function(){
"use strict";
const PA_CSS=`
.pa{font-family:var(--body,system-ui,-apple-system,"Segoe UI",sans-serif);color:var(--ink,#0D1B2E);display:flex;flex-direction:column;gap:16px;max-width:980px;margin:0 auto}
.pa *{box-sizing:border-box}
.pa .pa-card{background:var(--surface,#fff);border:1px solid var(--line,#DDE4EE);border-radius:14px;padding:18px 20px}
.pa h1{font-size:22px;line-height:1.25;margin:0}
.pa h2{font-size:16px;margin:0 0 4px}
.pa p{margin:0;line-height:1.5}
.pa .pa-muted{color:var(--muted,#56657C);font-size:14px}
.pa .pa-kick{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--muted,#56657C)}
.pa .pa-head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start}
.pa .pa-gc{text-align:right}
.pa .pa-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 18px;margin-top:14px}
.pa .pa-facts div{display:flex;flex-direction:column;gap:2px;min-width:0}
.pa .pa-facts span{font-size:12px;color:var(--muted,#56657C)}
.pa .pa-facts b{font-size:14.5px;overflow-wrap:anywhere}
.pa .pa-msg{background:var(--accent-soft,#E6EEFC);border-radius:10px;padding:10px 12px;font-size:14px;margin-top:12px;white-space:pre-wrap}
.pa .pa-msg.warn{background:#FFF4DB;color:#6B4A00}
.pa .pa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;margin-top:10px}
.pa label.pa-f{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:var(--muted,#56657C)}
.pa input,.pa textarea{font:inherit;font-size:15px;font-weight:400;color:var(--ink,#0D1B2E);background:var(--surface,#fff);border:1px solid var(--line,#CBD3E0);border-radius:9px;padding:9px 11px;min-height:40px;width:100%;min-width:0}
.pa input:focus,.pa textarea:focus{outline:2px solid var(--accent,#1F5FD6);outline-offset:1px}
.pa input.num{text-align:right;font-variant-numeric:tabular-nums}
.pa input[aria-invalid="true"]{border-color:#C0262D;background:#FFF5F5}
.pa .pa-tbl{width:100%;border-collapse:collapse;font-size:14px}
.pa .pa-tbl th{font-size:11.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--muted,#56657C);text-align:left;padding:8px 6px;border-bottom:1px solid var(--line,#DDE4EE);vertical-align:bottom}
.pa .pa-tbl td{padding:8px 6px;border-bottom:1px solid var(--line,#DDE4EE);vertical-align:middle}
.pa .pa-tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pa .pa-tbl td.n input{max-width:130px;margin-left:auto;display:block}
.pa .pa-tbl td.pc input{max-width:84px}
.pa .pa-tbl tfoot td{font-weight:700;border-bottom:0}
.pa .pa-small{display:block;font-size:12px;color:var(--muted,#56657C);font-weight:400}
.pa .pa-x{border:1px solid var(--line,#DDE4EE);background:var(--surface,#fff);color:var(--muted,#56657C);border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:16px}
.pa .pa-btn{font:inherit;font-size:15px;font-weight:700;border-radius:10px;padding:10px 16px;border:1px solid var(--line,#CBD3E0);background:var(--surface,#fff);color:var(--ink,#0D1B2E);cursor:pointer;min-height:44px}
.pa .pa-btn.primary{background:var(--accent,#1F5FD6);border-color:var(--accent,#1F5FD6);color:#fff}
.pa .pa-btn:disabled{opacity:.6;cursor:default}
.pa .pa-acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}
.pa .pa-tot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 18px;max-width:460px;margin-left:auto;font-size:14.5px}
.pa .pa-tot b{text-align:right;font-variant-numeric:tabular-nums}
.pa .pa-tot .due{font-size:17px;padding-top:8px;border-top:2px solid var(--ink,#0D1B2E)}
.pa .pa-err{color:#C0262D;font-size:14px;font-weight:600}
.pa .pa-err:empty{display:none}
.pa .pa-ok{display:flex;gap:12px;align-items:flex-start}
.pa .pa-ok .ic{flex:none;width:34px;height:34px;border-radius:50%;background:#1E8E4E;color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px}
@media (max-width:720px){
  .pa .pa-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pa .pa-gc{text-align:left}
  .pa .pa-grid{grid-template-columns:minmax(0,1fr)}
  .pa .pa-tbl thead{display:none}
  .pa .pa-tbl,.pa .pa-tbl tbody,.pa .pa-tbl tr,.pa .pa-tbl td{display:block;width:100%}
  .pa .pa-tbl tbody tr{border:1px solid var(--line,#DDE4EE);border-radius:12px;padding:8px 10px;margin-bottom:10px}
  .pa .pa-tbl td{border:0;padding:5px 0;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .pa .pa-tbl td[data-l]::before{content:attr(data-l);font-size:12.5px;color:var(--muted,#56657C);font-weight:600;text-align:left}
  .pa .pa-tbl td.d{display:block}
  .pa .pa-tbl td.n input,.pa .pa-tbl td.pc input{max-width:150px}
  .pa .pa-tbl tfoot{display:none}
}
@media print{ .pa .pa-acts,.pa .pa-x{display:none} .pa .pa-card{border:0;padding:0} }
`;
function el(tag, attrs, ...kids){
  const e=document.createElement(tag);
  if(attrs) for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="text") e.textContent=v; else if(k==="class") e.className=v; else if(k.startsWith("on") && typeof v==="function") e.addEventListener(k.slice(2),v); else e.setAttribute(k, v===true? "" : v); }
  for(const c of kids.flat()){ if(c==null||c===false) continue; e.append(c.nodeType? c : document.createTextNode(String(c))); }
  return e;
}
const num=v=>{ if(typeof v==="number") return isFinite(v)? v : 0; const n=Number(String(v==null?"":v).replace(/[$,\s%]/g,"")); return isFinite(n)? n : 0; };
const has=v=>v!=null && String(v).trim()!=="";
// cents, half away from zero (same as the app)
const r2=n=>{ const a=Math.round(Math.round(Math.abs(n)*10000)/100)/100; return n<0 && a? -a : a; };
const money=n=>{ n=r2(n); return (n<0?"−$":"$")+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); };
const amt=n=>r2(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const pcs=x=>{ const v=Math.round(x*100)/100; return String(v); };
const dUS=iso=>{ if(!iso) return ""; const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m? Number(m[2])+"/"+Number(m[3])+"/"+m[1] : iso; };
let uid=0; const lid=()=>"s"+Date.now().toString(36)+(uid++).toString(36);
const LSget=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, LSset=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} }, LSdel=k=>{ try{ localStorage.removeItem(k); }catch(e){} };

// the numbers, line by line, the same way the app's requisitions round them (each line to the cent, then add)
function calc(model, lines){
  const rate=num(model.retPct)/100; let V=0,P=0,W=0,G=0,R=0;
  const rows=lines.map(l=>{ const v=r2(num(l.value)), prev=r2(num(l.prev)), work=r2(num(l.work)), g=r2(prev+work), ret=r2(r2(g*rate)-num(l.relPrev));
    V+=v; P+=prev; W+=work; G+=g; R+=ret; return {v, prev, work, g, ret, bal:r2(v-g), pc: v? g/v*100 : 0, prevPc: v? prev/v*100 : 0}; });
  V=r2(V); P=r2(P); W=r2(W); G=r2(G); R=r2(R);
  const earned=r2(G-R), prevCert=r2(num(model.prevCert)), due=r2(earned-prevCert);
  return {rows, V, P, W, G, R, earned, prevCert, due, bal:r2(V-G), rate};
}

function mount(root, model, opts){
  opts=opts||{};
  if(!document.getElementById("paCss")){ const st=document.createElement("style"); st.id="paCss"; st.textContent=PA_CSS; document.head.append(st); }
  const open= model.status==="open" || model.status==="returned";
  const sub=model.submission||null;
  // starting values: a draft on this device, else what was sent before (returned for changes), else the approved lines
  let draft=null; if(open && opts.draftKey){ try{ draft=JSON.parse(LSget(opts.draftKey)||"null"); }catch(e){} }
  const src=draft || (sub && open? sub : null);
  const st={
    company: (src&&src.company) || (model.sub&&model.sub.name) || "",
    trade: (src&&src.trade) || (model.sub&&model.sub.trade) || "",
    filledBy: (src&&src.filledBy) || "", phone:(src&&src.phone)||"", email:(src&&src.email)||"", note:(src&&src.note)||"",
    lines: (model.lines||[]).map(l=>({id:l.id, desc:l.desc||"", value: has(l.value)? String(l.value) : "", prev:r2(num(l.prev)), relPrev:num(l.relPrev), work:"", pct:"", fixed:true}))
  };
  if(src && Array.isArray(src.lines)){
    const byId=new Map(st.lines.map(l=>[l.id,l]));
    if(model.editItems){ st.lines=src.lines.map(s=>{ const b=byId.get(s.id); return {id:s.id||lid(), desc:s.desc||"", value: has(s.value)? String(s.value) : "", prev: b? b.prev : 0, relPrev: b? b.relPrev : 0, work: has(s.work)? String(s.work) : "", pct: has(s.pct)? String(s.pct) : "", fixed: !!b}; });
      for(const b of byId.values()) if(!st.lines.some(l=>l.id===b.id)) st.lines.push(b); }
    else for(const s of src.lines){ const b=byId.get(s.id); if(b){ b.work= has(s.work)? String(s.work) : ""; b.pct= has(s.pct)? String(s.pct) : ""; } }
  }
  if(model.editItems && !st.lines.length) st.lines.push({id:lid(), desc:"", value:"", prev:0, relPrev:0, work:"", pct:"", fixed:false});
  const saveDraft=()=>{ if(opts.draftKey && open) LSset(opts.draftKey, JSON.stringify({company:st.company, trade:st.trade, filledBy:st.filledBy, phone:st.phone, email:st.email, note:st.note, lines:st.lines.map(l=>({id:l.id, desc:l.desc, value:l.value, work:l.work, pct:l.pct}))})); };

  const gc=model.gcName||"the general contractor";
  const facts=el("div",{class:"pa-facts"},
    ...[["Project",model.project],["Pay application #",String(model.appNo||"")],["Period to",dUS(model.periodTo)],[model.due? "Please submit by" : "Retainage", model.due? dUS(model.due) : (num(model.retPct)? pcs(num(model.retPct))+"%" : "None")]]
      .map(([k,v])=>el("div",null,el("span",{text:k}),el("b",{text:v||"—"}))));
  const head=el("section",{class:"pa-card"},
    el("div",{class:"pa-head"},
      el("div",null, el("span",{class:"pa-kick",text:"Pay application to "+gc}), el("h1",{text: open? "Fill in your work for this period" : "Pay application #"+(model.appNo||"")})),
      el("div",{class:"pa-muted pa-gc"}, el("b",{text:gc}), model.gcAddress? el("div",{text:model.gcAddress}) : null, model.gcPhone? el("div",{text:model.gcPhone}) : null)),
    facts,
    model.returnNote && open? el("div",{class:"pa-msg warn"}, el("b",{text:"Sent back for changes: "}), model.returnNote) : null,
    model.note? el("div",{class:"pa-msg",text:model.note}) : null);

  // closed: already submitted, approved or cancelled
  if(!open){
    const c= sub? calc(model, (model.lines||[]).map(l=>{ const s=(sub.lines||[]).find(x=>x.id===l.id)||{}; return {...l, work:s.work}; })) : null;
    const msg= model.status==="void"? "This pay application was cancelled by "+gc+"." :
      model.status==="approved"? "Approved by "+gc+". Thank you." : "Submitted to "+gc+(sub&&sub.at? " on "+dUS(String(sub.at).slice(0,10)) : "")+". They’ll review it and contact you if anything needs to change.";
    root.replaceChildren(el("div",{class:"pa"}, head, el("section",{class:"pa-card"}, el("div",{class:"pa-ok"}, el("span",{class:"ic",text: model.status==="void"? "!" : "✓"}), el("div",null, el("h2",{text: model.status==="void"? "Cancelled" : "Pay application received"}), el("p",{class:"pa-muted",text:msg}),
      model.status==="approved" && model.approvedDue!=null? el("p",{style:"margin-top:8px"}, "Approved payment: ", el("b",{text:money(num(model.approvedDue))}))
        : c? el("p",{style:"margin-top:8px"}, "Current payment due: ", el("b",{text:money(c.due)})) : null)))));
    return;
  }

  const err=el("p",{class:"pa-err",role:"alert"});
  const tbody=el("tbody"), tfoot=el("tfoot");
  const totBox=el("div",{class:"pa-tot"});
  const inp=(attrs,val,on)=>{ const i=el("input",attrs); i.value=val==null?"":val; i.addEventListener("input",()=>{ on(i.value); i.removeAttribute("aria-invalid"); saveDraft(); refresh(); }); return i; };
  const editItems=!!model.editItems;
  function drawRows(){
    tbody.replaceChildren();
    st.lines.forEach((l,i)=>{
      const lab=(l.desc||"line "+(i+1));
      const descCell= editItems? el("td",{class:"d","data-l":"Description"}, inp({id:"pa-d-"+l.id,placeholder:"e.g. Electrical rough-in","aria-label":"Description, line "+(i+1)}, l.desc, v=>{ l.desc=v; }))
        : el("td",{class:"d"}, el("b",{text:l.desc||"Line "+(i+1)}));
      const valCell= editItems? el("td",{class:"n","data-l":"Scheduled value ($)"}, inp({id:"pa-v-"+l.id,inputmode:"decimal",class:"num",placeholder:"0.00","aria-label":"Scheduled value, "+lab}, l.value, v=>{ l.value=v; syncFrom(l,"pct"); }))
        : el("td",{class:"n","data-l":"Scheduled value",text:amt(num(l.value))});
      const prevCell=el("td",{class:"n","data-l":"Billed before",id:"pa-p-"+l.id});
      const pcIn=inp({id:"pa-pc-"+l.id,inputmode:"decimal",class:"num",placeholder:"%","aria-label":"Percent complete to date, "+lab}, l.pct, v=>{ l.pct=v; syncFrom(l,"pct",true); });
      const wIn=inp({id:"pa-w-"+l.id,inputmode:"decimal",class:"num",placeholder:"0.00","aria-label":"This period in dollars, "+lab}, l.work, v=>{ l.work=v; syncFrom(l,"work",true); });
      tbody.append(el("tr",{id:"pa-r-"+l.id}, descCell, valCell, prevCell,
        el("td",{class:"n pc","data-l":"% complete to date"}, pcIn),
        el("td",{class:"n","data-l":"This period ($)"}, wIn),
        el("td",{class:"n","data-l":"Balance",id:"pa-b-"+l.id}),
        editItems? el("td",{class:"n"}, (!l.fixed || !l.prev)? el("button",{class:"pa-x",type:"button",title:"Remove line","aria-label":"Remove "+lab,text:"×",onclick:()=>{ st.lines.splice(i,1); if(!st.lines.length) st.lines.push({id:lid(), desc:"", value:"", prev:0, relPrev:0, work:"", pct:"", fixed:false}); saveDraft(); drawRows(); refresh(); }}) : null) : null));
    });
  }
  // % and $ are two ways to say the same thing; whichever was typed last wins
  function syncFrom(l, from, typed){
    const v=num(l.value);
    if(from==="pct"){ if(!has(l.pct)){ if(typed){ l.work=""; const w=document.getElementById("pa-w-"+l.id); if(w) w.value=""; } return; }
      const w=r2(v*num(l.pct)/100-l.prev); l.work= String(w); const wi=document.getElementById("pa-w-"+l.id); if(wi && document.activeElement!==wi) wi.value= w? amt(w) : "0.00"; }
    else { if(!has(l.work)){ l.pct=""; const p=document.getElementById("pa-pc-"+l.id); if(p && typed) p.value=""; return; }
      const pc= v? (l.prev+num(l.work))/v*100 : 0; l.pct=pcs(pc); const pi=document.getElementById("pa-pc-"+l.id); if(pi && document.activeElement!==pi) pi.value=l.pct; }
  }
  function refresh(){
    const c=calc(model, st.lines);
    st.lines.forEach((l,i)=>{ const x=c.rows[i];
      const p=document.getElementById("pa-p-"+l.id); if(p) p.replaceChildren(document.createTextNode(amt(x.prev)), el("span",{class:"pa-small",text:pcs(x.prevPc)+"%"}));
      const b=document.getElementById("pa-b-"+l.id); if(b) b.textContent=amt(x.bal); });
    tfoot.replaceChildren(el("tr",null, el("td",{text:"Totals"}), el("td",{class:"n",text:amt(c.V)}), el("td",{class:"n",text:amt(c.P)}), el("td",{class:"n",text: c.V? pcs(c.G/c.V*100)+"%" : ""}), el("td",{class:"n",text:amt(c.W)}), el("td",{class:"n",text:amt(c.bal)}), editItems? el("td") : null));
    totBox.replaceChildren(
      el("span",{text:"Contract sum"}), el("b",{text:money(c.V)}),
      el("span",{text:"Completed to date"}), el("b",{text:money(c.G)}),
      el("span",{text: c.rate? "Retainage ("+pcs(c.rate*100)+"%)" : "Retainage"}), el("b",{text: c.R? "−"+money(c.R) : money(0)}),
      el("span",{text:"Earned less retainage"}), el("b",{text:money(c.earned)}),
      el("span",{text:"Less previous payments"}), el("b",{text: c.prevCert? "−"+money(c.prevCert) : money(0)}),
      el("span",{class:"due",text:"Current payment due"}), el("b",{class:"due",id:"paDue",text:money(c.due)}));
    return c;
  }
  const fld=(label,id,val,set,attrs)=>el("label",{class:"pa-f",for:id}, label, inp(Object.assign({id},attrs||{}), val, set));
  const who=el("section",{class:"pa-card"},
    el("h2",{text:"Your company"}), el("p",{class:"pa-muted",text:"This goes in the header of your pay application."}),
    el("div",{class:"pa-grid"},
      fld("Company name","paCo",st.company,v=>{ st.company=v; },{autocomplete:"organization"}),
      fld("Title of work (your trade)","paTrade",st.trade,v=>{ st.trade=v; },{placeholder:"e.g. Electrical"}),
      fld("Your name (who is filling this out)","paBy",st.filledBy,v=>{ st.filledBy=v; },{autocomplete:"name"}),
      fld("Phone (optional)","paPh",st.phone,v=>{ st.phone=v; },{type:"tel",autocomplete:"tel"}),
      fld("Email (optional)","paEm",st.email,v=>{ st.email=v; },{type:"email",autocomplete:"email"})));
  const addBtn= editItems? el("button",{class:"pa-btn",type:"button",text:"+ Add line",onclick:()=>{ const n={id:lid(), desc:"", value:"", prev:0, relPrev:0, work:"", pct:"", fixed:false}; st.lines.push(n); saveDraft(); drawRows(); refresh(); setTimeout(()=>{ const e=document.getElementById("pa-d-"+n.id); if(e) e.focus(); },0); }}) : null;
  const work=el("section",{class:"pa-card"},
    el("h2",{text: editItems? "Your line items and work done" : "Work done to date"}),
    el("p",{class:"pa-muted",text: editItems? "List the items of your contract with their values (your schedule of values). For each item, enter the % complete to date or the $ amount for this period. After "+gc+" approves the items, your next pay applications will use the same items." : "For each item, enter the % complete to date, or the $ amount for this period. The other one fills in for you."}),
    el("div",{style:"overflow-x:auto;margin-top:10px"}, el("table",{class:"pa-tbl"},
      el("thead",null,el("tr",null, el("th",{text:"Description of work"}), el("th",{class:"n",text:"Scheduled value"}), el("th",{class:"n",text:"Billed before"}), el("th",{class:"n",text:"% complete to date"}), el("th",{class:"n",text:"This period ($)"}), el("th",{class:"n",text:"Balance"}), editItems? el("th") : null)),
      tbody, tfoot)),
    addBtn? el("div",{class:"pa-acts"}, addBtn) : null,
    el("div",{style:"margin-top:14px"}, totBox));
  const noteT=el("textarea",{id:"paNote",rows:"2",placeholder:"Anything "+gc+" should know (optional)"}); noteT.value=st.note; noteT.addEventListener("input",()=>{ st.note=noteT.value; saveDraft(); });
  const sendBtn=el("button",{class:"pa-btn primary",type:"button",id:"paSend",text: opts.inApp? "Submit for the sub" : "Submit pay application"});
  const fin=el("section",{class:"pa-card"}, el("label",{class:"pa-f",for:"paNote"},"Note",noteT), el("div",{class:"pa-acts"}, sendBtn, opts.onCancel? el("button",{class:"pa-btn",type:"button",text:"Cancel",onclick:opts.onCancel}) : null, err));

  sendBtn.addEventListener("click", async ()=>{
    err.textContent="";
    const bad=(id,msg)=>{ err.textContent=msg; const e=document.getElementById(id); if(e){ e.setAttribute("aria-invalid","true"); e.focus(); e.scrollIntoView({block:"center"}); } return true; };
    if(!st.company.trim()) return bad("paCo","Enter your company name.");
    if(!st.trade.trim()) return bad("paTrade","Enter the title of your work, e.g. Electrical.");
    if(!st.filledBy.trim()) return bad("paBy","Enter your name.");
    const lines=st.lines.filter(l=>l.desc.trim() || has(l.value) || has(l.work));
    if(!lines.length) return bad(editItems? "pa-d-"+st.lines[0].id : "paSend","Add at least one line item.");
    for(const l of lines){
      if(editItems && !l.desc.trim()) return bad("pa-d-"+l.id,"Describe every line item.");
      if(editItems && !(num(l.value)>0) && !l.prev) return bad("pa-v-"+l.id,"Enter the scheduled value of “"+(l.desc||"this line")+"”.");
      const v=num(l.value), g=r2(l.prev+num(l.work));
      if(g>v+0.004 && v>=0) return bad("pa-pc-"+l.id,"“"+(l.desc||"A line")+"” goes over 100%. Enter at most "+amt(r2(v-l.prev))+" for this period.");
      if(num(l.work)<-0.004) return bad("pa-w-"+l.id,"“"+(l.desc||"A line")+"” is below what was billed before. The % to date can’t go down.");
    }
    const c=calc(model, lines);
    if(!(c.W>0.004) && !editItems) return bad(lines[0]? "pa-pc-"+lines[0].id : "paSend","Enter the work done this period on at least one line.");
    const payload={company:st.company.trim().slice(0,160), trade:st.trade.trim().slice(0,120), filledBy:st.filledBy.trim().slice(0,120), phone:st.phone.trim().slice(0,60), email:st.email.trim().slice(0,160), note:st.note.trim().slice(0,2000),
      lines:lines.slice(0,200).map(l=>({id:l.id, desc:l.desc.trim().slice(0,300), value:r2(num(l.value)), work:r2(num(l.work)), pct: num(l.value)? Math.round((l.prev+num(l.work))/num(l.value)*10000)/100 : 0})),
      totals:{contract:c.V, toDate:c.G, retainage:c.R, earned:c.earned, prevCert:c.prevCert, due:c.due}};
    sendBtn.disabled=true; const lbl=sendBtn.textContent; sendBtn.textContent="Sending…";
    try{ await opts.onSubmit(payload); if(opts.draftKey) LSdel(opts.draftKey);
      if(opts.inApp) return;
      root.replaceChildren(el("div",{class:"pa"}, head, el("section",{class:"pa-card"}, el("div",{class:"pa-ok"}, el("span",{class:"ic",text:"✓"}), el("div",null,
        el("h2",{text:"Sent to "+gc}), el("p",{class:"pa-muted",text:"Thank you, "+payload.filledBy+". "+gc+" will review your pay application and contact you if anything needs to change."}),
        el("p",{style:"margin-top:8px"},"Current payment due: ",el("b",{text:money(c.due)})),
        el("div",{class:"pa-acts"}, el("button",{class:"pa-btn",type:"button",text:"Print a copy",onclick:()=>window.print()})))))));
      window.scrollTo({top:0});
    }catch(e){ sendBtn.disabled=false; sendBtn.textContent=lbl; err.textContent= (e&&e.userMessage) || "Couldn’t send. Check your internet connection and try again. What you typed is saved on this device."; }
  });

  root.replaceChildren(el("div",{class:"pa"}, head, who, work, fin));
  drawRows();
  // fill whichever half is missing for lines that came from a draft
  for(const l of st.lines){ if(has(l.pct) && !has(l.work)) syncFrom(l,"pct"); else if(has(l.work)) syncFrom(l,"work"); }
  drawRows(); refresh();
}
window.PayAppForm={mount, calc};
})();
