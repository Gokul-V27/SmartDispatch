# SmartDispatch — Flutter Mobile App UI/UX Spec

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#04080F` | App background |
| `surface` | `#080E1C` | Cards, panels |
| `elevated` | `#0C1425` | App bar, modals |
| `borderSubtle` | `#152035` | Dividers |
| `borderVisible` | `#1C2D47` | Input borders, card borders |
| `textPrimary` | `#FFFFFF` | Headings, values |
| `textMuted` | `#4A6380` | Labels, hints |
| `orange` | `#F97316` | Primary action, urgent |
| `blue` | `#38BDF8` | Info states |
| `teal` | `#22D3A0` | Success, pass, confirmed |
| `amber` | `#F59E0B` | Warnings |
| `red` | `#EF4444` | Failures, blocks |
| `purple` | `#A78BFA` | AI/vision indicators |
| `fontData` | JetBrains Mono | All data, IDs, codes |
| `fontTitle` | Syne | App title only |
| `fontBody` | System sans | Body text |
| `frame` | 390×844pt | iPhone 14 |
| `hPad` | 12pt | Horizontal padding |
| `vGap` | 8pt | Section spacing |
| `listGap` | 5pt | List item spacing |

### Component Rules
- **Cards**: Sharp edges (no border-radius), 1px `borderVisible`, 3px left accent stripe
- **Buttons**: Full-width, 48pt height, uppercase JetBrains Mono, no border-radius
  - Primary: orange fill, white text
  - Secondary: `surface` fill + 1px border
  - Success: teal fill
  - Destructive: red fill
- **Badges**: Pill shape, 10px mono, colored border + text + 10% opacity fill
- **Inputs**: 1px border, label 7px uppercase mono above, placeholder muted
- **App bar**: 56pt `elevated` surface, icon+title left, badge right
- **Alerts**: Colored 3px left border + colored text + 10% opacity colored bg
- **Checklist row**: 16pt colored checkbox (✓/✗/○) + item name + right status

---

## Screen 01 — Worker Login

**Route**: `/login` · **Accent**: Orange · **6 sections**

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | "09:41" left, signal right, 20pt |
| 2 | App icon | Package outline, 48pt, centered, 24pt below status |
| 3 | App name | "SMART" white + "DISPATCH" orange, Syne 28px bold |
| 4 | Subtitle | "WORKER PORTAL", JetBrains 10px, muted, spacing 4px |
| 5 | Gap | 20pt |
| 6 | Worker ID input | Label: "WORKER ID / EMAIL" 7px mono muted. Field: 48pt, 1px border `#1C2D47`, placeholder "WK-04219" muted, bg `surface` |
| 7 | PIN input | Label: "PIN (6-DIGIT)" 7px mono. 6 square boxes 40×40pt each, 8pt gaps, centered dot on fill, bg `surface` |
| 8 | Gap | 12pt |
| 9 | Button row | "SIGN IN" orange primary full-width 48pt + fingerprint square 48×48 secondary, 8pt gap |
| 10 | Divider | 1px `borderSubtle`, 16pt margin |
| 11 | Badge | "BIOMETRIC / FACE ID AVAILABLE" orange pill centered |
| 12 | Footnote | "Works offline · JWT cached 12h" muted 10px centered |
| 13 | Permissions | Below fold, 4 rows: Camera, Bluetooth, Location, Vibration (icon + 12px muted text) |

**States**: Default (empty) · Filled (green ✓ on Worker ID) · Error (red border + "Invalid PIN") · Loading (spinner in button)

**Interactions**: PIN auto-submits on 6th digit · Fingerprint triggers device biometric · Haptic on button press

---

## Screen 02 — Packer Dashboard

**Route**: `/home` · **Accent**: Orange · **Worker**: WK-04219

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | Time left, "WK-04219" mono right |
| 2 | App bar | Package icon + "SmartDispatch" Syne bold, "2 ALERTS" orange pill, green "LIVE" pulsing dot |
| 3 | Stats row | 2 tiles, 8pt gap. Left: "12" orange 32px mono, "TO PACK" 10px muted. Right: "47" teal 32px, "PACKED TODAY" |
| 4 | Alert banner | Red 3px left border, red bg 10%, "⚠ WRONG PRODUCT — Order ORD-8821 · Dock 3" red mono 12px |
| 5 | Section | "PENDING ORDERS" 10px uppercase muted mono |
| 6 | Order card 1 | Orange 3px left stripe. "ORD-2024-8821" white mono 14px bold + "URGENT" orange pill. Below: "Mrs. Priya · Dell Laptop + Mouse · 2 items" muted 11px |
| 7 | Order card 2 | Blue 3px stripe. "ORD-2024-8822" + "NORMAL" blue pill. "Mr. Rajan · iPhone 15 · 1 item" muted |
| 8 | Quick actions | 2×2 grid, 44pt tiles: Start Packing (orange), View Alerts (red), Scan History (blue), Settings (purple) |
| 9 | Sticky CTA | "▸ START PACKING" teal full-width 48pt |

**Interactions**: Pull-to-refresh · Tap card → start packing that order · Alert tap → detail sheet · Real-time WebSocket updates order list

---

## Screen 03 — OCR Product Scan (Camera Verification)

**Route**: `/pack/:orderId/scan` · **Accent**: Teal · **State**: Scanning item 1 of 2

This is the PRIMARY verification screen. Camera scans product label and compares against admin-entered product details.

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | "09:43", "SCANNING" right |
| 2 | App bar | Back arrow + "Scan Product", "1/2" teal pill right |
| 3 | Expected product card | Blue bg 8%, blue border. Shows what the order expects: "Dell Inspiron 15 · Silver · IN3520-7890 · SKU-DELL-3520-SLV" mono 12px. Admin-uploaded product photo thumbnail (60×60pt) on right |
| 4 | Camera viewfinder | 220pt height, black bg, teal 2px border, 4 corner L-brackets (12pt arms, teal), animated scan line (teal, glowing, 2s loop). Below: "POINT AT PRODUCT LABEL" teal mono 9px |
| 5 | OCR result panel | Teal bg 8%, teal border, 12pt padding. Key-value rows: |
| | "BRAND DETECTED" muted | "Dell" teal mono → ✓ match |
| | "MODEL" muted | "IN3520-7890" teal → ✓ match |
| | "PRODUCT" muted | "Inspiron 15" white → ✓ match |
| | "SKU" muted | "SKU-DELL-3520-SLV" teal → ✓ match |
| | "OVERALL" muted | "✓ ALL MATCH" teal bold 14px |
| 6 | Section | "ORDER ITEMS" muted 10px |
| 7 | Checklist | ✓ teal "Dell Inspiron 15 Silver" + "×1" · ○ empty "Logitech Mouse M235" + "×1" (pending) |
| 8 | Sticky CTA | "▸ SCAN NEXT ITEM" teal (or "▸ ALL SCANNED — NEXT" when done) |

### ❌ FAIL STATE (Mismatch)
| Element | Change |
|---------|--------|
| Viewfinder border | → Red 2px |
| Corner brackets | → Red |
| Scan line | → Red |
| Result panel | Red bg 10%, red border |
| "BRAND DETECTED" | "HP" red → ✗ MISMATCH (expected "Dell") |
| "MODEL" | "14-DQ2088" red → ✗ WRONG |
| "OVERALL" | "✗ WRONG PRODUCT" red bold 16px |
| Alert banner | "🚨 WRONG PRODUCT — Remove and scan correct item" red, red bg 15% |
| CTA | Disabled gray. Secondary: "SUPERVISOR OVERRIDE" red outline |
| Haptic | Strong vibration 500ms |

### What OCR Checks
The system compares scanned text against these admin-entered fields:
1. **Brand name** — "Dell" vs scanned brand
2. **Model number** — "IN3520-7890" vs scanned model
3. **SKU code** — barcode/SKU text
4. **Product name** — fuzzy match "Inspiron 15"
5. If ANY field mismatches → RED screen, packer blocked

---

## Screen 04 — AI Vision Photo Check

**Route**: `/pack/:orderId/vision` · **Accent**: Purple · **State**: Photo taken, analyzing

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | "09:45", "AI CHECK" right |
| 2 | App bar | Back + "Photo Verify", "STEP 2" purple pill |
| 3 | Comparison area | Two panels side by side (each 170×120pt): Left: "EXPECTED" label, admin product photo. Right: "YOUR PHOTO" label, packer's captured photo. Purple border on both |
| 4 | AI results panel | Purple bg 8%, purple border: |
| | "OBJECT TYPE" muted | "Laptop ✓" teal mono |
| | "BRAND LOGO" muted | "Dell ✓" teal |
| | "COLOR" muted | "Silver ✓" teal |
| | "SIZE/SHAPE" muted | "15-inch ✓" teal |
| | "MATCH SCORE" muted | "0.94" teal bold 18px |
| 5 | Banner | "✅ VISUAL MATCH CONFIRMED" teal banner |
| 6 | Sticky CTA | "▸ VISION PASSED — NEXT" teal |

### ❌ FAIL STATE (e.g., wrong color)
| Element | Change |
|---------|--------|
| AI results | "COLOR" → "Black ✗" red (expected Silver) |
| Match score | "0.41" red bold |
| Banner | "🚨 COLOR MISMATCH — Expected Silver, detected Black" red |
| Buttons | "RETAKE" secondary + "SUPERVISOR PIN" red primary |

### What Vision Checks
Compares packer's photo against admin's product photo:
1. **Object type** — Is it a laptop? Phone? Box? (TFLite object detection)
2. **Color** — Silver vs Black vs White (color classification model)
3. **Brand logo** — Detects logo in photo (logo detection)
4. **Size/shape** — General form factor match
5. **Similarity score** — Overall image similarity 0.0–1.0

---

## Screen 05 — Weight Entry

**Route**: `/pack/:orderId/weight` · **Accent**: Amber · **State**: Manual entry (camera-only phase)

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | "09:46", "WEIGHT" right |
| 2 | App bar | Back + "Weight Check", "STEP 3" amber pill. (Later: "BLE ●" green badge) |
| 3 | Expected weight | "EXPECTED: 2.850 kg" amber mono 18px centered, "(±100g tolerance)" muted 10px below |
| 4 | Weight input | Large numeric input, 48px mono, centered, "kg" suffix, bg `surface`, border `borderVisible`. Numpad below for easy entry |
| 5 | Result | After entry — circle indicator 80pt: PASS (teal border, "✓ PASS", "−30g") or FAIL (red, "✗ FAIL", ">150g over") |
| 6 | Breakdown | "MANIFEST BREAKDOWN" section. Rows: "Dell Inspiron 15 ×1" | "2.500 kg", "Logitech Mouse ×1" | "0.350 kg" |
| 7 | Sticky CTA | "▸ WEIGHT OK — NEXT" teal (disabled until entered + pass) |

### FAIL State
- Red circle "FAIL", "HARD BLOCK — RECHECK PRODUCTS" red banner, CTA disabled

---

## Screen 06 — Pack Complete + Label

**Route**: `/pack/:orderId/complete` · **Accent**: Teal · **State**: All 3 steps passed

| # | Element | Specs |
|---|---------|-------|
| 1 | Status bar | "09:48", "DONE" right |
| 2 | App bar | "Pack Complete" + "✓" teal pill |
| 3 | Success indicator | Large teal circle 100pt, "✓" checkmark 40px white, "ALL VERIFIED" teal 16px below |
| 4 | Verification summary | 3 rows with green checks: "✓ OCR — Brand, Model, SKU match" · "✓ Vision — Color, type match (0.94)" · "✓ Weight — 2.820kg (−30g)" |
| 5 | Customer card | Teal left stripe. "Mrs. Priya" white 14px, "12 Main St, Chennai 600001" muted, "Phone: +91 98xxx" muted |
| 6 | Label preview | Bordered card showing barcode image + address block + order number + tracking QR code. "DISPATCH LABEL READY" teal badge |
| 7 | CTA row | "🖨 PRINT LABEL" orange primary half + "✓ MARK PACKED" teal primary half |
| 8 | Note | "Customer will be notified automatically" muted 10px |

**On "MARK PACKED"**: Status → PACKED, customer gets push notification "Your order is packed!", admin dashboard updates, label PDF available for download/print.

---

## Shared Components

### Order Card
```
┌─────────────────────────────┐
│ ▎ORD-2024-8821     [URGENT] │  ← 3px accent stripe, mono bold, pill badge
│ ▎Mrs. Priya · 2 items       │  ← muted 11px
│ ▎Dell Laptop + Mouse         │  ← muted 11px
└─────────────────────────────┘
```

### Verification Result Row
```
BRAND DETECTED    Dell ✓       ← muted key | colored value + icon
```

### Checklist Item
```
✓  Dell Inspiron 15 Silver    ×1   ← colored box + name + right qty
○  Logitech Mouse M235        ×1   ← empty = pending
✗  HP Pavilion 14 (WRONG)     ×1   ← red = failed
```

### Alert Banner
```
┌─────────────────────────────────────┐
│▎ 🚨 WRONG PRODUCT — Remove item!   │  ← colored left border + bg 10%
└─────────────────────────────────────┘
```
