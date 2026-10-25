/* Grand Aurora Theatre – Interactive Venue Ticketing System
 * Everything on the map is generated from the SECTIONS data below. */
(() => {
  'use strict';

  /* =====================================================
   * 1. VENUE DATA MODEL
   * ===================================================== */
  const SEAT_SIZE = 26;
  const PITCH = 30;               // distance between seat origins
  const WORLD = { width: 1200, height: 900 };
  const STORAGE_KEY = 'aurora-theatre-cart-v1';

  const CATEGORIES = {
    vip:      { name: 'VIP Box',          price: 120 },
    premium:  { name: 'Premium Orchestra', price: 90 },
    standard: { name: 'Standard Orchestra', price: 70 },
    mezz:     { name: 'Mezzanine',        price: 55 },
    balcony:  { name: 'Balcony',          price: 35 }
  };

  // x,y = top-left of the section in world pixels; curve bends rows toward the stage.
  const SECTIONS = [
    { id: 'BXL', name: 'Box Left',          category: 'vip',      rows: 5, cols: 2,  x: 100,  y: 160, curve: 0 },
    { id: 'BXR', name: 'Box Right',         category: 'vip',      rows: 5, cols: 2,  x: 1044, y: 160, curve: 0 },
    { id: 'OL',  name: 'Orchestra Left',    category: 'standard', rows: 8, cols: 6,  x: 214,  y: 150, curve: 0 },
    { id: 'OC',  name: 'Orchestra Center',  category: 'premium',  rows: 8, cols: 12, x: 420,  y: 150, curve: 0 },
    { id: 'OR',  name: 'Orchestra Right',   category: 'standard', rows: 8, cols: 6,  x: 810,  y: 150, curve: 0 },
    { id: 'MZ',  name: 'Mezzanine',         category: 'mezz',     rows: 5, cols: 24, x: 240,  y: 450, curve: 16 },
    { id: 'BL',  name: 'Balcony',           category: 'balcony',  rows: 6, cols: 30, x: 150,  y: 650, curve: 22 }
  ];

  const STAGE = { x: 400, y: 28, w: 400, h: 70 };

  // Deterministic "sold" seats so the layout is the same on every load.
  function isSold(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h % 100 < 14;
  }

  /* =====================================================
   * 2. GENERATE SEAT OBJECTS FROM DATA
   * ===================================================== */
  const seats = new Map(); // id -> seat object

  function buildSeats() {
    SECTIONS.forEach(sec => {
      const mid = (sec.cols - 1) / 2;
      for (let r = 0; r < sec.rows; r++) {
        const rowLetter = String.fromCharCode(65 + r);
        for (let c = 0; c < sec.cols; c++) {
          const num = c + 1;
          const id = `${sec.id}-${rowLetter}${num}`;
          const norm = mid ? (c - mid) / mid : 0;
          const x = sec.x + c * PITCH;
          const y = sec.y + r * PITCH + sec.curve * (norm * norm); // edges curve toward the stage
          // (center is lower, edges higher => wraps around stage)
          seats.set(id, {
            id,
            sectionId: sec.id,
            sectionName: sec.name,
            category: sec.category,
            row: rowLetter,
            number: num,
            x, y,
            price: CATEGORIES[sec.category].price,
            sold: isSold(id)
          });
        }
      }
    });
  }

  /* =====================================================
   * 3. DOM REFERENCES & STATE
   * ===================================================== */
  const $ = id => document.getElementById(id);
  const viewport = $('viewport');
  const world = $('world');
  const addBtn = $('add-to-cart');
  const message = $('message');

  const cart = new Set();      // seat ids in cart
  let inspectedId = null;
  const seatEls = new Map();   // id -> button element

  const fmt = n => '$' + n.toLocaleString('en-US');

  /* =====================================================
   * 4. RENDER VENUE
   * ===================================================== */
  function el(tag, cls, styles, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (styles) Object.assign(e.style, styles);
    if (text) e.textContent = text;
    return e;
  }

  function renderVenue() {
    world.style.width = WORLD.width + 'px';
    world.style.height = WORLD.height + 'px';

    const stage = el('div', 'stage', {
      left: STAGE.x + 'px', top: STAGE.y + 'px', width: STAGE.w + 'px', height: STAGE.h + 'px'
    }, 'STAGE');
    world.appendChild(stage);

    // section labels (generated from data)
    SECTIONS.forEach(sec => {
      const w = (sec.cols - 1) * PITCH + SEAT_SIZE;
      const lab = el('div', 'section-label', {
        left: sec.x + 'px', width: w + 'px', top: (sec.y - 36) + 'px'
      });
      lab.innerHTML = `<b>${sec.name}</b><br>${fmt(CATEGORIES[sec.category].price)}`;
      world.appendChild(lab);
    });

    // markers
    world.appendChild(el('div', 'marker', { left: '535px', top: '860px' }, '\u25BC Main Entrance'));
    world.appendChild(el('div', 'marker', { left: '40px', top: '420px' }, 'Exit'));
    world.appendChild(el('div', 'marker', { left: '1130px', top: '420px' }, 'Exit'));
    world.appendChild(el('div', 'marker', { left: '556px', top: '395px' }, 'Center aisle'));

    // seats
    const frag = document.createDocumentFragment();
    seats.forEach(seat => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seat';
      b.dataset.id = seat.id;
      b.dataset.cat = seat.category;
      b.style.left = seat.x + 'px';
      b.style.top = seat.y + 'px';
      b.textContent = seat.number;
      b.setAttribute('aria-label',
        `${seat.sectionName}, row ${seat.row}, seat ${seat.number}, ${fmt(seat.price)}${seat.sold ? ', unavailable' : ''}`);
      seatEls.set(seat.id, b);
      frag.appendChild(b);
    });
    world.appendChild(frag);

    renderLegend();
  }

  function renderLegend() {
    const ul = $('legend');
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="swatch cat" data-cat="${key}"></span>${cat.name} – ${fmt(cat.price)}`;
      ul.appendChild(li);
    });
    ul.insertAdjacentHTML('beforeend',
      '<li class="sep"></li>' +
      '<li><span class="swatch inspected"></span>Inspected</li>' +
      '<li><span class="swatch in-cart"></span>In cart</li>' +
      '<li><span class="swatch unavailable"></span>Unavailable</li>');
  }

  /* =====================================================
   * 5. SEAT STATE SYNC (single source of truth: cart / inspectedId / sold)
   * ===================================================== */
  function refreshSeat(id) {
    const seat = seats.get(id);
    const b = seatEls.get(id);
    if (!seat || !b) return;
    b.classList.toggle('in-cart', cart.has(id));
    b.classList.toggle('unavailable', seat.sold && !cart.has(id));
    b.classList.toggle('inspected', inspectedId === id);
    b.setAttribute('aria-pressed', inspectedId === id ? 'true' : 'false');
    b.setAttribute('aria-disabled', seat.sold ? 'true' : 'false');
  }

  function refreshAllSeats() { seats.forEach((_, id) => refreshSeat(id)); }

  function statusOf(seat) {
    if (cart.has(seat.id)) return 'In your cart';
    if (seat.sold) return 'Unavailable';
    return 'Available';
  }

  /* =====================================================
   * 6. INSPECTION
   * ===================================================== */
  function showMessage(text, kind) {
    message.textContent = text || '';
    message.className = 'message' + (kind ? ' ' + kind : '');
  }

  function inspect(id) {
    const prev = inspectedId;
    inspectedId = id;
    if (prev) refreshSeat(prev);
    refreshSeat(id);
    renderInspectPanel();
    showMessage('');
  }

  function renderInspectPanel() {
    const empty = $('inspect-empty');
    const details = $('inspect-details');
    const seat = inspectedId && seats.get(inspectedId);
    if (!seat) {
      empty.hidden = false; details.hidden = true;
      addBtn.disabled = true; addBtn.textContent = 'ADD TO CART';
      return;
    }
    empty.hidden = true; details.hidden = false;
    $('d-seat').textContent = seat.id;
    $('d-section').textContent = seat.sectionName;
    $('d-rownum').textContent = `Row ${seat.row} / Seat ${seat.number}`;
    $('d-category').textContent = CATEGORIES[seat.category].name;
    $('d-price').textContent = fmt(seat.price);
    $('d-status').textContent = statusOf(seat);

    const inCart = cart.has(seat.id);
    addBtn.disabled = seat.sold || inCart;
    addBtn.textContent = inCart ? 'ALREADY IN CART' : seat.sold ? 'UNAVAILABLE' : 'ADD TO CART';
  }

  /* =====================================================
   * 7. CART
   * ===================================================== */
  function addToCart() {
    const seat = inspectedId && seats.get(inspectedId);
    if (!seat) return;
    if (seat.sold) { showMessage('This seat is unavailable.', 'warn'); return; }
    if (cart.has(seat.id)) { showMessage('This seat is already in your cart.', 'warn'); return; }
    cart.add(seat.id);
    refreshSeat(seat.id);
    renderCart();
    renderInspectPanel();
    showMessage(`Seat ${seat.id} added to cart.`, 'ok');
  }

  function renderCart() {
    const list = $('cart-list');
    list.innerHTML = '';
    let total = 0;
    cart.forEach(id => {
      const s = seats.get(id);
      total += s.price;
      const li = document.createElement('li');
      li.innerHTML =
        `<div class="info"><strong>${s.sectionName}</strong>` +
        `<small>Row ${s.row}, Seat ${s.number} &middot; ${CATEGORIES[s.category].name}</small></div>` +
        `<div class="right"><span>${fmt(s.price)}</span>` +
        `<button type="button" class="remove" data-id="${id}" aria-label="Remove seat ${id} from cart">Remove</button></div>`;
      list.appendChild(li);
    });
    $('cart-total').textContent = fmt(total);
    $('cart-count').textContent = cart.size;
    $('cart-empty').hidden = cart.size > 0;
    $('clear-cart').disabled = cart.size === 0;
  }

  /* =====================================================
   * 10. EVENTS
   * ===================================================== */
  world.addEventListener('click', e => {
    const b = e.target.closest('.seat');
    if (b) inspect(b.dataset.id);
  });

  addBtn.addEventListener('click', addToCart);

  /* =====================================================
   * 11. INIT
   * ===================================================== */
  buildSeats();
  renderVenue();
  refreshAllSeats();
  renderCart();
  renderInspectPanel();
})();
