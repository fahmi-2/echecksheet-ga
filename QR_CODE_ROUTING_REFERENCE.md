# 🔍 QR Code Routing Reference Guide

## Quick Reference: All 15 Checksheet Types

### 1. 🔥 Fire Alarm
- **QR Format**: `echecksheet:///status-ga/fire-alarm/{zona}`
- **Example**: `echecksheet:///status-ga/fire-alarm/zona-1`
- **Routes to**: `/status-ga/fire-alarm/zona-1`
- **Parameter Type**: Path parameter
- **Count**: 18 QR codes

### 2. 💧 Hydrant Inspection
- **QR Format**: `echecksheet:///status-ga/inspeksi-hydrant?openHydrant={no}`
- **Example**: `echecksheet:///status-ga/inspeksi-hydrant?openHydrant=5`
- **Routes to**: `/status-ga/inspeksi-hydrant?openHydrant=5`
- **Parameter Type**: Query parameter
- **Count**: 36 QR codes

### 3. 🧯 APAR (Fire Extinguisher)
- **QR Format**: `echecksheet:///status-ga/inspeksi-apar/{slug}`
- **Example**: `echecksheet:///status-ga/inspeksi-apar/area-kantin`
- **Routes to**: `/status-ga/inspeksi-apar/area-kantin`
- **Parameter Type**: Path parameter
- **Count**: 30 QR codes
- **Example Areas**: area-kantin, area-genba-a, area-auditorium, exim, forklift, etc.

### 4. 🚽 Toilet Checksheet
- **QR Format**: `echecksheet:///status-ga/checksheet-toilet/{areaId}`
- **Example**: `echecksheet:///status-ga/checksheet-toilet/toilet-a`
- **Routes to**: `/status-ga/checksheet-toilet/toilet-a`
- **Parameter Type**: Path parameter
- **Count**: 12 QR codes
- **Example Areas**: toilet-a, toilet-b1, toilet-c1, toilet-c2, toilet-d, toilet-office-main, etc.

### 5. 📦 Lift Barang (Freight Elevator)
- **QR Format**: `echecksheet:///status-ga/lift-barang?openLift={unit}`
- **Example**: `echecksheet:///status-ga/lift-barang?openLift=LIFT%20BARANG%20GENBA%20A`
- **Routes to**: `/status-ga/lift-barang?openLift=LIFT%20BARANG%20GENBA%20A`
- **Parameter Type**: Query parameter (URL-encoded)
- **Count**: 6 QR codes
- **Units**: LIFT BARANG GENBA A, LIFT BARANG GENBA B, LIFT BARANG GENBA C, LIFT BARANG WAREHOUSE, LIFT BARANG EXIM, LIFT BARANG JIG PROTO

### 6. 🚿 Selang Hydrant (Hydrant Hose)
- **QR Format**: `echecksheet:///status-ga/selang-hydrant?openArea={zona}`
- **Example**: `echecksheet:///status-ga/selang-hydrant?openArea=zona-barat`
- **Routes to**: `/status-ga/selang-hydrant?openArea=zona-barat`
- **Parameter Type**: Query parameter
- **Count**: 4 QR codes
- **Zones**: zona-barat, zona-timur, zona-utara, zona-selatan

### 7. 💨 Smoke Detector
- **QR Format**: `echecksheet:///status-ga/smoke-detector?openArea={area}`
- **Example**: `echecksheet:///status-ga/smoke-detector?openArea=area-1`
- **Routes to**: `/status-ga/smoke-detector?openArea=area-1`
- **Parameter Type**: Query parameter
- **Count**: 5 QR codes

### 8. 🔆 Emergency Lamp (Emergency Light)
- **QR Format**: `echecksheet:///status-ga/inspeksi-emergency/{area}`
- **Example**: `echecksheet:///status-ga/inspeksi-emergency/genba-a`
- **Routes to**: `/status-ga/inspeksi-emergency/genba-a`
- **Parameter Type**: Path parameter
- **Count**: 9 QR codes
- **Areas**: genba-a, genba-b, genba-c, warehouse, office, pump-room, power-house, training-room, auditorium

### 9. 🚪 Exit Lamp & Emergency Exit
- **QR Format**: `echecksheet:///status-ga/exit-lamp-pintu-darurat/{category}`
- **Example**: `echecksheet:///status-ga/exit-lamp-pintu-darurat/exit-lamp`
- **Routes to**: `/status-ga/exit-lamp-pintu-darurat/exit-lamp`
- **Parameter Type**: Path parameter
- **Count**: 3 QR codes
- **Categories**: exit-lamp, titik-kumpul, pintu-darurat

### 10. ⚡ Electrical Panel
- **QR Format**: `echecksheet:///status-ga/panel?openPanel={name}`
- **Example**: `echecksheet:///status-ga/panel?openPanel=PANEL%20A`
- **Routes to**: `/status-ga/panel?openPanel=PANEL%20A`
- **Parameter Type**: Query parameter (URL-encoded)
- **Count**: 20 QR codes
- **Panels**: PANEL A through PANEL T

### 11. 🔌 Stop Kontak (Electrical Socket) Inspection
- **QR Format**: `echecksheet:///status-ga/form-inspeksi-stop-kontak/{type}`
- **Example**: `echecksheet:///status-ga/form-inspeksi-stop-kontak/instalasi-listrik`
- **Routes to**: `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik`
- **Parameter Type**: Path parameter
- **Count**: 2 QR codes
- **Types**: instalasi-listrik, stop-kontak

### 12. 🛣️ Road Infrastructure (Infrastruktur Jalan)
- **QR Format**: `echecksheet:///status-ga/ga-inf-jalan?search={area}`
- **Example**: `echecksheet:///status-ga/ga-inf-jalan?search=area-dalam-pabrik`
- **Routes to**: `/status-ga/ga-inf-jalan?search=area-dalam-pabrik`
- **Parameter Type**: Query parameter
- **Count**: 2 QR codes
- **Areas**: area-dalam-pabrik, area-luar-pabrik

### 13. 👷 APD (Personal Protective Equipment)
- **QR Format**: `echecksheet:///status-ga/inspeksi-apd?areaId={type}`
- **Example**: `echecksheet:///status-ga/inspeksi-apd?areaId=topi-safety`
- **Routes to**: `/status-ga/inspeksi-apd?areaId=topi-safety`
- **Parameter Type**: Query parameter
- **Count**: 42 QR codes
- **Types**: topi-safety, helm-safety, kacamata-safety, masker-n95, masker-kain, dll.

### 14. 🪜 Electrical Staircase (Tangga Listrik)
- **QR Format**: `echecksheet:///status-ga/tg-listrik?openArea={area}`
- **Example**: `echecksheet:///status-ga/tg-listrik?openArea=area-1`
- **Routes to**: `/status-ga/tg-listrik?openArea=area-1`
- **Parameter Type**: Query parameter
- **Count**: 2 QR codes

### 15. 🔧 Preventive Lift Barang (Maintenance Lift)
- **QR Format**: `echecksheet:///status-ga/inspeksi-preventif-lift-barang/{subtype}`
- **Example**: `echecksheet:///status-ga/inspeksi-preventif-lift-barang/preventif`
- **Routes to**: `/status-ga/inspeksi-preventif-lift-barang/preventif`
- **Parameter Type**: Path parameter
- **Count**: 2 QR codes

---

## 📂 File Location Reference

| Type | Folder | Count |
|------|--------|-------|
| Fire Alarm | `/public/generated-qr/fire-alarm/` | 18 |
| Hydrant | `/public/generated-qr/hydrant/` | 36 |
| APAR | `/public/generated-qr/apar/` | 30 |
| Toilet | `/public/generated-qr/toilet/` | 12 |
| Lift Barang | `/public/generated-qr/lift-barang/` | 6 |
| Selang Hydrant | `/public/generated-qr/selang-hydrant/` | 4 |
| Smoke Detector | `/public/generated-qr/smoke-detector/` | 5 |
| Emergency Lamp | `/public/generated-qr/emergency/` | 9 |
| Exit Lamp | `/public/generated-qr/exit-lamp/` | 3 |
| Panel | `/public/generated-qr/panel/` | 20 |
| Stop Kontak | `/public/generated-qr/stop-kontak/` | 2 |
| Inf. Jalan | `/public/generated-qr/inf-jalan/` | 2 |
| APD | `/public/generated-qr/apd/` | 42 |
| Tangga Listrik | `/public/generated-qr/tg-listrik/` | 2 |
| Lift Barang Preventif | `/public/generated-qr/lift-barang-preventif/` | 2 |

---

## 🔑 URL Encoding Notes

Some parameters contain spaces and special characters that need URL encoding:

| Original | Encoded | Used in |
|----------|---------|---------|
| `LIFT BARANG GENBA A` | `LIFT%20BARANG%20GENBA%20A` | Lift Barang query param |
| `PANEL A` | `PANEL%20A` | Panel query param |
| `PANEL B` | `PANEL%20B` | Panel query param |
| etc. | `%20` replaces spaces | All special char params |

The scan page automatically handles URL encoding/decoding, so parameters are properly formatted in both QR codes and routes.

---

## 🧪 Testing QR Codes Manually

### Using QR Scanner App
1. Open any QR scanner app on your phone
2. Scan QR code from `/public/generated-qr/[type]/`
3. Verify it shows the correct routing path format

### Using Web QR Reader
1. Open the app at `http://localhost:3001/status-ga`
2. Click "Scan QR"
3. Scan QR code
4. Should navigate to the correct checksheet page

### Example Test Cases
```
Test 1: Fire Alarm Zone 1
- Scan: fire-alarm/zona-1.png
- Expected: Routes to /status-ga/fire-alarm/zona-1

Test 2: Hydrant 5
- Scan: hydrant/hydrant-5.png
- Expected: Routes to /status-ga/inspeksi-hydrant?openHydrant=5

Test 3: APAR Kantin
- Scan: apar/area-kantin.png
- Expected: Routes to /status-ga/inspeksi-apar/area-kantin

Test 4: Toilet A
- Scan: toilet/toilet-a.png
- Expected: Routes to /status-ga/checksheet-toilet/toilet-a

Test 5: Panel A (with spaces)
- Scan: panel/PANEL%20A.png
- Expected: Routes to /status-ga/panel?openPanel=PANEL%20A
```

---

## ⚠️ Common Issues & Solutions

### Issue: QR Code not scanning
- **Cause**: Poor image quality or camera angle
- **Solution**: Ensure QR code is well-lit and camera is perpendicular

### Issue: Routes to wrong page
- **Cause**: Checksheet type not implemented in scan page
- **Solution**: Check switch case in `/app/scan/page.tsx` line ~110

### Issue: Parameter not recognized
- **Cause**: Query param name mismatch (e.g., `openHydrant` vs `hydrantId`)
- **Solution**: Verify exact param name in `/app/scan/page.tsx`

### Issue: Page loads but no data displayed
- **Cause**: Parameter value doesn't exist in page's data
- **Solution**: Verify parameter value matches available options

---

## 📖 Documentation Files

- **Main Summary**: `QR_CODE_IMPLEMENTATION_SUMMARY.md`
- **Routing Reference** (this file): `QR_CODE_ROUTING_REFERENCE.md`
- **Generation Script**: `/scripts/generate-all-qr.js`
- **Scan Page Logic**: `/app/scan/page.tsx` (handleScanResult function)

---

*Created: QR Code System v2.0*
*Total QR Codes: 193*
*Checksheet Types Supported: 15*
*Format: echecksheet:///status-ga/[routing-path]*
