/* =====================================================================
   app.js — การทำงานทั้งหมดของเว็บ
   ข้อความบนหน้าเว็บเขียนแบบ L("ไทย","English") ค้นหาคำไทยที่อยากแก้ด้วย Ctrl+F ได้เลย

   สารบัญ (กด Ctrl+F แล้วพิมพ์หัวข้อ)
     [1] ภาษา            [2] ฐานข้อมูล + ข้อมูลทดลอง   [3] ตัวช่วย
     [4] แถบด้านบน        [5] หน้าร้าน                 [6] ตะกร้า
     [7] ล็อกอิน/สมัคร     [8] สั่งซื้อ                 [9] คำสั่งซื้อของลูกค้า + ใบแจ้งยอด
     [10] แอดมิน: ออเดอร์  [11] แอดมิน: สร้างออเดอร์     [12] แอดมิน: ฐานลูกค้า
     [13] แอดมิน: สินค้า/หมวด  [14] แอดมิน: ยอดขาย       [15] ปุ่มต่างๆ + เส้นทางหน้า
   ===================================================================== */

/* ============ [1] ภาษา ============ */
let lang = (()=>{ try{ return localStorage.getItem("cm_lang") || CONFIG.defaultLang }catch(e){ return CONFIG.defaultLang } })();
const L = (th,en) => lang==="en" ? en : th;
const loc = () => lang==="en" ? "en-GB" : "th-TH";

/* ============ [2] ฐานข้อมูล (จำลองในเบราว์เซอร์ด้วย localStorage) ============ */
const K = {db:"cm_db_v3", ses:"cm_ses_v3", cart:"cm_cart_v3"};
const load=(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } };
const store=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); return true }catch(e){ return false } };
const DAY = 864e5;

function freshCatalog(){
  const products = DEFAULT_PRODUCTS.map(p=>({...p}));
  products.forEach(p=>{ if(p.cat==="milk" && !p.img) p.img = CONFIG.milkPhoto; });
  return { cats: DEFAULT_CATS.map(c=>({...c})), products };
}

function seed(){
  const {cats,products} = freshCatalog();
  const byTh = Object.fromEntries(products.map(p=>[p.th,p]));
  const now = Date.now();
  const ymd = t => { const d=new Date(t); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
  let s = 7; const rnd = () => (s = (s*16807) % 2147483647) / 2147483647;   // สุ่มแบบคงที่ ให้ข้อมูลทดลองเหมือนเดิมทุกครั้ง

  const users = [
    {u:"admin",pw:"admin1234",role:"admin",name:"แอดมินสาขารังสิต"},
    {u:"somchai",pw:"milk1234",role:"customer",name:"ร้านชาบ้านสมชาย",alias:"สมชาย (ชาบ้าน)",tel:"081-234-5678",addr:"45/12 ซ.รังสิต-นครนายก 48 ต.ประชาธิปัตย์ อ.ธัญบุรี ปทุมธานี",fee:70,note:"ส่งก่อน 10 โมง"},
    {u:"noodee",pw:"tea5678",role:"customer",name:"หนูดี ชานมไข่มุก",alias:"หนูดี ตลาดรังสิต",tel:"089-111-2222",addr:"ตลาดรังสิต แผง B12",fee:0,note:"มารับเองตลอด"},
    {u:"kafae",pw:"cafe1234",role:"customer",name:"ร้านกาแฟหน้ามอ",alias:"กาแฟหน้ามอ (พี่บอส)",tel:"062-555-0101",addr:"ข้าง ม.รังสิต ประตู 2",fee:50,note:""},
    {u:"pangyen",pw:"bread1234",role:"customer",name:"ปังเย็นป้าแอ๊ด",alias:"ป้าแอ๊ด ปังเย็น",tel:"091-777-3434",addr:"ฟิวเจอร์พาร์ค รังสิต ทางเข้า 3",fee:60,note:"ชอบนมต้มแช่เย็น"}
  ].map(u=>({tel:"",addr:"",fee:null,note:"",alias:"",created:now-90*DAY,...u}));

  const baskets = {
    somchai:[["นมต้ม 5กก.",2],["ชาแดงตรามือ",3],["ข้นถุงคาร์เนชัน 2กก.",2],["ดรีมมี่",2],["แก้ว22 ลอนใสST",4],["ฝาโดม",2],["หลอด8มม.คละสีไม่หุ้ม",2]],
    noodee:[["นมดิบ 5กก.",1],["ไข่มุก โตจัน",4],["แก้ว22 แคปซูล",3],["หลอดมุก ไม่หุ้ม",5],["น้ำตาลทรายแดง",2]],
    kafae:[["สดทีพอทกล่อง",6],["กาแฟเรดคัพ กล่อง",1],["แก้ว16 เรียบใส",4],["ฝาเรียบ95 yye",4],["น้ำเชื่อม มิตรผล",3]],
    pangyen:[["นมต้ม 5กก.",1],["ขนมปัง ขาวหั่น2.2",8],["ขนมปัง เขียวหั่น2.2",6],["เนยแซมซั่น",2],["ข้นถุงทีพอท2กก.",1],["ช็อคโกแลต กระปุก",1]]
  };
  const every = {somchai:4,noodee:3,kafae:5,pangyen:2};
  const mkItems = list => list.map(([n,q])=>{ const p=byTh[n]; return p && {id:p.id,th:p.th,en:p.en,p:p.price,u:p.unit,q:Math.max(1,q + Math.round((rnd()-.5)*2))}; }).filter(Boolean);
  const orders = [];
  for(const [u,gap] of Object.entries(every)){
    const cu = users.find(x=>x.u===u);
    for(let d=60; d>=3; d-=gap + Math.round(rnd()*2)){
      const t = now - d*DAY + Math.round(rnd()*8)*3600e3;
      const pick = u==="noodee";
      orders.push({user:u, items:mkItems(baskets[u]), method:pick?"pickup":"delivery", reqDate:ymd(t+DAY), reqSlot:CONFIG.slots[Math.floor(rnd()*CONFIG.slots.length)],
        addr:pick?"":cu.addr, tel:cu.tel, note:"", created:t, status:"shipped", pay: rnd()<0.06 && d<20 ? "unpaid" : "paid", shipFee: pick?0:cu.fee,
        confirmDate:ymd(t+DAY), confirmTime:"09:00", adminNote:""});
    }
  }
  const add = (u,ago,o) => { const cu=users.find(x=>x.u===u); const t=now-ago*DAY;
    orders.push(Object.assign({user:u,items:mkItems(baskets[u]),method:"delivery",reqDate:ymd(now+DAY),reqSlot:CONFIG.slots[0],addr:cu.addr,tel:cu.tel,note:"",created:t,
      status:"pending",pay:"unpaid",shipFee:null,confirmDate:"",confirmTime:"",adminNote:""},o)); };
  add("pangyen",1.2,{status:"shipped",pay:"paid",shipFee:60,confirmDate:ymd(now),confirmTime:"08:30"});
  add("kafae",0.5,{status:"preparing",pay:"reported",shipFee:50,confirmDate:ymd(now+DAY),confirmTime:"10:00"});
  add("somchai",0.2,{status:"accepted",pay:"unpaid",shipFee:70,confirmDate:ymd(now+DAY),confirmTime:"09:30",adminNote:"ส่งรอบเช้า"});
  add("noodee",0.06,{method:"pickup",addr:"",reqSlot:CONFIG.slots[2],note:"ขอนมแช่เย็นนะคะ"});
  add("pangyen",0.02,{});

  orders.sort((a,b)=>a.created-b.created).forEach((o,i)=>{
    o.id = "CM-"+(1001+i);
    o.log = [{s:"pending",t:o.created}];
    FLOW.slice(1,FLOW.indexOf(o.status)+1).forEach((st,j)=>o.log.push({s:st,t:o.created+(j+1)*2*3600e3}));
  });
  return {ver:DATA_VERSION, cats, products, users, orders, seq:1001+orders.length};
}

const FLOW = ["pending","accepted","preparing","shipped"];
let db = load(K.db,null);
if(!db) db = seed();
if(db.ver !== DATA_VERSION){ Object.assign(db, freshCatalog(), {ver:DATA_VERSION}); }   // แก้ data.js แล้วเพิ่ม DATA_VERSION → โหลดสินค้าใหม่
let ses = load(K.ses,null);
let cart = load(K.cart,{});
function saveDb(){ if(!store(K.db,db)) toast(L("⚠️ พื้นที่เก็บข้อมูลเต็ม (รูปใหญ่เกินไป?)","⚠️ Storage full (images too large?)")); }
const saveCart = ()=>store(K.cart,cart);
saveDb();
addEventListener("storage",e=>{ if(e.key===K.db){ db=load(K.db,db); route(); } });

const me = () => ses && db.users.find(u=>u.u===ses.u);
const isAdmin = () => me()?.role==="admin";
const prod = id => db.products.find(p=>String(p.id)===String(id));
const cat = id => db.cats.find(c=>c.id===id) || {id, th:id, en:id, emoji:"🛒", color:"#eee"};
const userOf = u => db.users.find(x=>x.u===u) || {u, name:u};

/* ============ [3] ตัวช่วย ============ */
const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf = n => Number(n).toLocaleString(loc(),{minimumFractionDigits:0,maximumFractionDigits:2});
const baht = n => "฿"+nf(n);
const pname = p => (lang==="en" && p.en) ? p.en : p.th;              // ชื่อสินค้าตามภาษา
const uname = u => lang==="en" ? (UNIT_EN[u]||u) : u;                 // หน่วยตามภาษา
const cname = c => (lang==="en" && c.en) ? c.en : c.th;               // ชื่อหมวดตามภาษา
const custName = u => u.alias || u.name;                               // ชื่อที่แอดมินเห็น
const dTH = s => s ? new Date(s+"T00:00").toLocaleDateString(loc(),{weekday:"short",day:"numeric",month:"short",year:"2-digit"}) : "-";
const tTH = t => new Date(t).toLocaleString(loc(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
const ymdOf = t => { const d=new Date(t); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
const todayYMD = () => ymdOf(Date.now());
const sub = o => o.items.reduce((s,i)=>s+i.p*i.q,0);
const grand = o => sub(o) + (o.shipFee||0);
const isPickup = o => o.method==="pickup";
const STATUS = () => ({pending:L("รอร้านยืนยัน","Awaiting confirmation"),accepted:L("รับออเดอร์แล้ว","Order accepted"),preparing:L("เตรียมของแล้ว","Prepared"),shipped:L("จัดส่งแล้ว","Delivered"),cancelled:L("ยกเลิก","Cancelled")});
const PAY = () => ({none:L("รอใบแจ้งยอด","Awaiting bill"),unpaid:L("ยังไม่ชำระ","Unpaid"),reported:L("แจ้งโอนแล้ว · รอตรวจ","Payment reported"),paid:L("ชำระแล้ว","Paid")});
const stLabel = o => o.status==="shipped" && isPickup(o) ? L("ลูกค้ารับของแล้ว","Picked up") : STATUS()[o.status];
const payKey = o => o.status==="cancelled" ? null : (o.status==="pending" ? "none" : o.pay);
const pill = (cls,txt) => `<span class="pill ${cls}">${esc(txt)}</span>`;
const stPill = o => pill("s-"+o.status, stLabel(o));
const payPill = o => { const k=payKey(o); return k ? pill("p-"+k, PAY()[k]) : ""; };
const myOrders = () => db.orders.filter(o=>o.user===ses?.u).sort((a,b)=>b.created-a.created);
const itemsText = o => o.items.map(i=>esc(pname(i))+" ×"+i.q).join(" · ");
let tt; function toast(m){ const t=$("toast"); t.textContent=m; t.classList.add("on"); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove("on"),1800); }
const thumbHTML = (p, cls="") => { const c=cat(p.cat); return `<div class="${cls}" style="background:${esc(c.color)}"><span class="emo">${c.emoji}</span>${p.img?`<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">`:""}</div>`; };

/* ============ [4] แถบด้านบน ============ */
$("logo").src = CONFIG.logo;
$("logo").onerror = ()=>{ $("logo").remove(); $("wm").style.display="block"; };

function renderChrome(){
  document.documentElement.lang = lang;
  document.title = CONFIG.shop[lang];
  $("brandName").textContent = lang==="en" ? "Rangsit Branch" : "สาขารังสิต";
  $("brandTag").textContent = CONFIG.tagline[lang];
  $("foot").textContent = `${CONFIG.shop[lang]} · ${L("โทร","Tel")} ${CONFIG.phone}`;
  $("dTitle").textContent = L("ตะกร้าสินค้า","Your cart");
  $("fabR").textContent = L("ดูตะกร้า →","View cart →");
}
function renderNav(){
  const u = me(), h = location.hash || "#/";
  const langSw = `<div class="lang"><button class="${lang==="th"?"on":""}" data-a="lang" data-l="th">TH</button><button class="${lang==="en"?"on":""}" data-a="lang" data-l="en">EN</button></div>`;
  let html = langSw;
  if(isAdmin()){
    html += `<a class="${h==="#/"?"on":""}" href="#/"><span class="ico">🏪</span> <span class="txt">${L("หน้าร้าน","Store")}</span></a>
      <a class="${h.startsWith("#/admin")?"on":""}" href="#/admin"><span class="ico">🛠️</span> <span class="txt">${L("หลังร้าน","Admin")}</span></a>
      <button class="lnk" data-a="logout" title="${L("ออกจากระบบ","Log out")}"><span class="ico">↩</span> <span class="txt">${L("ออก","Log out")}</span></button>`;
  } else {
    const active = u ? myOrders().filter(o=>o.status!=="cancelled" && (o.status!=="shipped" || o.pay!=="paid")).length : 0;
    const n = Object.values(cart).reduce((a,b)=>a+b,0);
    html += `<a class="${h==="#/"?"on":""}" href="#/"><span class="ico">🏪</span> <span class="txt">${L("สินค้า","Shop")}</span></a>` +
      (u ? `<a class="${h.startsWith("#/order")?"on":""}" href="#/orders"><span class="ico">🧾</span> <span class="txt">${L("คำสั่งซื้อ","Orders")}</span>${active?`<span class="dot">${active}</span>`:""}</a>` : "") +
      `<button class="lnk" data-a="openCart"><span class="ico">🛒</span> <span class="txt">${L("ตะกร้า","Cart")}</span>${n?`<span class="dot">${n}</span>`:""}</button>` +
      (u ? `<button class="lnk" data-a="logout" title="${esc(u.name)}"><span class="ico">↩</span> <span class="txt">${L("ออก","Log out")}</span></button>`
         : `<button class="btn pri sm" data-a="login">${L("เข้าสู่ระบบ","Log in")}</button>`);
  }
  $("nav").innerHTML = html;
  const n = Object.values(cart).reduce((a,b)=>a+b,0);
  $("fab").style.display = (!isAdmin() && n && innerWidth<=600 && h==="#/") ? "flex" : "none";
  $("fabL").textContent = `🛒 ${n} ${L("ชิ้น","items")} · ${baht(cartTotal())}`;
}

/* ============ [5] หน้าร้าน ============ */
let curCat = "all", query = "";
const visibleProducts = () => db.products.filter(p=>!p.hidden && db.cats.some(c=>c.id===p.cat));
function freqItems(){
  const f = {};
  myOrders().filter(o=>o.status!=="cancelled").forEach(o=>o.items.forEach(i=>{ f[i.id]=(f[i.id]||0)+1; }));
  return f;
}
function control(p){
  const q = cart[p.id]||0;
  return q ? `<div class="step"><button data-a="dec" data-id="${p.id}">−</button><span>${q} ${esc(uname(p.unit))}</span><button data-a="inc" data-id="${p.id}">+</button></div>`
           : `<button class="add" data-a="inc" data-id="${p.id}">+ ${L("ใส่ตะกร้า","Add")}</button>`;
}
function card(p,freq){
  const had = freq && freq[p.id] ? `<span class="had">${L(`เคยสั่ง ${freq[p.id]} ครั้ง`,`Ordered ${freq[p.id]}×`)}</span>` : "";
  return `<div class="card">${thumbHTML(p,"thumb").replace("</div>",had+"</div>")}
    <div class="info"><div class="name">${esc(pname(p))}</div><div class="price">${baht(p.price)} <small>/ ${esc(uname(p.unit))}</small></div>
    <div data-ctl="${p.id}">${control(p)}</div></div></div>`;
}
function viewShop(){
  const u = me(), cust = u && !isAdmin();
  const freq = cust ? freqItems() : null;
  const vis = visibleProducts();
  const favIds = freq ? Object.keys(freq).filter(id=>vis.some(p=>String(p.id)===id)).sort((a,b)=>freq[b]-freq[a]) : [];
  const cats = [{id:"all",label:L("ทั้งหมด","All"),emoji:"🗂️",n:vis.length}]
    .concat(favIds.length?[{id:"fav",label:L("สั่งประจำ","My usuals"),emoji:"⭐",n:favIds.length}]:[])
    .concat(db.cats.map(c=>({id:c.id,label:cname(c),emoji:c.emoji,n:vis.filter(p=>p.cat===c.id).length})).filter(c=>c.n));
  if(!cats.some(c=>c.id===curCat)) curCat="all";
  const side = cats.map(c=>`<button class="${curCat===c.id?"on":""}" data-a="cat" data-k="${esc(c.id)}"><span>${c.emoji}</span>${esc(c.label)}<span class="n">${c.n}</span></button>`).join("");
  const chips = cats.map(c=>`<button class="${curCat===c.id?"on":""}" data-a="cat" data-k="${esc(c.id)}">${esc(c.label)}</button>`).join("");

  let hello = "";
  if(cust){
    const last = myOrders().find(o=>o.status!=="cancelled");
    hello = `<div class="hello"><img class="bg" src="${esc(CONFIG.banner)}" alt="" onerror="this.remove()"><div class="grow">
      <h2>${L("สวัสดี","Hello,")} ${esc(u.name)}</h2>` +
      (last ? `<p>${L("สั่งเหมือนครั้งล่าสุด","Order the same as last time")} (${esc(last.id)} · ${tTH(last.created)})</p><div class="again">${itemsText(last)}</div></div>
      <button class="btn" data-a="reorder" data-id="${esc(last.id)}">🔁 ${L("สั่งซ้ำทั้งหมด","Reorder all")}</button>` : `<p>${L("เลือกสินค้าแล้วกดใส่ตะกร้าได้เลย","Pick products and add them to your cart")}</p></div>`) + `</div>`;
  } else if(!u){
    hello = `<div class="hello"><img class="bg" src="${esc(CONFIG.banner)}" alt="" onerror="this.remove()"><div class="grow"><h2>${L("นมสดคุณภาพ ส่งตรงถึงร้าน","Quality fresh milk, delivered to your shop")}</h2>
      <p>${L("เข้าสู่ระบบเพื่อสั่งซื้อ ดูประวัติ และสั่งซ้ำได้ในคลิกเดียว","Log in to order, see your history and reorder in one tap")}</p></div><button class="btn" data-a="login">${L("เข้าสู่ระบบ / สมัคร","Log in / Sign up")}</button></div>`;
  }
  $("app").innerHTML = `<div class="shop"><aside class="side">${side}</aside><div>
    ${hello}
    <div class="search"><span>🔍</span><input id="q" type="search" placeholder="${L("ค้นหาสินค้า เช่น นมต้ม แก้ว22 ไข่มุก","Search e.g. milk, cup, pearls")}" value="${esc(query)}"></div>
    <div class="chips" id="chips">${chips}</div><div id="plist"></div></div></div>`;
  $("q").oninput = e => { query = e.target.value; renderList(freq,favIds); };
  renderList(freq,favIds);
  const onChip = document.querySelector("#chips .on"); if(onChip) $("chips").scrollLeft = onChip.offsetLeft - 16;
}
function renderList(freq,favIds){
  const q = query.trim().toLowerCase(), vis = visibleProducts();
  let html = "";
  if(q){
    const items = vis.filter(p=>p.th.toLowerCase().includes(q) || (p.en||"").toLowerCase().includes(q));
    if(items.length) html = `<div class="grp"><h3>${L("ผลการค้นหา","Results for")} “${esc(query)}” · ${items.length}</h3><div class="grid">${items.map(p=>card(p,freq)).join("")}</div></div>`;
  } else if(curCat==="fav"){
    html = `<div class="grp"><h3>⭐ ${L("สั่งประจำ","My usuals")}</h3><div class="grid">${favIds.map(prod).filter(Boolean).map(p=>card(p,freq)).join("")}</div></div>`;
  } else {
    for(const c of db.cats){
      if(curCat!=="all" && curCat!==c.id) continue;
      const items = vis.filter(p=>p.cat===c.id); if(!items.length) continue;
      html += `<div class="grp"><h3>${esc(cname(c))}</h3><div class="grid">${items.map(p=>card(p,freq)).join("")}</div></div>`;
    }
  }
  $("plist").innerHTML = html || `<div class="empty">${L("ไม่พบสินค้า","No products found")} “${esc(query)}”</div>`;
}

/* ============ [6] ตะกร้า ============ */
const cartIds = () => Object.keys(cart).filter(id=>{ const p=prod(id); return p && !p.hidden; });
const cartTotal = () => cartIds().reduce((s,id)=>s+prod(id).price*cart[id],0);
function setQty(id,d){
  cart[id] = Math.max(0,(cart[id]||0)+d); if(!cart[id]) delete cart[id];
  saveCart();
  const p = prod(id);
  document.querySelectorAll(`[data-ctl="${id}"]`).forEach(el=>el.innerHTML=control(p));
  if($("drawer").classList.contains("on")) renderCart();
  renderNav();
}
function renderCart(){
  const ids = cartIds();
  if(!ids.length){
    $("dBody").innerHTML = `<div class="empty">🛒<br>${L("ยังไม่มีสินค้าในตะกร้า","Your cart is empty")}</div>`;
    $("dFoot").innerHTML = `<button class="btn out block" data-a="closeAll">${L("เลือกสินค้าต่อ","Continue shopping")}</button>`; return;
  }
  $("dBody").innerHTML = ids.map(id=>{ const p=prod(id),q=cart[id]; return `<div class="cl"><div class="ln">${esc(pname(p))}<small>${baht(p.price)} / ${esc(uname(p.unit))}</small></div>
    <div class="qty"><button data-a="dec" data-id="${id}">−</button><span>${q}</span><button data-a="inc" data-id="${id}">+</button></div><div class="lt">${baht(p.price*q)}</div></div>`; }).join("");
  $("dFoot").innerHTML = `<div class="sumrow total"><span>${L("ค่าสินค้า","Subtotal")}</span><span>${baht(cartTotal())}</span></div>
    <div class="hint">${L("ค่าส่งและเวลาจัดส่ง ร้านจะยืนยันหลังรับออเดอร์","Delivery fee and time will be confirmed by the shop")}</div>
    <button class="btn pri block" data-a="checkout">${L("ดำเนินการสั่งซื้อ","Checkout")}</button>
    <button class="btn out block sm" data-a="clearCart">${L("ล้างตะกร้า","Clear cart")}</button>`;
}
function openCart(){ renderCart(); $("drawer").classList.add("on"); $("scrim").classList.add("on"); }
function closeAll(){ ["drawer","scrim","modal"].forEach(i=>$(i).classList.remove("on")); }
function openModal(html, wide){ $("modal").className = "modal on" + (wide?" wide":""); $("modal").innerHTML = html; $("scrim").classList.add("on"); }

/* ============ [7] ล็อกอิน / สมัครสมาชิก ============ */
let afterLogin = null;
function openLogin(tab="login", next=null){
  afterLogin = next ?? afterLogin;
  const isL = tab==="login";
  openModal(`<div class="mhead"><div><h2>${isL?L("เข้าสู่ระบบ","Log in"):L("สมัครสมาชิก","Create account")}</h2><div class="hint">${esc(CONFIG.shop[lang])}</div></div><button class="x" data-a="closeAll">×</button></div>
   <div class="mtabs"><button class="${isL?"on":""}" data-a="loginTab" data-t="login">${L("เข้าสู่ระบบ","Log in")}</button><button class="${!isL?"on":""}" data-a="loginTab" data-t="reg">${L("ลูกค้าใหม่","New customer")}</button></div>
   <form id="authForm">` + (isL ? `
    <div class="fld"><label>${L("ชื่อผู้ใช้","Username")}</label><input id="lu" autocomplete="username" autocapitalize="none" required></div>
    <div class="fld"><label>${L("รหัสผ่าน","Password")}</label><input id="lp" type="password" autocomplete="current-password" required></div>
    <div class="err" id="aerr"></div><button class="btn pri block">${L("เข้าสู่ระบบ","Log in")}</button>
    <div class="demo"><b>${L("บัญชีทดลอง","Demo accounts")}</b><br>${L("ลูกค้า","Customer")}: <code>somchai</code> / <code>milk1234</code><br>${L("แอดมิน","Admin")}: <code>admin</code> / <code>admin1234</code>
      <div class="btnrow"><button type="button" class="btn sec sm" data-a="demo" data-u="somchai">${L("ลองเป็นลูกค้า","Try as customer")}</button><button type="button" class="btn sec sm" data-a="demo" data-u="admin">${L("ลองเป็นแอดมิน","Try as admin")}</button></div></div>` : `
    <div class="fld"><label>${L("ชื่อร้าน / ชื่อผู้สั่ง","Shop / your name")} *</label><input id="rn" required></div>
    <div class="fld"><label>${L("เบอร์โทร","Phone")} *</label><input id="rt" type="tel" inputmode="tel" required></div>
    <div class="fld"><label>${L("ที่อยู่จัดส่ง (ใส่ทีหลังได้)","Delivery address (optional)")}</label><textarea id="ra"></textarea></div>
    <div class="fld"><label>${L("ชื่อผู้ใช้ (a-z, 0-9 อย่างน้อย 4 ตัว)","Username (a-z, 0-9, min 4)")} *</label><input id="ru" autocomplete="username" autocapitalize="none" required></div>
    <div class="row2"><div class="fld"><label>${L("รหัสผ่าน (6 ตัวขึ้นไป)","Password (min 6)")} *</label><input id="rp" type="password" autocomplete="new-password" required></div>
    <div class="fld"><label>${L("ยืนยันรหัสผ่าน","Confirm password")} *</label><input id="rp2" type="password" autocomplete="new-password" required></div></div>
    <div class="err" id="aerr"></div><button class="btn pri block">${L("สร้างบัญชี","Create account")}</button>`) + `</form>`);
  $("authForm").onsubmit = e => { e.preventDefault(); isL ? doLogin($("lu").value.trim(),$("lp").value) : doRegister(); };
}
function doLogin(u,p){
  const user = db.users.find(x=>x.u.toLowerCase()===u.toLowerCase() && x.pw===p);
  if(!user){ $("aerr").textContent=L("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง","Wrong username or password"); return; }
  ses = {u:user.u}; store(K.ses,ses); closeAll();
  toast(L("ยินดีต้อนรับ ","Welcome, ")+user.name);
  const next = afterLogin; afterLogin=null;
  const target = user.role==="admin" ? "#/admin" : (next || "#/");
  if(location.hash===target) route(); else location.hash = target;
}
const validUser = (u,p,p2) => {
  if(!/^[a-z0-9_]{4,}$/.test(u)) return L("ชื่อผู้ใช้ต้องเป็น a-z, 0-9 อย่างน้อย 4 ตัว","Username must be a-z, 0-9, at least 4 characters");
  if(db.users.some(x=>x.u===u)) return L("ชื่อผู้ใช้นี้มีคนใช้แล้ว","Username already taken");
  if(p.length<6) return L("รหัสผ่านต้องมีอย่างน้อย 6 ตัว","Password must be at least 6 characters");
  if(p2!==undefined && p!==p2) return L("รหัสผ่านไม่ตรงกัน","Passwords don't match");
  return "";
};
function doRegister(){
  const n=$("rn").value.trim(), t=$("rt").value.trim(), a=$("ra").value.trim(), u=$("ru").value.trim().toLowerCase(), p=$("rp").value, p2=$("rp2").value;
  const err = m => $("aerr").textContent = m;
  if(!n) return err(L("กรุณาใส่ชื่อ","Please enter a name"));
  if(t.replace(/\D/g,"").length<9) return err(L("เบอร์โทรไม่ถูกต้อง","Invalid phone number"));
  const v = validUser(u,p,p2); if(v) return err(v);
  db.users.push({u,pw:p,role:"customer",name:n,alias:"",tel:t,addr:a,fee:null,note:"",created:Date.now()}); saveDb();
  doLogin(u,p);
}
function logout(){ ses=null; store(K.ses,null); toast(L("ออกจากระบบแล้ว","Logged out")); if(location.hash==="#/"||!location.hash) route(); else location.hash="#/"; }

/* ============ [8] สั่งซื้อ (checkout) ============ */
function viewCheckout(){
  const u = me(), ids = cartIds();
  if(!ids.length){ location.hash="#/"; return; }
  const tomorrow = ymdOf(Date.now()+DAY);
  $("app").innerHTML = `<div class="pagehead"><a class="back" href="#/">← ${L("กลับไปเลือกสินค้า","Back to shop")}</a></div>
  <div class="pagehead"><h1>${L("ยืนยันคำสั่งซื้อ","Confirm order")}</h1></div>
  <div class="cols"><form class="panel" id="coForm">
    <h3>${L("วิธีรับสินค้า","How to receive")}</h3>
    <div class="seg" style="margin-bottom:16px">
      <label><input type="radio" name="m" value="pickup"> 🏪 ${L("รับที่ร้าน","Pick up at shop")}</label>
      <label><input type="radio" name="m" value="delivery" checked> 🛵 ${L("ให้ร้านไปส่ง","Delivery")}</label></div>
    <div class="row2"><div class="fld"><label id="dLbl"></label><input type="date" id="cd" min="${todayYMD()}" value="${tomorrow}" required></div>
    <div class="fld"><label>${L("ช่วงเวลา","Time slot")} *</label><select id="cs">${CONFIG.slots.map(s=>`<option>${s}</option>`).join("")}</select></div></div>
    <div class="fld" id="addrBox"><label>${L("ที่อยู่จัดส่ง","Delivery address")} *</label><textarea id="ca">${esc(u.addr)}</textarea></div>
    <div class="fld"><label>${L("เบอร์ติดต่อ","Contact phone")}</label><input id="ct" value="${esc(u.tel)}"></div>
    <div class="fld"><label>${L("หมายเหตุถึงร้าน","Note to shop")}</label><textarea id="cn"></textarea></div>
    <div class="err" id="cerr"></div>
    <button class="btn pri block">${L("ส่งคำสั่งซื้อ","Place order")}</button>
    <p class="hint" style="margin:10px 0 0">${L("ร้านจะตรวจรายการ ใส่ค่าส่งและยืนยันเวลา แล้วใบแจ้งยอดจะขึ้นในหน้าคำสั่งซื้อ","The shop will confirm the delivery fee and time, then your bill appears on the order page")}</p>
  </form>
  <div class="panel"><h3>${L("รายการ","Items")} (${ids.length})</h3>
    <table class="lines"><tbody>${ids.map(id=>{const p=prod(id);return `<tr><td>${esc(pname(p))}<br><span class="hint">${cart[id]} ${esc(uname(p.unit))} × ${baht(p.price)}</span></td><td class="r">${baht(p.price*cart[id])}</td></tr>`}).join("")}</tbody></table>
    <div class="sumrow" style="margin-top:10px"><span>${L("ค่าสินค้า","Subtotal")}</span><span>${baht(cartTotal())}</span></div>
    <div class="sumrow"><span>${L("ค่าส่ง","Delivery")}</span><span class="hint" id="shipTxt"></span></div>
  </div></div>`;
  const sync = () => { const d = document.querySelector("input[name=m]:checked").value==="delivery";
    $("addrBox").style.display = d?"flex":"none";
    $("dLbl").textContent = (d?L("วันที่ต้องการให้ส่ง","Delivery date"):L("วันที่จะมารับ","Pick-up date"))+" *";
    $("shipTxt").textContent = d?L("ร้านแจ้งหลังรับออเดอร์","Confirmed by shop"):L("ไม่มี","None"); };
  document.querySelectorAll("input[name=m]").forEach(r=>r.onchange=sync); sync();
  $("coForm").onsubmit = e => {
    e.preventDefault();
    const m = document.querySelector("input[name=m]:checked").value, d=$("cd").value, a=$("ca").value.trim();
    if(!d || d < todayYMD()) return $("cerr").textContent=L("กรุณาเลือกวันที่ (วันนี้หรือหลังจากนี้)","Please choose today or a later date");
    if(m==="delivery" && !a) return $("cerr").textContent=L("กรุณาใส่ที่อยู่จัดส่ง","Please enter a delivery address");
    if(m==="delivery" && !u.addr) u.addr=a;
    const o = newOrder({user:u.u, items:ids.map(id=>snap(prod(id),cart[id])), method:m, reqDate:d, reqSlot:$("cs").value, addr:m==="delivery"?a:"", tel:$("ct").value.trim(), note:$("cn").value.trim()});
    cart={}; saveCart();
    toast(L("ส่งคำสั่งซื้อแล้ว รอร้านยืนยัน","Order sent — waiting for the shop"));
    location.hash = "#/order/"+o.id;
  };
}
const snap = (p,q) => ({id:p.id, th:p.th, en:p.en, p:p.price, u:p.unit, q});
function newOrder(o){
  const t = Date.now();
  const full = Object.assign({id:"CM-"+(db.seq++), created:t, status:"pending", pay:"unpaid", shipFee:null, confirmDate:"", confirmTime:"", adminNote:"", addr:"", tel:"", note:"", log:[{s:"pending",t}]}, o);
  db.orders.push(full); saveDb(); return full;
}

/* ============ [9] คำสั่งซื้อของลูกค้า + ใบแจ้งยอด ============ */
function viewOrders(){
  const list = myOrders();
  $("app").innerHTML = `<div class="pagehead"><h1>${L("คำสั่งซื้อของฉัน","My orders")}</h1><span class="sp"></span><span class="hint">${list.length} ${L("รายการ","orders")}</span></div>` +
   (list.length ? `<div class="olist">${list.map(o=>`
    <div class="ocard"><div><div class="no">${esc(o.id)}</div><div class="meta">${tTH(o.created)} · ${isPickup(o)?L("รับที่ร้าน","Pick-up"):L("ให้ร้านส่ง","Delivery")} ${dTH(o.confirmDate||o.reqDate)}</div>
      <div class="pills">${stPill(o)}${payPill(o)}</div></div>
      <div class="amt">${baht(o.shipFee==null?sub(o):grand(o))}<small>${o.shipFee==null?L("ยังไม่รวมค่าส่ง","excl. delivery"):L("รวมค่าส่งแล้ว","incl. delivery")}</small></div>
      <div class="items">${itemsText(o)}</div>
      <div class="acts"><a class="btn out sm" href="#/order/${esc(o.id)}">${L("ดูรายละเอียด","Details")}${payKey(o)==="unpaid"?" · "+L("ใบแจ้งยอด","Bill"):""}</a><button class="btn sec sm" data-a="reorder" data-id="${esc(o.id)}">🔁 ${L("สั่งซ้ำ","Reorder")}</button></div>
    </div>`).join("")}</div>` : `<div class="panel empty">${L("ยังไม่มีคำสั่งซื้อ","No orders yet")}<br><br><a class="btn pri" href="#/">${L("ไปเลือกสินค้า","Start shopping")}</a></div>`);
}
function timeline(o){
  if(o.status==="cancelled") return `<div class="waiting" style="background:#eee;color:#555">${L("ออเดอร์นี้ถูกยกเลิกแล้ว","This order was cancelled")}</div>`;
  const cur = FLOW.indexOf(o.status);
  const labels = [L("สั่งซื้อแล้ว","Ordered"),L("รับออเดอร์แล้ว","Accepted"),L("เตรียมของแล้ว","Prepared"), isPickup(o)?L("ลูกค้ารับของแล้ว","Picked up"):L("จัดส่งแล้ว","Delivered")];
  return `<div class="tl">${FLOW.map((s,i)=>{ const lg=o.log.find(l=>l.s===s);
    return `<div class="st ${i<=cur?"done":""} ${i===cur?"now":""}"><div class="c">${i<=cur?"✓":i+1}</div>${labels[i]}${lg?`<time>${tTH(lg.t)}</time>`:""}</div>`; }).join("")}</div>`;
}
/* ใบแจ้งยอด: ตามที่ขอ — จำนวนไม่มีหน่วย, ราคาในรายการไม่มี ฿, มี ฿ เฉพาะยอดรวม */
function billHTML(o, forAdmin){
  const items = `<table class="lines"><thead><tr><th>${L("รายการ","Item")}</th><th class="r">${L("จำนวน","Qty")}</th><th class="r">${L("ราคา","Price")}</th><th class="r">${L("รวม","Amount")}</th></tr></thead>
    <tbody>${o.items.map(i=>`<tr><td>${esc(pname(i))}</td><td class="r">${nf(i.q)}</td><td class="r">${nf(i.p)}</td><td class="r">${nf(i.p*i.q)}</td></tr>`).join("")}</tbody></table>`;
  if(o.status==="pending" && !forAdmin){
    return `<div class="panel"><h3>${L("รายการสินค้า","Items")}</h3>${items}
      <div class="sumrow" style="margin-top:10px"><span>${L("ค่าสินค้า","Subtotal")}</span><span>${baht(sub(o))}</span></div>
      <div class="waiting" style="margin-top:12px">⏳ ${L("รอร้านตรวจรายการและใส่ค่าส่ง ใบแจ้งยอดจะแสดงที่นี่หลังร้านรับออเดอร์","Waiting for the shop to confirm. Your bill with the delivery fee will appear here.")}</div></div>`;
  }
  const paid = o.pay==="paid";
  const acc = (o.log.find(l=>l.s==="accepted")||{t:o.created}).t;
  return `<div class="bill"><h3><span>${paid?L("ใบเสร็จรับเงิน","Receipt"):L("ใบแจ้งยอดชำระ","Bill")}</span><span class="hint">${esc(o.id)}</span></h3>
    <div class="sub">${esc(CONFIG.shop[lang])} · ${tTH(acc)}${forAdmin?` · ${esc(userOf(o.user).name)}`:""}</div>
    ${paid?`<div class="stamp">${L("ชำระแล้ว","PAID")}</div>`:""}
    ${items}
    <div style="margin-top:10px"><div class="sumrow"><span>${L("ค่าสินค้า","Subtotal")}</span><span>${nf(sub(o))}</span></div>
    <div class="sumrow"><span>${L("ค่าส่ง","Delivery")}${isPickup(o)?" ("+L("รับที่ร้าน","pick-up")+")":""}</span><span>${o.shipFee==null?"-":nf(o.shipFee)}</span></div>
    <div class="sumrow total"><span>${paid?L("ยอดที่ชำระ","Total paid"):L("ยอดที่ต้องชำระ","Amount due")}</span><span>${baht(grand(o))}</span></div></div>
    ${!forAdmin && o.status!=="cancelled" && !paid ? `<div class="payto noprint">${L("โอนผ่านพร้อมเพย์","PromptPay")} <b>${esc(CONFIG.promptpay)}</b><br>${L("ชื่อบัญชี","Account")} ${esc(CONFIG.promptpayName)}<br>${L("หรือจ่ายเงินสดตอนรับของ","or pay cash on receipt")}</div>
      ${o.pay==="unpaid" ? `<button class="btn ok block noprint" style="margin-top:12px" data-a="reportPaid" data-id="${esc(o.id)}">✅ ${L("โอนแล้ว แจ้งร้าน","I've paid — notify shop")}</button>` :
        `<div class="waiting noprint" style="margin-top:12px">${L("แจ้งโอนแล้ว · รอร้านตรวจสอบยอด","Payment reported · waiting for the shop to verify")}</div>`}` : ""}
    <div class="btnrow noprint" style="margin-top:12px"><button class="btn out sm" data-a="print">🖨️ ${L("พิมพ์ / บันทึก PDF","Print / Save PDF")}</button></div>
  </div>`;
}
function orderInfo(o, admin){
  const u = userOf(o.user);
  return `<dl class="kv">
    ${admin?`<dt>${L("ลูกค้า","Customer")}</dt><dd><a href="#/admin/c/${esc(u.u)}"><b>${esc(custName(u))}</b></a>${u.alias?`<br><span class="hint">${esc(u.name)}</span>`:""}</dd>`:""}
    <dt>${L("เบอร์","Phone")}</dt><dd>${esc(o.tel||u.tel||"-")}</dd>
    <dt>${L("วิธีรับ","Method")}</dt><dd>${isPickup(o)?"🏪 "+L("รับที่ร้าน","Pick-up"):"🛵 "+L("ให้ร้านไปส่ง","Delivery")}</dd>
    <dt>${L("ลูกค้าขอ","Requested")}</dt><dd>${dTH(o.reqDate)} · ${esc(o.reqSlot)}</dd>
    <dt>${L("ร้านยืนยัน","Confirmed")}</dt><dd>${o.confirmDate?`<b>${dTH(o.confirmDate)} · ${esc(o.confirmTime)}</b>`:`<span class="hint">${L("รอร้านยืนยัน","Pending")}</span>`}</dd>
    ${!isPickup(o)?`<dt>${L("ที่อยู่","Address")}</dt><dd>${esc(o.addr)}</dd>`:""}
    ${o.note?`<dt>${L("หมายเหตุ","Note")}</dt><dd>${esc(o.note)}</dd>`:""}
    ${o.adminNote?`<dt>${L("ข้อความจากร้าน","From shop")}</dt><dd>${esc(o.adminNote)}</dd>`:""}
    ${admin&&u.note?`<dt>${L("โน้ตลูกค้า","Customer note")}</dt><dd>📌 ${esc(u.note)}</dd>`:""}
  </dl>`;
}
function viewOrder(id){
  const o = db.orders.find(x=>x.id===id && x.user===ses.u);
  if(!o){ $("app").innerHTML=`<div class="panel empty">${L("ไม่พบคำสั่งซื้อ","Order not found")}</div>`; return; }
  $("app").innerHTML = `<div class="pagehead"><a class="back" href="#/orders">← ${L("คำสั่งซื้อทั้งหมด","All orders")}</a></div>
   <div class="pagehead"><h1>${esc(o.id)}</h1>${stPill(o)}${payPill(o)}<span class="sp"></span>
     <button class="btn sec sm noprint" data-a="reorder" data-id="${esc(o.id)}">🔁 ${L("สั่งซ้ำ","Reorder")}</button>
     ${o.status==="pending"?`<button class="btn danger sm noprint" data-a="cancel" data-id="${esc(o.id)}">${L("ยกเลิก","Cancel")}</button>`:""}</div>
   <div class="panel noprint" style="margin-bottom:16px">${timeline(o)}</div>
   <div class="cols"><div>${billHTML(o,false)}</div><div class="panel"><h3>${L("ข้อมูลการรับสินค้า","Delivery details")}</h3>${orderInfo(o,false)}</div></div>`;
}

/* ============ [10] แอดมิน: ออเดอร์ ============ */
function adminNav(active){
  const pend = db.orders.filter(o=>o.status==="pending").length;
  const tabs = [["orders","#/admin","📋 "+L("ออเดอร์","Orders"),pend],["new","#/admin/new","➕ "+L("สร้างออเดอร์","New order")],
    ["customers","#/admin/customers","👥 "+L("ฐานลูกค้า","Customers")],["products","#/admin/products","📦 "+L("สินค้า/หมวด","Products")],["sales","#/admin/sales","📊 "+L("ยอดขาย","Sales")]];
  return `<nav class="subnav">${tabs.map(([k,h,l,n])=>`<a class="${active===k?"on":""}" href="${h}">${l}${n?`<span class="dot">${n}</span>`:""}</a>`).join("")}</nav>`;
}
let adminTab = "todo";
function viewAdmin(){
  const O = db.orders.slice().sort((a,b)=>b.created-a.created);
  const pend = O.filter(o=>o.status==="pending"), work = O.filter(o=>["accepted","preparing"].includes(o.status));
  const unpaid = O.filter(o=>o.status!=="cancelled" && o.status!=="pending" && o.pay!=="paid");
  const reported = O.filter(o=>o.pay==="reported" && o.status!=="cancelled");
  const T = {todo:[L("ต้องจัดการ","To do"),O.filter(o=>o.status==="pending"||["accepted","preparing"].includes(o.status)||o.pay==="reported")],
             pending:[L("รอยืนยัน","Pending"),pend],work:[L("กำลังเตรียม","In progress"),work],unpaid:[L("ค้างชำระ","Unpaid"),unpaid],
             done:[L("เสร็จแล้ว","Completed"),O.filter(o=>o.status==="shipped"&&o.pay==="paid")],all:[L("ทั้งหมด","All"),O]};
  const rows = T[adminTab][1];
  $("app").innerHTML = adminNav("orders") + `<div class="pagehead"><h1>${L("จัดการคำสั่งซื้อ","Orders")}</h1><span class="sp"></span><button class="btn out sm" data-a="resetDemo">${L("รีเซ็ตข้อมูลทดลอง","Reset demo data")}</button></div>
  <div class="stats"><div class="stat"><b style="color:var(--amber)">${pend.length}</b><span>${L("รอยืนยัน","Pending")}</span></div>
    <div class="stat"><b style="color:var(--violet)">${work.length}</b><span>${L("กำลังเตรียม / รอส่ง","In progress")}</span></div>
    <div class="stat"><b style="color:var(--red)">${unpaid.length}</b><span>${L("ค้างชำระ","Unpaid")}${reported.length?` · ${L("แจ้งโอน","reported")} ${reported.length}`:""}</span></div>
    <div class="stat"><b>${baht(unpaid.reduce((s,o)=>s+grand(o),0))}</b><span>${L("ยอดค้างรับ","Outstanding")}</span></div></div>
  <div class="tabs">${Object.entries(T).map(([k,[l,a]])=>`<button class="tab ${adminTab===k?"on":""}" data-a="atab" data-k="${k}">${l} (${a.length})</button>`).join("")}</div>
  ${ordersTable(rows)}`;
}
function ordersTable(rows){
  if(!rows.length) return `<div class="panel empty">${L("ไม่มีรายการ","Nothing here")}</div>`;
  return `<div class="tblwrap"><table class="tbl"><thead><tr><th>${L("เลขที่","No.")}</th><th>${L("ลูกค้า","Customer")}</th><th class="hide-s">${L("รับ/ส่ง","Pick-up/Delivery")}</th><th>${L("สถานะ","Status")}</th><th class="r hide-s">${L("ยอด","Total")}</th></tr></thead><tbody>
  ${rows.map(o=>{const u=userOf(o.user);return `<tr class="click" data-a="aopen" data-id="${esc(o.id)}">
    <td><b>${esc(o.id)}</b><br><span class="hint">${tTH(o.created)}</span></td><td>${esc(custName(u))}<br><span class="hint">${o.items.length} ${L("รายการ","items")}</span></td>
    <td class="hide-s">${isPickup(o)?"🏪 "+L("รับเอง","Pick-up"):"🛵 "+L("ส่ง","Delivery")}<br><span class="hint">${dTH(o.confirmDate||o.reqDate)} ${esc(o.confirmTime||o.reqSlot)}</span></td>
    <td><div class="pills">${stPill(o)}${payPill(o)}</div></td><td class="r hide-s"><b>${baht(o.shipFee==null?sub(o):grand(o))}</b>${o.shipFee==null?`<br><span class="hint">+${L("ค่าส่ง","delivery")}</span>`:""}</td></tr>`}).join("")}
  </tbody></table></div>`;
}
function viewAdminOrder(id){
  const o = db.orders.find(x=>x.id===id);
  if(!o){ $("app").innerHTML=adminNav("orders")+`<div class="panel empty">${L("ไม่พบคำสั่งซื้อ","Order not found")}</div>`; return; }
  const u = userOf(o.user);
  const idx = FLOW.indexOf(o.status);
  const next = idx>=1 && idx<3 ? FLOW[idx+1] : null;
  const nextLbl = next==="preparing" ? "📦 "+L("เตรียมของแล้ว","Mark prepared") : next==="shipped" ? (isPickup(o)?"🤝 "+L("ลูกค้ารับของแล้ว","Mark picked up"):"🛵 "+L("จัดส่งแล้ว","Mark delivered")) : "";
  const editable = o.status!=="cancelled" && o.pay!=="paid";
  const defFee = o.shipFee ?? (isPickup(o) ? 0 : (u.fee ?? CONFIG.defaultShipFee));
  $("app").innerHTML = adminNav("orders") + `<div class="pagehead"><a class="back" href="#/admin">← ${L("รายการทั้งหมด","All orders")}</a></div>
  <div class="pagehead"><h1>${esc(o.id)}</h1>${stPill(o)}${payPill(o)}</div>
  <div class="panel" style="margin-bottom:16px">${timeline(o)}</div>
  <div class="cols"><div>
    ${editable?`<form class="panel" id="accForm"><h3>${o.status==="pending"?L("รับออเดอร์ · ใส่ค่าส่งและเวลา","Accept · set delivery fee & time"):L("แก้ไขค่าส่ง / เวลา","Edit delivery fee / time")}</h3>
      <div class="row2"><div class="fld"><label>${L("ค่าส่ง (บาท)","Delivery fee (฿)")}${o.shipFee==null&&u.fee!=null&&!isPickup(o)?` · <span style="color:var(--green)">${L("ดึงจากฐานลูกค้า","from customer profile")}</span>`:""}</label><input id="af" type="number" min="0" step="1" value="${defFee}" required></div>
      <div class="fld"><label>${L("ยอดรวมที่ลูกค้าต้องจ่าย","Customer pays")}</label><input id="ag" disabled></div></div>
      <div class="row2"><div class="fld"><label>${isPickup(o)?L("วันที่ลูกค้ามารับ","Pick-up date"):L("วันที่จัดส่ง","Delivery date")}</label><input id="ad" type="date" value="${esc(o.confirmDate||o.reqDate)}" required></div>
      <div class="fld"><label>${L("เวลา","Time")}</label><input id="at" type="time" value="${esc(o.confirmTime||(o.reqSlot||"09:00").slice(0,5))}" required></div></div>
      <div class="fld"><label>${L("ข้อความถึงลูกค้า","Message to customer")}</label><input id="an" value="${esc(o.adminNote)}"></div>
      <button class="btn pri block">${o.status==="pending"?"✅ "+L("รับออเดอร์ และส่งใบแจ้งยอด","Accept & send bill"):L("บันทึก","Save")}</button></form>`:""}
    <div class="panel"><h3>${L("อัปเดตสถานะ","Update status")}</h3>
      <div class="hint" style="margin-bottom:6px">${L("สถานะออเดอร์","Order status")}</div>
      <div class="btnrow" style="margin-bottom:14px">${next?`<button class="btn pri sm" data-a="advance" data-id="${esc(o.id)}">${nextLbl}</button>`:""}
        ${o.status==="pending"?`<span class="hint">${L("ใส่ค่าส่งและกดรับออเดอร์ก่อน","Accept the order first")}</span>`:""}
        ${o.status!=="cancelled"&&o.status!=="shipped"?`<button class="btn danger sm" data-a="acancel" data-id="${esc(o.id)}">${L("ยกเลิกออเดอร์","Cancel order")}</button>`:""}
        ${o.status==="shipped"?`<span class="hint">${L("ออเดอร์เสร็จสมบูรณ์","Completed")}</span>`:""}${o.status==="cancelled"?`<span class="hint">${L("ยกเลิกแล้ว","Cancelled")}</span>`:""}</div>
      ${o.status!=="cancelled"&&o.status!=="pending"?`<div class="hint" style="margin-bottom:6px">${L("สถานะการชำระเงิน","Payment")}</div><div class="btnrow">
        ${o.pay!=="paid"?`<button class="btn ok sm" data-a="markPaid" data-id="${esc(o.id)}">💰 ${L("ยืนยันได้รับเงินแล้ว","Mark as paid")}</button>`:`<button class="btn out sm" data-a="markUnpaid" data-id="${esc(o.id)}">${L("ย้อนเป็นยังไม่ชำระ","Mark unpaid")}</button>`}
        ${o.pay==="reported"?`<span class="hint">${L("ลูกค้าแจ้งโอนแล้ว ตรวจยอดในบัญชี","Customer reported payment — check your account")}</span>`:""}</div>`:""}
    </div>
    <div class="panel"><h3>${L("ข้อมูลลูกค้า","Customer")}</h3>${orderInfo(o,true)}</div>
  </div><div>${billHTML(o,true)}</div></div>`;
  if(editable){
    const upd = () => $("ag").value = baht(sub(o) + (+$("af").value||0));
    $("af").oninput = upd; upd();
    $("accForm").onsubmit = e => { e.preventDefault();
      o.shipFee = Math.max(0,+$("af").value||0); o.confirmDate=$("ad").value; o.confirmTime=$("at").value; o.adminNote=$("an").value.trim();
      if(o.status==="pending"){ o.status="accepted"; o.pay="unpaid"; o.log.push({s:"accepted",t:Date.now()}); toast(L("รับออเดอร์แล้ว · ลูกค้าเห็นใบแจ้งยอด","Accepted · bill sent")); } else toast(L("บันทึกแล้ว","Saved"));
      saveDb(); route(); };
  }
}

/* ============ [11] แอดมิน: สร้างออเดอร์แทนลูกค้า (รับทางโทรศัพท์/LINE) ============ */
let draft = null;
function viewAdminNew(params){
  const customers = db.users.filter(u=>u.role==="customer").sort((a,b)=>custName(a).localeCompare(custName(b),"th"));
  if(!draft || (params.c && draft.cust!==params.c)) draft = {cust:params.c||"", items:{}, method:"delivery", date:ymdOf(Date.now()+DAY), time:"09:00", fee:"", note:"", feeTouched:false};
  const u = draft.cust ? userOf(draft.cust) : null;
  if(u && !draft.feeTouched) draft.fee = draft.method==="pickup" ? 0 : (u.fee ?? CONFIG.defaultShipFee);
  if(u && draft.method==="delivery" && draft.addr==null) draft.addr = u.addr;
  const ids = Object.keys(draft.items).filter(id=>prod(id));
  const subtotal = ids.reduce((s,id)=>s+prod(id).price*draft.items[id],0);
  const last = u ? db.orders.filter(o=>o.user===u.u && o.status!=="cancelled").sort((a,b)=>b.created-a.created)[0] : null;
  $("app").innerHTML = adminNav("new") + `<div class="pagehead"><h1>${L("สร้างออเดอร์แทนลูกค้า","New order for a customer")}</h1></div>
  <div class="cols"><div>
    <div class="panel"><h3>1. ${L("เลือกลูกค้า","Customer")}</h3>
      <div class="fld"><select id="nc"><option value="">— ${L("เลือกลูกค้าจากฐานลูกค้า","Choose from customer list")} —</option>${customers.map(c=>`<option value="${esc(c.u)}" ${c.u===draft.cust?"selected":""}>${esc(custName(c))}${c.alias?` (${esc(c.name)})`:""}</option>`).join("")}</select></div>
      ${u?`<dl class="kv"><dt>${L("เบอร์","Phone")}</dt><dd>${esc(u.tel||"-")}</dd><dt>${L("ที่อยู่","Address")}</dt><dd>${esc(u.addr||"-")}</dd><dt>${L("ค่าส่งประจำ","Usual fee")}</dt><dd>${u.fee==null?"-":baht(u.fee)}</dd>${u.note?`<dt>${L("โน้ต","Note")}</dt><dd>📌 ${esc(u.note)}</dd>`:""}</dl>
        ${last?`<div class="btnrow" style="margin-top:12px"><button class="btn sec sm" data-a="draftLast">🔁 ${L("ดึงรายการล่าสุด","Load last order")} (${esc(last.id)})</button></div>`:""}`
       :`<div class="hint">${L("ยังไม่มีลูกค้า? เพิ่มได้ที่เมนู ฐานลูกค้า","Not listed? Add them under Customers")}</div>`}
    </div>
    <div class="panel"><h3>2. ${L("เพิ่มสินค้า","Add products")}</h3>
      <div class="picker"><div class="search" style="margin:0"><span>🔍</span><input id="np" placeholder="${L("พิมพ์ชื่อสินค้า","Type a product name")}" autocomplete="off"></div><div class="res" id="npRes" hidden></div></div>
      ${ids.length?`<div style="margin-top:8px">${ids.map(id=>{const p=prod(id);return `<div class="cl"><div class="ln">${esc(pname(p))}<small>${baht(p.price)} / ${esc(uname(p.unit))}</small></div>
        <div class="qty"><button type="button" data-a="dq" data-id="${id}" data-d="-1">−</button><input data-q="${id}" inputmode="numeric" value="${draft.items[id]}"><button type="button" data-a="dq" data-id="${id}" data-d="1">+</button></div><div class="lt">${baht(p.price*draft.items[id])}</div></div>`}).join("")}</div>`
       :`<div class="empty" style="padding:24px">${L("ยังไม่มีสินค้า","No items yet")}</div>`}
    </div></div>
    <form class="panel" id="nForm"><h3>3. ${L("การรับสินค้าและค่าส่ง","Delivery & fee")}</h3>
      <div class="seg" style="margin-bottom:14px"><label><input type="radio" name="nm" value="pickup" ${draft.method==="pickup"?"checked":""}> 🏪 ${L("รับที่ร้าน","Pick-up")}</label><label><input type="radio" name="nm" value="delivery" ${draft.method==="delivery"?"checked":""}> 🛵 ${L("ไปส่ง","Delivery")}</label></div>
      <div class="row2"><div class="fld"><label>${L("วันที่","Date")}</label><input id="nd" type="date" value="${draft.date}"></div><div class="fld"><label>${L("เวลา","Time")}</label><input id="nt" type="time" value="${draft.time}"></div></div>
      ${draft.method==="delivery"?`<div class="fld"><label>${L("ที่อยู่จัดส่ง","Address")}</label><textarea id="na">${esc(draft.addr??"")}</textarea></div>`:""}
      <div class="fld"><label>${L("ค่าส่ง (บาท)","Delivery fee (฿)")}</label><input id="nf" type="number" min="0" value="${draft.fee}"></div>
      <div class="fld"><label>${L("หมายเหตุ","Note")}</label><input id="nn" value="${esc(draft.note)}"></div>
      <div class="sumrow"><span>${L("ค่าสินค้า","Subtotal")}</span><span>${baht(subtotal)}</span></div>
      <div class="sumrow"><span>${L("ค่าส่ง","Delivery")}</span><span>${baht(+draft.fee||0)}</span></div>
      <div class="sumrow total"><span>${L("รวม","Total")}</span><span>${baht(subtotal+(+draft.fee||0))}</span></div>
      <div class="err" id="nerr"></div>
      <button class="btn pri block">✅ ${L("สร้างออเดอร์ (รับออเดอร์แล้ว)","Create order (accepted)")}</button>
      <p class="hint">${L("ออเดอร์จะเข้าระบบเป็น “รับออเดอร์แล้ว” และลูกค้าเห็นใบแจ้งยอดทันที","The order starts as Accepted and the customer sees the bill right away")}</p>
    </form></div>`;
  const keep = () => { draft.date=$("nd").value; draft.time=$("nt").value; draft.note=$("nn").value; if($("na")) draft.addr=$("na").value; };
  $("nc").onchange = e => { keep(); draft.cust=e.target.value; draft.feeTouched=false; draft.addr=null; viewAdminNew({}); };
  document.querySelectorAll("input[name=nm]").forEach(r=>r.onchange=e=>{ keep(); draft.method=e.target.value; draft.feeTouched=false; viewAdminNew({}); });
  $("nf").oninput = e => { draft.fee=e.target.value; draft.feeTouched=true; };
  $("nf").onchange = () => { keep(); viewAdminNew({}); };
  document.querySelectorAll("[data-q]").forEach(inp=>inp.onchange=e=>{ keep(); const v=Math.max(0,parseInt(e.target.value)||0); if(v) draft.items[inp.dataset.q]=v; else delete draft.items[inp.dataset.q]; viewAdminNew({}); });
  const res = $("npRes");
  $("np").oninput = e => { const q=e.target.value.trim().toLowerCase(); if(!q){ res.hidden=true; return; }
    const m = db.products.filter(p=>p.th.toLowerCase().includes(q)||(p.en||"").toLowerCase().includes(q)).slice(0,12);
    res.innerHTML = m.length ? m.map(p=>`<button type="button" data-a="dadd" data-id="${p.id}"><span>${esc(pname(p))}</span><span class="hint">${baht(p.price)}/${esc(uname(p.unit))}</span></button>`).join("") : `<div class="hint" style="padding:10px">${L("ไม่พบ","No match")}</div>`;
    res.hidden=false; };
  $("nForm").onsubmit = e => { e.preventDefault(); keep();
    if(!u) return $("nerr").textContent=L("กรุณาเลือกลูกค้า","Choose a customer");
    if(!ids.length) return $("nerr").textContent=L("กรุณาเพิ่มสินค้า","Add at least one product");
    if(draft.method==="delivery" && !(draft.addr||"").trim()) return $("nerr").textContent=L("กรุณาใส่ที่อยู่","Enter an address");
    const o = newOrder({user:u.u, items:ids.map(id=>snap(prod(id),draft.items[id])), method:draft.method, reqDate:draft.date, reqSlot:draft.time, addr:draft.method==="delivery"?draft.addr.trim():"",
      tel:u.tel, note:draft.note.trim(), status:"accepted", shipFee:+draft.fee||0, confirmDate:draft.date, confirmTime:draft.time});
    o.log.push({s:"accepted",t:Date.now()}); saveDb(); draft=null;
    toast(L("สร้างออเดอร์ ","Created ")+o.id); location.hash="#/admin/o/"+o.id; };
}
window.draftKeep = () => { if($("nd")){ draft.date=$("nd").value; draft.time=$("nt").value; draft.note=$("nn").value; if($("na")) draft.addr=$("na").value; } };

/* ============ [12] แอดมิน: ฐานลูกค้า ============ */
let custQ = "";
function custStats(u){
  const os = db.orders.filter(o=>o.user===u.u && o.status!=="cancelled");
  return {n:os.length, spent:os.reduce((s,o)=>s+grand(o),0), owe:os.filter(o=>o.status!=="pending"&&o.pay!=="paid").reduce((s,o)=>s+grand(o),0), last:os.reduce((m,o)=>Math.max(m,o.created),0)};
}
function viewCustomers(){
  const q = custQ.trim().toLowerCase();
  const list = db.users.filter(u=>u.role==="customer").filter(u=>!q || [u.alias,u.name,u.tel,u.u,u.addr].join(" ").toLowerCase().includes(q))
    .map(u=>({u,s:custStats(u)})).sort((a,b)=>b.s.last-a.s.last);
  $("app").innerHTML = adminNav("customers") + `<div class="pagehead"><h1>${L("ฐานลูกค้า","Customers")}</h1><span class="hint">${list.length} ${L("ราย","customers")}</span><span class="sp"></span><button class="btn pri sm" data-a="custNew">＋ ${L("เพิ่มลูกค้า","Add customer")}</button></div>
  <div class="search"><span>🔍</span><input id="cq" placeholder="${L("ค้นหาชื่อ เบอร์ ที่อยู่","Search name, phone, address")}" value="${esc(custQ)}"></div>
  <div class="tblwrap"><table class="tbl"><thead><tr><th>${L("ชื่อที่ร้านเรียก","Display name")}</th><th class="hide-s">${L("เบอร์","Phone")}</th><th class="r">${L("ออเดอร์","Orders")}</th><th class="r hide-s">${L("ยอดซื้อรวม","Total spent")}</th><th class="r">${L("ค้างชำระ","Owes")}</th><th class="hide-s">${L("สั่งล่าสุด","Last order")}</th></tr></thead><tbody>
  ${list.map(({u,s})=>`<tr class="click" data-a="copen" data-id="${esc(u.u)}"><td><b>${esc(custName(u))}</b>${u.alias?`<br><span class="hint">${esc(u.name)}</span>`:""}</td><td class="hide-s">${esc(u.tel||"-")}</td>
    <td class="r">${s.n}</td><td class="r hide-s">${baht(s.spent)}</td><td class="r" style="${s.owe?"color:var(--red);font-weight:600":""}">${s.owe?baht(s.owe):"-"}</td><td class="hide-s">${s.last?tTH(s.last):"-"}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">${L("ไม่พบลูกค้า","No customers")}</td></tr>`}
  </tbody></table></div>`;
  $("cq").oninput = e => { custQ=e.target.value; const pos=e.target.selectionStart; viewCustomers(); $("cq").focus(); $("cq").setSelectionRange(pos,pos); };
}
function custForm(u){
  const isNew = !u; u = u || {alias:"",name:"",tel:"",addr:"",fee:"",note:"",u:""};
  return `<form id="cForm">
    <div class="fld"><label>${L("ลูกค้า","Customer")}</label><input id="cf_alias" value="${esc(u.alias)}" placeholder="${L("เช่น ป้าแอ๊ด ปังเย็น","e.g. Auntie's bread stall")}"></div>
    <div class="row2"><div class="fld"><label>${L("ชื่อร้าน / ชื่อลูกค้า","Shop / customer name")} *</label><input id="cf_name" value="${esc(u.name)}" required></div>
    <div class="fld"><label>${L("เบอร์โทร","Phone")}</label><input id="cf_tel" value="${esc(u.tel)}"></div></div>
    <div class="fld"><label>${L("ที่อยู่จัดส่ง","Delivery address")}</label><textarea id="cf_addr">${esc(u.addr)}</textarea></div>
    <div class="row2"><div class="fld"><label>${L("ค่าส่ง(บาท)","Delivery fee (฿)")}</label><input id="cf_fee" type="number" min="0" value="${u.fee??""}"></div>
    <div class="fld"><label>${L("โน้ตเกี่ยวกับลูกค้า","Internal note")}</label><input id="cf_note" value="${esc(u.note)}"></div></div>
    <div class="row2"><div class="fld"><label>${L("ชื่อผู้ใช้สำหรับล็อกอิน","Login username")}${isNew?" *":""}</label><input id="cf_u" value="${esc(u.u)}" ${isNew?"":"disabled"} autocapitalize="none"></div>
    <div class="fld"><label>${isNew?L("รหัสผ่าน","Password")+" *":L("ตั้งรหัสผ่านใหม่","New password")}</label><input id="cf_pw" type="text" autocomplete="off" ${isNew?`value="${"cm"+Math.floor(1000+Math.random()*9000)}"`:""}></div></div>
    <div class="err" id="cf_err"></div>
    <button class="btn pri block">${isNew?L("เพิ่มลูกค้า","Add customer"):L("บันทึกข้อมูลลูกค้า","Save customer")}</button></form>`;
}
function readCustForm(u, isNew){
  const g = id => $(id).value.trim();
  const err = m => { $("cf_err").textContent=m; return false; };
  if(!g("cf_name")) return err(L("กรุณาใส่ชื่อ","Name required"));
  if(isNew){ const v = validUser(g("cf_u").toLowerCase(), $("cf_pw").value); if(v) return err(v); }
  else if($("cf_pw").value && $("cf_pw").value.length<6) return err(L("รหัสผ่านต้องมีอย่างน้อย 6 ตัว","Password must be at least 6 characters"));
  Object.assign(u, {alias:g("cf_alias"), name:g("cf_name"), tel:g("cf_tel"), addr:g("cf_addr"), fee:g("cf_fee")===""?null:Math.max(0,+g("cf_fee")), note:g("cf_note")});
  if(isNew){ u.u=g("cf_u").toLowerCase(); u.pw=$("cf_pw").value; }
  else if($("cf_pw").value) u.pw=$("cf_pw").value;
  return true;
}
function openCustNew(){
  openModal(`<div class="mhead"><h2>${L("เพิ่มลูกค้าใหม่","Add customer")}</h2><button class="x" data-a="closeAll">×</button></div>${custForm(null)}
    <p class="hint">${L("แจ้งชื่อผู้ใช้/รหัสผ่านให้ลูกค้าเพื่อล็อกอินสั่งเองได้","Share the username/password so the customer can log in")}</p>`, true);
  $("cForm").onsubmit = e => { e.preventDefault(); const u={role:"customer",created:Date.now()}; if(!readCustForm(u,true)) return;
    db.users.push(u); saveDb(); closeAll(); toast(L("เพิ่มลูกค้าแล้ว","Customer added")); location.hash="#/admin/c/"+u.u; };
}
function viewCustomer(id){
  const u = db.users.find(x=>x.u===id && x.role==="customer");
  if(!u){ $("app").innerHTML=adminNav("customers")+`<div class="panel empty">${L("ไม่พบลูกค้า","Customer not found")}</div>`; return; }
  const s = custStats(u);
  const os = db.orders.filter(o=>o.user===u.u).sort((a,b)=>b.created-a.created);
  const f = {}; os.filter(o=>o.status!=="cancelled").forEach(o=>o.items.forEach(i=>{ f[i.id]=f[i.id]||{i,q:0}; f[i.id].q+=i.q; }));
  const top = Object.values(f).sort((a,b)=>b.q-a.q).slice(0,6);
  $("app").innerHTML = adminNav("customers") + `<div class="pagehead"><a class="back" href="#/admin/customers">← ${L("ฐานลูกค้า","Customers")}</a></div>
  <div class="pagehead"><h1>${esc(custName(u))}</h1><span class="sp"></span><a class="btn pri sm" href="#/admin/new?c=${esc(u.u)}">➕ ${L("สร้างออเดอร์ให้ลูกค้านี้","New order for this customer")}</a></div>
  <div class="stats"><div class="stat"><b>${s.n}</b><span>${L("ออเดอร์","Orders")}</span></div><div class="stat"><b>${baht(s.spent)}</b><span>${L("ยอดซื้อรวม","Total spent")}</span></div>
    <div class="stat"><b style="color:${s.owe?"var(--red)":"inherit"}">${baht(s.owe)}</b><span>${L("ค้างชำระ","Owes")}</span></div><div class="stat"><b style="font-size:17px">${s.last?tTH(s.last):"-"}</b><span>${L("สั่งล่าสุด","Last order")}</span></div></div>
  <div class="cols"><div><div class="panel"><h3>${L("ประวัติการสั่ง","Order history")}</h3>${os.length?ordersTable(os.slice(0,30)):`<div class="hint">${L("ยังไม่มีออเดอร์","No orders yet")}</div>`}</div>
    ${top.length?`<div class="panel"><h3>${L("สินค้าที่สั่งบ่อย","Frequently ordered")}</h3><table class="lines"><tbody>${top.map(t=>`<tr><td>${esc(pname(t.i))}</td><td class="r">${nf(t.q)} ${esc(uname(t.i.u))}</td></tr>`).join("")}</tbody></table></div>`:""}</div>
    <div class="panel"><h3>${L("ข้อมูลลูกค้า","Customer details")}</h3>${custForm(u)}
      <div class="hint" style="margin-top:10px">${L("สมัครเมื่อ","Joined")} ${u.created?tTH(u.created):"-"}</div>
      ${s.n?"":`<button class="btn danger sm" style="margin-top:12px" data-a="custDel" data-id="${esc(u.u)}">${L("ลบลูกค้า","Delete customer")}</button>`}</div></div>`;
  $("cForm").onsubmit = e => { e.preventDefault(); if(readCustForm(u,false)){ saveDb(); toast(L("บันทึกแล้ว","Saved")); route(); } };
}

/* ============ [13] แอดมิน: สินค้า / หมวดหมู่ ============ */
let admCat = "all", admQ = "";
function viewProducts(){
  const q = admQ.trim().toLowerCase();
  const list = db.products.filter(p=>(admCat==="all"||p.cat===admCat) && (!q || p.th.toLowerCase().includes(q) || (p.en||"").toLowerCase().includes(q)));
  $("app").innerHTML = adminNav("products") + `<div class="pagehead"><h1>${L("สินค้าและหมวดหมู่","Products & categories")}</h1><span class="sp"></span><button class="btn pri sm" data-a="pNew">＋ ${L("เพิ่มสินค้า","Add product")}</button></div>
  <div class="cols pr">
   <div><div class="search"><span>🔍</span><input id="pq" placeholder="${L("ค้นหาสินค้า","Search products")}" value="${esc(admQ)}"></div>
    <div class="tabs scroll"><button class="tab ${admCat==="all"?"on":""}" data-a="pcat" data-k="all">${L("ทั้งหมด","All")} (${db.products.length})</button>${db.cats.map(c=>`<button class="tab ${admCat===c.id?"on":""}" data-a="pcat" data-k="${esc(c.id)}">${c.emoji} ${esc(cname(c))}</button>`).join("")}</div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>${L("สินค้า","Product")}</th><th class="r">${L("ราคา","Price")}</th><th class="hide-s">${L("หมวด","Category")}</th><th>${L("แสดง","Visible")}</th></tr></thead><tbody>
    ${list.map(p=>`<tr class="click ${p.hidden?"off":""}" data-a="pEdit" data-id="${p.id}"><td>${thumbHTML(p,"mini")}</td><td><b>${esc(p.th)}</b><br><span class="hint">${esc(p.en||"")}</span></td>
      <td class="r">${nf(p.price)}<br><span class="hint">/${esc(uname(p.unit))}</span></td><td class="hide-s">${cat(p.cat).emoji} ${esc(cname(cat(p.cat)))}</td><td>${p.hidden?L("ซ่อน","Hidden"):"✓"}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">${L("ไม่พบสินค้า","No products")}</td></tr>`}
    </tbody></table></div></div>
   <div class="panel catpanel"><h3 style="display:flex;justify-content:space-between;align-items:center">${L("หมวดหมู่","Categories")}<button class="btn sec xs" data-a="cNew">＋ ${L("เพิ่ม","Add")}</button></h3>
    <div class="hint" style="margin-bottom:8px">${L("ลำดับตรงนี้ = ลำดับที่ลูกค้าเห็น","Order here = order customers see")}</div>
    ${db.cats.map((c,i)=>`<div class="catrow"><div class="sw" style="background:${esc(c.color)}">${c.emoji}</div><div class="nm">${esc(c.th)}<small>${esc(c.en||"")} · ${db.products.filter(p=>p.cat===c.id).length} ${L("รายการ","items")}</small></div>
      <button class="btn out xs" data-a="cUp" data-i="${i}" ${i===0?"disabled":""}>↑</button><button class="btn out xs" data-a="cDown" data-i="${i}" ${i===db.cats.length-1?"disabled":""}>↓</button><button class="btn sec xs" data-a="cEdit" data-i="${i}">${L("แก้","Edit")}</button></div>`).join("")}
   </div></div>`;
  $("pq").oninput = e => { admQ=e.target.value; const pos=e.target.selectionStart; viewProducts(); $("pq").focus(); $("pq").setSelectionRange(pos,pos); };
}
function resizeImage(file){
  return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onerror=rej; fr.onload=()=>{ const im=new Image(); im.onerror=rej; im.onload=()=>{
    const s=Math.min(1,600/Math.max(im.width,im.height)), c=document.createElement("canvas"); c.width=Math.round(im.width*s); c.height=Math.round(im.height*s);
    c.getContext("2d").drawImage(im,0,0,c.width,c.height); res(c.toDataURL("image/jpeg",.8)); }; im.src=fr.result; }; fr.readAsDataURL(file); });
}
function openProduct(id){
  const isNew = id==null;
  const p = isNew ? {id:null,th:"",en:"",price:"",unit:"ถุง",cat:admCat!=="all"?admCat:db.cats[0]?.id,img:"",hidden:false} : {...prod(id)};
  let img = p.img;
  const units = [...new Set(db.products.map(x=>x.unit).concat(Object.keys(UNIT_EN)))];
  openModal(`<div class="mhead"><h2>${isNew?L("เพิ่มสินค้า","Add product"):L("แก้ไขสินค้า","Edit product")}</h2><button class="x" data-a="closeAll">×</button></div>
   <form id="pForm"><div class="row2"><div><div class="imgprev" id="pPrev"></div>
      <div class="btnrow"><label class="btn sec sm" style="cursor:pointer">📷 ${L("อัปโหลดรูป","Upload")}<input type="file" id="pFile" accept="image/*" hidden></label><button type="button" class="btn out sm" id="pNoImg">${L("ลบรูป","Remove")}</button></div>
      <div class="fld" style="margin-top:10px"><label>${L("หรือวางลิงก์รูป","or paste image URL")}</label><input id="pUrl" value="${img&&!img.startsWith("data:")?esc(img):""}" placeholder="https://..."></div></div>
    <div><div class="fld"><label>${L("ชื่อ (ไทย)","Name (Thai)")} *</label><input id="pTh" value="${esc(p.th)}" required></div>
      <div class="fld"><label>${L("ชื่อ (อังกฤษ)","Name (English)")}</label><input id="pEn" value="${esc(p.en)}"></div>
      <div class="row2"><div class="fld"><label>${L("ราคา","Price")} *</label><input id="pPr" type="number" min="0" step="0.5" value="${p.price}" required></div>
      <div class="fld"><label>${L("หน่วย","Unit")}</label><input id="pUn" list="unitList" value="${esc(p.unit)}"><datalist id="unitList">${units.map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div></div>
      <div class="fld"><label>${L("หมวดหมู่","Category")}</label><select id="pCat">${db.cats.map(c=>`<option value="${esc(c.id)}" ${c.id===p.cat?"selected":""}>${c.emoji} ${esc(c.th)}</option>`).join("")}</select></div>
      <label class="check"><input type="checkbox" id="pHid" ${p.hidden?"checked":""}> ${L("ซ่อนจากลูกค้า (เช่น ของหมด)","Hide from customers (e.g. out of stock)")}</label></div></div>
    <div class="err" id="pErr"></div>
    <div class="btnrow" style="margin-top:6px"><button class="btn pri">${L("บันทึก","Save")}</button>${isNew?"":`<span class="sp" style="flex:1"></span><button type="button" class="btn danger sm" data-a="pDel" data-id="${p.id}">${L("ลบสินค้า","Delete")}</button>`}</div></form>`, true);
  const prev = () => { const c=cat($("pCat").value); $("pPrev").style.background=c.color; $("pPrev").innerHTML = c.emoji + (img?`<img src="${esc(img)}" alt="" onerror="this.remove()">`:""); };
  prev(); $("pCat").onchange = prev;
  $("pUrl").oninput = e => { img=e.target.value.trim(); prev(); };
  $("pNoImg").onclick = () => { img=""; $("pUrl").value=""; prev(); };
  $("pFile").onchange = async e => { const f=e.target.files[0]; if(!f) return; try{ img = await resizeImage(f); $("pUrl").value=""; prev(); }catch(x){ $("pErr").textContent=L("อ่านรูปไม่ได้","Couldn't read image"); } };
  $("pForm").onsubmit = e => { e.preventDefault();
    const data = {th:$("pTh").value.trim(), en:$("pEn").value.trim(), price:+$("pPr").value, unit:$("pUn").value.trim()||"ชิ้น", cat:$("pCat").value, img, hidden:$("pHid").checked};
    if(!data.th) return $("pErr").textContent=L("กรุณาใส่ชื่อ","Name required");
    if(isNew){ data.id = Math.max(0,...db.products.map(x=>+x.id||0))+1; db.products.push(data); }
    else Object.assign(prod(id), data);
    saveDb(); closeAll(); toast(L("บันทึกแล้ว","Saved")); viewProducts(); };
}
function openCat(i){
  const isNew = i==null, c = isNew ? {id:"",th:"",en:"",emoji:"🛒",color:"#eef0f4"} : db.cats[i];
  const n = isNew ? 0 : db.products.filter(p=>p.cat===c.id).length;
  openModal(`<div class="mhead"><h2>${isNew?L("เพิ่มหมวดหมู่","Add category"):L("แก้ไขหมวดหมู่","Edit category")}</h2><button class="x" data-a="closeAll">×</button></div>
   <form id="catForm"><div class="fld"><label>${L("ชื่อ (ไทย)","Name (Thai)")} *</label><input id="kTh" value="${esc(c.th)}" required></div>
   <div class="fld"><label>${L("ชื่อ (อังกฤษ)","Name (English)")}</label><input id="kEn" value="${esc(c.en)}"></div>
   <div class="row2"><div class="fld"><label>${L("ไอคอน (อีโมจิ)","Icon (emoji)")}</label><input id="kEm" value="${esc(c.emoji)}" maxlength="4"></div>
   <div class="fld"><label>${L("สีพื้นการ์ด","Card colour")}</label><input id="kCo" type="color" value="${esc(c.color)}" style="height:46px;padding:4px"></div></div>
   <div class="err" id="kErr"></div>
   <div class="btnrow"><button class="btn pri">${L("บันทึก","Save")}</button>${isNew?"":`<span style="flex:1"></span><button type="button" class="btn danger sm" data-a="cDel" data-i="${i}" ${n?`disabled title="${L("ย้ายสินค้าออกก่อน","Move products out first")}"`:""}>${L("ลบหมวด","Delete")}</button>`}</div>
   ${n?`<p class="hint">${L(`หมวดนี้มีสินค้า ${n} รายการ ต้องย้ายออกก่อนถึงจะลบได้`,`${n} products use this category — move them before deleting`)}</p>`:""}</form>`);
  $("catForm").onsubmit = e => { e.preventDefault();
    const d = {th:$("kTh").value.trim(), en:$("kEn").value.trim(), emoji:$("kEm").value.trim()||"🛒", color:$("kCo").value};
    if(!d.th) return $("kErr").textContent=L("กรุณาใส่ชื่อ","Name required");
    if(isNew) db.cats.push({id:"c"+Date.now().toString(36), ...d}); else Object.assign(c,d);
    saveDb(); closeAll(); toast(L("บันทึกแล้ว","Saved")); viewProducts(); };
}

/* ============ [14] แอดมิน: ยอดขาย ============ */
let salesP = "day", salesAnchor = new Date();
function periodRange(p, a){
  const d = new Date(a); d.setHours(0,0,0,0);
  if(p==="day") return [d, new Date(+d+DAY)];
  if(p==="week"){ const s=new Date(d); s.setDate(d.getDate()-((d.getDay()+6)%7)); const e=new Date(s); e.setDate(s.getDate()+7); return [s,e]; }
  const s = new Date(d.getFullYear(), d.getMonth(), 1), e = new Date(d.getFullYear(), d.getMonth()+1, 1); return [s,e];
}
function viewSales(){
  const [s,e] = periodRange(salesP, salesAnchor);
  const os = db.orders.filter(o=>o.status!=="cancelled" && o.created>=+s && o.created<+e);
  const total = os.reduce((t,o)=>t+grand(o),0), goods = os.reduce((t,o)=>t+sub(o),0), fees = os.reduce((t,o)=>t+(o.shipFee||0),0);
  const paid = os.filter(o=>o.pay==="paid"&&o.status!=="pending").reduce((t,o)=>t+grand(o),0);
  // กราฟ
  let buckets;
  if(salesP==="day"){ buckets = Array.from({length:15},(_,i)=>{ const h=6+i; return {x:String(h).padStart(2,"0"), v:os.filter(o=>new Date(o.created).getHours()===h || (i===0&&new Date(o.created).getHours()<6) || (i===14&&new Date(o.created).getHours()>20)).reduce((t,o)=>t+grand(o),0)}; }); }
  else { const n = Math.round((e-s)/DAY); buckets = Array.from({length:n},(_,i)=>{ const ds=+s+i*DAY; const d=new Date(ds);
    return {x: salesP==="week" ? d.toLocaleDateString(loc(),{weekday:"short"}) : String(d.getDate()), v:os.filter(o=>o.created>=ds&&o.created<ds+DAY).reduce((t,o)=>t+grand(o),0)}; }); }
  const max = Math.max(1,...buckets.map(b=>b.v));
  const label = salesP==="day" ? s.toLocaleDateString(loc(),{weekday:"long",day:"numeric",month:"long",year:"numeric"})
    : salesP==="week" ? `${s.toLocaleDateString(loc(),{day:"numeric",month:"short"})} – ${new Date(+e-DAY).toLocaleDateString(loc(),{day:"numeric",month:"short",year:"numeric"})}`
    : s.toLocaleDateString(loc(),{month:"long",year:"numeric"});
  // สินค้าขายดี / ลูกค้า
  const pm = {}; os.forEach(o=>o.items.forEach(i=>{ const k=i.id; pm[k]=pm[k]||{i,q:0,v:0}; pm[k].q+=i.q; pm[k].v+=i.q*i.p; }));
  const tops = Object.values(pm).sort((a,b)=>b.v-a.v).slice(0,10);
  const cm = {}; os.forEach(o=>{ cm[o.user]=cm[o.user]||{n:0,v:0}; cm[o.user].n++; cm[o.user].v+=grand(o); });
  const topc = Object.entries(cm).sort((a,b)=>b[1].v-a[1].v).slice(0,8);
  const isNow = periodRange(salesP,new Date())[0].getTime()===s.getTime();
  $("app").innerHTML = adminNav("sales") + `<div class="pagehead"><h1>${L("สรุปยอดขาย","Sales summary")}</h1></div>
  <div class="periodbar"><div class="tabs" style="margin:0">${[["day",L("วัน","Day")],["week",L("สัปดาห์","Week")],["month",L("เดือน","Month")]].map(([k,l])=>`<button class="tab ${salesP===k?"on":""}" data-a="sp" data-k="${k}">${l}</button>`).join("")}</div>
    <span style="flex:1"></span><button class="btn out sm" data-a="sNav" data-d="-1">‹</button><span class="lbl">${label}</span><button class="btn out sm" data-a="sNav" data-d="1" ${isNow?"disabled":""}>›</button>
    ${isNow?"":`<button class="btn sec sm" data-a="sNow">${L("ปัจจุบัน","Today")}</button>`}</div>
  <div class="stats"><div class="stat"><b style="color:var(--blue)">${baht(total)}</b><span>${L("ยอดขายรวม (รวมค่าส่ง)","Total sales (incl. delivery)")}</span></div>
    <div class="stat"><b>${os.length}</b><span>${L("ออเดอร์","Orders")} · ${L("เฉลี่ย","avg")} ${baht(os.length?total/os.length:0)}</span></div>
    <div class="stat"><b style="color:var(--green)">${baht(paid)}</b><span>${L("รับเงินแล้ว","Collected")}</span></div>
    <div class="stat"><b style="color:var(--red)">${baht(total-paid)}</b><span>${L("ยังไม่ได้รับ","Not yet collected")}</span></div></div>
  <div class="panel" style="margin-bottom:16px"><h3>${L("ยอดขาย","Sales")} ${salesP==="day"?L("ตามชั่วโมงที่สั่ง","by hour"):L("รายวัน","by day")}</h3>
    <div class="chart">${buckets.map(b=>`<div class="b" title="${esc(b.x)}: ${baht(b.v)}">${b.v&&buckets.length<=15?`<div class="tip">${nf(Math.round(b.v))}</div>`:""}<div class="bar ${b.v?"":"zero"}" style="height:${Math.max(1,b.v/max*85)}%"></div><div class="x">${esc(b.x)}</div></div>`).join("")}</div>
    <div class="hint" style="margin-top:8px">${L("ค่าสินค้า","Goods")} ${baht(goods)} · ${L("ค่าส่ง","Delivery fees")} ${baht(fees)} · ${L("ไม่รวมออเดอร์ที่ยกเลิก","excludes cancelled orders")}</div></div>
  <div class="cols"><div class="panel"><h3>${L("สินค้าขายดี","Top products")}</h3>${tops.length?`<table class="lines"><thead><tr><th>${L("สินค้า","Product")}</th><th class="r">${L("จำนวน","Qty")}</th><th class="r">${L("ยอด","Sales")}</th></tr></thead><tbody>${tops.map(t=>`<tr><td>${esc(pname(t.i))}</td><td class="r">${nf(t.q)}</td><td class="r">${nf(t.v)}</td></tr>`).join("")}</tbody></table>`:`<div class="hint">${L("ไม่มียอดขายในช่วงนี้","No sales in this period")}</div>`}</div>
    <div class="panel"><h3>${L("ลูกค้า","Customers")}</h3>${topc.length?`<table class="lines"><thead><tr><th>${L("ลูกค้า","Customer")}</th><th class="r">${L("ออเดอร์","Orders")}</th><th class="r">${L("ยอด","Sales")}</th></tr></thead><tbody>${topc.map(([u,v])=>`<tr><td><a href="#/admin/c/${esc(u)}">${esc(custName(userOf(u)))}</a></td><td class="r">${v.n}</td><td class="r">${nf(v.v)}</td></tr>`).join("")}</tbody></table>`:`<div class="hint">-</div>`}</div></div>`;
}

/* ============ [15] ปุ่มต่างๆ + เส้นทางหน้า ============ */
function reorder(id){
  const o = db.orders.find(x=>x.id===id); if(!o) return;
  let miss = 0;
  o.items.forEach(i=>{ const p=prod(i.id); if(p && !p.hidden) cart[p.id]=(cart[p.id]||0)+i.q; else miss++; });
  saveCart(); if(location.hash==="#/"||!location.hash) viewShop(); renderNav(); openCart();
  toast(miss?L(`ใส่ตะกร้าแล้ว (${miss} รายการไม่มีขาย)`,`Added (${miss} items unavailable)`):L("ใส่รายการเดิมลงตะกร้าแล้ว","Added your previous items to cart"));
}
const findO = el => db.orders.find(x=>x.id===el.dataset.id);
const ACT = {
  inc:e=>setQty(e.dataset.id,1), dec:e=>setQty(e.dataset.id,-1),
  openCart, closeAll, login:()=>openLogin("login"), logout,
  lang:e=>{ lang=e.dataset.l; try{ localStorage.setItem("cm_lang",lang) }catch(x){} renderChrome(); route(); },
  loginTab:e=>openLogin(e.dataset.t),
  demo:e=>doLogin(e.dataset.u, e.dataset.u==="admin"?"admin1234":"milk1234"),
  cat:e=>{ curCat=e.dataset.k; query=""; viewShop(); window.scrollTo(0,0); },
  clearCart:()=>{ cart={}; saveCart(); renderCart(); renderNav(); if(location.hash==="#/"||!location.hash) viewShop(); },
  checkout:()=>{ closeAll(); if(!me()) return openLogin("login","#/checkout"); if(isAdmin()) return toast(L("แอดมินสร้างออเดอร์ได้ที่เมนู สร้างออเดอร์","Admins: use New order")); location.hash="#/checkout"; },
  reorder:e=>{ if(!me()) return openLogin(); reorder(e.dataset.id); },
  cancel:e=>{ const o=findO(e); if(o&&o.status==="pending"&&confirm(L("ยกเลิกคำสั่งซื้อนี้?","Cancel this order?"))){ o.status="cancelled"; o.log.push({s:"cancelled",t:Date.now()}); saveDb(); route(); } },
  reportPaid:e=>{ findO(e).pay="reported"; saveDb(); toast(L("แจ้งร้านแล้ว","Shop notified")); route(); },
  print:()=>window.print(),
  atab:e=>{ adminTab=e.dataset.k; viewAdmin(); },
  aopen:e=>{ location.hash="#/admin/o/"+e.dataset.id; },
  advance:e=>{ const o=findO(e); const n=FLOW[FLOW.indexOf(o.status)+1]; if(n){ o.status=n; o.log.push({s:n,t:Date.now()}); saveDb(); toast(stLabel(o)); route(); } },
  acancel:e=>{ const o=findO(e); if(confirm(L("ยกเลิกออเดอร์ ","Cancel order ")+o.id+"?")){ o.status="cancelled"; o.log.push({s:"cancelled",t:Date.now()}); saveDb(); route(); } },
  markPaid:e=>{ findO(e).pay="paid"; saveDb(); toast(L("บันทึกรับเงินแล้ว","Marked as paid")); route(); },
  markUnpaid:e=>{ findO(e).pay="unpaid"; saveDb(); route(); },
  resetDemo:()=>{ if(confirm(L("ลบข้อมูลทั้งหมด (ออเดอร์ ลูกค้า สินค้าที่แก้) แล้วกลับไปใช้ข้อมูลทดลอง?","Erase everything and restore demo data?"))){ db=seed(); saveDb(); cart={}; saveCart(); ses={u:"admin"}; store(K.ses,ses); toast(L("รีเซ็ตแล้ว","Reset done")); route(); } },
  // สร้างออเดอร์
  dadd:e=>{ draftKeep(); draft.items[e.dataset.id]=(draft.items[e.dataset.id]||0)+1; viewAdminNew({}); $("np").focus(); },
  dq:e=>{ draftKeep(); const id=e.dataset.id; draft.items[id]=Math.max(0,(draft.items[id]||0)+(+e.dataset.d)); if(!draft.items[id]) delete draft.items[id]; viewAdminNew({}); },
  draftLast:()=>{ draftKeep(); const last=db.orders.filter(o=>o.user===draft.cust&&o.status!=="cancelled").sort((a,b)=>b.created-a.created)[0];
    if(last){ draft.items={}; last.items.forEach(i=>{ if(prod(i.id)) draft.items[i.id]=i.q; }); draft.method=last.method; draft.feeTouched=false; viewAdminNew({}); toast(L("ดึงรายการล่าสุดแล้ว","Loaded last order")); } },
  // ลูกค้า
  copen:e=>{ location.hash="#/admin/c/"+e.dataset.id; },
  custNew:openCustNew,
  custDel:e=>{ if(confirm(L("ลบลูกค้านี้?","Delete this customer?"))){ db.users=db.users.filter(u=>u.u!==e.dataset.id); saveDb(); location.hash="#/admin/customers"; } },
  // สินค้า
  pcat:e=>{ admCat=e.dataset.k; viewProducts(); },
  pNew:()=>openProduct(null), pEdit:e=>openProduct(e.dataset.id),
  pDel:e=>{ if(confirm(L("ลบสินค้านี้? (ออเดอร์เก่ายังเก็บชื่อและราคาไว้)","Delete this product? (past orders keep their copy)"))){ db.products=db.products.filter(p=>String(p.id)!==e.dataset.id); delete cart[e.dataset.id]; saveCart(); saveDb(); closeAll(); viewProducts(); } },
  cNew:()=>openCat(null), cEdit:e=>openCat(+e.dataset.i),
  cUp:e=>{ const i=+e.dataset.i; [db.cats[i-1],db.cats[i]]=[db.cats[i],db.cats[i-1]]; saveDb(); viewProducts(); },
  cDown:e=>{ const i=+e.dataset.i; [db.cats[i+1],db.cats[i]]=[db.cats[i],db.cats[i+1]]; saveDb(); viewProducts(); },
  cDel:e=>{ db.cats.splice(+e.dataset.i,1); saveDb(); closeAll(); viewProducts(); },
  // ยอดขาย
  sp:e=>{ salesP=e.dataset.k; viewSales(); },
  sNav:e=>{ const d=+e.dataset.d, a=new Date(salesAnchor); if(salesP==="day") a.setDate(a.getDate()+d); else if(salesP==="week") a.setDate(a.getDate()+7*d); else a.setMonth(a.getMonth()+d, 1); salesAnchor=a; viewSales(); },
  sNow:()=>{ salesAnchor=new Date(); viewSales(); }
};
document.addEventListener("click", ev=>{
  if(!ev.target.closest(".picker") && $("npRes")) $("npRes").hidden = true;
  const el = ev.target.closest("[data-a]"); if(!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if(f){ ev.preventDefault(); f(el); }
});
addEventListener("keydown", e=>{ if(e.key==="Escape") closeAll(); });
addEventListener("resize", renderNav);

function route(){
  const raw = location.hash || "#/";
  const [h, qs] = raw.split("?");
  const params = Object.fromEntries(new URLSearchParams(qs||""));
  const u = me();
  $("drawer").classList.remove("on");
  if(!$("modal").classList.contains("on")) $("scrim").classList.remove("on");
  if(h.startsWith("#/admin")){
    if(!isAdmin()){ location.hash="#/"; setTimeout(()=>openLogin("login"),0); return; }
    const [, , page, id] = h.split("/");
    if(!page) viewAdmin();
    else if(page==="o") viewAdminOrder(decodeURIComponent(id));
    else if(page==="new") viewAdminNew(params);
    else if(page==="customers") viewCustomers();
    else if(page==="c") viewCustomer(decodeURIComponent(id));
    else if(page==="products") viewProducts();
    else if(page==="sales") viewSales();
    else viewAdmin();
  } else if(h==="#/checkout"){
    if(!u || isAdmin()){ location.hash="#/"; return; } viewCheckout();
  } else if(h==="#/orders"){
    if(!u || isAdmin()){ location.hash="#/"; setTimeout(()=>openLogin("login","#/orders"),0); return; } viewOrders();
  } else if(h.startsWith("#/order/")){
    if(!u || isAdmin()){ location.hash="#/"; return; } viewOrder(decodeURIComponent(h.slice(8)));
  } else viewShop();
  renderNav();
}
let lastH = location.hash;
addEventListener("hashchange", ()=>{ route(); if(location.hash.split("?")[0]!==lastH.split("?")[0]) window.scrollTo(0,0); lastH=location.hash; });
renderChrome();
route();
