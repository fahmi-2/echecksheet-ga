// app/inspeksi-apar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { aparDataBySlug } from "@/lib/apar-data";
import { AlertTriangle, FileText, BarChart2, ArrowLeft } from "lucide-react";

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
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  const validAreas = useMemo(() => {
    return AREAS.filter(area => aparDataBySlug[area.slug as keyof typeof aparDataBySlug]?.length > 0);
  }, []);

  const filteredAreas = validAreas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

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

        {/* 🔍 Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cari area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Grid Area */}
        {filteredAreas.length === 0 ? (
          <div className="no-results">
            Tidak ada area ditemukan untuk "{searchTerm}"
          </div>
        ) : (
          <div className="categories-grid">
            {filteredAreas.map((area) => (
              <div key={area.slug} className="category-card">
                <div className="card-header">
                  <h2>{area.name}</h2>
                </div>
                <p className="card-desc">Lihat status dan detail APAR</p>
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
            ))}
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

        /* Search Bar */
        .search-container {
          margin-bottom: 24px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .search-input {
          flex: 1;
          padding: 14px 20px;
          font-size: 1rem;
          border: none;
          outline: none;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 1.1rem;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
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
          border-bottom: 2px solid #bbdefb;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.3rem;
          color: #0d47a1;
          font-weight: 700;
          text-align: center;
          line-height: 1.4;
        }

        .card-desc {
          padding: 16px 20px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          text-align: center;
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

          .search-container {
            margin-top: 16px;
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
        }
      `}</style>
    </div>
  );
}