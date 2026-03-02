// app/status-ga/inspeksi-emergency/riwayat/[area]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EmergencyItem {
  no: number;
  lokasi: string;
  id: string;
  kondisiLampu: string;
  indicatorLamp: string;
  batteryCharger: string;
  idNumber: string;
  kebersihan: string;
  kondisiKabel: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
}

interface EmergencyRecord {
  id: string;
  date: string;
  area: string;
  items: EmergencyItem[];
  checker: string;
  checkerNik?: string;
  submittedAt: string;
}

const areaTitles: Record<string, string> = {
  "genba-a": "GENBA A",
  "genba-b": "GENBA B",
  "genba-c": "GENBA C",
  "jig-proto": "JIG PROTO",
  "gel-sheet": "GEL SHEET",
  "warehouse": "WAREHOUSE",
  "mezzanine": "MEZZANINE",
  "parkir": "PARKIR",
  "main-office": "MAIN OFFICE",
};

export default function RiwayatEmergency() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const area = params.area as string;
  const [records, setRecords] = useState<EmergencyRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EmergencyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

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

      const queryParams = new URLSearchParams();
      queryParams.append('area', area);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      if (filterLocation) queryParams.append('lokasi', filterLocation);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/api/emergency-lamp/history?${queryParams.toString()}`);

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
    if (area) {
      loadData();
    }
  }, [area, filterDateFrom, filterDateTo, filterLocation]);

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
      const response = await fetch(`/api/emergency-lamp/delete?id=${recordId}`, {
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

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!user) return null;

  const areaTitle = areaTitles[area] || area.toUpperCase();

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/inspeksi-emergency")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">📍 Riwayat Inspeksi Emergency Lamp - {areaTitle}</h1>
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
          <Link href={`/status-ga/inspeksi-emergency/${area}`} className="btn-add">
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
              <div className="empty-state">Belum ada data Inspeksi Emergency Lamp.</div>
            ) : (
              <div className="data-tables">
                {/* ✅ DESKTOP: Table View */}
                <div className="desktop-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="data-section">
                      <div className="section-header">
                        <span>📅 {formatDate(record.date)}</span>
                        <span>👤 {record.checker}</span>
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
                              <th>Lokasi</th>
                              <th>ID</th>
                              <th>Kondisi Lampu</th>
                              <th>Indicator</th>
                              <th>Battery</th>
                              <th>ID Num</th>
                              <th>Kebersihan</th>
                              <th>Kabel</th>
                              <th>Keterangan</th>
                              <th>Foto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item) => (
                              <tr key={`${record.id}-${item.no}`}>
                                <td>{item.no}</td>
                                <td>{item.lokasi}</td>
                                <td>{item.id}</td>
                                <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>
                                  {item.kondisiLampu || "-"}
                                </td>
                                <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>
                                  {item.indicatorLamp || "-"}
                                </td>
                                <td className={item.batteryCharger === "NG" ? "status-ng" : ""}>
                                  {item.batteryCharger || "-"}
                                </td>
                                <td className={item.idNumber === "NG" ? "status-ng" : ""}>
                                  {item.idNumber || "-"}
                                </td>
                                <td className={item.kebersihan === "NG" ? "status-ng" : ""}>
                                  {item.kebersihan || "-"}
                                </td>
                                <td className={item.kondisiKabel === "NG" ? "status-ng" : ""}>
                                  {item.kondisiKabel || "-"}
                                </td>
                                <td>{item.keterangan || "-"}</td>
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

                {/* ✅ MOBILE: Card View */}
                <div className="mobile-view">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="record-card">
                      <div className="card-header" onClick={() => toggleExpandRecord(record.id)}>
                        <div className="card-date">
                          <span className="calendar-icon">📅</span>
                          <span>{formatDate(record.date)}</span>
                        </div>
                        <div className="card-checker">
                          <span className="user-icon">👤</span>
                          <span>{record.checker}</span>
                        </div>
                        <div className={`expand-icon ${expandedRecord === record.id ? 'expanded' : ''}`}>
                          ▼
                        </div>
                      </div>
                      
                      {expandedRecord === record.id && (
                        <div className="card-body">
                          <div className="card-actions">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="delete-btn-mobile"
                            >
                              🗑️ Hapus Data
                            </button>
                          </div>
                          
                          <div className="items-list">
                            {record.items.map((item) => {
                              const hasNg = 
                                item.kondisiLampu === "NG" ||
                                item.indicatorLamp === "NG" ||
                                item.batteryCharger === "NG" ||
                                item.idNumber === "NG" ||
                                item.kebersihan === "NG" ||
                                item.kondisiKabel === "NG";
                              
                              return (
                                <div key={`${record.id}-${item.no}`} className={`item-card ${hasNg ? 'item-card-ng' : ''}`}>
                                  <div className="item-header">
                                    <span className="item-no">#{item.no}</span>
                                    <span className={`item-status ${hasNg ? 'status-ng' : 'status-ok'}`}>
                                      {hasNg ? 'NG' : 'OK'}
                                    </span>
                                  </div>
                                  <div className="item-lokasi">{item.lokasi}</div>
                                  <div className="item-id">ID: {item.id}</div>
                                  
                                  <div className="item-details">
                                    <div className="detail-row">
                                      <span className="detail-label">Kondisi Lampu:</span>
                                      <span className={`detail-value ${item.kondisiLampu === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.kondisiLampu || '-'}
                                      </span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Indicator:</span>
                                      <span className={`detail-value ${item.indicatorLamp === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.indicatorLamp || '-'}
                                      </span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Battery:</span>
                                      <span className={`detail-value ${item.batteryCharger === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.batteryCharger || '-'}
                                      </span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">ID Number:</span>
                                      <span className={`detail-value ${item.idNumber === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.idNumber || '-'}
                                      </span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Kebersihan:</span>
                                      <span className={`detail-value ${item.kebersihan === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.kebersihan || '-'}
                                      </span>
                                    </div>
                                    <div className="detail-row">
                                      <span className="detail-label">Kondisi Kabel:</span>
                                      <span className={`detail-value ${item.kondisiKabel === 'NG' ? 'ng' : 'ok'}`}>
                                        {item.kondisiKabel || '-'}
                                      </span>
                                    </div>
                                    {item.keterangan && (
                                      <div className="detail-row full">
                                        <span className="detail-label">Keterangan:</span>
                                        <span className="detail-value">{item.keterangan}</span>
                                      </div>
                                    )}
                                    {item.foto && (
                                      <div className="detail-row full">
                                        <span className="detail-label">Foto:</span>
                                        <img
                                          src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                                          alt="Foto"
                                          className="item-photo"
                                          onClick={() => openImagePreview(item.foto!)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
          width: 100%;
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
          flex-wrap: wrap;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background 0.2s;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-back-text {
          display: inline;
        }

        .page-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          flex: 1;
          word-break: break-word;
        }

        /* Filter */
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
          min-height: 44px;
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
          min-height: 44px;
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
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .btn-add:hover {
          background: #1565c0;
        }

        /* Riwayat Container */
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

        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .data-section {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
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
          flex-wrap: wrap;
          gap: 8px;
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
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-btn:hover {
          transform: scale(1.1);
        }

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 1000px;
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
          z-index: 10;
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

        /* Mobile Card Styles */
        .record-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover {
          background: #f1f5f9;
        }

        .card-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #1e88e5;
          font-weight: 600;
        }

        .card-checker {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #64748b;
          flex: 1;
        }

        .expand-icon {
          font-size: 1.2rem;
          color: #94a3b8;
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body {
          padding: 16px;
          background: #fafbfc;
        }

        .card-actions {
          margin-bottom: 16px;
        }

        .delete-btn-mobile {
          width: 100%;
          padding: 12px 16px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .delete-btn-mobile:hover {
          background: #fecaca;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .item-card-ng {
          border-color: rgba(244, 67, 54, 0.5);
          background: rgba(244, 67, 54, 0.05);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .item-no {
          background: #1e88e5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .item-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .item-status.ok {
          background: #d1fae5;
          color: #065f46;
        }

        .item-status.ng {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          padding: 12px 16px 4px;
          word-break: break-word;
        }

        .item-id {
          font-size: 0.85rem;
          color: #64748b;
          padding: 0 16px 12px;
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          gap: 12px;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row.full {
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
          min-width: 100px;
          flex-shrink: 0;
        }

        .detail-value {
          font-size: 0.9rem;
          color: #1e293b;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        .detail-value.ok {
          color: #059669;
          font-weight: 600;
        }

        .detail-value.ng {
          color: #dc2626;
          font-weight: 600;
        }

        .item-photo {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
        }

        /* Image Modal */
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

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.2rem;
          }

          .apd-table {
            min-width: 900px;
            font-size: 0.8rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 8px 6px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
            margin-left: 0;
          }

          .header-banner {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: center;
          }

          .btn-back-text {
            display: inline;
          }

          .page-title {
            font-size: 1.1rem;
            width: 100%;
            text-align: center;
          }

          .date-filter {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px;
          }

          .filter-group {
            width: 100%;
          }

          .date-input,
          .location-select {
            width: 100%;
            min-width: 100%;
            font-size: 0.9rem;
          }

          .clear-filter,
          .btn-add {
            width: 100%;
            justify-content: center;
          }

          .btn-add {
            margin-left: 0;
          }

          .riwayat-container {
            padding: 16px 12px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .apd-table {
            min-width: 800px;
            font-size: 0.75rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 6px 4px;
          }

          .history-image {
            width: 45px;
            height: 45px;
          }

          .item-photo {
            width: 50px;
            height: 50px;
          }

          .detail-label {
            min-width: 80px;
            font-size: 0.8rem;
          }

          .detail-value {
            font-size: 0.85rem;
          }

          .item-lokasi {
            font-size: 0.95rem;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .header-banner {
            padding: 10px 12px;
          }

          .page-title {
            font-size: 1rem;
          }

          .date-filter {
            padding: 10px;
            gap: 10px;
          }

          .filter-group label {
            font-size: 0.85rem;
          }

          .date-input,
          .location-select {
            font-size: 0.85rem;
            padding: 8px 10px;
          }

          .clear-filter,
          .btn-add {
            font-size: 0.85rem;
            padding: 10px 14px;
          }

          .riwayat-container {
            padding: 12px 8px;
          }

          .card-header {
            padding: 12px;
          }

          .card-date,
          .card-checker {
            font-size: 0.85rem;
          }

          .card-body {
            padding: 12px;
          }

          .item-header {
            padding: 10px 12px;
          }

          .item-no {
            padding: 3px 10px;
            font-size: 0.8rem;
          }

          .item-status {
            font-size: 0.75rem;
            padding: 3px 10px;
          }

          .item-lokasi {
            font-size: 0.9rem;
            padding: 10px 12px 4px;
          }

          .item-id {
            font-size: 0.8rem;
            padding: 0 12px 10px;
          }

          .item-details {
            padding: 0 12px 12px;
          }

          .detail-row {
            padding: 6px 0;
          }

          .detail-label {
            min-width: 70px;
            font-size: 0.75rem;
          }

          .detail-value {
            font-size: 0.8rem;
          }

          .item-photo {
            width: 45px;
            height: 45px;
          }

          .apd-table {
            min-width: 700px;
            font-size: 0.7rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 4px 3px;
          }

          .history-image {
            width: 40px;
            height: 40px;
          }

          .delete-btn-mobile {
            min-height: 52px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}