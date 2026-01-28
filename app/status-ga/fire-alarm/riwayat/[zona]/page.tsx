// app/status-ga/fire-alarm/riwayat/[zona]/page.tsx
"use client";

import { useState, useEffect, use } from "react"; // ✅ Tambahkan `use`
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FireAlarmItem {
  no: number;
  zona: string;
  lokasi: string;
  alarmBell?: string;
  indicatorLamp?: string;
  manualCallPoint?: string;
  idZona?: string;
  kebersihan?: string;
  kondisiNok?: string;
  tindakanPerbaikan?: string;
  pic?: string;
  dueDate?: string;
  verify?: string;
}

interface FireAlarmRecord {
  id: string;
  date: string;
  checker: string;
  items: FireAlarmItem[];
}

// ✅ TERIMA `params` sebagai Promise
export default function RiwayatFireAlarm({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter();
  const { user } = useAuth();

  // ✅ UNWRAP params dengan React.use()
  const { zona } = use(params);

  const [records, setRecords] = useState<FireAlarmRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FireAlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // Load data berdasarkan zona
  useEffect(() => {
    const loadRecords = () => {
      try {
        const historyKey = `ga_fire_alarm_history_${zona}`;
        const saved = localStorage.getItem(historyKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const validRecords = parsed.filter((r: any) => r.items && Array.isArray(r.items));
          setRecords(validRecords);
          setFilteredRecords(validRecords);
        }
      } catch (e) {
        console.error(`Gagal memuat riwayat ${zona}:`, e);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [zona]); // ✅ Re-load saat zona berubah

  // Terapkan filter
  useEffect(() => {
    let filtered = records.filter(r => r.items && Array.isArray(r.items));

    if (filterDate) {
      filtered = filtered.filter(r => r.date === filterDate);
    }

    if (filterLocation) {
      filtered = filtered.filter(r =>
        r.items.some(item => item.lokasi === filterLocation)
      );
    }

    setFilteredRecords(filtered);
  }, [filterDate, filterLocation, records]);

  // Ambil daftar lokasi unik
  const locations = Array.from(
    new Set(
      records
        .filter(r => r.items && Array.isArray(r.items))
        .flatMap(r => r.items.map(i => i.lokasi))
    )
  ).sort();

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner Biru Gradasi */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/fire-alarm")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>

          <h1 className="page-title">📍 Riwayat Inspeksi Fire Alarm - {zona.toUpperCase()}</h1>
        </div>

        {/* Filter */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Tanggal:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Lokasi:</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="location-select"
            >
              <option value="">Semua Lokasi</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFilterDate("");
              setFilterLocation("");
            }}
            className="clear-filter"
          >
            Reset Filter
          </button>
          <Link href={`/status-ga/fire-alarm/${zona}`} className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              Belum ada data Inspeksi Fire Alarm.
            </div>
          ) : (
            <div className="data-tables">
              {filteredRecords.map((record) => (
                <div key={record.id} className="data-section">
                  <div className="section-header">
                    <span>Tanggal: {record.date}</span>
                    <span>Petugas: {record.checker}</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="apd-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Zona</th>
                          <th>Lokasi</th>
                          <th>Alarm Bell</th>
                          <th>Indicator Lamp</th>
                          <th>Manual Call Point</th>
                          <th>ID Zona</th>
                          <th>Kebersihan</th>
                          <th>Kondisi N-OK</th>
                          <th>Tindakan Perbaikan</th>
                          <th>PIC</th>
                          <th>Due Date</th>
                          <th>Verify</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.items.map((item) => (
                          <tr key={`${record.id}-${item.no}`}>
                            <td>{item.no}</td>
                            <td>{item.zona}</td>
                            <td>{item.lokasi}</td>
                            <td className={item.alarmBell === "NG" ? "status-ng" : ""}>
                              {item.alarmBell || "-"}
                            </td>
                            <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>
                              {item.indicatorLamp || "-"}
                            </td>
                            <td className={item.manualCallPoint === "NG" ? "status-ng" : ""}>
                              {item.manualCallPoint || "-"}
                            </td>
                            <td className={item.idZona === "NG" ? "status-ng" : ""}>
                              {item.idZona || "-"}
                            </td>
                            <td className={item.kebersihan === "NG" ? "status-ng" : ""}>
                              {item.kebersihan || "-"}
                            </td>
                            <td>{item.kondisiNok || "-"}</td>
                            <td>{item.tindakanPerbaikan || "-"}</td>
                            <td>{item.pic || "-"}</td>
                            <td>{item.dueDate || "-"}</td>
                            <td>{item.verify || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        /* Header Banner Biru Gradasi */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 20px 24px;
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
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .page-title {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 700;
          flex: 1;
          text-align: center;
        }

        /* Filter */
        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .date-input,
        .location-select {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          min-width: 160px;
        }

        .clear-filter {
          padding: 8px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn-add {
          padding: 8px 16px;
          background: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin-left: auto;
          white-space: nowrap;
        }

        /* Riwayat Container */
        .riwayat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 1.1rem;
        }

        .data-tables {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .data-section {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .section-header {
          background: #f1f5f9;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #475569;
          font-weight: 600;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .apd-table th,
        .apd-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .apd-table th {
          background: #f8fafc;
          font-weight: 700;
          color: #1e293b;
          position: sticky;
          top: 0;
        }

        .status-ng {
          background: #fee2e2;
          color: #dc2626;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
        }

        @media (max-width: 768px) {
          .header-banner {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .page-title {
            font-size: 1.4rem;
          }

          .date-filter {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-add {
            margin-left: 0;
            align-self: flex-start;
          }

          .apd-table {
            font-size: 0.75rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 6px;
          }
        }
      `}</style>
    </div>
  );
}