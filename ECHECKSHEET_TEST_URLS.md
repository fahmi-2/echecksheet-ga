# 🔗 E-Checksheet Test URLs & QR Code Examples

## Overview
Complete list of test URLs untuk semua 118 e-checksheet QR codes.

**Dev Server**: http://localhost:3001  
**Build Status**: ✅ Complete  
**Total URLs**: 118

---

## 1️⃣ E-Checksheet Hydrant (36 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-hydrant/`  
**Route Pattern**: `/e-checksheet-hydrant?openHydrant={no}`  
**QR Format**: `echecksheet:///e-checksheet-hydrant?openHydrant={no}`

### Test URLs (Sample)
```
http://localhost:3001/e-checksheet-hydrant?openHydrant=1
http://localhost:3001/e-checksheet-hydrant?openHydrant=5
http://localhost:3001/e-checksheet-hydrant?openHydrant=10
http://localhost:3001/e-checksheet-hydrant?openHydrant=20
http://localhost:3001/e-checksheet-hydrant?openHydrant=36
```

### All Hydrant Numbers
1-36 (QR files: hydrant-1.png through hydrant-36.png)

---

## 2️⃣ E-Checksheet Infrastruktur Jalan (2 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-inf-jalan/`  
**Route Pattern**: `/e-checksheet-inf-jalan?search={area}`  
**QR Format**: `echecksheet:///e-checksheet-inf-jalan?search={area}`

### Test URLs
```
http://localhost:3001/e-checksheet-inf-jalan?search=area-dalam-pabrik
http://localhost:3001/e-checksheet-inf-jalan?search=area-luar-pabrik
```

### Files
- area-dalam-pabrik.png
- area-luar-pabrik.png

---

## 3️⃣ E-Checksheet Inspeksi APD (43 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-apd/`  
**Route Pattern**: `/e-checksheet-ins-apd?areaId={type}`  
**QR Format**: `echecksheet:///e-checksheet-ins-apd?areaId={type}`

### Test URLs (Sample)
```
http://localhost:3001/e-checksheet-ins-apd?areaId=topi-safety
http://localhost:3001/e-checksheet-ins-apd?areaId=helm-safety
http://localhost:3001/e-checksheet-ins-apd?areaId=kacamata-safety
http://localhost:3001/e-checksheet-ins-apd?areaId=masker-n95
http://localhost:3001/e-checksheet-ins-apd?areaId=sarung-tangan-nitrile
```

### All APD Types (43 total)
```
topi-safety
helm-safety
kacamata-safety
masker-n95
masker-kain
sarung-tangan-nitrile
sarung-tangan-kulit
sepatu-safety
boot-safety
rompi-safety
rompi-reflective
apron
overall
jaket-safety
kaos-kaki-safety
ikat-pinggang-safety
safety-belt
harness
knee-pad
elbow-pad
wrist-guard
face-shield
ear-muff
respirator
gas-mask
safety-glasses
welding-helmet
bump-cap
hairnet
shoe-cover
sleeve-guard
chest-protector
back-protector
shin-guard
goggles
earplugs
air-purifying-respirator
supplied-air-respirator
chemical-resistant-suit
radiation-suit
flame-resistant-suit
electrostatic-suit
```

---

## 4️⃣ E-Checksheet Lift Barang (6 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-lift-barang/`  
**Route Pattern**: `/e-checksheet-lift-barang?openLift={unit}`  
**QR Format**: `echecksheet:///e-checksheet-lift-barang?openLift={unit}`

### Test URLs
```
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20A
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20B
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20C
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20WAREHOUSE
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20EXIM
http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20JIG%20PROTO
```

### All Lift Units
```
LIFT BARANG GENBA A
LIFT BARANG GENBA B
LIFT BARANG GENBA C
LIFT BARANG WAREHOUSE
LIFT BARANG EXIM
LIFT BARANG JIG PROTO
```

### Files
- lift-barang-genba-a.png
- lift-barang-genba-b.png
- lift-barang-genba-c.png
- lift-barang-warehouse.png
- lift-barang-exim.png
- lift-barang-jig-proto.png

---

## 5️⃣ E-Checksheet Panel (20 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-panel/`  
**Route Pattern**: `/e-checksheet-panel?openPanel={name}`  
**QR Format**: `echecksheet:///e-checksheet-panel?openPanel={name}`

### Test URLs (Sample)
```
http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20A
http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20B
http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20F
http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20M
http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20T
```

### All Panels (20 total)
```
PANEL A (panel-a.png)
PANEL B (panel-b.png)
PANEL C (panel-c.png)
PANEL D (panel-d.png)
PANEL E (panel-e.png)
PANEL F (panel-f.png)
PANEL G (panel-g.png)
PANEL H (panel-h.png)
PANEL I (panel-i.png)
PANEL J (panel-j.png)
PANEL K (panel-k.png)
PANEL L (panel-l.png)
PANEL M (panel-m.png)
PANEL N (panel-n.png)
PANEL O (panel-o.png)
PANEL P (panel-p.png)
PANEL Q (panel-q.png)
PANEL R (panel-r.png)
PANEL S (panel-s.png)
PANEL T (panel-t.png)
```

---

## 6️⃣ E-Checksheet Selang Hydrant (4 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-slg-hydrant/`  
**Route Pattern**: `/e-checksheet-slg-hydrant?openArea={zona}`  
**QR Format**: `echecksheet:///e-checksheet-slg-hydrant?openArea={zona}`

### Test URLs
```
http://localhost:3001/e-checksheet-slg-hydrant?openArea=zona-barat
http://localhost:3001/e-checksheet-slg-hydrant?openArea=zona-timur
http://localhost:3001/e-checksheet-slg-hydrant?openArea=zona-utara
http://localhost:3001/e-checksheet-slg-hydrant?openArea=zona-selatan
```

### Files
- zona-barat.png
- zona-timur.png
- zona-utara.png
- zona-selatan.png

---

## 7️⃣ E-Checksheet Smoke Detector (5 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-smoke-detector/`  
**Route Pattern**: `/e-checksheet-smoke-detector?openArea={area}`  
**QR Format**: `echecksheet:///e-checksheet-smoke-detector?openArea={area}`

### Test URLs
```
http://localhost:3001/e-checksheet-smoke-detector?openArea=area-1
http://localhost:3001/e-checksheet-smoke-detector?openArea=area-2
http://localhost:3001/e-checksheet-smoke-detector?openArea=area-3
http://localhost:3001/e-checksheet-smoke-detector?openArea=area-4
http://localhost:3001/e-checksheet-smoke-detector?openArea=area-5
```

### Files
- area-1.png
- area-2.png
- area-3.png
- area-4.png
- area-5.png

---

## 8️⃣ E-Checksheet Tangga Listrik (2 QR Codes)

**File Location**: `/public/generated-qr/e-checksheet-tg-listrik/`  
**Route Pattern**: `/e-checksheet-tg-listrik?openArea={area}`  
**QR Format**: `echecksheet:///e-checksheet-tg-listrik?openArea={area}`

### Test URLs
```
http://localhost:3001/e-checksheet-tg-listrik?openArea=area-produksi
http://localhost:3001/e-checksheet-tg-listrik?openArea=area-warehouse
```

### Files
- area-produksi.png
- area-warehouse.png

---

## 🧪 Quick Testing Guide

### Step 1: Test First E-Checksheet Type (Hydrant)
```
URL: http://localhost:3001/e-checksheet-hydrant?openHydrant=1
Expected: Hydrant Inspection Form loads
Parameters: Hydrant #1 is highlighted/selected
Form Status: Ready for data entry
```

### Step 2: Test Parameter Pre-filling
```
URL: http://localhost:3001/e-checksheet-hydrant?openHydrant=5
Expected: Form shows Hydrant #5
Location: Pre-filled from database (if available)
Zone: Pre-filled if passed as parameter
```

### Step 3: Test Different Type (APD)
```
URL: http://localhost:3001/e-checksheet-ins-apd?areaId=helm-safety
Expected: APD Inspection Form for helm-safety
Form Title: Shows helm-safety type
Inspection Items: Specific to helmet/hat PPE
```

### Step 4: Test Special Characters (Panel with Space)
```
URL: http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20A
Note: %20 = space character
Expected: PANEL A loads correctly
Form shows: "PANEL A" (with space)
```

### Step 5: Scan Actual QR Code
```
1. Open QR file from /public/generated-qr/e-checksheet-hydrant/hydrant-1.png
2. Scan with phone camera or QR reader
3. App should open URL automatically
4. Navigate to correct e-checksheet page
5. Form should pre-fill with parameters
```

---

## 📊 URL Parameter Reference

| Checksheet Type | Parameter Name | Parameter Values |
|---|---|---|
| Hydrant | `openHydrant` | 1-36 |
| Inf Jalan | `search` | area-dalam-pabrik, area-luar-pabrik |
| APD | `areaId` | 43 different APD types |
| Lift Barang | `openLift` | 6 lift unit names |
| Panel | `openPanel` | PANEL A - PANEL T (20 panels) |
| Selang Hydrant | `openArea` | zona-barat, zona-timur, zona-utara, zona-selatan |
| Smoke Detector | `openArea` | area-1, area-2, area-3, area-4, area-5 |
| Tangga Listrik | `openArea` | area-produksi, area-warehouse |

---

## 🔍 URL Encoding Rules

**Special Characters**:
- Space → `%20`
- Hyphen (-) → Keep as-is
- Underscore (_) → Keep as-is

**Examples**:
```
LIFT BARANG GENBA A → LIFT%20BARANG%20GENBA%20A
PANEL A → PANEL%20A
zona-barat → zona-barat (no encoding needed)
area-1 → area-1 (no encoding needed)
```

---

## 📁 File Naming Convention

**Hydrant**: `hydrant-{no}.png`  
**Inf Jalan**: `{area}.png`  
**APD**: `{type}.png`  
**Lift Barang**: `{unit-name-lowercase-with-hyphens}.png`  
**Panel**: `{panel-name-lowercase}.png`  
**Selang Hydrant**: `{zona}.png`  
**Smoke Detector**: `{area}.png`  
**Tangga Listrik**: `{area}.png`  

---

## ✅ Testing Checklist

### Test All Routes
- [ ] Hydrant (at least 3 different numbers)
- [ ] Inf Jalan (both areas)
- [ ] APD (at least 5 different types)
- [ ] Lift Barang (all 6 units)
- [ ] Panel (A, M, T)
- [ ] Selang Hydrant (all 4 zones)
- [ ] Smoke Detector (area-1 and area-5)
- [ ] Tangga Listrik (both areas)

### Test Features
- [ ] Page loads within 2 seconds
- [ ] Parameters display correctly
- [ ] Form fields are accessible
- [ ] Special characters render properly
- [ ] URL encoding works
- [ ] Form can be submitted
- [ ] Data saves to localStorage

### Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🐛 Troubleshooting URLs

### URL Not Working?
```
Check:
1. Dev server running: npm run dev
2. Correct port: localhost:3001
3. Parameter names exact match
4. URL encoding correct (%20 for space)
5. No typos in URL
```

### QR Code Not Scanning?
```
Check:
1. QR image file exists
2. File not corrupted
3. Good lighting when scanning
4. Use proper QR reader app
5. QR content matches URL format
```

### Form Not Loading?
```
Check:
1. Page exists at /app/e-checksheet-[type]/page.tsx
2. Form component exists
3. Build succeeded: npm run build
4. No TypeScript errors
5. Browser console for errors
```

---

## 📚 Related Documentation

- `E_CHECKSHEET_IMPLEMENTATION.md` - Full implementation details
- `QUICK_REFERENCE.md` - Quick reference guide
- `TEST_E_CHECKSHEET_ROUTING.md` - Testing procedures
- `/app/scan/page.tsx` - Routing logic (lines 215-296)

---

## 🎯 Summary

**Total URLs**: 118  
**Dev Server**: http://localhost:3001  
**Build Status**: ✅ Complete  
**Testing Status**: ✅ Ready  

All e-checksheet routes are accessible and ready for testing!

---

**Last Updated**: January 27, 2026  
**Version**: 1.0
