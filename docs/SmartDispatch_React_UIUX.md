# SmartDispatch — React Web UI/UX Specification

## Part A: Admin Dashboard (React + Vite)

### Design System
- **Theme**: Dark mode, bg `#0A0F1A`, surface `#111827`, elevated `#1F2937`
- **Font**: Inter (headings + body), JetBrains Mono (data/codes)
- **Accent**: Orange `#F97316` primary, Teal `#22D3A0` success, Red `#EF4444` errors
- **Sidebar**: 240px fixed left, dark `#080E1C`, logo top, nav links with icons
- **Layout**: Sidebar + main content area, 24px padding, max-width 1200px

---

### Page 1 — Admin Login (`/admin/login`)

| Element | Specs |
|---------|-------|
| Container | Centered card 400px wide, dark surface, 1px border |
| Logo | Package icon + "SMARTDISPATCH" orange accent, 24px |
| Subtitle | "ADMIN PORTAL" muted mono 10px |
| Email input | Label "EMAIL", placeholder "admin@smartdispatch.com" |
| Password input | Label "PASSWORD", show/hide toggle |
| Button | "SIGN IN" orange full-width |
| Footer | "SmartDispatch v1.0" muted |

---

### Page 2 — Dashboard (`/admin/dashboard`)

| Section | Content |
|---------|---------|
| Header | "Dashboard" h1 + date/time + "LIVE" green dot |
| Stats row | 4 cards: "Pending Orders" (orange number), "Packing Now" (blue), "Packed Today" (teal), "Errors Today" (red) |
| Alert feed | Red-bordered list of recent alerts: wrong product scans, mismatches. Each: timestamp + order # + error type + worker ID |
| Recent orders table | Columns: Order #, Customer, Items, Status (colored badge), Assigned Packer, Time. Sortable, paginated |
| Live packing feed | WebSocket-powered list showing real-time scan events: "WK-04219 scanned Dell Laptop for ORD-8821 — ✓ MATCH" |

---

### Page 3 — Product Management (`/admin/products`)

**This is the CRITICAL page** — Admin enters all product details that the packer's camera will verify against.

#### Product List View
| Element | Specs |
|---------|-------|
| Header | "Products" h1 + "Add Product" orange button right |
| Search | Text input: search by name, brand, SKU, category |
| Filters | Dropdown: Category (Electronics, Clothing, Grocery, etc.) + Stock status |
| Table columns | Photo (40px thumb) · Name · Brand · SKU · Category · Color · Weight · Stock · Actions |
| Actions | Edit (blue), Delete (red), View (eye icon) |
| Pagination | 20 per page, page numbers + prev/next |

#### Add/Edit Product Form (`/admin/products/new` or `/admin/products/:id/edit`)

This form captures EVERYTHING the packer needs to verify:

| Section | Fields |
|---------|--------|
| **Basic Info** | |
| Product Name | Text input, required. e.g. "Dell Inspiron 15" |
| Brand | Text input, required. e.g. "Dell" |
| Model Number | Text input, required. e.g. "IN3520-7890" |
| SKU | Text input, unique required. e.g. "SKU-DELL-3520-SLV" |
| Category | Dropdown: Electronics, Clothing, Grocery, Furniture, Hardware, Other |
| **Appearance** | |
| Color | Text + color picker. e.g. "Silver" + hex. **Critical for vision check** |
| Product Photos | Multi-image upload (drag & drop), max 5 images. Main photo used for AI vision comparison. Shows thumbnails with delete/reorder |
| **Specifications** | |
| Weight (kg) | Number input. e.g. 2.5 |
| Weight Tolerance (g) | Number input, default 100. How much variance allowed |
| Specs (dynamic) | Key-value pairs, add/remove rows. e.g. RAM: 16GB, Storage: 512GB SSD, Screen: 15.6" FHD |
| **Inventory** | |
| Stock Quantity | Number input |
| Price (₹) | Number input |
| **Description** | |
| Description | Rich text editor for full product description |
| | |
| **Save** | "SAVE PRODUCT" orange button. Validates all required fields |

> **Why every field matters**: When packer scans a product label with camera, the OCR reads brand + model + SKU text. When packer takes a photo, AI vision checks color + object type against the admin photo. Weight is checked against entered weight ±tolerance. If ANY mismatch → RED screen, packer blocked.

---

### Page 4 — Order Management (`/admin/orders`)

#### Order List
| Column | Content |
|--------|---------|
| Order # | "ORD-2024-8821" mono, clickable |
| Customer | Name + phone |
| Items | Count + brief list |
| Total | ₹ amount |
| Status | Colored badge: PENDING (gray), ASSIGNED (blue), PACKING (amber), VERIFIED (purple), PACKED (teal), SHIPPED (blue), DELIVERED (green) |
| Packer | Assigned worker ID or "Unassigned" |
| Time | Created time + duration |
| Actions | Assign, View, Cancel |

#### Order Detail (`/admin/orders/:id`)
| Section | Content |
|---------|---------|
| Header | Order # + status badge + customer name |
| Customer info | Name, address, phone, email |
| Items table | Product photo + name + SKU + qty + unit price + verification status (✓/✗/pending for each: OCR, Vision, Weight) |
| Verification log | Timeline of all scan events with timestamps, results, worker ID, evidence photos |
| Assignment | Dropdown to assign/reassign packer |
| Label | "Generate Label" button → shows PDF preview with barcode + address |
| Status controls | Buttons to advance status: Assign → Start Packing → Mark Shipped → Mark Delivered |

---

### Page 5 — Worker Management (`/admin/workers`)

| Column | Content |
|--------|---------|
| Worker ID | "WK-04219" mono |
| Name | Worker name |
| Role | PACKER / SUPERVISOR badge |
| Status | Active (green) / Inactive (gray) |
| Today | "12 packed, 0 errors" |
| Actions | Edit, Deactivate, View History |

#### Add Worker Form
Fields: Name, Email, Phone, Role dropdown, Auto-generated Worker ID, Set PIN

---

### Page 6 — Print Center (`/admin/print`)

| Element | Specs |
|---------|-------|
| Queue | List of packed orders ready for label printing |
| Preview | Click order → shows label preview: Barcode, Customer address, Order number, QR code (tracking link), Item summary |
| Print button | "PRINT LABEL" → sends to connected printer or downloads PDF |
| Batch print | Select multiple → "PRINT ALL SELECTED" |

---

### Page 7 — Alert Center (`/admin/alerts`)

| Column | Content |
|--------|---------|
| Severity | 🔴 Critical / 🟡 Warning / 🔵 Info |
| Type | WRONG_PRODUCT / COLOR_MISMATCH / WEIGHT_FAIL / SUPERVISOR_OVERRIDE |
| Order | Order # link |
| Details | "Scanned HP Pavilion, expected Dell Inspiron" |
| Worker | Worker ID who triggered |
| Time | Timestamp |
| Status | Open / Resolved |
| Actions | Mark resolved, View full log |

---

### Page 8 — Analytics (`/admin/analytics`)

| Widget | Content |
|--------|---------|
| Daily throughput | Bar chart: orders packed per day (last 30 days) |
| Error rate | Line chart: % of orders with at least 1 mismatch |
| Top errors | Table: most common mismatch types (product, color, weight) |
| Worker efficiency | Table: worker ID, orders/day, avg time/order, error count |
| Product confusion | Table: which products get swapped most often (e.g. Dell 15 Silver ↔ Dell 15 Black) |

---

## Part B: Customer Portal (Next.js 14)

### Design System
- **Theme**: Dark mode matching admin, bg `#0A0F1A`
- **Font**: Inter, JetBrains Mono for order numbers/tracking
- **Responsive**: Desktop + mobile responsive

---

### Page 1 — Browse Products (`/products`)

| Element | Specs |
|---------|-------|
| Header | Navbar: Logo + "SmartDispatch" left, Search bar center, Cart icon + Login right |
| Categories | Horizontal filter chips: All, Electronics, Clothing, Grocery, etc. |
| Product grid | 3 columns desktop, 2 mobile. Each card: Product photo (200px), Name, Brand, Price (₹), "Add to Cart" button |
| Search | Real-time filter by name, brand, category |

---

### Page 2 — Product Detail (`/products/:id`)

| Section | Content |
|---------|---------|
| Gallery | Main photo large (400px) + thumbnails below (all admin-uploaded photos) |
| Info | Product name (h1), Brand, Model #, Color, Price ₹ |
| Specs table | All key-value specs from admin (RAM, Storage, Screen, etc.) |
| Quantity | Number input + "ADD TO CART" orange button |
| Description | Full rich text description |

---

### Page 3 — Cart (`/cart`)

| Element | Specs |
|---------|-------|
| Item rows | Photo + Name + SKU + Qty (editable) + Price + Remove button |
| Summary | Subtotal + Shipping + Total |
| CTA | "PROCEED TO CHECKOUT" orange button |

---

### Page 4 — Checkout (`/checkout`)

| Section | Fields |
|---------|--------|
| Shipping address | Full name, Phone, Street, City, State, PIN code |
| Order summary | Items list + totals (read-only) |
| Payment | (Phase 1: Cash on Delivery. Later: Razorpay) |
| CTA | "PLACE ORDER" orange button |
| Confirmation | Success screen: Order # displayed, "Track your order" link, est. delivery time |

---

### Page 5 — Order Tracking (`/tracking/:orderNumber`)

**Public page** — accessible without login via tracking link

| Element | Specs |
|---------|-------|
| Header | "Track Order" + order number mono |
| Status timeline | Vertical stepper with colored dots: |
| | ✅ Order Placed — timestamp |
| | ✅ Packing — "Verified by WK-04219" |
| | ✅ Packed — "Label printed" |
| | 🔵 Shipped — "In transit" (current, pulsing) |
| | ○ Delivered — pending |
| Order details | Items list, shipping address |
| Live updates | WebSocket auto-refreshes status |

---

### Page 6 — Order History (`/orders`)

**Requires login**

| Column | Content |
|--------|---------|
| Order # | Clickable, mono |
| Date | Placed date |
| Items | Count + names |
| Total | ₹ amount |
| Status | Colored badge |
| Actions | Track, Reorder |

---

## Navigation Structure

### Admin Sidebar
```
📦 Dashboard
📋 Products
   └─ Add Product
   └─ Product List
🛒 Orders
   └─ All Orders
   └─ Pending
   └─ Packed
👷 Workers
🖨 Print Center
🚨 Alerts
📊 Analytics
⚙ Settings
```

### Customer Navbar
```
[Logo] SmartDispatch    [Search...]    [Cart 🛒]  [Login/Profile]
```

### Customer Profile Menu
```
My Orders
Track Order
Profile Settings
Logout
```
