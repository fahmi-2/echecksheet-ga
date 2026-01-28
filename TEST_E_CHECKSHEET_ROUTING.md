# 🧪 E-Checksheet QR Code Routing Test

## Overview
Testing QR code routing untuk 8 e-checksheet types yang terletak di luar folder `/status-ga/`.

Dev Server: http://localhost:3001

---

## ✅ QR Code Routes (E-Checksheet)

### 1. **E-Checksheet Hydrant** 
- **QR Format**: `echecksheet:///e-checksheet-hydrant?openHydrant={no}`
- **Route**: `/e-checksheet-hydrant?openHydrant=1`
- **Test URL**: http://localhost:3001/e-checksheet-hydrant?openHydrant=1
- **Parameters**: 
  - `openHydrant`: 1-36 (Hydrant number)
- **QR Codes**: 36 codes di `/public/generated-qr/e-checksheet-hydrant/`

**Test Case**:
```
Scan QR: hydrant-1.png
Expected Route: /e-checksheet-hydrant?openHydrant=1
Expected Page: E-Checksheet Hydrant Inspection Form
```

---

### 2. **E-Checksheet Infrastruktur Jalan**
- **QR Format**: `echecksheet:///e-checksheet-inf-jalan?search={area}`
- **Route**: `/e-checksheet-inf-jalan?search=area-dalam-pabrik`
- **Test URL**: http://localhost:3001/e-checksheet-inf-jalan?search=area-dalam-pabrik
- **Parameters**:
  - `search`: area-dalam-pabrik, area-luar-pabrik
- **QR Codes**: 2 codes di `/public/generated-qr/e-checksheet-inf-jalan/`

**Test Case**:
```
Scan QR: area-dalam-pabrik.png
Expected Route: /e-checksheet-inf-jalan?search=area-dalam-pabrik
Expected Page: E-Checksheet Infrastruktur Jalan Form
```

---

### 3. **E-Checksheet Inspeksi APD**
- **QR Format**: `echecksheet:///e-checksheet-ins-apd?areaId={type}`
- **Route**: `/e-checksheet-ins-apd?areaId=helm-safety`
- **Test URL**: http://localhost:3001/e-checksheet-ins-apd?areaId=helm-safety
- **Parameters**:
  - `areaId`: 43 different APD types (topi-safety, helm-safety, etc.)
- **QR Codes**: 43 codes di `/public/generated-qr/e-checksheet-apd/`

**Test Case**:
```
Scan QR: helm-safety.png
Expected Route: /e-checksheet-ins-apd?areaId=helm-safety
Expected Page: E-Checksheet APD Inspection Form
```

---

### 4. **E-Checksheet Lift Barang**
- **QR Format**: `echecksheet:///e-checksheet-lift-barang?openLift={unit}`
- **Route**: `/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20A`
- **Test URL**: http://localhost:3001/e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20A
- **Parameters**:
  - `openLift`: LIFT BARANG GENBA A, LIFT BARANG GENBA B, etc.
- **QR Codes**: 6 codes di `/public/generated-qr/e-checksheet-lift-barang/`

**Test Case**:
```
Scan QR: lift-barang-genba-a.png
Expected Route: /e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20A
Expected Page: E-Checksheet Lift Barang Inspection Form
```

---

### 5. **E-Checksheet Panel**
- **QR Format**: `echecksheet:///e-checksheet-panel?openPanel={name}`
- **Route**: `/e-checksheet-panel?openPanel=PANEL%20A`
- **Test URL**: http://localhost:3001/e-checksheet-panel?openPanel=PANEL%20A
- **Parameters**:
  - `openPanel`: PANEL A - PANEL T (20 panels)
- **QR Codes**: 20 codes di `/public/generated-qr/e-checksheet-panel/`

**Test Case**:
```
Scan QR: panel-a.png
Expected Route: /e-checksheet-panel?openPanel=PANEL%20A
Expected Page: E-Checksheet Panel Inspection Form
```

---

### 6. **E-Checksheet Selang Hydrant**
- **QR Format**: `echecksheet:///e-checksheet-slg-hydrant?openArea={zona}`
- **Route**: `/e-checksheet-slg-hydrant?openArea=zona-barat`
- **Test URL**: http://localhost:3001/e-checksheet-slg-hydrant?openArea=zona-barat
- **Parameters**:
  - `openArea`: zona-barat, zona-timur, zona-utara, zona-selatan
- **QR Codes**: 4 codes di `/public/generated-qr/e-checksheet-slg-hydrant/`

**Test Case**:
```
Scan QR: zona-barat.png
Expected Route: /e-checksheet-slg-hydrant?openArea=zona-barat
Expected Page: E-Checksheet Selang Hydrant Form
```

---

### 7. **E-Checksheet Smoke Detector**
- **QR Format**: `echecksheet:///e-checksheet-smoke-detector?openArea={area}`
- **Route**: `/e-checksheet-smoke-detector?openArea=area-1`
- **Test URL**: http://localhost:3001/e-checksheet-smoke-detector?openArea=area-1
- **Parameters**:
  - `openArea`: area-1, area-2, area-3, area-4, area-5
- **QR Codes**: 5 codes di `/public/generated-qr/e-checksheet-smoke-detector/`

**Test Case**:
```
Scan QR: area-1.png
Expected Route: /e-checksheet-smoke-detector?openArea=area-1
Expected Page: E-Checksheet Smoke Detector Form
```

---

### 8. **E-Checksheet Tangga Listrik**
- **QR Format**: `echecksheet:///e-checksheet-tg-listrik?openArea={area}`
- **Route**: `/e-checksheet-tg-listrik?openArea=area-produksi`
- **Test URL**: http://localhost:3001/e-checksheet-tg-listrik?openArea=area-produksi
- **Parameters**:
  - `openArea`: area-produksi, area-warehouse
- **QR Codes**: 2 codes di `/public/generated-qr/e-checksheet-tg-listrik/`

**Test Case**:
```
Scan QR: area-produksi.png
Expected Route: /e-checksheet-tg-listrik?openArea=area-produksi
Expected Page: E-Checksheet Tangga Listrik Form
```

---

## 📊 Summary

| Checksheet Type | QR Codes | Location | Route |
|---|---|---|---|
| E-Checksheet Hydrant | 36 | `/public/generated-qr/e-checksheet-hydrant/` | `/e-checksheet-hydrant?openHydrant=X` |
| E-Checksheet Inf Jalan | 2 | `/public/generated-qr/e-checksheet-inf-jalan/` | `/e-checksheet-inf-jalan?search=X` |
| E-Checksheet APD | 43 | `/public/generated-qr/e-checksheet-apd/` | `/e-checksheet-ins-apd?areaId=X` |
| E-Checksheet Lift Barang | 6 | `/public/generated-qr/e-checksheet-lift-barang/` | `/e-checksheet-lift-barang?openLift=X` |
| E-Checksheet Panel | 20 | `/public/generated-qr/e-checksheet-panel/` | `/e-checksheet-panel?openPanel=X` |
| E-Checksheet Selang Hydrant | 4 | `/public/generated-qr/e-checksheet-slg-hydrant/` | `/e-checksheet-slg-hydrant?openArea=X` |
| E-Checksheet Smoke Detector | 5 | `/public/generated-qr/e-checksheet-smoke-detector/` | `/e-checksheet-smoke-detector?openArea=X` |
| E-Checksheet Tangga Listrik | 2 | `/public/generated-qr/e-checksheet-tg-listrik/` | `/e-checksheet-tg-listrik?openArea=X` |
| **TOTAL** | **118** | | |

---

## 🔄 System Flow

```
QR Code Scan
    ↓
ScanModal atau /scan page
    ↓
Parse QR: echecksheet:///e-checksheet-[type]?param=value
    ↓
Extract: checksheet type & parameters
    ↓
Switch case in /app/scan/page.tsx
    ↓
Route to: /e-checksheet-[type]?param=value
    ↓
Open e-checksheet page (NOT in /status-ga/)
    ↓
Form pre-filled dengan parameters
```

---

## 🧪 Manual Testing Steps

### Step 1: Verify Pages Load
1. Open http://localhost:3001/e-checksheet-hydrant?openHydrant=1
2. Should see: "Hydrant Inspection Form" header
3. Check parameters are loaded correctly

### Step 2: Verify QR Codes Exist
1. Navigate to `/public/generated-qr/e-checksheet-hydrant/`
2. Should see: 36 PNG files (hydrant-1.png, hydrant-2.png, ..., hydrant-36.png)
3. Repeat for other 7 checksheet types

### Step 3: Verify Routing Logic
1. Open DevTools Console on /app/scan/page.tsx
2. Check routing switch cases for e-checksheet types
3. All 8 types should be present in switch statement

### Step 4: Test with QR Code Reader
1. Use phone camera on QR code from `/public/generated-qr/e-checksheet-hydrant/hydrant-1.png`
2. Should redirect to `/e-checksheet-hydrant?openHydrant=1`
3. Form should load with parameters

---

## ✅ Verification Checklist

- [ ] All 8 e-checksheet folders exist in `/public/generated-qr/`
- [ ] Total 118 QR codes generated
- [ ] Build succeeds with all e-checksheet routes
- [ ] Dev server runs without errors
- [ ] Pages load with correct parameters
- [ ] Routing from scan page works correctly
- [ ] URL encoding handles special characters
- [ ] Forms pre-fill with parameters correctly
- [ ] Navigation between checksheets works
- [ ] Camera stops after QR scan

---

## 🔗 Related Files

- **QR Generator**: `/scripts/generate-all-qr.js`
- **Scan Router**: `/app/scan/page.tsx` (lines 215-290 for e-checksheet routing)
- **E-Checksheet Pages**: `/app/e-checksheet-*/page.tsx`
- **Forms**: `/app/e-checksheet-*/EChecksheet*Form.tsx`

---

## 📝 Notes

- E-checksheet routes are DIRECT routes, NOT nested under `/status-ga/`
- QR format uses `echecksheet:///e-checksheet-` prefix
- Parameters vary by checksheet type (openHydrant, search, areaId, openLift, openPanel, openArea)
- All special characters are URL-encoded
- Forms should pre-fill with passed parameters

---

**Generated**: January 27, 2026
**Status**: ✅ Ready for Testing
