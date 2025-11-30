/* script.js — Wonderdiina
   - Cart (localStorage)
   - Currency MAD <-> EUR
   - Language switching (lang.json)
   - PayPal.me redirect
   - Hero audio behavior (play on homepage, mute when leaving)
*/

const PRODUCTS = [
  { id: 'agenda', name: 'Boho Agenda', priceMAD: 150, img: 'assets/images/agenda.jpg' },
  { id: 'mug', name: 'Cozy Boho Mug', priceMAD: 140, img: 'assets/images/mug.jpg' },
  { id: 'keychain', name: 'Handmade Keychain', priceMAD: 60, img: 'assets/images/keychain.jpg' },
  { id: 'print', name: 'Art Print', priceMAD: 200, img: 'assets/images/print.jpg' },
  { id: 'bookmark', name: 'Handmade Bookmark', priceMAD: 40, img: 'assets/images/bookmark.jpg' },
  { id: 'magnet', name: 'Decor Magnet', priceMAD: 35, img: 'assets/images/magnet.jpg' },
];

// conversion rate (MAD -> EUR). Adjust if needed.
const RATE_MAD_TO_EUR = 0.093;

let cart = JSON.parse(localStorage.getItem('wonderdiinaCart') || '[]');
function saveCart(){ localStorage.setItem('wonderdiinaCart', JSON.stringify(cart)); }
function getCurrency(){ return localStorage.getItem('wonderdiinaCurrency') || 'MAD'; }
function setCurrency(c){ localStorage.setItem('wonderdiinaCurrency', c); renderAll(); updateCartUI(); }

// convert money
function convert(mad, currency){
  if (currency === 'MAD') return mad;
  if (currency === 'EUR') {
    // multiply digit-by-digit safely:
    const raw = mad * RATE_MAD_TO_EUR;
    return Math.round(raw * 100) / 100;
  }
  return mad;
}

/* ------------------------------
   Products rendering (index + shop)
   ------------------------------ */
function renderPreviewProducts(){
  const el = document.getElementById('preview-products');
  if (!el) return;
  el.innerHTML = '';
  const currency = getCurrency();
  PRODUCTS.slice(0,3).forEach(p=>{
    const price = convert(p.priceMAD, currency).toFixed(2);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h4>${p.name}</h4>
      <div class="price">${price} ${currency}</div>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
      <a class="buy-btn" data-id="${p.id}">Buy</a>
    `;
    el.appendChild(card);
  });
  attachProductButtons();
}

function renderShopProducts() {
  const el = document.getElementById('shop-products');
  if (!el) return;
  el.innerHTML = '';
  const currency = getCurrency();
  PRODUCTS.forEach(p=>{
    const price = convert(p.priceMAD, currency).toFixed(2);
    const item = document.createElement('div');
    item.className = 'product-card';
    item.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h4>${p.name}</h4>
      <div class="price">${price} ${currency}</div>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
      <button class="buy-btn" data-id="${p.id}">Buy</button>
    `;
    el.appendChild(item);
  });
  attachProductButtons();
}

function attachProductButtons(){
  document.querySelectorAll('.add-btn').forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.id;
      addToCartById(id,1);
      showCartPopup();
    };
  });
  document.querySelectorAll('.buy-btn').forEach(btn=>{
    btn.onclick = async () => {
      const id = btn.dataset.id;
      // direct buy: create cart with single item, open PayPal link
      const product = PRODUCTS.find(p=>p.id===id);
      if (!product) return;
      const currency = getCurrency();
      const amount = convert(product.priceMAD, currency);
      redirectToPayPal(amount, currency);
    };
  });
}

/* ------------------------------
   Cart functions
   ------------------------------ */
function addToCartById(id, qty){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const existing = cart.find(i=>i.id === p.id);
  if(existing) existing.quantity += qty;
  else cart.push({ id: p.id, name: p.name, priceMAD: p.priceMAD, quantity: qty });
  saveCart();
  updateCartUI();
}

function removeFromCart(id){
  cart = cart.filter(i=>i.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, newQty){
  const it = cart.find(i=>i.id===id);
  if(!it) return;
  it.quantity = Math.max(1, Number(newQty));
  saveCart();
  updateCartUI();
}

function updateCartUI(){
  const countSpan = document.getElementById('cart-count');
  const countSpan2 = document.getElementById('cart-count-2');
  const popupCurrency = document.getElementById('cart-currency');
  const currency = getCurrency();
  const total = cart.reduce((s,ci)=> s + convert(ci.priceMAD,currency)*(ci.quantity||1),0);
  if(countSpan) countSpan.textContent = cart.reduce((s,i)=>s+i.quantity,0) || 0;
  if(countSpan2) countSpan2.textContent = cart.reduce((s,i)=>s+i.quantity,0) || 0;
  if(popupCurrency) popupCurrency.textContent = currency;
  // update popups lists if present
  const list = document.querySelectorAll('#cart-items, #cart-items-shop');
  list.forEach(el=>{
    if(!el) return;
    el.innerHTML = '';
    cart.forEach(ci=>{
      const li = document.createElement('li');
      const unit = convert(ci.priceMAD,currency);
      li.innerHTML = `${ci.name} × ${ci.quantity} — ${unit.toFixed(2)} ${currency}
        <div style="float:right">
          <button data-remove="${ci.id}" class="small">✕</button>
        </div>`;
      el.appendChild(li);
    });
  });
  // attach remove buttons
  document.querySelectorAll('[data-remove]').forEach(b=>{
    b.onclick = ()=> removeFromCart(b.dataset.remove);
  });

  // update checkout page if present
  const checkoutList = document.getElementById('checkout-list');
  const checkoutTotal = document.getElementById('checkout-total');
  if(checkoutList){
    checkoutList.innerHTML = '';
    let tot = 0;
    cart.forEach(ci=>{
      const li = document.createElement('li');
      const unit = convert(ci.priceMAD,currency);
      li.textContent = `${ci.name} × ${ci.quantity} — ${(unit*ci.quantity).toFixed(2)} ${currency}`;
      checkoutList.appendChild(li);
      tot += unit*ci.quantity;
    });
    if(checkoutTotal) checkoutTotal.textContent = tot.toFixed(2);
    // prepare PayPal link with total
    const paypalBtn = document.getElementById('paypal-pay');
    if(paypalBtn){
      const amount = tot.toFixed(2);
      const paypalLink = buildPayPalMeLink(amount, currency);
      paypalBtn.href = paypalLink;
    }
  }

  // update small totals in popup
  const cartTotalEls = document.querySelectorAll('#cart-total, #cart-total-shop');
  cartTotalEls.forEach(el=>{
    const t = cart.reduce((s,ci)=> s + convert(ci.priceMAD,currency)*(ci.quantity||1),0);
    el.textContent = t.toFixed(2);
  });
}

function clearCart(){
  cart = [];
  saveCart();
  updateCartUI();
}

/* ------------------------------
   Popup & UI helpers
   ------------------------------ */
function showCartPopup(){
  const popup = document.getElementById('cart-popup') || document.getElementById('cart-popup-shop');
  if(!popup) return;
  popup.classList.remove('hidden');
  popup.setAttribute('aria-hidden','false');
  updateCartUI();
}
function hideAllPopups(){
  document.querySelectorAll('.popup').forEach(p=>{
    p.classList.add('hidden');
    p.setAttribute('aria-hidden','true');
  });
}

/* attach top-level controls */
document.addEventListener('click', (e)=>{
  if(e.target && e.target.matches('#open-cart, #open-cart-2, .cart-btn')) {
    showCartPopup();
  }
  if(e.target && e.target.matches('.close-btn')) {
    hideAllPopups();
  }
  if(e.target && e.target.matches('#clear-cart')) {
    clearCart();
  }
});

/* ------------------------------
   PayPal.me redirect helper
   ------------------------------ */
function buildPayPalMeLink(amount, currency){
  // paypal.me supports: https://www.paypal.me/username/AMOUNT?currencyCode=CUR
  // Use your username 'incaprint25' (as given)
  // sanitize amount (2 decimals)
  const amt = Number(amount).toFixed(2);
  const cur = (currency === 'EUR' ? 'EUR' : 'MAD'); // PayPal may not accept MAD everywhere, but link is created
  return `https://www.paypal.me/incaprint25/${amt}?currencyCode=${cur}`;
}

function redirectToPayPal(amount, currency){
  const link = buildPayPalMeLink(amount, currency);
  window.open(link, '_blank');
}

/* ------------------------------
   Language switching (lang.json)
   ------------------------------ */
let TRANSLATIONS = {};
async function loadTranslations(){
  try {
    const r = await fetch('lang.json');
    TRANSLATIONS = await r.json();
  } catch(e) {
    console.warn('lang load error', e);
    TRANSLATIONS = {};
  }
}
function translatePage(lang){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const key = el.getAttribute('data-key');
    const text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || null;
    if(text) el.textContent = text;
  });
  if(lang === 'ar'){
    document.documentElement.dir = 'rtl';
    document.body.style.textAlign = 'right';
  } else {
    document.documentElement.dir = 'ltr';
    document.body.style.textAlign = 'left';
  }
  localStorage.setItem('wonderdiinaLang', lang);
}

/* ------------------------------
   Hero audio behavior
   - Play only for homepage, user gesture required in many browsers.
   - Pause/mute when leaving page or navigating.
*/
function heroAudioBehavior(){
  const audio = document.getElementById('heroAudio');
  const video = document.getElementById('heroVideo');
  // Play audio automatically if on homepage and user previously allowed
  if(!audio || !video) return;
  // Play on first click anywhere (soft)
  const tryPlay = () => {
    audio.volume = 0.12;
    audio.play().catch(() => {});
    window.removeEventListener('click', tryPlay);
  };
  window.addEventListener('click', tryPlay);

  // when page hidden/paged switched, pause audio
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) audio.pause();
    else if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ) {
      // do not auto-play without gesture, so leave paused
    }
  });

  // pause on unload/navigate away
  window.addEventListener('beforeunload', ()=> {
    audio.pause();
  });
}

/* ------------------------------
   Boot / render everything
   ------------------------------ */
async function renderAll(){
  // language and currency persisted
  const lang = localStorage.getItem('wonderdiinaLang') || 'en';
  const currency = localStorage.getItem('wonderdiinaCurrency') || 'MAD';

  // set select controls (if exist)
  document.querySelectorAll('#lang-switcher, #lang-switcher-header').forEach(s=>{
    if(s) s.value = lang;
    s?.addEventListener('change', (e)=> { translatePage(e.target.value); document.querySelectorAll('#lang-switcher, #lang-switcher-header').forEach(x=>x.value=e.target.value); });
  });

  document.querySelectorAll('#currency-switcher, #currency-switcher-header').forEach(s=>{
    if(s) s.value = currency;
    s?.addEventListener('change', (e)=> { setCurrency(e.target.value); document.querySelectorAll('#currency-switcher, #currency-switcher-header').forEach(x=>x.value=e.target.value); });
  });

  await loadTranslations();
  translatePage(lang);

  // render previews & shop
  renderPreviewProducts();
  renderShopProducts();
  updateCartUI();

  // attach extra UI
  heroAudioBehavior();

  // initialize checkout page totals & PayPal link if present
  const checkoutList = document.getElementById('checkout-list');
  if(checkoutList) updateCartUI();

  // cart popup close buttons
  document.querySelectorAll('.popup .close-btn').forEach(b => b.onclick = hideAllPopups);
}

/* Run on DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});
/* =========================
   Gallery + btn-buy binding
   (Append to end of script.js)
   ========================= */

(function(){
  // Ensure functions from existing script are available
  const safeAddToCart = (id, qty = 1) => {
    // Prefer existing function addToCartById if present
    if (typeof addToCartById === 'function') {
      addToCartById(id, qty);
    } else if (typeof addToCart === 'function') {
      addToCart(id, qty);
    } else {
      console.warn('No add-to-cart function found. Please ensure addToCartById or addToCart is defined.');
    }
    // Try to update UI using your updateCartUI if defined
    if (typeof updateCartUI === 'function') updateCartUI();
    // Show popup if available
    if (typeof showCartPopup === 'function') showCartPopup();
  };

  // Bind ".btn-buy" (category pages) to add-to-cart
  function bindBtnBuy() {
    document.querySelectorAll('.btn-buy').forEach(btn => {
      // avoid double binding
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', (e) => {
        const card = btn.closest('.product-card');
        if (!card) return;
        const id = card.getAttribute('data-id');
        if (!id) return;
        safeAddToCart(id, 1);
      });
    });
  }

  // Gallery: thumbnail click swaps main image
  function bindGalleryThumbs() {
    // Delegated handler for performance (works for dynamically added cards too)
    document.body.addEventListener('click', (e) => {
      const t = e.target;
      if (!t.classList.contains('product-thumb')) return;
      const gallery = t.closest('.gallery');
      if (!gallery) return;
      const main = gallery.querySelector('.product-main');
      if (main && t.src) main.src = t.src;
    });
  }

  // Small enhancement: when product main image fails, fallback to placeholder
  function fallbackImages() {
    document.querySelectorAll('.product-main, .product-thumb, .product-card img').forEach(img => {
      img.addEventListener('error', () => {
        img.src = 'assets/images/shop/placeholder_boho.jpg';
      });
    });
  }

  // Observe DOM changes to re-bind buy buttons (useful if product-cards are injected)
  const observer = new MutationObserver((mutations) => {
    bindBtnBuy();
    fallbackImages();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // init on load
  document.addEventListener('DOMContentLoaded', () => {
    bindBtnBuy();
    bindGalleryThumbs();
    fallbackImages();

    // Also make sure cart UI is up-to-date after binding
    if (typeof updateCartUI === 'function') updateCartUI();
  });

  // keyboard gallery navigation (left / right) for focused gallery
  document.addEventListener('keydown', (e) => {
    if (!document.activeElement) return;
    const focused = document.activeElement.closest && document.activeElement.closest('.gallery');
    if (!focused) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const thumbs = Array.from(focused.querySelectorAll('.product-thumb'));
      if (!thumbs.length) return;
      const main = focused.querySelector('.product-main');
      const idx = thumbs.findIndex(t => t.src === main.src);
      if (idx === -1) return;
      let next = idx + (e.key === 'ArrowRight' ? 1 : -1);
      if (next < 0) next = thumbs.length - 1;
      if (next >= thumbs.length) next = 0;
      main.src = thumbs[next].src;
      e.preventDefault();
    }
  });

})();
