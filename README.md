# Grand Aurora Theatre – Interactive Venue Ticketing System

Front-end ticket selection for a theatre (HTML + CSS + vanilla JavaScript, no dependencies).
Open `index.html` in a browser – no build step needed.

## Venue
| Section | Seats | Category | Price |
|---|---|---|---|
| Box Left / Box Right | 10 + 10 | VIP Box | $120 |
| Orchestra Center | 96 | Premium | $90 |
| Orchestra Left / Right | 48 + 48 | Standard | $70 |
| Mezzanine | 120 | Mezzanine | $55 |
| Balcony | 180 | Balcony | $35 |

About 512 seats, generated from the `SECTIONS` array in `app.js`. ~14% are deterministically marked unavailable.

## Features
- Seats generated from JS data (`SECTIONS`, `CATEGORIES`) as `<button>` elements
- Click = inspect (details + price); only **ADD TO CART** adds the ticket
- States: available, inspected, in cart, unavailable
- Zoom In/Out, Move Up/Down/Left/Right, Reset/Center View (with limits)
- Cart with prices, total, remove, clear; duplicate prevention
- Map and cart always in sync; cart stored in `localStorage` and restored on refresh
- Responsive layout (sidebar stacks under the map on narrow screens)
- **Bonus:** mouse-wheel zoom (towards cursor) and click/drag panning (also touch)
