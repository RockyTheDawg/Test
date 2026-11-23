# Charge storefront mockup

Run `npm start` with Node.js 20+ and open http://localhost:3000. Run `npm test` for domain tests. No dependencies or build step are required; the HTML, CSS and modules can also be served by static hosting (including GitHub Pages). Routes use URL hashes.

The original README is intentionally unchanged. It describes the previous repository contents; this file documents the replacement.

## Review flow

1. Browse/filter the collection, open a product, and select color and size. Lime / XL is intentionally unavailable.
2. Add items, edit quantities, and preview checkout. Use fictional information only.
3. Place Demo Order. Confirmation, tracking, and staff views use the same saved order snapshot.
4. Open Staff login and enter `meow` in any capitalization. Change announcements, products, category labels, featured flags, prices, and individual variant availability.
5. Simulate Needs Attention, then Awaiting Fulfillment for retry. Payment status remains separate. Add shipments for distinct order lines to demonstrate Partially Shipped and Shipped.
6. Use Reset all demo data in the staff dashboard to clear orders/cart and restore the initial catalog and announcement.

## Boundaries

This is a browser-local demo, not a production commerce system. The staff passcode is deliberately public and provides no security boundary. Each browser has its own data; local storage clearing removes it. Do not enter personal or sensitive information. No payment form, network integration, email delivery, supplier submission, or actual order placement exists. Shipping ($6/$12) and tax (6%) are fictional estimates. Policy pages intentionally contain the requested blank-area notice.

`store.js` separates catalog, variants, integer-cent totals, order snapshots, and simulation adapters from `app.js` UI. Orders have independent payment/fulfillment status, failure and retry history, and an array of shipments. Each shipment contains whole order lines, supporting multiple shipments per order. The demo order token prevents repeated placement of the same submission.

Production requires a secure backend, database, authenticated staff roles, verified server payment notifications, authoritative catalog/price/availability/shipping checks, persistent idempotency and fulfillment retries, real policy text, and confirmed supplier catalog mappings. None of those live services are enabled by this mockup. The team remains responsible for customer support, payment issues, refunds and fulfillment exceptions. Customer payments and supplier charges are separate; supplier costs and other operating expenses must be validated before launch.
