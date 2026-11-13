/* Client Billing · online platform layer
 * Sign-in, company registration, invite links, and the data/files/people services the app uses,
 * backed by Supabase. Every company's data is sealed off by the database's row-level security. */
(function(){
"use strict";
const CFG = window.APP_CONFIG || {};
const APP_NAME = CFG.appName || "Client Billing";
const LS = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };
const PAGE_URL = location.origin + location.pathname;

/* ---------- tiny DOM helper ---------- */
function el(tag, attrs, ...kids){
  const e=document.createElement(tag);
  if(attrs) for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="text") e.textContent=v; else if(k==="class") e.className=v; else if(k.startsWith("on")) e.addEventListener(k.slice(2),v); else e.setAttribute(k, v===true? "" : v); }
  for(const c of kids.flat()){ if(c==null||c===false) continue; e.append(c.nodeType? c : document.createTextNode(String(c))); }
  return e;
}
const css = `
#authRoot{position:fixed;inset:0;z-index:9999;background:var(--bg,#f4f6fa);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:48px 16px;font-family:var(--body,system-ui,sans-serif);color:var(--ink,#1d2433)}
#authRoot .acard{width:100%;max-width:440px;background:var(--surface,#fff);border:1px solid var(--line,#e2e6ee);border-radius:16px;padding:28px 26px;box-shadow:0 10px 40px rgba(20,30,60,.08);display:flex;flex-direction:column;gap:14px}
#authRoot .acard.wide{max-width:560px}
#authRoot .abrand{display:flex;align-items:center;gap:10px;margin-bottom:4px}
#authRoot .abrand .m{width:36px;height:36px;border-radius:10px;background:var(--accent,#1F5FD6);color:#fff;display:grid;place-items:center;font-weight:800}
#authRoot .abrand b{font-size:17px}
#authRoot h1{font-size:24px;margin:0;line-height:1.2}
#authRoot p{margin:0;line-height:1.5}
#authRoot .muted{color:var(--muted,#667085);font-size:14px}
#authRoot label{display:flex;flex-direction:column;gap:6px;font-size:13.5px;font-weight:600;color:var(--muted,#56607a)}
#authRoot input{font:inherit;font-size:15px;font-weight:400;color:var(--ink,#1d2433);background:var(--surface,#fff);border:1px solid var(--line,#d6dbe5);border-radius:10px;padding:10px 12px;min-height:42px}
#authRoot input:focus{outline:2px solid var(--accent,#1F5FD6);outline-offset:1px}
#authRoot .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
#authRoot fieldset.work{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;min-width:0}
#authRoot fieldset.work legend{font-size:13.5px;font-weight:600;color:var(--muted,#56607a);padding:0;margin-bottom:6px}
#authRoot .workopts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#authRoot label.wopt{flex-direction:row;align-items:flex-start;gap:8px;padding:10px 12px;border:1.5px solid var(--line,#e2e6ee);border-radius:10px;cursor:pointer;color:var(--ink,#0d1b2e);font-weight:600}
#authRoot label.wopt input{margin:2px 0 0;accent-color:var(--accent,#1F5FD6);width:18px;height:18px;min-height:0;padding:0;flex:none;border:0;box-shadow:none}
#authRoot label.wopt small{display:block;font-weight:400;color:var(--muted,#56607a);font-size:12.5px;margin-top:2px}
#authRoot label.wopt:has(input:checked){border-color:var(--accent,#1F5FD6);background:var(--accent-soft,#E6EEFC)}
@media (max-width:520px){#authRoot .workopts{grid-template-columns:1fr}}
@media (max-width:520px){#authRoot .row2{grid-template-columns:1fr}}
#authRoot button.ab{font:inherit;font-size:15px;font-weight:700;border-radius:10px;padding:11px 16px;border:1px solid var(--line,#d6dbe5);background:var(--surface,#fff);color:var(--ink,#1d2433);cursor:pointer;min-height:44px}
#authRoot button.ab.primary{background:var(--accent,#1F5FD6);border-color:var(--accent,#1F5FD6);color:#fff}
#authRoot button.ab:disabled{opacity:.6;cursor:default}
#authRoot .linkb{font:inherit;font-size:14px;background:none;border:0;color:var(--accent,#1F5FD6);cursor:pointer;padding:0;text-align:left}
#authRoot .err{color:var(--danger,#c0262d);font-size:14px;min-height:0}
#authRoot .err:empty{display:none}
#authRoot .note{background:var(--accent-soft,#e8efff);border-radius:10px;padding:10px 12px;font-size:14px}
#authRoot .foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:14px}
#authRoot .co{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line,#e2e6ee);border-radius:12px;padding:12px 14px;cursor:pointer;background:none;font:inherit;text-align:left;color:inherit}
#authRoot .co:hover{border-color:var(--accent,#1F5FD6)}
#authRoot .logoprev{max-height:56px;max-width:220px;border:1px solid var(--line,#e2e6ee);border-radius:8px;padding:4px;background:#fff}
`;
function root(){ let r=document.getElementById("authRoot"); if(!r){ const st=document.createElement("style"); st.textContent=css; document.head.append(st); r=el("div",{id:"authRoot",role:"main"}); document.body.append(r); } return r; }
function show(card){ const r=root(); r.hidden=false; r.replaceChildren(card); const f=card.querySelector("input,button.primary"); if(f) setTimeout(()=>f.focus(),30); }
function hideAuth(){ const r=document.getElementById("authRoot"); if(r) r.remove(); }
const brand=()=>el("div",{class:"abrand"},el("span",{class:"m",text:"CB"}),el("b",{text:APP_NAME}));
function card(title, sub, body, wide){ return el("form",{class:"acard"+(wide?" wide":""),novalidate:true,onsubmit:e=>e.preventDefault()}, brand(), el("h1",{text:title}), sub? el("p",{class:"muted",text:sub}) : null, ...body); }
const field=(label,attrs)=>{ const i=el("input",attrs); return [el("label",null,label,i), i]; };
function busy(btn, on, label){ if(on){ btn.dataset.l=btn.textContent; btn.disabled=true; btn.textContent=label||"Please wait…"; } else { btn.disabled=false; if(btn.dataset.l) btn.textContent=btn.dataset.l; } }
const errText=e=>{ const m=String(e&&(e.message||e.error_description||e)||"");
  if(/Invalid login credentials/i.test(m)) return "That email and password don’t match. Try again or reset your password.";
  if(/Email not confirmed/i.test(m)) return "Confirm your email first. Open the link we sent you, then sign in.";
  if(/already registered|already exists/i.test(m)) return "There’s already an account with this email. Sign in instead.";
  if(/Password should be/i.test(m)) return "Use a password of at least 8 characters.";
  if(/rate limit|too many/i.test(m)) return "Too many tries. Wait a minute and try again.";
  if(/invite_expired/.test(m)) return "This invite link was already used, was cancelled, or has expired. Ask your admin for a new one.";
  if(/invite_other_email/.test(m)) return "This invite link was made for a different email address. Sign in with that email, or ask your admin for a new link.";
  if(/invite_not_found/.test(m)) return "This invite link isn’t valid. Ask your admin for a new one.";
  if(/Failed to fetch|NetworkError/i.test(m)) return "Can’t reach the server. Check your internet connection and try again.";
  return m || "Something went wrong. Try again."; };

/* ---------- setup check ---------- */
if(!CFG.supabaseUrl || !CFG.supabaseAnonKey || /PASTE/i.test(CFG.supabaseUrl+CFG.supabaseAnonKey) || !window.supabase){
  document.addEventListener("DOMContentLoaded",()=>show(card("Almost ready", "This copy of the app isn’t connected to its database yet.",[el("p",{class:"muted",text:"Open config.js and fill in your Supabase project URL and anon key (see the setup guide), then reload."})])));
  window.claude={ use: async()=>null };
  return;
}
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });

/* ---------- invite token from the link ---------- */
(function(){ const u=new URL(location.href); let t=u.searchParams.get("invite"); const hm=/(?:^|[#&])invite=([0-9a-f]{20,80})/i.exec(location.hash||""); if(!t && hm) t=hm[1];
  if(t && /^[0-9a-f]{20,80}$/i.test(t)){ LS.set("cb.invite", t); u.searchParams.delete("invite"); history.replaceState(null,"",u.pathname+u.search+(hm? "" : u.hash)); } })();
const isRecovery = /type=recovery/.test(location.hash) || new URL(location.href).searchParams.get("reset")==="1";

/* ---------- the platform state ---------- */
const P = { sb, uid:null, email:"", name:"", cid:null, role:null, companyName:"", companies:[], members:[], ready:false };
let readyResolve; const readyP = new Promise(r=>readyResolve=r);
window.__appPlatform = P;

/* ---------- auth screens ---------- */
async function inviteBanner(){
  const t=LS.get("cb.invite"); if(!t) return null;
  try{ const { data } = await sb.rpc("invite_info",{ p_token:t }); const i=Array.isArray(data)? data[0] : null;
    if(!i){ LS.del("cb.invite"); return el("p",{class:"note",text:"This invite link isn’t valid. Ask your admin for a new one."}); }
    if(!i.valid){ LS.del("cb.invite"); return el("p",{class:"note",text:"This invite to "+i.company_name+" was already used or has expired. Ask your admin for a new link."}); }
    return el("p",{class:"note"},"You’re invited to join ",el("b",{text:i.company_name})," as "+(i.role==="viewer"?"a viewer":"an editor")+(i.email? " ("+i.email+")" : "")+". Create an account or sign in to accept.");
  }catch(e){ return null; }
}
async function screenSignIn(msg){
  const [lE,email]=field("Email",{type:"email",autocomplete:"email",required:true});
  const [lP,pw]=field("Password",{type:"password",autocomplete:"current-password",required:true});
  const err=el("p",{class:"err",role:"alert"}); if(msg) err.textContent=msg;
  const go=el("button",{class:"ab primary",type:"submit",text:"Sign in"});
  const f=card("Sign in", null, [await inviteBanner(), lE, lP, err, go,
    el("div",{class:"foot"}, el("button",{class:"linkb",type:"button",text:"Create an account",onclick:()=>screenSignUp()}), el("button",{class:"linkb",type:"button",text:"Forgot password?",onclick:()=>screenForgot(email.value)}))]);
  f.addEventListener("submit", async()=>{ err.textContent=""; if(!email.value.trim()||!pw.value){ err.textContent="Enter your email and password."; return; }
    busy(go,true,"Signing in…"); const { error } = await sb.auth.signInWithPassword({ email:email.value.trim(), password:pw.value });
    if(error){ busy(go,false); err.textContent=errText(error); return; } });   // onAuthStateChange takes it from here
  show(f);
}
async function screenSignUp(){
  const [lN,name]=field("Your name",{autocomplete:"name",required:true});
  const [lE,email]=field("Work email",{type:"email",autocomplete:"email",required:true});
  const [lP,pw]=field("Password (at least 8 characters)",{type:"password",autocomplete:"new-password",minlength:"8",required:true});
  const err=el("p",{class:"err",role:"alert"}); const go=el("button",{class:"ab primary",type:"submit",text:"Create account"});
  const inv=LS.get("cb.invite");
  const f=card("Create your account", inv? null : "Next you’ll set up your company. To join an existing company, use the invite link your admin sent you.", [await inviteBanner(), lN, lE, lP, err, go,
    el("div",{class:"foot"}, el("button",{class:"linkb",type:"button",text:"I already have an account",onclick:()=>screenSignIn()}))]);
  f.addEventListener("submit", async()=>{ err.textContent="";
    if(!name.value.trim()||!email.value.trim()){ err.textContent="Enter your name and email."; return; } if(pw.value.length<8){ err.textContent="Use a password of at least 8 characters."; return; }
    busy(go,true,"Creating…");
    const { data, error } = await sb.auth.signUp({ email:email.value.trim(), password:pw.value, options:{ data:{ name:name.value.trim() }, emailRedirectTo: PAGE_URL + (inv? "?invite="+inv : "") } });
    if(error){ busy(go,false); err.textContent=errText(error); return; }
    if(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length===0){ busy(go,false); err.textContent="There’s already an account with this email. Sign in instead."; return; }
    if(!data.session) show(card("Check your email","We sent a confirmation link to "+email.value.trim()+". Open it on this device to finish signing up.",[el("p",{class:"muted",text:"Didn’t get it? Check spam, or wait a minute and try signing in."}), el("button",{class:"ab",type:"button",text:"Back to sign in",onclick:()=>screenSignIn()})]));
  });
  show(f);
}
function screenForgot(pre){
  const [lE,email]=field("Email",{type:"email",autocomplete:"email",required:true}); email.value=pre||"";
  const err=el("p",{class:"err",role:"alert"}); const go=el("button",{class:"ab primary",type:"submit",text:"Send reset link"});
  const f=card("Reset your password","We’ll email you a link to choose a new password.",[lE, err, go, el("div",{class:"foot"}, el("button",{class:"linkb",type:"button",text:"Back to sign in",onclick:()=>screenSignIn()}))]);
  f.addEventListener("submit", async()=>{ err.textContent=""; if(!email.value.trim()){ err.textContent="Enter your email."; return; }
    busy(go,true,"Sending…"); const { error } = await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: PAGE_URL+"?reset=1" }); busy(go,false);
    if(error){ err.textContent=errText(error); return; }
    show(card("Check your email","If there’s an account for "+email.value.trim()+", a reset link is on its way.",[el("button",{class:"ab",type:"button",text:"Back to sign in",onclick:()=>screenSignIn()})])); });
  show(f);
}
function screenNewPassword(){
  const [lP,pw]=field("New password (at least 8 characters)",{type:"password",autocomplete:"new-password",minlength:"8"});
  const err=el("p",{class:"err",role:"alert"}); const go=el("button",{class:"ab primary",type:"submit",text:"Save new password"});
  const f=card("Choose a new password",null,[lP, err, go]);
  f.addEventListener("submit", async()=>{ err.textContent=""; if(pw.value.length<8){ err.textContent="Use at least 8 characters."; return; }
    busy(go,true,"Saving…"); const { error } = await sb.auth.updateUser({ password:pw.value }); if(error){ busy(go,false); err.textContent=errText(error); return; }
    const u=new URL(location.href); u.searchParams.delete("reset"); history.replaceState(null,"",u.pathname+u.search); enter(); });
  show(f);
}
function readLogo(file){ return new Promise((res,rej)=>{
  if(!file) return res(""); if(!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) return rej(new Error("Choose a PNG or JPG image."));
  const url=URL.createObjectURL(file); const img=new Image();
  img.onload=()=>{ const max=900, mh=320, k=Math.min(1, max/img.naturalWidth, mh/img.naturalHeight); const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.naturalWidth*k)); c.height=Math.max(1,Math.round(img.naturalHeight*k));
    const g=c.getContext("2d"); g.drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); const d=c.toDataURL("image/png"); if(d.length>700000) return rej(new Error("That logo is too large. Use a smaller image.")); res(d); };
  img.onerror=()=>{ URL.revokeObjectURL(url); rej(new Error("That file couldn’t be read as an image.")); }; img.src=url; }); }
P.readLogo = readLogo;
function screenCreateCompany(){
  const [lC,cname]=field("Company name",{autocomplete:"organization",required:true});
  const [lA,a1]=field("Street address",{autocomplete:"address-line1"});
  const [lB,a2]=field("City, state, ZIP",{autocomplete:"address-level2"});
  const [lPh,phone]=field("Phone",{type:"tel",autocomplete:"tel"});
  const [lEm,cemail]=field("Company email",{type:"email",autocomplete:"email"}); cemail.value=P.email||"";
  const [lW,web]=field("Website (optional)",{});
  const logoIn=el("input",{type:"file",accept:"image/png,image/jpeg,image/webp"}); const prev=el("img",{class:"logoprev",alt:"Logo preview",hidden:true}); let logo="";
  // GC, sub or both: decides which projects the app shows (changeable later in Settings)
  const wopt=(v,t,sub)=>el("label",{class:"wopt"}, el("input",{type:"radio",name:"workAs",value:v,id:"workAs-"+v}), el("span",null, t, el("small",{text:sub})));
  const work=el("fieldset",{class:"work",id:"workAsSet"}, el("legend",{text:"We work as"}),
    el("div",{class:"workopts"}, wopt("gc","General contractor","We bill owners"), wopt("sub","Subcontractor","We bill GCs"), wopt("both","Both","GC and sub jobs")),
    el("span",{class:"muted",style:"font-size:12.5px",text:"You can change this later in Settings."}));
  const err=el("p",{class:"err",role:"alert"});
  logoIn.addEventListener("change", async()=>{ err.textContent=""; try{ logo=await readLogo(logoIn.files[0]); prev.src=logo; prev.hidden=!logo; }catch(e){ logo=""; prev.hidden=true; err.textContent=e.message; } });
  const go=el("button",{class:"ab primary",type:"submit",text:"Create company"});
  const f=card("Set up your company","This prints at the top of your invoices, requisitions and change orders. You’ll be the company’s admin and can invite your team next.",[
    lC, work, lA, el("div",{class:"row2"}, lB, lPh), el("div",{class:"row2"}, lEm, lW),
    el("label",null,"Logo (optional, you can add it later)", logoIn), prev, err, go,
    el("div",{class:"foot"}, el("span",{class:"muted",text:"Signed in as "+P.email}), el("button",{class:"linkb",type:"button",text:"Sign out",onclick:()=>P.signOut()}))], true);
  f.addEventListener("submit", async()=>{ err.textContent=""; const n=cname.value.trim(); if(!n){ err.textContent="Enter the company name."; cname.focus(); return; }
    const wa=(f.querySelector('input[name="workAs"]:checked')||{}).value; if(!wa){ err.textContent="Choose whether you work as a GC, a subcontractor or both."; f.querySelector('#workAs-gc').focus(); return; }
    busy(go,true,"Creating…");
    const settings={ name:n, payableTo:n, address1:a1.value.trim(), address2:a2.value.trim(), phone:phone.value.trim(), email:cemail.value.trim(), website:web.value.trim(), logoData:logo||"", workAs:wa };
    const { data, error } = await sb.rpc("create_company",{ p_name:n, p_settings:settings });
    if(error){ busy(go,false); err.textContent=errText(error); return; }
    LS.set("cb.company", data); enter(); });
  show(f);
}
function screenPickCompany(list){
  show(card("Choose a company","You belong to more than one.",[...list.map(c=>el("button",{class:"co",type:"button",onclick:()=>{ LS.set("cb.company",c.id); enter(); }}, el("b",{text:c.name}), el("span",{class:"muted",text:roleName(c.role)}))),
    el("div",{class:"foot"}, el("button",{class:"linkb",type:"button",text:"+ Set up another company",onclick:()=>screenCreateCompany()}), el("button",{class:"linkb",type:"button",text:"Sign out",onclick:()=>P.signOut()}))]));
}
const roleName=r=>({admin:"Admin",editor:"Editor",viewer:"Viewer"}[r]||r);

/* ---------- after sign-in: join, pick or create a company ---------- */
let entering=false;
async function enter(){
  if(entering) return; entering=true;
  try{
    const { data:{ session } } = await sb.auth.getSession();
    if(!session){ entering=false; return screenSignIn(); }
    const u=session.user; P.uid=u.id; P.email=u.email||""; P.name=(u.user_metadata&&u.user_metadata.name)||"";
    try{ await sb.rpc("claim_pending"); }catch(e){}
    const inv=LS.get("cb.invite");
    if(inv){ const { data, error } = await sb.rpc("accept_invite",{ p_token:inv }); LS.del("cb.invite");
      if(error){ entering=false; const msg=errText(error); return show(card("Couldn’t use the invite",msg,[el("button",{class:"ab primary",type:"button",text:"Continue",onclick:()=>enter()}), el("button",{class:"ab",type:"button",text:"Sign out",onclick:()=>P.signOut()})])); }
      if(data) LS.set("cb.company", data); }
    const { data:mine, error } = await sb.from("company_members").select("company_id, role, companies(name)").eq("user_id", P.uid);
    if(error) throw error;
    P.companies=(mine||[]).map(m=>({id:m.company_id, role:m.role, name:(m.companies&&m.companies.name)||"Company"})).sort((a,b)=>a.name.localeCompare(b.name));
    if(!P.companies.length){ entering=false; return screenCreateCompany(); }
    let pick=P.companies.find(c=>c.id===LS.get("cb.company"));
    if(!pick && P.companies.length===1) pick=P.companies[0];
    if(!pick){ entering=false; return screenPickCompany(P.companies); }
    LS.set("cb.company", pick.id); P.cid=pick.id; P.role=pick.role; P.companyName=pick.name;
    if(P.name) sb.rpc("set_my_name",{ p_name:P.name }).then(()=>{},()=>{});
    await startData();
    hideAuth(); P.ready=true; readyResolve();
  }catch(e){ entering=false; show(card("Couldn’t open your account", errText(e), [el("button",{class:"ab primary",type:"button",text:"Try again",onclick:()=>enter()}), el("button",{class:"ab",type:"button",text:"Sign out",onclick:()=>P.signOut()})])); }
}
P.signOut = async()=>{ try{ await sb.auth.signOut(); }catch(e){} LS.del("cb.company"); location.replace(PAGE_URL); };
P.switchCompany = ()=>{ LS.del("cb.company"); location.replace(PAGE_URL); };

/* ---------- data: one live copy of the company's documents ---------- */
const cache=new Map();           // col -> Map(id -> frozen data)
const colL=new Map(), docL=new Map();
const key=(c,i)=>c+"\u0000"+i;
function freeze(o){ if(o && typeof o==="object" && !Object.isFrozen(o)){ Object.freeze(o); for(const k in o) freeze(o[k]); } return o; }
const clone=o=>JSON.parse(JSON.stringify(o==null? {} : o));
function colMap(c){ let m=cache.get(c); if(!m){ m=new Map(); cache.set(c,m); } return m; }
function putDoc(c,i,d){ if(d==null) colMap(c).delete(i); else colMap(c).set(i, freeze(d)); dirty(c,i); }
const pendingC=new Set(), pendingD=new Set(); let flushT=null;
function dirty(c,i){ pendingC.add(c); pendingD.add(key(c,i)); if(!flushT) flushT=setTimeout(flush,0); }
function flush(){ flushT=null; const cs=[...pendingC], ds=[...pendingD]; pendingC.clear(); pendingD.clear();
  for(const c of cs){ const s=colL.get(c); if(s) for(const fn of [...s]) safe(fn, colSnap(c)); }
  for(const k of ds){ const s=docL.get(k); if(s){ const [c,i]=k.split("\u0000"); for(const fn of [...s]) safe(fn, docSnap(c,i)); } } }
function safe(fn,arg){ try{ fn(arg); }catch(e){ console.error(e); } }
function docSnap(c,i){ const d=virtGet(c,i); const v= d!==undefined? d : (cache.get(c)||new Map()).get(i); return { id:i, exists:v!==undefined, data:()=>v, metadata:{} }; }
function colSnap(c){ const v=virtCol(c); const m=v || cache.get(c) || new Map(); const docs=[...m.entries()].map(([i,d])=>({ id:i, exists:true, data:()=>d, metadata:{} })); return { docs, size:docs.length, empty:!docs.length, forEach(f){ docs.forEach(f); } }; }
// people and access requests come from the membership table, not documents
function memberDoc(m){ return freeze({ role:m.role, email:m.email||"", name:m.name||"", at:m.joined_at||"" }); }
function virtCol(c){ if(c==="members"){ const m=new Map(); for(const x of P.members) m.set(x.user_id, memberDoc(x)); return m; } if(c==="access") return new Map(); return null; }
function virtGet(c,i){ if(c==="members"){ const x=P.members.find(y=>y.user_id===i); return x? memberDoc(x) : undefined; } if(c==="access") return undefined; return undefined; }

async function loadAll(){
  const next=new Map(); const page=1000;
  for(let from=0; ; from+=page){
    const { data, error } = await sb.from("docs").select("col,id,data").eq("company_id",P.cid).order("col").order("id").range(from, from+page-1);
    if(error) throw error;
    for(const r of data){ let m=next.get(r.col); if(!m){ m=new Map(); next.set(r.col,m); } m.set(r.id, freeze(r.data||{})); }
    if(data.length<page) break;
  }
  // tell listeners about anything that changed
  const cols=new Set([...cache.keys(), ...next.keys()]);
  for(const c of cols){ const a=cache.get(c)||new Map(), b=next.get(c)||new Map();
    for(const [i,d] of b) if(!a.has(i) || JSON.stringify(a.get(i))!==JSON.stringify(d)) dirty(c,i);
    for(const i of a.keys()) if(!b.has(i)) dirty(c,i);
    cache.set(c,b); }
}
async function loadMembers(){
  const { data, error } = await sb.from("company_members").select("user_id, role, email, name, joined_at").eq("company_id",P.cid);
  if(error) throw error; P.members=data||[];
  const me=P.members.find(m=>m.user_id===P.uid);
  if(!me){ alertAndReload("You no longer have access to "+P.companyName+"."); return; }
  if(P.ready && me.role!==P.role){ alertAndReload("Your access changed to "+roleName(me.role)+". The page will reload."); return; }
  P.role=me.role; pendingC.add("members"); for(const m of P.members) pendingD.add(key("members",m.user_id)); if(!flushT) flushT=setTimeout(flush,0);
}
function alertAndReload(msg){ try{ window.alert(msg); }catch(e){} LS.del("cb.company"); location.replace(PAGE_URL); }
let chan=null, subscribedOnce=false, hiddenAt=0;
async function startData(){
  await Promise.all([loadAll(), loadMembers()]);
  chan=sb.channel("company-"+P.cid)
    .on("postgres_changes",{ event:"*", schema:"public", table:"docs", filter:"company_id=eq."+P.cid }, onDocChange)
    .on("postgres_changes",{ event:"*", schema:"public", table:"company_members", filter:"company_id=eq."+P.cid }, ()=>{ loadMembers().catch(()=>{}); })
    .subscribe(status=>{ if(status==="SUBSCRIBED"){ if(subscribedOnce) resync(); subscribedOnce=true; } });
  document.addEventListener("visibilitychange",()=>{ if(document.hidden) hiddenAt=Date.now(); else if(hiddenAt && Date.now()-hiddenAt>60000) resync(); });
  window.addEventListener("online", resync);
}
let resyncing=null; function resync(){ if(resyncing) return resyncing; resyncing=Promise.all([loadAll(), loadMembers()]).catch(()=>{}).finally(()=>{ resyncing=null; }); return resyncing; }
function onDocChange(p){
  if(p.eventType==="DELETE"){ const o=p.old||{}; if(o.company_id && o.company_id!==P.cid) return; if(o.col!=null && o.id!=null && colMap(o.col).has(o.id) && !writing.has(key(o.col,o.id))) putDoc(o.col,o.id,null); return; }
  const n=p.new||{}; if(n.company_id!==P.cid) return; if(writing.has(key(n.col,n.id))) return;   // our own write is already applied
  putDoc(n.col, n.id, n.data||{});
}
function deepMerge(a,b){ if(!a || typeof a!=="object" || Array.isArray(a) || !b || typeof b!=="object" || Array.isArray(b)) return clone(b); const o=clone(a); for(const k of Object.keys(b)){ const bv=b[k]; o[k]= (bv && typeof bv==="object" && !Array.isArray(bv) && o[k] && typeof o[k]==="object" && !Array.isArray(o[k]))? deepMerge(o[k],bv) : clone(bv); } return o; }
function splitPath(path){ const s=String(path).split("/").filter(Boolean); return s; }
function privateOf(col){ const s=col.split("/"); if(s[0]==="data" && s[1]==="users"){ if(s[2]!==P.uid) { const e=new Error("Not allowed"); e.code="permission_denied"; throw e; } return P.uid; } return null; }
const writing=new Map(); const chains=new Map();
function serial(k, fn){ const prev=chains.get(k)||Promise.resolve(); const run=prev.catch(()=>{}).then(fn); chains.set(k, run); writing.set(k,(writing.get(k)||0)+1);
  return run.finally(()=>{ const n=(writing.get(k)||1)-1; if(n<=0) writing.delete(k); else writing.set(k,n); if(chains.get(k)===run) chains.delete(k); }); }
function dbErr(error){ const e=new Error(error&&error.message||"write_failed"); e.code= /row-level security|permission/i.test(e.message)? "permission_denied" : /not_found/.test(e.message)? "invalid_argument" : "unavailable"; return e; }
function newId(){ const a="0123456789abcdefghijklmnopqrstuvwxyz"; const b=new Uint8Array(20); crypto.getRandomValues(b); return [...b].map(x=>a[x%36]).join(""); }
function memberWrite(op, id, data){
  if(op==="update" && data && data.role){ if(!["admin","editor","viewer"].includes(data.role)) return Promise.reject(dbErr({message:"invalid role"}));
    return sb.from("company_members").update({ role:data.role }).match({ company_id:P.cid, user_id:id }).select().then(({data:r,error})=>{ if(error) throw dbErr(error); if(!r||!r.length) throw dbErr({message:"permission"}); return loadMembers(); }); }
  if(op==="delete") return sb.from("company_members").delete().match({ company_id:P.cid, user_id:id }).select().then(({data:r,error})=>{ if(error) throw dbErr(error); return loadMembers(); });
  return Promise.resolve();   // adding people happens through invite links
}
function docRef(col, id){
  const k=key(col,id);
  return {
    id, path: col+"/"+id,
    onSnapshot(fn, onErr){ let s=docL.get(k); if(!s){ s=new Set(); docL.set(k,s); } s.add(fn); setTimeout(()=>safe(fn, docSnap(col,id)),0); return ()=>s.delete(fn); },
    async get(){ return docSnap(col,id); },
    set(data){ if(col==="members"||col==="access") return memberWrite("set",id,data);
      let priv; try{ priv=privateOf(col); }catch(e){ return Promise.reject(e); }
      const before=colMap(col).get(id), val=clone(data); putDoc(col,id,val);
      return serial(k, async()=>{ const { error } = await sb.from("docs").upsert({ company_id:P.cid, col, id, data:val, private_to:priv, updated_by:P.uid, updated_at:new Date().toISOString() },{ onConflict:"company_id,col,id" });
        if(error){ putDoc(col,id,before===undefined? null : before); throw dbErr(error); } }); },
    update(patch){ if(col==="members"||col==="access") return memberWrite("update",id,patch);
      const before=colMap(col).get(id); if(before===undefined){ const e=new Error("Document doesn’t exist"); e.code="invalid_argument"; return Promise.reject(e); }
      putDoc(col,id,deepMerge(before, patch));
      return serial(k, async()=>{ const { data:merged, error } = await sb.rpc("doc_update",{ p_company:P.cid, p_col:col, p_id:id, p_patch:clone(patch) });
        if(error){ putDoc(col,id,before); throw dbErr(error); } if(merged && JSON.stringify(merged)!==JSON.stringify(colMap(col).get(id))) putDoc(col,id,merged); }); },
    delete(){ if(col==="members"||col==="access") return memberWrite("delete",id);
      const before=colMap(col).get(id); putDoc(col,id,null);
      return serial(k, async()=>{ const { error } = await sb.from("docs").delete().match({ company_id:P.cid, col, id });
        if(error){ if(before!==undefined) putDoc(col,id,before); throw dbErr(error); } }); }
  };
}
const dbApi = Object.freeze({
  doc(path){ const s=splitPath(path); if(s.length<2 || s.length%2) throw new Error("A document path needs an even number of parts"); return docRef(s.slice(0,-1).join("/"), s[s.length-1]); },
  collection(path){ const s=splitPath(path); if(!s.length || s.length%2===0) throw new Error("A collection path needs an odd number of parts"); const col=s.join("/");
    return { id:s[s.length-1], path:col,
      doc(id){ return docRef(col, id || newId()); },
      onSnapshot(fn, onErr){ let set=colL.get(col); if(!set){ set=new Set(); colL.set(col,set); } set.add(fn); setTimeout(()=>safe(fn, colSnap(col)),0); return ()=>set.delete(fn); },
      async get(){ return colSnap(col); } }; }
});

/* ---------- files ---------- */
const hex=n=>{ const b=new Uint8Array(n); crypto.getRandomValues(b); return [...b].map(x=>x.toString(16).padStart(2,"0")).join(""); };
const assetsApi = Object.freeze({
  async upload(blob, opts){ const id=hex(16), type=(opts&&opts.type)||blob.type||"application/octet-stream";
    const { error } = await sb.storage.from("files").upload(P.cid+"/"+id, blob, { contentType:type, upsert:false });
    if(error){ const e=new Error(error.message||"upload_failed"); e.code="unavailable"; throw e; }
    return { id, url:null, sizeBytes:blob.size, contentType:type }; },
  async delete(id){ const { error } = await sb.storage.from("files").remove([P.cid+"/"+id]); if(error) throw new Error(error.message); },
  async list(){ return { assets:[], usage:{} }; }
});
P.fetchBlob = async id=>{ const { data, error } = await sb.storage.from("files").download(P.cid+"/"+id); if(error || !data) throw new Error((error&&error.message)||"not_found"); return data; };
P.putFileWithId = async (id, blob)=>{ const { error } = await sb.storage.from("files").upload(P.cid+"/"+id, blob, { contentType:blob.type||"application/pdf", upsert:true }); if(error) throw new Error(error.message); };

/* ---------- people ---------- */
function avatar(name){ const ini=(String(name||"?").trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2)||"?").toUpperCase(); const hue=[...String(name||"")].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
  return "data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="hsl('+hue+',55%,45%)"/><text x="32" y="41" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">'+ini.replace(/[<&>]/g,"")+'</text></svg>'); }
function legacyMap(){ const l=(cache.get("settings")||new Map()).get("legacy"); return (l&&l.people)||{}; }
function personOf(id){ let m=P.members.find(x=>x.user_id===id); if(!m){ const em=legacyMap()[id]; if(em) m=P.members.find(x=>String(x.email||"").toLowerCase()===String(em).toLowerCase()); }
  return m? { id, name:m.name||m.email||"", email:m.email||"", avatarUrl:avatar(m.name||m.email), guest:false } : { id, name:"", email:"", avatarUrl:avatar("?"), guest:false }; }
const userApi = Object.freeze({
  async me(){ return { id:P.uid, name:P.name||P.email, email:P.email, avatarUrl:avatar(P.name||P.email), isOwner:P.role==="admin", canEdit:P.role==="admin"||P.role==="editor", guest:false }; },
  async id(){ return P.uid; },
  isOwner(){ return P.role==="admin"; }, canEdit(){ return P.role!=="viewer"; }, can(){ return P.role!=="viewer"; },
  async profiles(ids){ const o={}; for(const id of ids||[]) o[id]=personOf(id); return o; },
  async search(q){ q=String(q||"").toLowerCase(); return P.members.filter(m=>!q || String(m.name||"").toLowerCase().includes(q) || String(m.email||"").toLowerCase().includes(q)).map(m=>personOf(m.user_id)); }
});

/* ---------- downloads ---------- */
const downloadsApi = Object.freeze({ async save({ filename, data }){ const blob= data instanceof Blob? data : new Blob([data]); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename||"download"; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 30000); return { saved:true }; } });

P.legacy = ()=> (cache.get("settings")||new Map()).get("legacy") || null;

/* ---------- invites (admin) ---------- */
P.invites = {
  async list(){ const { data, error } = await sb.from("invites").select("token, role, email, note, created_at, expires_at, used_by, used_at, revoked").eq("company_id",P.cid).order("created_at",{ascending:false}).limit(200); if(error) throw error; return data||[]; },
  async create({ role, email, note }){ const { data, error } = await sb.from("invites").insert({ company_id:P.cid, role: role==="viewer"? "viewer" : "editor", email: email? String(email).trim().toLowerCase() : null, note: note? String(note).slice(0,200) : null, created_by:P.uid }).select("token").single(); if(error) throw error; return data.token; },
  async revoke(token){ const { error } = await sb.from("invites").update({ revoked:true }).eq("token",token).eq("company_id",P.cid); if(error) throw error; },
  link(token){ return PAGE_URL+"?invite="+token; }
};

/* ---------- what the app calls ---------- */
window.claude = Object.freeze({ use: async (name)=>{
  await readyP;
  switch(name){ case "db": return dbApi; case "assets": return P.role==="viewer"? null : assetsApi; case "user": return userApi; case "downloads": return downloadsApi; default: return null; }
} });

/* ---------- start ---------- */
sb.auth.onAuthStateChange((event, session)=>{
  if(event==="PASSWORD_RECOVERY"){ screenNewPassword(); return; }
  if(event==="SIGNED_IN" && !P.ready && !isRecovery) enter();
  if(event==="SIGNED_OUT" && P.ready) location.replace(PAGE_URL);
});
document.addEventListener("DOMContentLoaded", async()=>{
  root().replaceChildren(el("div",{class:"acard"}, brand(), el("p",{class:"muted",text:"Loading…"})));
  const { data:{ session } } = await sb.auth.getSession();
  if(isRecovery && session) return screenNewPassword();
  if(session) enter(); else if(LS.get("cb.invite")) screenSignUp(); else screenSignIn();
});
})();
