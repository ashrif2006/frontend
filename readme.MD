# A7-Store — Frontend

The frontend for a multi-tenant e-commerce platform. This repository contains two independent, vanilla **HTML / CSS / Bootstrap 5 / JavaScript (ES Modules)** applications that both talk to the same [backend API](#):

- **`owner-frontend/`** — the dashboard store owners use to manage their shop.
- **`customer-frontend/`** — the public storefront ("A7-store") that customers browse and order from.

No build step, no framework, no bundler — every page is a standalone `.html` file that imports its own ES module from `js/`.

## Project Structure

```
owner-frontend/
├── index.html              Landing page (marketing)
├── login.html
├── register.html             Create a new store + admin account
├── dashboard.html              Stats overview, computed client-side
├── products.html                 Product list, search, filters, delete
├── product-form.html                Add / edit product
├── orders.html                        Order list, status workflow, WhatsApp link
├── store-settings.html                  Store name, slug, logo, WhatsApp number
├── css/theme.css
└── js/
    ├── api.js               All backend calls (auth, store, products, orders)
    ├── dashboard.js
    ├── products.js
    ├── product-form.js
    ├── orders.js
    └── store-settings.js

customer-frontend/
├── store.html              Storefront — product grid + offcanvas cart
├── product-details.html      Single product page — gallery, qty, related items
├── checkout.html               Order form + summary, success screen
├── css/theme.css
└── js/
    ├── api.js               Public store/product/order calls
    ├── cart.js                Cart persisted in localStorage
    ├── ui.js                   Shared render helpers (store info, formatting)
    ├── cart-ui.js               Offcanvas cart renderer (shared across pages)
    ├── store.js
    ├── product-details.js
    └── checkout.js
```

## Two Separate Visual Identities

The two apps deliberately **do not** share a design system — they serve different audiences and have their own `theme.css`:

| | Owner Dashboard | Customer Storefront (A7-store) |
|---|---|---|
| Palette | Ink black + teal-green accent | White + bold indigo + warm yellow |
| Typeface | Fraunces (display) + Plus Jakarta Sans | Sora (display) + Plus Jakarta Sans |
| Signature motif | Receipt / perforated-ticket accents | Tilted "A7" monogram badge |
| Audience | Store owner managing a business | Shopper browsing and buying |

## Owner Dashboard — Pages

- **Landing (`index.html`)** — hero, feature highlights, how-it-works, CTA to register.
- **Login / Register** — JWT stored in `localStorage`. Register creates the store and its first admin user in one call.
- **Dashboard** — all stats (total sales, pending orders, total orders, active products, low-stock list, recent orders) are **computed client-side** from `GET /products` and `GET /dashboard/orders` — there is no dedicated stats endpoint.
- **Products** — grid view with availability/stock filters and search; enforces the backend's 15-product cap by disabling "Add Product" once reached.
- **Product Form** — same page handles create and edit (`?id=` query param switches mode). Image upload (max 3, drag-and-drop) is only available when creating, since the update endpoint doesn't accept new images — edit mode shows existing images read-only instead.
- **Orders** — list with status tabs (`PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED`), expandable detail view, one-click status transitions, and a direct WhatsApp link to the customer.
- **Store Settings** — update name/slug/WhatsApp number and upload/remove the store logo. Saving triggers up to two sequential requests (text fields via `PUT`, logo via a separate `multipart` upload) behind a single "Save" button.

## Customer Storefront — Pages

- **Store (`store.html`)** — hero with store logo/name (rendered dynamically from the API response), search, "all / on sale" filter, product grid with quick "add to cart," and a cart icon with a live item-count badge.
- **Product Details (`product-details.html`)** — image gallery with thumbnails, stock-aware quantity stepper, live price-by-quantity total, and a "related products" strip.
- **Checkout (`checkout.html`)** — order summary pulled from the cart, customer info form (name, phone, address, notes), client-side validation, and a success screen showing the order ID plus a WhatsApp link to the store (when the backend returns one).

### Cart Behavior
The cart is pure client state in `localStorage` (key: `a7_store_cart`) — no backend cart endpoint is involved. It's shared via an offcanvas component (`cart-ui.js`) so adding/removing/adjusting quantity updates instantly on both `store.html` and `product-details.html` without a page reload. The cart is only sent to the server once, as the `items` array in the final `POST /store/:slug/orders` checkout call.

### Which Store Loads?
The storefront reads the target store from a `?store=<slug>` query parameter (e.g. `store.html?store=ashrif`). If omitted, it falls back to a default slug defined in `js/ui.js`.

## Running Locally

These are static files — no build step required.

1. Open either `owner-frontend/` or `customer-frontend/` in VS Code.
2. Right-click the entry HTML file (`index.html` or `store.html`) → **Open with Live Server**.
3. Make sure `BASE_URL` at the top of each `js/api.js` points to your backend (defaults to a local or deployed API URL — update as needed).

## Deployment

Each app deploys to **Vercel** as an independent static project, both pointing at the same repo:

| Project | Root Directory |
|---|---|
| Owner dashboard | `owner-frontend` |
| Customer storefront | `customer-frontend` |

No framework preset, no build command, no output directory override needed — Vercel serves the static files as-is.

## Notes & Known Limitations

- There is no dedicated dashboard-stats API — all dashboard numbers are derived from existing `products`/`orders` endpoints on the client.
- Editing a product's images after creation isn't supported by the current backend; only text fields can be updated post-creation.
- The owner side has no endpoint to fetch a single product by ID — the edit form fetches the full product list and finds the matching one client-side (acceptable given the 15-product cap per store).