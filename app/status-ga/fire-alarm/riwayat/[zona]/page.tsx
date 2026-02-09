// app/status-ga/fire-alarm/riwayat/[zona]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FireAlarmItem {
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
}

interface FireAlarmRecord {
  id: string;
  date: string;
  checker: string;
  checkerNik?: string;
  submittedAt: string;
  items: FireAlarmItem[];
}

export default function RiwayatFireAlarm({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { zona } = use(params);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [records, setRecords] = useState<FireAlarmRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FireAlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // 🔥 LOAD DATA DARI API
  const loadData = async () => {
    try {
      setLoading(true);

      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('zona', zona);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      if (filterLocation) queryParams.append('lokasi', filterLocation);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/api/fire-alarm/history?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecords(data.data || []);
          setFilteredRecords(data.data || []);
        } else {
          alert('Gagal memuat riwayat: ' + data.message);
        }
      } else {
        alert('Gagal mengambil data dari server');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Gagal memuat riwayat: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zona) {
      loadData();
    }
  }, [zona, filterDateFrom, filterDateTo, filterLocation]);

  // Ambil daftar lokasi unik dari records
  const locations = Array.from(
    new Set(
      records
        .flatMap((r) => r.items || [])
        .map((i) => i.lokasi)
        .filter(Boolean)
    )
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) {
      const imageUrl = src.startsWith('data:') 
        ? src 
        : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${src}`;
      setPreviewImage(imageUrl);
    }
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const response = await fetch(`/api/fire-alarm/delete?id=${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
        alert('Data berhasil dihapus!');
      } else {
        const error = await response.json();
        alert('Gagal menghapus data: ' + error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
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
            <label>Dari Tanggal:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
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
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFilterDateFrom("");
              setFilterDateTo("");
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

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="riwayat-container">
            {filteredRecords.length === 0 ? (
              <div className="empty-state">Belum ada data Inspeksi Fire Alarm.</div>
            ) : (
              <div className="data-tables">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="data-section">
                    <div className="section-header">
                      <span>Tanggal: {record.date}</span>
                      <span>Petugas: {record.checker}</span>
                      <div className="section-actions">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="delete-btn"
                          title="Hapus data"
                        >
                          🗑️
                        </button>
                      </div>
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
                            <th>Foto</th>
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
                              <td>
                                {item.foto ? (
                                  <img
                                    src={item.foto.startsWith('data:') 
                                      ? item.foto 
                                      : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                                    alt="Foto"
                                    className="history-image clickable"
                                    onClick={() => openImagePreview(item.foto!)}
                                  />
                                ) : (
                                  "-"
                                )}
                              </td>
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
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={closeImagePreview}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeImagePreview}>✕</button>
              <img src={previewImage} alt="Zoom" className="modal-image" />
            </div>
          </div>
        )}
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
          color: #1e293b;
        }

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

        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
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

        .clear-filter:hover {
          background: #b91c1c;
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

        .btn-add:hover {
          background: #1565c0;
        }

        .riwayat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 1.1rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #1976d2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
          align-items: center;
          font-size: 0.9rem;
          color: #475569;
          font-weight: 600;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #f44336;
          transition: transform 0.2s;
        }

        .delete-btn:hover {
          transform: scale(1.1);
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
          color: #334155;
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

        .history-image {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #ddd;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .history-image:hover {
          transform: scale(1.1);
        }

        /* Zoom Image Modal */
        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          cursor: pointer;
        }

        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          cursor: default;
        }

        .close-btn {
          position: absolute;
          top: -40px;
          right: 0;
          background: #fff;
          color: #000;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-weight: bold;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #e0e0e0;
          transform: scale(1.1);
        }

        .modal-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border: 2px solid white;
          border-radius: 8px;
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

          .history-image {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}