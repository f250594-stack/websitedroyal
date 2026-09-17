/* =========================================================
   D ROYAL FRAGRANCE — site logic
   Products load from assets/products.json so Sana can edit
   names/prices/stock/photos without touching any code.
   Cart persists in localStorage (client-side demo cart).
   ========================================================= */

const WHATSAPP_NUMBER = "923001234567"; // TODO: replace with real WhatsApp business number (country code, no +)
const CURRENCY = "Rs. ";

/* ---------- helpers ---------- */
function money(n){ return CURRENCY + Number(n).toLocaleString("en-PK"); }

function getProducts(){
  return fetch("/assets/products.json").then(r => r.json());
}

/* relative path fix for pages inside /pages/ etc. Try root first, fallback relative.
   If the page is opened directly as a file:// URL (no local server), fetch() is blocked
   by the browser, so we fall back to the embedded copy below. When this site is
   uploaded to real hosting (https://), the JSON file will load normally and become
   the single source of truth — edit assets/products.json to manage products. */
async function loadProducts(){
  const candidates = ["assets/products.json","/assets/products.json","../assets/products.json"];
  for (const url of candidates){
    try{
      const res = await fetch(url);
      if(res.ok) return await res.json();
    }catch(e){ /* try next */ }
  }
  return PRODUCTS_FALLBACK;
}

const PRODUCTS_FALLBACK = [
  {"id":"dr-noir-oud","name":"Noir Oud","gender":"men","price":6900,"compareAtPrice":8500,"sizeMl":100,"stock":14,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80","shortDescription":"A commanding blend of dark oud, smoked leather and amber for the man who enters a room before he speaks.","notes":{"top":["Bergamot","Black Pepper","Cardamom"],"heart":["Oud","Leather","Rose"],"base":["Amber","Sandalwood","Musk"]},"concentration":"Eau de Parfum"},
  {"id":"dr-velvet-rose","name":"Velvet Rose","gender":"women","price":6500,"compareAtPrice":null,"sizeMl":100,"stock":20,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80","shortDescription":"Layers of Turkish rose and soft vanilla wrapped in a whisper of white musk.","notes":{"top":["Pink Pepper","Bergamot","Litchi"],"heart":["Turkish Rose","Peony","Jasmine"],"base":["Vanilla","White Musk","Cedarwood"]},"concentration":"Eau de Parfum"},
  {"id":"dr-royal-amber","name":"Royal Amber","gender":"men","price":7400,"compareAtPrice":null,"sizeMl":100,"stock":9,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80","shortDescription":"Warm amber and aged vanilla wood, built for evenings that go long.","notes":{"top":["Cinnamon","Orange Blossom"],"heart":["Amber","Tobacco Leaf"],"base":["Vanilla","Dry Wood","Benzoin"]},"concentration":"Eau de Parfum"},
  {"id":"dr-blanc-jasmine","name":"Blanc Jasmine","gender":"women","price":5900,"compareAtPrice":7200,"sizeMl":50,"stock":25,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80","shortDescription":"Bright jasmine petals over clean linen musk — a signature for daylight hours.","notes":{"top":["Mandarin","Neroli"],"heart":["Jasmine Sambac","Lily of the Valley"],"base":["White Musk","Soft Woods"]},"concentration":"Eau de Toilette"},
  {"id":"dr-imperial-vetiver","name":"Imperial Vetiver","gender":"men","price":7900,"compareAtPrice":null,"sizeMl":100,"stock":11,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80","shortDescription":"Earthy vetiver root and crisp citrus, sharpened with a line of grey pepper.","notes":{"top":["Grapefruit","Grey Pepper"],"heart":["Vetiver","Geranium"],"base":["Oakmoss","Ambroxan"]},"concentration":"Eau de Parfum"},
  {"id":"dr-gold-oud-elixir","name":"Gold Oud Elixir","gender":"women","price":8200,"compareAtPrice":null,"sizeMl":100,"stock":7,"sourcing":"supplier","image":"https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=800&q=80","shortDescription":"Golden saffron and oud softened with rose and honeyed musk. Unmistakably regal.","notes":{"top":["Saffron","Pink Pepper"],"heart":["Rose","Oud"],"base":["Honey","Musk","Amber"]},"concentration":"Eau de Parfum"}
];

/* ---------- cart (localStorage) ---------- */
const Cart = {
  key: "dr_cart_v1",
  get(){ try{ return JSON.parse(localStorage.getItem(this.key)) || []; }catch(e){ return []; } },
  save(items){ localStorage.setItem(this.key, JSON.stringify(items)); renderCartCount(); },
  add(product, size, qty){
    const items = this.get();
    const lineId = product.id + "-" + size;
    const existing = items.find(i => i.lineId === lineId);
    if(existing){ existing.qty += qty; }
    else{
      items.push({
        lineId, id: product.id, name: product.name, price: product.price,
        image: product.image, size, qty
      });
    }
    this.save(items);
  },
  remove(lineId){
    this.save(this.get().filter(i => i.lineId !== lineId));
  },
  clear(){ this.save([]); },
  count(){ return this.get().reduce((a,i)=>a+i.qty,0); },
  total(){ return this.get().reduce((a,i)=>a+i.qty*i.price,0); }
};

function renderCartCount(){
  document.querySelectorAll("#cartCount").forEach(el => el.textContent = Cart.count());
}

function renderCartDrawer(){
  const wrap = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if(!wrap) return;
  const items = Cart.get();
  if(items.length === 0){
    wrap.innerHTML = '<div class="cart-empty">Your bag is empty.<br>Discover a signature scent.</div>';
  } else {
    wrap.innerHTML = items.map(i => `
      <div class="cart-row">
        <img src="${i.image}" alt="${i.name}">
        <div>
          <div class="nm">${i.name}</div>
          <div class="sub">${i.size}ml &nbsp;·&nbsp; Qty ${i.qty} &nbsp;·&nbsp; ${money(i.price)}</div>
          <div class="rm" data-remove="${i.lineId}">Remove</div>
        </div>
        <div class="sub">${money(i.price*i.qty)}</div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-remove]").forEach(btn=>{
      btn.addEventListener("click", ()=>{ Cart.remove(btn.dataset.remove); renderCartDrawer(); });
    });
  }
  if(totalEl) totalEl.textContent = money(Cart.total());
}

function openCart(){
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartDrawer")?.classList.add("open");
  renderCartDrawer();
}
function closeCart(){
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
}

function toast(msg){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------- WhatsApp helpers ---------- */
function waLink(message){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
function waOrderMessage(product, size, qty){
  return `Assalam-o-Alaikum! I'd like to order:\n\n${product.name} (${size}ml) x${qty}\nPrice: ${money(product.price)} each\n\nName:\nPhone:\nAddress:`;
}

/* ---------- product card rendering (shared by home / men / women) ---------- */
function renderCard(p){
  const badge = p.compareAtPrice ? '<span class="pc-badge">SALE</span>' : (p.stock <= 8 ? '<span class="pc-badge">LOW STOCK</span>' : '');
  const was = p.compareAtPrice ? `<span class="was">${money(p.compareAtPrice)}</span>` : '';
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="pc-media">
        <a href="product.html?id=${p.id}" tabindex="-1" aria-hidden="true">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </a>
        ${badge}
        <div class="pc-quick">
          <button class="btn small full quick-add" data-id="${p.id}" type="button">ADD TO CART</button>
        </div>
      </div>
      <div class="pc-body">
        <div class="cat">${p.gender === 'men' ? "MEN'S" : "WOMEN'S"} &middot; ${p.concentration.toUpperCase()}</div>
        <a href="product.html?id=${p.id}"><h4>${p.name}</h4></a>
        <div class="desc">${p.shortDescription}</div>
        <div class="pc-price"><span class="now">${money(p.price)}</span>${was}</div>
      </div>
    </div>
  `;
}

function attachQuickAdd(){
  document.querySelectorAll(".quick-add").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      e.preventDefault(); e.stopPropagation();
      const products = await loadProducts();
      const p = products.find(x=>x.id===btn.dataset.id);
      if(!p) return;
      Cart.add(p, p.sizeMl, 1);
      toast(p.name + " added to bag");
    });
  });
}

/* ---------- global init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCartCount();

  // mobile drawer
  const menuToggle = document.getElementById("menuToggle");
  const mobileDrawer = document.getElementById("mobileDrawer");
  menuToggle?.addEventListener("click", ()=> mobileDrawer.classList.add("open"));
  document.getElementById("drawerClose")?.addEventListener("click", ()=> mobileDrawer.classList.remove("open"));

  // cart drawer
  document.querySelectorAll("[data-open-cart]").forEach(b=>b.addEventListener("click", openCart));
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("cartClose")?.addEventListener("click", closeCart);

  // whatsapp float default (general enquiry)
  const waFloat = document.getElementById("waFloat");
  if(waFloat){
    waFloat.href = waLink("Assalam-o-Alaikum! I have a question about D Royal Fragrance perfumes.");
  }

  // newsletter (demo only — no backend wired yet)
  document.getElementById("newsletterForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    toast("Thank you for subscribing.");
    e.target.reset();
  });
});
