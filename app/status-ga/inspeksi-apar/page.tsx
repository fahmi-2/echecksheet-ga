// app/inspeksi-apar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { aparDataBySlug } from "@/lib/apar-data";
import { AlertTriangle, FileText, BarChart2, ArrowLeft, Hash } from "lucide-react";

const AREAS = [
  { name: "AREA LOCKER & SECURITY", slug: "area-locker-security" },
  { name: "AREA KANTIN", slug: "area-kantin" },
  { name: "AREA AUDITORIUM", slug: "area-auditorium" },
  { name: "AREA MAIN OFFICE", slug: "area-main-office" },
  { name: "EXIM", slug: "exim" },
  { name: "AREA GENBA A", slug: "area-genba-a" },
  { name: "AREA MEZZANINE GENBA A", slug: "area-mezzanine-genba-a" },
  { name: "JIG PROTO 1 AREA RECEIVING (SEBELAH PINTU MASUK) FABRIKASI JP SISI BARAT", slug: "jig-proto-1-area-receiving" },
  { name: "STOCK CONTROL AREA", slug: "stock-control-area" },
  { name: "JIG PROTO 2 CNC ROOM FABRIKASI C/B JP", slug: "jig-proto-2-cnc-room" },
  { name: "AREA TRAINING A& DINING ROOM , MTC OFFICE", slug: "area-training-dining-mtc" },
  { name: "GENBA C", slug: "genba-c" },
  { name: "AREA PUMP ROOM & WAREHOUSE", slug: "area-pump-room-warehouse" },
  { name: "POWER HOUSE (UNTUK GENBA A)", slug: "power-house-genba-a" },
  { name: "POWER HOUSE (UNTUK GENBA C)", slug: "power-house-genba-c" },
  { name: "AREA TPS B3", slug: "area-tps-b3" },
  { name: "NEW BUILDING WAREHOUSE", slug: "new-building-warehouse" },
  { name: "GENBA B", slug: "genba-b" },
  { name: "POWER HOUSE AREA DAN WORKSHOP", slug: "power-house-workshop" },
  { name: "AREA SEGITIGA GA", slug: "area-segitiga-ga" },
  { name: "AREA PARKIR MOTOR", slug: "area-parkir-motor" },
  { name: "FORKLIFT", slug: "forklift" },
  { name: "SAMPING PAGAR SEBELUM RAK HELM", slug: "samping-pagar-rak-helm" },
  { name: "BELAKANG KANTIN", slug: "belakang-kantin" },
  { name: "IR ROOM", slug: "ir-room" },
  { name: "AREA AUDITORIUM OUTDOOR", slug: "area-auditorium-outdoor" },
  { name: "AREA KLINIK", slug: "area-klinik" },
  { name: "MESIN RAYCHEM GENBA A", slug: "mesin-raychem-genba-a" },
  { name: "MESIN RAYCHEM GENBA B", slug: "mesin-raychem-genba-b" },
  { name: "MESIN RAYCHEM GENBA C", slug: "mesin-raychem-genba-c" },
];

export default function InspeksiAparPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  // Helper: ekstrak angka dari no.apar (bisa "1", "2", "1.1", dll)
  const extractNumber = (noApar: string | number): number => {
    const str = noApar.toString();
    // Ambil angka pertama dari string (misal: "1.1" -> 1, "2" -> 2)
    const match = str.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper: dapatkan no.apar dari item
  const getNoApar = (item: any): string => {
    return item["no.apar"] || item.noApar || item.noAPAR || item.noItem || "-";
  };

  // Helper: cek apakah area memiliki APAR dalam range
  const areaHasAparInRange = useMemo(() => {
    return (slug: string, from: number | null, to: number | null) => {
      // Jika tidak ada filter range, tampilkan semua
      if (from === null && to === null) return true;
      
      const items = aparDataBySlug[slug as keyof typeof aparDataBySlug];
      if (!items || items.length === 0) return false;

      return items.some((item: any) => {
        const noApar = getNoApar(item);
        const num = extractNumber(noApar);
        
        // Check if number is within range
        const min = from ?? 0;
        const max = to ?? Number.MAX_SAFE_INTEGER;
        
        return num >= min && num <= max;
      });
    };
  }, []);

  const filteredAreas = useMemo(() => {
    const fromNum = rangeFrom.trim() ? parseInt(rangeFrom, 10) : null;
    const toNum = rangeTo.trim() ? parseInt(rangeTo, 10) : null;

    return AREAS.filter((area) => {
      // 1. Cek apakah area memiliki data valid
      const areaData = aparDataBySlug[area.slug as keyof typeof aparDataBySlug];
      if (!areaData || areaData.length === 0) return false;

      // 2. Filter berdasarkan nama area
      const matchesArea = area.name.toLowerCase().includes(searchTerm.toLowerCase());

      // 3. Filter berdasarkan range no. apar
      const matchesRange = areaHasAparInRange(area.slug, fromNum, toNum);

      // Tampilkan area jika memenuhi KEDUA kriteria
      return matchesArea && matchesRange;
    });
  }, [searchTerm, rangeFrom, rangeTo, areaHasAparInRange]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setRangeFrom("");
    setRangeTo("");
  };

  const hasActiveFilters = searchTerm.trim() || rangeFrom.trim() || rangeTo.trim();

  // Helper untuk mendapatkan APAR dalam range untuk ditampilkan
  const getAparInRange = (areaSlug: string, from: number | null, to: number | null) => {
    if (from === null && to === null) return [];
    
    const items = aparDataBySlug[areaSlug as keyof typeof aparDataBySlug] || [];
    const min = from ?? 0;
    const max = to ?? Number.MAX_SAFE_INTEGER;
    
    return items.filter((item: any) => {
      const noApar = getNoApar(item);
      const num = extractNumber(noApar);
      return num >= min && num <= max;
    });
  };

  if (!user) return null;

  const fromNum = rangeFrom.trim() ? parseInt(rangeFrom, 10) : null;
  const toNum = rangeTo.trim() ? parseInt(rangeTo, 10) : null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>

          <div className="header-title">
            <AlertTriangle size={28} color="#ffffff" />
            Status Inspeksi APAR
          </div>

          <div className="header-subtitle">Pilih area untuk melihat detail inspeksi</div>
        </div>

        {/* 🔍 Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <Hash size={18} />
            <h3>Filter Berdasarkan No. APAR</h3>
          </div>
          
          <div className="filter-inputs">
            <div className="filter-group">
              <label htmlFor="area-search">Nama Area (Opsional)</label>
              <div className="input-wrapper">
                <input
                  id="area-search"
                  type="text"
                  placeholder="Cari nama area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-range">
              <div className="filter-group">
                <label htmlFor="range-from">No. APAR Dari</label>
                <div className="input-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input
                    id="range-from"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>

              <div className="range-separator">-</div>

              <div className="filter-group">
                <label htmlFor="range-to">No. APAR Sampai</label>
                <div className="input-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input
                    id="range-to"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-actions">
              <span className="filter-info">
                {fromNum && toNum 
                  ? `Filter: No. APAR ${fromNum} - ${toNum}` 
                  : fromNum 
                    ? `Filter: No. APAR ≥ ${fromNum}`
                    : toNum
                      ? `Filter: No. APAR ≤ ${toNum}`
                      : ""}
                {searchTerm && ` | Area: "${searchTerm}"`}
                <br />
                <small>Menampilkan {filteredAreas.length} dari {AREAS.length} area</small>
              </span>
              <button onClick={handleClearFilters} className="btn-clear">
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Grid Area */}
        {filteredAreas.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>Tidak ada area ditemukan untuk kriteria:</p>
            <ul>
              {searchTerm && <li>Nama Area: "{searchTerm}"</li>}
              {fromNum && toNum && <li>No. APAR: {fromNum} - {toNum}</li>}
              {fromNum && !toNum && <li>No. APAR ≥ {fromNum}</li>}
              {!fromNum && toNum && <li>No. APAR ≤ {toNum}</li>}
            </ul>
            <button onClick={handleClearFilters} className="btn-reset">
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {filteredAreas.map((area) => {
              const areaItems = aparDataBySlug[area.slug as keyof typeof aparDataBySlug] || [];
              const matchedItems = (fromNum || toNum) ? getAparInRange(area.slug, fromNum, toNum) : [];

              return (
                <div key={area.slug} className="category-card">
                  <div className="card-header">
                    <h2>{area.name}</h2>
                    {(fromNum || toNum) && matchedItems.length > 0 && (
                      <span className="match-badge">
                        {matchedItems.length} APAR
                      </span>
                    )}
                  </div>
                  <p className="card-desc">
                    {(fromNum || toNum) && matchedItems.length > 0
                      ? `No. APAR: ${matchedItems.slice(0, 5).map((i: any) => getNoApar(i)).join(", ")}${matchedItems.length > 5 ? "..." : ""}`
                      : `Total ${areaItems.length} APAR untuk diperiksa`}
                  </p>
                  <div className="card-actions">
                    <button
                      onClick={() => router.push(`/status-ga/inspeksi-apar/${area.slug}`)}
                      className="btn-checklist"
                    >
                      <FileText size={16} />
                      Lihat Detail
                    </button>
                    <button
                      onClick={() => router.push(`/status-ga/inspeksi-apar/${area.slug}/riwayat`)}
                      className="btn-riwayat"
                    >
                      <BarChart2 size={16} />
                      Riwayat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Catatan Penting */}
        <div className="info-box">
          <h3>Catatan Penting:</h3>
          <ul>
            <li>
              <strong>Kolom berwarna hitam atau kosong</strong> pada tabel item pengecekan berarti{" "}
              <em>fitur tersebut tidak tersedia/tidak relevan</em> untuk jenis APAR di lokasi tersebut.
            </li>
            <li>
              <strong>Tanggal Expired (Exp. Date)</strong> yang telah melewati tanggal hari ini akan ditampilkan dalam{" "}
              <span className="expired-text">warna merah</span>.
            </li>
            <li>
              <strong>Filter Range</strong> akan menampilkan area yang memiliki minimal satu APAR dalam rentang nomor yang ditentukan.
            </li>
            <li>
              <strong>Contoh:</strong> Dari 1 Sampai 5 akan menampilkan area yang memiliki APAR no. 1, 2, 3, 4, atau 5.
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header Banner */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          outline: none;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .header-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
          text-align: right;
          flex-shrink: 0;
        }

        /* Filter Section */
        .filter-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: #1e293b;
          font-weight: 600;
        }

        .filter-inputs {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #475569;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }

        .filter-input {
          width: 100%;
          padding: 12px 12px 12px 36px;
          font-size: 0.95rem;
          border: 2px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .filter-input:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-range {
          display: flex;
          align-items: flex-end;
          gap: 12px;
        }

        .filter-range .filter-group {
          flex: 1;
        }

        .range-separator {
          font-size: 1.5rem;
          font-weight: bold;
          color: #94a3b8;
          padding-bottom: 12px;
        }

        .filter-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .filter-info {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.5;
        }

        .filter-info small {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .btn-clear {
          padding: 8px 16px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-clear:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 48px 24px;
          color: #64748b;
          background: white;
          border-radius: 16px;
          border: 2px dashed #cbd5e1;
          margin-bottom: 24px;
        }

        .no-results-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .no-results p {
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 12px;
          color: #334155;
        }

        .no-results ul {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
          color: #64748b;
        }

        .no-results li {
          margin: 4px 0;
          font-size: 0.95rem;
        }

        .btn-reset {
          padding: 10px 24px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-reset:hover {
          background: #1565c0;
          transform: translateY(-1px);
        }

        /* Grid Zona */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .category-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }

        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }

        .card-header {
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-bottom: 2px solid #bbdefb;
          position: relative;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #0d47a1;
          font-weight: 700;
          text-align: center;
          line-height: 1.4;
        }

        .match-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #4caf50;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .card-desc {
          padding: 16px 20px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          text-align: center;
          font-size: 0.95rem;
          flex: 1;
        }

        .card-actions {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-checklist,
        .btn-riwayat {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.25s ease;
          text-align: center;
          min-height: 42px;
          cursor: pointer;
          border: none;
          outline: none;
        }

        .btn-checklist {
          background: #1976d2;
          color: white;
        }

        .btn-checklist:hover {
          background: #1565c0;
          transform: scale(1.03);
          box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
        }

        .btn-riwayat {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        .btn-riwayat:hover {
          background: #e2e8f0;
          border-color: #94a8c9;
          color: #1e293b;
          transform: scale(1.03);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }

        /* Info Box */
        .info-box {
          background: linear-gradient(135deg, #fff8e1 0%, #fffde7 100%);
          border-left: 5px solid #ffc107;
          padding: 20px;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #5d4037;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .info-box h3 {
          margin: 0 0 12px 0;
          color: #e65100;
          font-weight: 700;
        }

        .info-box ul {
          list-style: disc;
          padding-left: 20px;
          margin: 0;
        }

        .info-box li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .expired-text {
          color: #d32f2f;
          font-weight: bold;
          background: #ffebee;
          padding: 2px 6px;
          border-radius: 3px;
        }

        /* Responsif Mobile */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
          }

          .header-banner {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            padding: 16px;
          }

          .btn-back {
            align-self: flex-start;
            padding: 6px 12px;
            gap: 6px;
            font-size: 0.85rem;
          }

          .header-title {
            font-size: 1.6rem;
            justify-content: center;
          }

          .header-subtitle {
            text-align: center;
            align-self: flex-end;
          }

          .filter-range {
            flex-direction: column;
            align-items: stretch;
          }

          .range-separator {
            text-align: center;
            padding: 4px 0;
          }

          .filter-actions {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .categories-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }

          .btn-checklist,
          .btn-riwayat {
            width: 100%;
          }

          .card-header {
            flex-wrap: wrap;
          }

          .match-badge {
            position: static;
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
}