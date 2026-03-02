// app/status-ga/checksheet-toilet/[area]/riwayat/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Download, Eye, X, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────
interface InspectionItem {
  no: number;
  key: string;
  label: string;
}

interface InspectionRecord {
  id: string;
  inspection_date: string;
  inspection_time: string;
  inspector_name: string;
  inspector_nik?: string;
  overall_status: string;
  toilet_type: string;
  area_name?: string;
  [key: string]: any; // item_X_hasil_l/p etc.
}

// ─── STATIC DATA ─────────────────────────────────────────
const INSPECTION_ITEMS: InspectionItem[] = [
  { no: 1, key: "kebersihanLantai",   label: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
  { no: 2, key: "kebersihanDinding",  label: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
  { no: 3, key: "bauToilet",          label: "Bau tidak menyengat / tidak ada bau tidak sedap" },
  { no: 4, key: "ketersediaanAir",    label: "Ketersediaan air mencukupi" },
  { no: 5, key: "klosetBersih",       label: "Kloset bersih, tidak mampet, tidak bocor" },
  { no: 6, key: "wastafel",           label: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
  { no: 7, key: "tisuToilet",         label: "Tisu toilet tersedia" },
  { no: 8, key: "tempatSampah",       label: "Tempat sampah tersedia dan tertutup" },
  { no: 9, key: "ventilasi",          label: "Ventilasi cukup (tidak pengap)" },
  { no: 10, key: "perlengkapanLain",  label: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
];

const AREA_NAMES: Record<string, string> = {
  "toilet-driver": "TOILET - DRIVER",
  "toilet-bea-cukai": "TOILET - BEA CUKAI",
  "toilet-parkir": "TOILET - PARKIR",
  "toilet-c2": "TOILET - C2",
  "toilet-c1": "TOILET - C1",
  "toilet-d": "TOILET - D",
  "toilet-auditorium": "TOILET - AUDITORIUM",
  "toilet-whs": "TOILET - WHS",
  "toilet-b1": "TOILET - B1",
  "toilet-a": "TOILET - A",
  "toilet-lobby": "TOILET - LOBBY",
  "toilet-office-main": "TOILET - OFFICE MAIN",
};

const WANITA_ONLY_AREAS = ["toilet-c2", "toilet-whs"];

// ─── HELPER ──────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ─── DETAIL MODAL ─────────────────────────────────────────
function DetailModal({
  inspection,
  areaId,
  onClose,
}: {
  inspection: InspectionRecord;
  areaId: string;
  onClose: () => void;
}) {
  const isWanitaOnly = WANITA_ONLY_AREAS.includes(areaId);
  const isLakiPerempuan = !isWanitaOnly;

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Robust field reader — tries multiple key formats that APIs might return
  // Robust getter: tries exact match → uppercase suffix → case-insensitive scan
  const getVal = (field: string): string => {
    const v = inspection[field];
    if (v !== undefined && v !== null && v !== "") return String(v);
    const upper = field.replace(/_([lp])$/, (_: string, g: string) => `_${g.toUpperCase()}`);
    const v2 = inspection[upper];
    if (v2 !== undefined && v2 !== null && v2 !== "") return String(v2);
    const fl = field.toLowerCase();
    for (const k of Object.keys(inspection)) {
      if (k.toLowerCase() === fl) {
        const v3 = inspection[k];
        if (v3 !== undefined && v3 !== null && v3 !== "") return String(v3);
      }
    }
    return "";
  };

  const renderItemRow = (item: InspectionItem) => {
    if (isWanitaOnly) {
      const hasil = getVal(`item_${item.no}_hasil_p`);
      const ket   = getVal(`item_${item.no}_keterangan_p`);
      const tindakan = getVal(`item_${item.no}_tindakan_p`);
      const foto  = getVal(`item_${item.no}_foto_p`);
      const pic   = getVal(`item_${item.no}_pic_p`);
      const isNG  = hasil === "NG";

      return (
        <div key={item.no} className={`dm-item ${isNG ? "dm-item--ng" : "dm-item--ok"}`}>
          <div className="dm-item-header">
            <span className="dm-item-no">{item.no}</span>
            <span className="dm-item-label">{item.label}</span>
            <span className={`dm-badge ${isNG ? "dm-badge--ng" : "dm-badge--ok"}`}>
              {hasil || "-"}
            </span>
          </div>
          {(ket || tindakan || foto) && (
            <div className="dm-item-detail">
              {ket && <div className="dm-detail-row"><span className="dm-dl">Keterangan:</span><span>{ket}</span></div>}
              {tindakan && <div className="dm-detail-row"><span className="dm-dl">Tindakan:</span><span>{tindakan}</span></div>}
              {pic && <div className="dm-detail-row"><span className="dm-dl">PIC:</span><span>{pic}</span></div>}
              {foto && (
                <div className="dm-detail-row dm-foto-row">
                  <span className="dm-dl">Foto:</span>
                  <img src={foto} alt="Foto temuan" className="dm-foto" />
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Laki & Perempuan side by side (or stacked on mobile)
    const hasilL = getVal(`item_${item.no}_hasil_l`);
    const hasilP = getVal(`item_${item.no}_hasil_p`);
    const ketL   = getVal(`item_${item.no}_keterangan_l`);
    const ketP   = getVal(`item_${item.no}_keterangan_p`);
    const tindakanL = getVal(`item_${item.no}_tindakan_l`);
    const tindakanP = getVal(`item_${item.no}_tindakan_p`);
    const fotoL  = getVal(`item_${item.no}_foto_l`);
    const fotoP  = getVal(`item_${item.no}_foto_p`);
    const picL   = getVal(`item_${item.no}_pic_l`);
    const picP   = getVal(`item_${item.no}_pic_p`);
    const hasNG  = hasilL === "NG" || hasilP === "NG";

    return (
      <div key={item.no} className={`dm-item ${hasNG ? "dm-item--ng" : "dm-item--ok"}`}>
        {/* Item header */}
        <div className="dm-item-header">
          <span className="dm-item-no">{item.no}</span>
          <span className="dm-item-label">{item.label}</span>
        </div>

        {/* Gender columns */}
        <div className="dm-gender-cols">
          {/* Laki */}
          <div className={`dm-gender-col dm-gender-col--male ${hasilL === "NG" ? "dm-col--ng" : "dm-col--ok"}`}>
            <div className="dm-gender-title dm-gender-title--male">
              🚹 Laki-laki
              <span className={`dm-badge ${hasilL === "NG" ? "dm-badge--ng" : "dm-badge--ok"}`}>
                {hasilL || "-"}
              </span>
            </div>
            {(ketL || tindakanL) && (
              <div className="dm-gender-detail">
                {ketL && <div className="dm-detail-row"><span className="dm-dl">Ket:</span><span>{ketL}</span></div>}
                {tindakanL && <div className="dm-detail-row"><span className="dm-dl">Tindakan:</span><span>{tindakanL}</span></div>}
                {picL && <div className="dm-detail-row"><span className="dm-dl">PIC:</span><span>{picL}</span></div>}
                {fotoL && (
                  <div className="dm-detail-row dm-foto-row">
                    <span className="dm-dl">Foto:</span>
                    <img src={fotoL} alt="Foto" className="dm-foto" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Perempuan */}
          <div className={`dm-gender-col dm-gender-col--female ${hasilP === "NG" ? "dm-col--ng" : "dm-col--ok"}`}>
            <div className="dm-gender-title dm-gender-title--female">
              🚺 Perempuan
              <span className={`dm-badge ${hasilP === "NG" ? "dm-badge--ng" : "dm-badge--ok"}`}>
                {hasilP || "-"}
              </span>
            </div>
            {(ketP || tindakanP) && (
              <div className="dm-gender-detail">
                {ketP && <div className="dm-detail-row"><span className="dm-dl">Ket:</span><span>{ketP}</span></div>}
                {tindakanP && <div className="dm-detail-row"><span className="dm-dl">Tindakan:</span><span>{tindakanP}</span></div>}
                {picP && <div className="dm-detail-row"><span className="dm-dl">PIC:</span><span>{picP}</span></div>}
                {fotoP && (
                  <div className="dm-detail-row dm-foto-row">
                    <span className="dm-dl">Foto:</span>
                    <img src={fotoP} alt="Foto" className="dm-foto" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Count summary
  const counts = INSPECTION_ITEMS.reduce(
    (acc, item) => {
      if (isWanitaOnly) {
        const h = getVal(`item_${item.no}_hasil_p`);
        if (h === "OK") acc.ok++; else if (h === "NG") acc.ng++;
      } else {
        const l = getVal(`item_${item.no}_hasil_l`);
        const p = getVal(`item_${item.no}_hasil_p`);
        if (l === "OK") acc.ok++; else if (l === "NG") acc.ng++;
        if (p === "OK") acc.ok++; else if (p === "NG") acc.ng++;
      }
      return acc;
    },
    { ok: 0, ng: 0 }
  );

  const total = isWanitaOnly ? 10 : 20;

  return (
    <div className="dm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dm-modal">
        {/* Modal Header */}
        <div className="dm-modal-header">
          <div className="dm-modal-title">
            <Calendar size={20} />
            <span>Detail Pemeriksaan</span>
          </div>
          <button className="dm-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Inspection Info */}
        <div className="dm-info-bar">
          <div className="dm-info-grid">
            <div className="dm-info-item">
              <span className="dm-info-label">📅 Tanggal</span>
              <span className="dm-info-val">{formatDate(inspection.inspection_date)}</span>
            </div>
            <div className="dm-info-item">
              <span className="dm-info-label">⏰ Waktu</span>
              <span className="dm-info-val">{inspection.inspection_time}</span>
            </div>
            <div className="dm-info-item">
              <span className="dm-info-label">👤 Inspector</span>
              <span className="dm-info-val">{inspection.inspector_name}</span>
            </div>
            <div className="dm-info-item">
              <span className="dm-info-label">📍 Area</span>
              <span className="dm-info-val">{AREA_NAMES[areaId] || areaId}</span>
            </div>
          </div>
        </div>

        {/* Summary Scoreboard */}
        <div className="dm-scoreboard">
          <div className="dm-score dm-score--ok">
            <CheckCircle size={22} />
            <span className="dm-score-num">{counts.ok}</span>
            <span className="dm-score-label">OK</span>
          </div>
          <div className="dm-score-divider" />
          <div className="dm-score dm-score--ng">
            <XCircle size={22} />
            <span className="dm-score-num">{counts.ng}</span>
            <span className="dm-score-label">NG</span>
          </div>
          <div className="dm-score-divider" />
          <div className="dm-score dm-score--total">
            <span className="dm-score-num">{counts.ok + counts.ng}</span>
            <span className="dm-score-label">/ {total} Item</span>
          </div>
          <div className="dm-overall">
            <span className={`dm-overall-badge ${inspection.overall_status === "NG" ? "dm-badge--ng" : "dm-badge--ok"}`}>
              {inspection.overall_status === "NG" ? "✗ NG" : "✓ OK"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="dm-progress-wrap">
          <div
            className="dm-progress-bar"
            style={{ width: `${Math.round((counts.ok / (counts.ok + counts.ng || 1)) * 100)}%` }}
          />
        </div>
        <div className="dm-progress-label">
          {Math.round((counts.ok / (counts.ok + counts.ng || 1)) * 100)}% item OK
        </div>

        {/* Items */}
        <div className="dm-items-wrap">
          {INSPECTION_ITEMS.map(renderItemRow)}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function RiwayatToilet({ params }: { params: Promise<{ area: string }> }) {
  const [areaId, setAreaId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0, hasMore: false });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setAreaId(resolvedParams.area);
    })();
  }, [params]);

  useEffect(() => {
    if (!user || !areaId) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          area_code: areaId,
          limit: String(pagination.limit),
          offset: String(pagination.offset),
        });
        if (filterDate) queryParams.append("inspection_date", filterDate);

        const response = await fetch(`/api/toilet-inspections/history?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            let rows: InspectionRecord[] = data.data;
            if (filterStatus !== "all") {
              rows = rows.filter((r) => r.overall_status?.toLowerCase() === filterStatus.toLowerCase());
            }
            setInspections(rows);
            if (data.pagination) setPagination((p) => ({ ...p, ...data.pagination }));
          } else {
            setInspections([]);
          }
        } else {
          alert(`Gagal memuat riwayat: Status ${response.status}`);
        }
      } catch (err) {
        alert("Gagal memuat riwayat: " + (err as any).message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, areaId, filterDate, filterStatus, pagination.offset]);

  const areaName = areaId ? (AREA_NAMES[areaId] || decodeURIComponent(areaId)) : "";

  const handleExportCSV = () => {
    if (!inspections.length) { alert("Tidak ada data untuk diexport"); return; }
    const headers = ["Tanggal", "Waktu", "Inspector", "Status"];
    const rows = inspections.map((r) => [
      formatDateShort(r.inspection_date),
      r.inspection_time,
      r.inspector_name,
      r.overall_status,
    ]);
    let csv = headers.join(",") + "\n";
    rows.forEach((r) => { csv += r.map((c) => `"${c}"`).join(",") + "\n"; });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `riwayat-${areaId}-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  if (!user || !areaId) return null;

  return (
    <>
      <style>{`
        /* ─── RESET & BASE ─── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ─── VARIABLES ─── */
        :root {
          --rv-blue: #1565c0;
          --rv-blue-light: #1e88e5;
          --rv-blue-pale: #e3f2fd;
          --rv-green: #166534;
          --rv-green-pale: #dcfce7;
          --rv-red: #b91c1c;
          --rv-red-pale: #fee2e2;
          --rv-gray: #64748b;
          --rv-border: #e2e8f0;
          --rv-shadow: 0 2px 8px rgba(0,0,0,0.07);
          --rv-radius: 12px;
          --rv-sidebar: 75px;
        }

        /* ─── LAYOUT ─── */
        .rv-page { display: flex; min-height: 100vh; background: #f7f9fc; }

        .rv-content {
          flex: 1;
          margin-left: var(--rv-sidebar);
          padding: 24px 20px 48px;
          max-width: 1400px;
        }

        /* ─── HEADER BANNER ─── */
        .rv-header {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          color: #fff;
          padding: 16px 20px;
          border-radius: var(--rv-radius);
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(21,101,192,0.25);
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .rv-btn-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.2);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.2s;
          min-height: 40px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .rv-btn-back:hover { background: rgba(255,255,255,0.3); }

        .rv-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: clamp(16px, 4vw, 22px);
          font-weight: 700;
          flex: 1;
        }

        /* ─── FILTER CARD ─── */
        .rv-filters {
          background: #fff;
          border: 1px solid var(--rv-border);
          border-radius: var(--rv-radius);
          padding: 14px 18px;
          margin-bottom: 18px;
          display: flex;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: var(--rv-shadow);
        }

        .rv-filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .rv-filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .rv-filter-input,
        .rv-filter-select {
          padding: 9px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 7px;
          font-size: 14px;
          color: #1e293b;
          background: #fff;
          transition: border-color 0.2s;
          min-height: 40px;
        }

        .rv-filter-input { width: 170px; }
        .rv-filter-select { min-width: 120px; }

        .rv-filter-input:focus,
        .rv-filter-select:focus {
          outline: none;
          border-color: var(--rv-blue-light);
          box-shadow: 0 0 0 3px rgba(30,136,229,0.1);
        }

        .rv-btn-export {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 7px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 40px;
          margin-left: auto;
          white-space: nowrap;
        }
        .rv-btn-export:hover { background: #059669; transform: translateY(-1px); }

        /* ─── STATS BAR ─── */
        .rv-stats {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .rv-stat {
          flex: 1;
          min-width: 100px;
          background: #fff;
          border: 1px solid var(--rv-border);
          border-radius: 8px;
          padding: 10px 14px;
          text-align: center;
          box-shadow: var(--rv-shadow);
        }

        .rv-stat-num {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          display: block;
        }

        .rv-stat-label {
          font-size: 11px;
          color: var(--rv-gray);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .rv-stat--ok .rv-stat-num { color: var(--rv-green); }
        .rv-stat--ng .rv-stat-num { color: var(--rv-red); }

        /* ─── LOADING / EMPTY ─── */
        .rv-loading, .rv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: #fff;
          border: 1px solid var(--rv-border);
          border-radius: var(--rv-radius);
          color: var(--rv-gray);
          gap: 12px;
        }

        .rv-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: var(--rv-blue);
          border-radius: 50%;
          animation: rv-spin 0.8s linear infinite;
        }

        @keyframes rv-spin { to { transform: rotate(360deg); } }

        /* ─── DESKTOP TABLE ─── */
        .rv-desktop { display: block; }
        .rv-mobile  { display: none; }

        .rv-table-wrap {
          background: #fff;
          border: 1px solid var(--rv-border);
          border-radius: var(--rv-radius);
          overflow: hidden;
          box-shadow: var(--rv-shadow);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .rv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          min-width: 560px;
        }

        .rv-table thead th {
          background: #f1f5f9;
          padding: 13px 14px;
          text-align: left;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #cbd5e1;
          white-space: nowrap;
        }

        .rv-table tbody td {
          padding: 12px 14px;
          border-bottom: 1px solid #f0f4f8;
          color: #334155;
          vertical-align: middle;
        }

        .rv-table tbody tr:last-child td { border-bottom: none; }
        .rv-table tbody tr:hover { background: #f8fafc; }

        .rv-no-col { text-align: center; width: 48px; color: #94a3b8; font-weight: 600; }
        .rv-date-col { white-space: nowrap; font-weight: 600; }
        .rv-time-col { white-space: nowrap; }
        .rv-name-col { max-width: 200px; }

        /* ─── STATUS BADGE ─── */
        .rv-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
        }
        .rv-badge--ok { background: var(--rv-green-pale); color: var(--rv-green); }
        .rv-badge--ng { background: var(--rv-red-pale); color: var(--rv-red); }

        /* ─── DETAIL BUTTON ─── */
        .rv-btn-detail {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 34px;
          white-space: nowrap;
        }
        .rv-btn-detail:hover { background: #2563eb; transform: translateY(-1px); }

        /* ─── MOBILE CARDS ─── */
        .rv-card {
          background: #fff;
          border: 1.5px solid var(--rv-border);
          border-radius: var(--rv-radius);
          margin-bottom: 10px;
          overflow: hidden;
          box-shadow: var(--rv-shadow);
          transition: box-shadow 0.2s;
        }
        .rv-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); }

        .rv-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.15s;
          min-height: 52px;
        }
        .rv-card-header:hover { background: #f1f5f9; }

        .rv-card-no {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rv-card-date {
          flex: 1;
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .rv-card-meta {
          font-size: 11px;
          color: var(--rv-gray);
          display: block;
          font-weight: 400;
          margin-top: 2px;
        }

        .rv-card-chevron {
          color: var(--rv-gray);
          transition: transform 0.25s;
          flex-shrink: 0;
        }
        .rv-card-chevron.open { transform: rotate(180deg); }

        .rv-card-body {
          padding: 14px 16px;
          border-top: 1px solid var(--rv-border);
          background: #fafbfc;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rv-card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          gap: 8px;
        }

        .rv-card-row-label {
          color: var(--rv-gray);
          font-weight: 500;
          min-width: 80px;
        }

        .rv-card-row-val {
          color: #1e293b;
          text-align: right;
          flex: 1;
        }

        .rv-btn-detail-mobile {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          margin-top: 6px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
          min-height: 48px;
        }
        .rv-btn-detail-mobile:hover { background: #2563eb; }

        /* ─── PAGINATION ─── */
        .rv-pagination {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .rv-btn-more {
          padding: 12px 28px;
          background: #64748b;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
          min-width: 160px;
        }
        .rv-btn-more:hover:not(:disabled) { background: #475569; transform: translateY(-1px); }
        .rv-btn-more:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─── DETAIL MODAL ─── */
        .dm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.55);
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
          backdrop-filter: blur(2px);
        }

        .dm-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 820px;
          margin: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          overflow: hidden;
          animation: dm-slide-in 0.25s ease;
        }

        @keyframes dm-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dm-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1565c0, #1e88e5);
          color: #fff;
        }

        .dm-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
        }

        .dm-close {
          width: 34px;
          height: 34px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .dm-close:hover { background: rgba(255,255,255,0.35); }

        /* Info bar */
        .dm-info-bar {
          background: #f8fafc;
          border-bottom: 1px solid var(--rv-border);
          padding: 12px 20px;
        }

        .dm-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px 16px;
        }

        .dm-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dm-info-label {
          font-size: 11px;
          color: var(--rv-gray);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .dm-info-val {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Scoreboard */
        .dm-scoreboard {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 14px 20px;
          background: #fff;
          border-bottom: 1px solid var(--rv-border);
        }

        .dm-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 0 20px;
          flex: 1;
        }

        .dm-score-num {
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }

        .dm-score-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--rv-gray);
          text-transform: uppercase;
        }

        .dm-score--ok { color: var(--rv-green); }
        .dm-score--ng { color: var(--rv-red); }
        .dm-score--total { color: #334155; }

        .dm-score-divider {
          width: 1px;
          height: 48px;
          background: var(--rv-border);
          flex-shrink: 0;
        }

        .dm-overall {
          padding: 0 20px;
        }

        .dm-overall-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 18px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 15px;
        }

        /* Progress */
        .dm-progress-wrap {
          height: 6px;
          background: #fee2e2;
          margin: 0 20px 4px;
          border-radius: 3px;
          overflow: hidden;
        }

        .dm-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .dm-progress-label {
          padding: 0 20px 14px;
          font-size: 11px;
          color: var(--rv-gray);
          text-align: right;
        }

        /* Items */
        .dm-items-wrap {
          padding: 12px 16px 20px;
          max-height: 60vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dm-item {
          border-radius: 8px;
          overflow: hidden;
          border: 1.5px solid;
        }

        .dm-item--ok { border-color: #bbf7d0; background: #f0fdf4; }
        .dm-item--ng { border-color: #fecaca; background: #fff5f5; }

        .dm-item-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          flex-wrap: nowrap;
        }

        .dm-item-no {
          width: 24px;
          height: 24px;
          min-width: 24px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .dm-item-label {
          flex: 1;
          min-width: 0;
          font-size: 12.5px;
          font-weight: 500;
          color: #334155;
          line-height: 1.4;
          word-break: break-word;
          white-space: normal;
        }

        .dm-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          align-self: flex-start;
          margin-top: 1px;
          white-space: nowrap;
        }
        .dm-badge--ok { background: var(--rv-green-pale); color: var(--rv-green); }
        .dm-badge--ng { background: var(--rv-red-pale); color: var(--rv-red); }

        /* Gender columns */
        .dm-gender-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid rgba(0,0,0,0.06);
        }

        .dm-gender-col {
          padding: 8px 12px;
        }

        .dm-gender-col--male  { border-right: 1px solid rgba(0,0,0,0.06); }

        .dm-col--ok { background: rgba(240,253,244,0.6); }
        .dm-col--ng { background: rgba(255,245,245,0.8); }

        .dm-gender-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
          gap: 6px;
        }

        .dm-gender-title--male   { color: #1565c0; }
        .dm-gender-title--female { color: #ad1457; }

        .dm-gender-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dm-detail-row {
          display: flex;
          gap: 6px;
          font-size: 11.5px;
          color: #475569;
          flex-wrap: wrap;
        }

        .dm-dl {
          font-weight: 600;
          color: #64748b;
          min-width: 58px;
          flex-shrink: 0;
        }

        .dm-item-detail {
          padding: 8px 12px;
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dm-foto-row {
          flex-direction: column;
          gap: 4px;
        }

        .dm-foto {
          max-width: 100px;
          max-height: 100px;
          border-radius: 4px;
          border: 1px solid #ddd;
          object-fit: cover;
          margin-top: 4px;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .rv-content {
            margin-left: 80px;
            padding: 18px 14px 40px;
          }
        }

        @media (max-width: 768px) {
          .rv-content {
            margin-left: 0;
            padding: 12px 10px 60px;
          }

          .rv-header {
            padding: 12px 14px;
          }

          .rv-btn-back-text { display: none; }

          .rv-filters {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px 14px;
          }

          .rv-filter-group { width: 100%; }
          .rv-filter-input { width: 100%; }
          .rv-filter-select { width: 100%; }
          .rv-btn-export { width: 100%; justify-content: center; margin-left: 0; }

          .rv-desktop { display: none; }
          .rv-mobile  { display: block; }

          .rv-stats { gap: 8px; }
          .rv-stat { min-width: 80px; padding: 8px 10px; }
          .rv-stat-num { font-size: 18px; }
          .rv-stat-label { font-size: 10px; }
        }

        @media (max-width: 480px) {
          .rv-content { padding: 10px 8px 60px; }

          .rv-header-title { font-size: 15px; }

          .dm-overlay { padding: 8px; }

          .dm-modal { border-radius: 12px; }

          .dm-modal-header { padding: 12px 16px; }

          .dm-scoreboard { padding: 10px 12px; gap: 0; }

          .dm-score { padding: 0 10px; }
          .dm-score-num { font-size: 22px; }
          .dm-score-label { font-size: 10px; }

          .dm-overall { padding: 0 10px; }
          .dm-overall-badge { font-size: 13px; padding: 5px 12px; }

          .dm-progress-wrap,
          .dm-progress-label { margin-left: 12px; margin-right: 12px; }

          .dm-progress-label { padding-left: 0; padding-right: 0; }

          .dm-items-wrap { padding: 8px 10px 16px; max-height: 55vh; }

          .dm-gender-cols { grid-template-columns: 1fr; }
          .dm-gender-col--male { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.06); }

          .dm-info-grid { grid-template-columns: 1fr 1fr; }

          .rv-stat-num { font-size: 16px; }

          @media (hover: none) and (pointer: coarse) {
            .rv-filter-input,
            .rv-filter-select { font-size: 16px; }
          }
        }
      `}</style>

      <div className="rv-page">
        <Sidebar userName={user.fullName} />

        <div className="rv-content">
          {/* ── Header ── */}
          <div className="rv-header">
            <button className="rv-btn-back" onClick={() => router.push("/status-ga/checksheet-toilet")}>
              <ArrowLeft size={16} />
              <span className="rv-btn-back-text">Kembali</span>
            </button>
            <div className="rv-header-title">
              <Calendar size={22} />
              <span>Riwayat {areaName}</span>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="rv-filters">
            <div className="rv-filter-group">
              <label>Tanggal</label>
              <input
                type="date"
                className="rv-filter-input"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPagination((p) => ({ ...p, offset: 0 })); }}
              />
            </div>
            <div className="rv-filter-group">
              <label>Status</label>
              <select
                className="rv-filter-select"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPagination((p) => ({ ...p, offset: 0 })); }}
              >
                <option value="all">Semua</option>
                <option value="OK">OK</option>
                <option value="NG">NG</option>
              </select>
            </div>
            <button className="rv-btn-export" onClick={handleExportCSV}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* ── Stats bar ── */}
          {!loading && inspections.length > 0 && (
            <div className="rv-stats">
              <div className="rv-stat">
                <span className="rv-stat-num">{inspections.length}</span>
                <span className="rv-stat-label">Total Data</span>
              </div>
              <div className="rv-stat rv-stat--ok">
                <span className="rv-stat-num">{inspections.filter((r) => r.overall_status === "OK").length}</span>
                <span className="rv-stat-label">Total OK</span>
              </div>
              <div className="rv-stat rv-stat--ng">
                <span className="rv-stat-num">{inspections.filter((r) => r.overall_status === "NG").length}</span>
                <span className="rv-stat-label">Total NG</span>
              </div>
              <div className="rv-stat">
                <span className="rv-stat-num">
                  {inspections.length > 0
                    ? Math.round((inspections.filter((r) => r.overall_status === "OK").length / inspections.length) * 100)
                    : 0}%
                </span>
                <span className="rv-stat-label">% OK</span>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="rv-loading">
              <div className="rv-spinner" />
              <p style={{ margin: 0, color: "#64748b" }}>Memuat data...</p>
            </div>
          ) : inspections.length === 0 ? (
            <div className="rv-empty">
              <p style={{ margin: 0, fontSize: 15 }}>
                {filterDate || filterStatus !== "all"
                  ? "Tidak ada data yang sesuai filter"
                  : "Belum ada data riwayat"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="rv-desktop">
                <div className="rv-table-wrap">
                  <table className="rv-table">
                    <thead>
                      <tr>
                        <th className="rv-no-col">No</th>
                        <th className="rv-date-col">Tanggal</th>
                        <th className="rv-time-col">Waktu</th>
                        <th className="rv-name-col">Inspector</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((r, idx) => (
                        <tr key={r.id}>
                          <td className="rv-no-col">{idx + 1}</td>
                          <td className="rv-date-col">{formatDateShort(r.inspection_date)}</td>
                          <td className="rv-time-col">{r.inspection_time}</td>
                          <td className="rv-name-col">{r.inspector_name}</td>
                          <td>
                            <span className={`rv-badge ${r.overall_status === "NG" ? "rv-badge--ng" : "rv-badge--ok"}`}>
                              {r.overall_status === "NG" ? "✗" : "✓"} {r.overall_status}
                            </span>
                          </td>
                          <td>
                            <button className="rv-btn-detail" onClick={() => setSelectedInspection(r)}>
                              <Eye size={13} />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="rv-mobile">
                {inspections.map((r, idx) => {
                  const isOpen = expandedId === r.id;
                  return (
                    <div key={r.id} className="rv-card">
                      <div className="rv-card-header" onClick={() => toggleExpand(r.id)}>
                        <div className="rv-card-no">{idx + 1}</div>
                        <div className="rv-card-date">
                          {formatDateShort(r.inspection_date)}
                          <span className="rv-card-meta">{r.inspection_time} · {r.inspector_name}</span>
                        </div>
                        <span className={`rv-badge ${r.overall_status === "NG" ? "rv-badge--ng" : "rv-badge--ok"}`}>
                          {r.overall_status === "NG" ? "✗" : "✓"} {r.overall_status}
                        </span>
                        <span className={`rv-card-chevron ${isOpen ? "open" : ""}`}>
                          <ChevronDown size={18} />
                        </span>
                      </div>

                      {isOpen && (
                        <div className="rv-card-body">
                          <div className="rv-card-row">
                            <span className="rv-card-row-label">Waktu</span>
                            <span className="rv-card-row-val">⏰ {r.inspection_time}</span>
                          </div>
                          <div className="rv-card-row">
                            <span className="rv-card-row-label">Inspector</span>
                            <span className="rv-card-row-val">👤 {r.inspector_name}</span>
                          </div>
                          <div className="rv-card-row">
                            <span className="rv-card-row-label">Status</span>
                            <span className="rv-card-row-val">
                              <span className={`rv-badge ${r.overall_status === "NG" ? "rv-badge--ng" : "rv-badge--ok"}`}>
                                {r.overall_status === "NG" ? "✗ NG" : "✓ OK"}
                              </span>
                            </span>
                          </div>
                          <button className="rv-btn-detail-mobile" onClick={() => setSelectedInspection(r)}>
                            <Eye size={16} />
                            Lihat Detail Pemeriksaan
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.hasMore && (
                <div className="rv-pagination">
                  <button
                    className="rv-btn-more"
                    onClick={() => setPagination((p) => ({ ...p, offset: p.offset + p.limit }))}
                    disabled={loading}
                  >
                    {loading ? "Memuat..." : "Muat Lebih Banyak"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedInspection && (
        <DetailModal
          inspection={selectedInspection}
          areaId={areaId!}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </>
  );
}