// app/status-ga/inspeksi-apar/[slug]/riwayat/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";
import { aparDataBySlug } from "@/lib/apar-data";

const areaNames: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING (SEBELAH PINTU MASUK) FABRIKASI JP SISI BARAT",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM FABRIKASI C/B JP",
  "area-training-dining-mtc": "AREA TRAINING A& DINING ROOM , MTC OFFICE",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (UNTUK GENBA A)",
  "power-house-genba-c": "POWER HOUSE (UNTUK GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE AREA DAN WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR SEBELAH RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

export default function RiwayatInspeksiAparPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const slug = params.slug as string;
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
      return;
    }
    loadHistory();
  }, [user, router, slug]);

  const loadHistory = () => {
    try {
      const historyKey = `ga_apar_history_${slug}`;
      const saved = localStorage.getItem(historyKey);
      if (saved) {
        const records = JSON.parse(saved);
        setHistory(records.reverse());
      }
    } catch (e) {
      console.error("Error loading history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="loading">Memuat...</div>;
  if (user.role !== "inspector-ga") return null;

  if (isLoading) {
    return <div className="loading">Loading riwayat...</div>;
  }

  const areaName = areaNames[slug] || slug;
  const aparList = aparDataBySlug[slug as keyof typeof aparDataBySlug] || [];

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <button onClick={() => router.back()} className="back-btn">
          ← Kembali
        </button>

        <h1>📜 Riwayat Inspeksi APAR – {areaName}</h1>

        {history.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada riwayat inspeksi untuk area ini</p>
            <button
              onClick={() => router.push(`/status-ga/inspeksi-apar/${slug}`)}
              className="btn-primary"
            >
              + Mulai Inspeksi
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((record, idx) => {
              const ngCount = record.items.filter((item: any) =>
                Object.entries(item).some(
                  ([key, value]) =>
                    key.startsWith("check") && value === "X"
                )
              ).length;

              return (
                <div key={idx} className="history-card">
                  <div className="card-header">
                    <div>
                      <h3>{record.date}</h3>
                      <p>Pemeriksa: {record.checker}</p>
                    </div>
                    <div className="status-badge">
                      {ngCount === 0 ? (
                        <span className="status-ok">✓ SEMUA OK</span>
                      ) : (
                        <span className="status-ng">✗ {ngCount} NG</span>
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Lokasi</th>
                          <th>No. APAR</th>
                          <th>Status</th>
                          <th>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aparList.map((apar, aparIdx) => {
                          const itemData = record.items[aparIdx];
                          const hasNG = itemData
                            ? Object.entries(itemData).some(
                                ([key, value]) =>
                                  key.startsWith("check") && value === "X"
                              )
                            : false;

                          return (
                            <tr key={aparIdx}>
                              <td>{apar.no}</td>
                              <td>{apar.lokasi}</td>
                              <td>{apar.noApar}</td>
                              <td>
                                <span className={hasNG ? "status-ng" : "status-ok"}>
                                  {hasNG ? "NG" : "OK"}
                                </span>
                              </td>
                              <td>{itemData?.keterangan || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* ❌ TOMBOL "Lihat Detail Lengkap" DIHAPUS SESUAI PERMINTAAN */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
        }
        .back-btn {
          background: #f0f0f0;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 24px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .back-btn:hover {
          background: #e0e0e0;
          transform: translateX(-2px);
        }
        h1 {
          color: #b71c1c;
          margin-bottom: 24px;
          font-size: 1.8rem;
        }
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .empty-state p {
          color: #999;
          font-size: 1.1rem;
          margin-bottom: 24px;
        }
        .btn-primary {
          padding: 12px 32px;
          background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(183, 28, 28, 0.2);
        }
        .btn-primary:hover {
          box-shadow: 0 4px 8px rgba(183, 28, 28, 0.3);
          transform: translateY(-2px);
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .history-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        .history-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #fff8e1 0%, #fff3cd 100%);
          border-bottom: 2px solid #ffd54f;
        }
        .card-header h3 {
          margin: 0 0 4px 0;
          color: #b71c1c;
          font-size: 1.1rem;
        }
        .card-header p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        .status-badge {
          display: flex;
          gap: 8px;
        }
        .status-ok {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .status-ng {
          background: #ffebee;
          color: #c62828;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .card-body {
          padding: 16px;
        }
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }
        .detail-table th,
        .detail-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          text-align: left;
        }
        .detail-table th {
          background: #fff8e1;
          font-weight: 600;
          color: #b71c1c;
        }
        .detail-table tbody tr:hover {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  );
}
