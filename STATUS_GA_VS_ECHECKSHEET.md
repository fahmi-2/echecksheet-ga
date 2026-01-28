# 📍 Status-GA vs E-Checksheet: Architectural Difference

## Overview

Sistem inspeksi memiliki **2 kategori checksheet** dengan routing structure yang berbeda:

### 1. **Status-GA Checksheets** (15 types)
- Located: `/app/status-ga/[checksheet-type]/`
- Routing: `/status-ga/[type]/...`
- Purpose: Status pages dengan tracking workflow
- QR Format: `echecksheet:///status-ga/[type]/...`

### 2. **E-Checksheet** (8 types) ← **NEW: DIRECT ROUTES**
- Located: `/app/e-checksheet-[type]/`
- Routing: `/e-checksheet-[type]?...`
- Purpose: Direct inspection forms (not nested)
- QR Format: `echecksheet:///e-checksheet-[type]?...`

---

## 📂 Folder Structure

```
/app/
├── status-ga/                          ← STATUS-GA (15 types)
│   ├── fire-alarm/
│   │   ├── page.tsx
│   │   ├── [zona]/
│   │   │   └── page.tsx
│   │   └── riwayat/[zona]/
│   ├── inspeksi-hydrant/
│   ├── inspeksi-apar/
│   ├── checksheet-toilet/
│   ├── panel/
│   ├── lift-barang/
│   ├── selang-hydrant/
│   ├── smoke-detector/
│   ├── inspeksi-emergency/
│   ├── exit-lamp-pintu-darurat/
│   ├── form-inspeksi-stop-kontak/
│   ├── ga-inf-jalan/
│   ├── inspeksi-apd/
│   ├── tg-listrik/
│   └── inspeksi-preventif-lift-barang/
│
├── e-checksheet-hydrant/               ← E-CHECKSHEET (8 types)
│   ├── page.tsx
│   ├── EChecksheetHydrantForm.tsx
│   └── layout.tsx (optional)
├── e-checksheet-inf-jalan/
├── e-checksheet-ins-apd/
├── e-checksheet-lift-barang/
├── e-checksheet-panel/
├── e-checksheet-slg-hydrant/
├── e-checksheet-smoke-detector/
└── e-checksheet-tg-listrik/
```

---

## 🔄 Routing Comparison

### Status-GA Example: Fire Alarm

```
QR Code Content:
  echecksheet:///status-ga/fire-alarm/zona-1

Scan Flow:
  QR Scan
    ↓
  /app/scan/page.tsx (lines 94-210)
    ↓
  Parse: type=fire-alarm, id=zona-1
    ↓
  Switch case handles: /status-ga/fire-alarm/[zona]
    ↓
  Route: /status-ga/fire-alarm/zona-1
    ↓
  Status-GA page opens (complex workflow)
```

### E-Checksheet Example: Hydrant (NEW)

```
QR Code Content:
  echecksheet:///e-checksheet-hydrant?openHydrant=1

Scan Flow:
  QR Scan
    ↓
  /app/scan/page.tsx (lines 215-296)
    ↓
  Parse: type=e-checksheet-hydrant, param=openHydrant=1
    ↓
  Switch case handles: e-checksheet-hydrant
    ↓
  Route: /e-checksheet-hydrant?openHydrant=1
    ↓
  E-Checksheet page opens (direct form)
```

---

## 📊 Detailed Comparison Table

| Feature | Status-GA | E-Checksheet |
|---------|-----------|--------------|
| **Folder Location** | `/app/status-ga/[type]/` | `/app/e-checksheet-[type]/` |
| **Route Pattern** | `/status-ga/[type]/path` | `/e-checksheet-[type]?query` |
| **Route Type** | Path-based (dynamic segments) | Query parameter-based |
| **Nesting Level** | Nested (inside /status-ga/) | Direct/Flat (root level) |
| **QR Prefix** | `echecksheet:///status-ga/` | `echecksheet:///e-checksheet-` |
| **Routing Code** | Lines 94-210 in /scan/page.tsx | Lines 215-296 in /scan/page.tsx |
| **Parameter Style** | Path: `/hydrant/[no]` | Query: `?openHydrant=X` |
| **Number of Types** | 15 checksheets | 8 checksheets |
| **Workflow** | Complex (status tracking) | Simple (direct inspection) |
| **Form Component** | Varies per type | `EChecksheet[Type]Form.tsx` |
| **Data Persistence** | Backend integration | localStorage (local form) |
| **Page Complexity** | High (multiple sections) | Medium (single form) |

---

## 🔍 Routing Logic Comparison

### Status-GA Routing (Lines 94-210)

```typescript
// Pattern: echecksheet:///status-ga/[checksheet-type]/[path]
if (remaining.startsWith("status-ga/")) {
  remaining = remaining.replace("status-ga/", "");
  const [firstPart, ...restParts] = remaining.split("/");
  
  switch (firstPart) {
    case "fire-alarm": {
      const zona = pathPart.replace("fire-alarm/", "");
      targetUrl = `/status-ga/fire-alarm/${encodeURIComponent(zona)}`;
      break;
    }
    case "inspeksi-hydrant": {
      const queryParams = new URLSearchParams(query || "");
      const openHydrant = queryParams.get("openHydrant");
      if (openHydrant) {
        targetUrl = `/status-ga/inspeksi-hydrant/${encodeURIComponent(openHydrant)}`;
      }
      break;
    }
    // ... 13 more cases
  }
  
  router.push(targetUrl);
  return;
}
```

### E-Checksheet Routing (Lines 215-296)

```typescript
// Pattern: echecksheet:///e-checksheet-[type]?param=value
if (remaining.startsWith("e-checksheet-")) {
  const [checksheetType, ...restParts] = remaining.split("/");
  
  switch (checksheetType) {
    case "e-checksheet-hydrant": {
      const queryParams = new URLSearchParams(query || "");
      const openHydrant = queryParams.get("openHydrant");
      if (openHydrant) {
        targetUrl = `/e-checksheet-hydrant?openHydrant=${encodeURIComponent(openHydrant)}`;
      }
      break;
    }
    case "e-checksheet-panel": {
      const queryParams = new URLSearchParams(query || "");
      const openPanel = queryParams.get("openPanel");
      if (openPanel) {
        targetUrl = `/e-checksheet-panel?openPanel=${encodeURIComponent(openPanel)}`;
      }
      break;
    }
    // ... 6 more cases
  }
  
  router.push(targetUrl);
  return;
}
```

---

## 🎯 When to Use Which

### Use Status-GA For:
- ✅ Complex workflows (approval, tracking, history)
- ✅ Multiple states/steps (draft, submitted, approved)
- ✅ Reporting and analytics dashboards
- ✅ Admin dashboard views
- ✅ Historical data and riwayat pages

**Examples**:
- Fire Alarm (multiple zones, tracking)
- Hydrant Inspection (workflow)
- APD Management (complex rules)
- Emergency Procedures (multi-step)

### Use E-Checksheet For:
- ✅ Simple direct inspection forms
- ✅ Quick data capture (hydrant, panel, detector)
- ✅ Minimal state management
- ✅ Local data persistence (localStorage)
- ✅ Fast inspection entry

**Examples**:
- Hydrant inspection
- Panel check
- Smoke detector verification
- Equipment status check

---

## 📋 E-Checksheet Types Detail

### 1. **E-Checksheet Hydrant** (36 codes)
```
Route: /e-checksheet-hydrant?openHydrant={no}
QR Format: echecksheet:///e-checksheet-hydrant?openHydrant=1
Use Case: Quick hydrant status check
Data: Hydrant #, Location, Zone, Type
Storage: localStorage key = `e-checksheet-hydrant-{no}`
```

### 2. **E-Checksheet Infrastruktur Jalan** (2 codes)
```
Route: /e-checksheet-inf-jalan?search={area}
QR Format: echecksheet:///e-checksheet-inf-jalan?search=area-dalam-pabrik
Use Case: Road/pathway infrastructure check
Data: Area name, search parameter
Storage: localStorage key = `e-checksheet-inf-jalan`
```

### 3. **E-Checksheet APD** (43 codes)
```
Route: /e-checksheet-ins-apd?areaId={type}
QR Format: echecksheet:///e-checksheet-ins-apd?areaId=helm-safety
Use Case: PPE inventory and status
Data: 43 different APD types
Storage: localStorage key = `e-checksheet-apd-{type}`
```

### 4. **E-Checksheet Lift Barang** (6 codes)
```
Route: /e-checksheet-lift-barang?openLift={unit}
QR Format: echecksheet:///e-checksheet-lift-barang?openLift=LIFT%20BARANG%20GENBA%20A
Use Case: Lift equipment check
Data: 6 lift units across facility
Storage: localStorage key = `e-checksheet-lift-barang-{unit}`
```

### 5. **E-Checksheet Panel** (20 codes)
```
Route: /e-checksheet-panel?openPanel={name}
QR Format: echecksheet:///e-checksheet-panel?openPanel=PANEL%20A
Use Case: Electrical panel inspection
Data: 20 panels (PANEL A - PANEL T)
Storage: localStorage key = `e-checksheet-panel-{name}`
```

### 6. **E-Checksheet Selang Hydrant** (4 codes)
```
Route: /e-checksheet-slg-hydrant?openArea={zona}
QR Format: echecksheet:///e-checksheet-slg-hydrant?openArea=zona-barat
Use Case: Hose/connector status check
Data: 4 zones
Storage: localStorage key = `e-checksheet-selang-{zona}`
```

### 7. **E-Checksheet Smoke Detector** (5 codes)
```
Route: /e-checksheet-smoke-detector?openArea={area}
QR Format: echecksheet:///e-checksheet-smoke-detector?openArea=area-1
Use Case: Smoke detector maintenance
Data: 5 areas
Storage: localStorage key = `e-checksheet-smoke-{area}`
```

### 8. **E-Checksheet Tangga Listrik** (2 codes)
```
Route: /e-checksheet-tg-listrik?openArea={area}
QR Format: echecksheet:///e-checksheet-tg-listrik?openArea=area-produksi
Use Case: Electric stair/ladder check
Data: 2 areas
Storage: localStorage key = `e-checksheet-tg-{area}`
```

---

## 🔐 Data Flow Comparison

### Status-GA Data Flow

```
QR Scan
  ↓
/status-ga/[type]/... page
  ↓
Page fetches from backend (API)
  ↓
Display existing data + form
  ↓
User edits
  ↓
Save to backend (API call)
  ↓
Update status/workflow
  ↓
Show in riwayat (history)
```

### E-Checksheet Data Flow

```
QR Scan
  ↓
/e-checksheet-[type]?params page
  ↓
Load from localStorage if exists
  ↓
Display form with pre-filled params
  ↓
User fills inspection items
  ↓
Save to localStorage (key = e-checksheet-{type}-{id})
  ↓
Show summary of saved inspections
  ↓
Optional: Send to backend
```

---

## 💻 Code Examples

### Status-GA Page Example: Fire Alarm

```typescript
// /app/status-ga/fire-alarm/page.tsx
export default function FireAlarmPage() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  
  useEffect(() => {
    // Fetch zones from backend
    fetchZones().then(setZones);
  }, []);
  
  return (
    <div>
      {zones.map(zona => (
        <ZoneCard 
          zona={zona}
          onClick={() => router.push(`/status-ga/fire-alarm/${zona.id}`)}
        />
      ))}
    </div>
  );
}
```

### E-Checksheet Page Example: Hydrant

```typescript
// /app/e-checksheet-hydrant/page.tsx
export default function EChecksheetHydrantPage({
  searchParams,
}: {
  searchParams: Promise<{ openHydrant?: string }>;
}) {
  const params = use(searchParams);
  const hydrantNo = params?.openHydrant || '0';
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EChecksheetHydrantForm hydrantNo={hydrantNo} />
    </Suspense>
  );
}
```

---

## 📊 Statistics

### Status-GA
- **Folder Count**: 1 (/app/status-ga/)
- **Checksheet Types**: 15
- **QR Code Categories**: 15
- **Total QR Codes**: ~192 (varies by type)
- **Routing Complexity**: High
- **Data Backend**: Required
- **State Management**: Complex

### E-Checksheet
- **Folder Count**: 8 (/app/e-checksheet-*/)
- **Checksheet Types**: 8
- **QR Code Categories**: 8
- **Total QR Codes**: 118
- **Routing Complexity**: Simple
- **Data Backend**: Optional
- **State Management**: Simple

**Total in System**: 23 checksheet types, ~310 QR codes

---

## 🚀 Migration Path (If Needed)

If an e-checksheet should become status-ga:

1. Copy folder: `/app/e-checksheet-[type]` → `/app/status-ga/[type]`
2. Update routing in `/app/scan/page.tsx`
3. Add backend integration (API calls)
4. Update QR generator script
5. Add riwayat (history) pages
6. Update workflows

---

## ✅ Key Takeaways

1. **Status-GA**: Complex workflows, backend required, full tracking
2. **E-Checksheet**: Simple forms, localStorage, quick entry
3. **Different routes**: `/status-ga/` vs `/e-checksheet-`
4. **Different QR formats**: `echecksheet:///status-ga/` vs `echecksheet:///e-checksheet-`
5. **Different code sections**: Lines 94-210 vs 215-296 in `/app/scan/page.tsx`
6. **Coexist peacefully**: Both systems work independently
7. **Easy to scale**: Add more types to either category

---

## 🔗 Related Documentation

- `E_CHECKSHEET_IMPLEMENTATION.md` - Full e-checksheet implementation
- `QUICK_REFERENCE.md` - Quick reference guide
- `TEST_E_CHECKSHEET_ROUTING.md` - Testing guide
- `/app/scan/page.tsx` - Routing logic
- `/scripts/generate-all-qr.js` - QR generation

---

**Architectural Review Date**: January 27, 2026  
**Status**: ✅ Complete and Validated
