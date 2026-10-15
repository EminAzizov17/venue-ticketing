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
          const y = sec.y + r * PITCH + sec.curve * (norm * norm);
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

  buildSeats();
  console.log(seats.size + ' seats generated');
})();
