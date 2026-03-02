// app/status-ga/exit-lamp-pintu-darurat/riwayat/exit-lamp/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ExitLampItem {
  no: number;
  lokasi: string;
  id: string;
  kondisiLampu: string;
  indikatorLampu: string;
  kebersihan: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string;
}

interface ExitLampRecord {
  id: number;
  date: string;
  checker: string;
  nik?: string;
  department?: string;
  submittedAt: string;
  items: ExitLampItem[];
}

export default function RiwayatExitLamp() {
  const router = useRouter();
  const { user } = useAuth();

  const [records, setRecords] = useState<ExitLampRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // Load data dari API
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/exit-lamp/history');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        const formattedData = data.map((record: any) => ({
          id: record.id,
          date: record.date,
          checker: record.checker,
          nik: record.nik,
          department: record.department,
          submittedAt: record.submittedAt,
          items: record.items.map((item: any, index: number) => ({
            no: index + 1,
            lokasi: item.lokasi,
            id: item.id,
            kondisiLampu: item.kondisiLampu,
            indikatorLampu: item.indikatorLampu,
            kebersihan: item.kebersihan,
            keterangan: item.keterangan || "",
            tindakanPerbaikan: item.tindakanPerbaikan || "",
            pic: item.pic || "",
            foto: item.foto || ""
          }))
        }));
        
        console.log('✅ Data loaded:', formattedData);
        setRecords(formattedData);
      } catch (error) {
        console.error('❌ Load error:', error);
        alert('Gagal memuat riwayat: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const filterDateObj = filterDate ? new Date(filterDate) : null;
    const recordDateObj = new Date(record.date);
    
    if (filterDateObj && 
        (recordDateObj.getFullYear() !== filterDateObj.getFullYear() ||
         recordDateObj.getMonth() !== filterDateObj.getMonth() ||
         recordDateObj.getDate() !== filterDateObj.getDate())) {
      return false;
    }
    
    if (filterLocation) {
      return record.items.some((item) => item.lokasi === filterLocation);
    }
    
    return true;
  });

  const locations = Array.from(
    new Set(records.flatMap((r) => r.items.map((i) => i.lokasi)))
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) setPreviewImage(src);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const toggleExpandRecord = (recordIndex: number) => {
    setExpandedRecord(expandedRecord === recordIndex ? null : recordIndex);
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/exit-lamp-pintu-darurat")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">💡 Riwayat Exit Lamp & Emergency Lamp</h1>
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
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
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
          <Link href="/exit-lamp-pintu-darurat/exit-lamp" className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>⏳ Memuat data...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              {records.length === 0 
                ? "Belum ada data Exit Lamp." 
                : "Tidak ada data yang sesuai filter."}
            </div>
          ) : (
            <div className="data-tables">
              {/* ✅ DESKTOP: Table View */}
              <div className="desktop-view">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="data-section">
                    <div className="section-header">
                      <span>📅 Tanggal: {new Date(record.date).toLocaleDateString('id-ID')}</span>
                      <span>👤 Petugas: {record.checker}</span>
                      {record.department && <span>🏢 Dept: {record.department}</span>}
                    </div>
                    <div className="table-wrapper">
                      <table className="apd-table">
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Lokasi</th>
                            <th>ID</th>
                            <th>Kondisi Lampu</th>
                            <th>Indikator</th>
                            <th>Kebersihan</th>
                            <th>Keterangan</th>
                            <th>Foto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.items.map((item, index) => (
                            <tr key={`${record.id}-${index}`}>
                              <td>{index + 1}</td>
                              <td>{item.lokasi}</td>
                              <td>{item.id}</td>
                              <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>
                                {item.kondisiLampu || "-"}
                              </td>
                              <td className={item.indikatorLampu === "NG" ? "status-ng" : ""}>
                                {item.indikatorLampu || "-"}
                              </td>
                              <td className={item.kebersihan === "NG" ? "status-ng" : ""}>
                                {item.kebersihan || "-"}
                              </td>
                              <td>{item.keterangan || "-"}</td>
                              <td>
                                {item.foto ? (
                                  <img
                                    src={item.foto.startsWith('http') ? item.foto : `/uploads${item.foto}`}
                                    alt="Foto"
                                    className="history-image clickable"
                                    onClick={() => openImagePreview(item.foto)}
                                    onError={(e) => {
                                      console.error('Image load error:', item.foto);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
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
                {filteredRecords.map((record, recordIndex) => (
                  <div key={record.id} className="record-card">
                    <div 
                      className="card-header" 
                      onClick={() => toggleExpandRecord(recordIndex)}
                    >
                      <div className="card-date">
                        <span className="calendar-icon">📅</span>
                        <span>{new Date(record.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="card-checker">
                        <span className="user-icon">👤</span>
                        <span>{record.checker}</span>
                      </div>
                      <div className={`expand-icon ${expandedRecord === recordIndex ? 'expanded' : ''}`}>
                        ▼
                      </div>
                    </div>

                    {expandedRecord === recordIndex && (
                      <div className="card-body">
                        {record.items.map((item, itemIndex) => {
                          const hasNg = 
                            item.kondisiLampu === "NG" ||
                            item.indikatorLampu === "NG" ||
                            item.kebersihan === "NG";
                          
                          return (
                            <div key={`${record.id}-${itemIndex}`} className={`item-card ${hasNg ? 'item-card-ng' : ''}`}>
                              <div className="item-header">
                                <span className="item-no">#{itemIndex + 1}</span>
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
                                  <span className="detail-label">Indikator:</span>
                                  <span className={`detail-value ${item.indikatorLampu === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.indikatorLampu || '-'}
                                  </span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Kebersihan:</span>
                                  <span className={`detail-value ${item.kebersihan === 'NG' ? 'ng' : 'ok'}`}>
                                    {item.kebersihan || '-'}
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
                                      src={item.foto.startsWith('http') ? item.foto : `/uploads${item.foto}`}
                                      alt="Foto"
                                      className="item-photo"
                                      onClick={() => openImagePreview(item.foto)}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="image-modal" onClick={closeImagePreview}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeImagePreview}>✕</button>
              <img 
                src={previewImage.startsWith('http') ? previewImage : `/uploads${previewImage}`}
                alt="Zoom" 
                className="modal-image"
                onError={(e) => {
                  console.error('Modal image load error');
                  (e.target as HTMLImageElement).alt = 'Gambar tidak dapat dimuat';
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          color: #1e293b;
          overflow-x: hidden;
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
          font-size: 1.6rem;
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
          min-height: 400px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #1e88e5;
          font-weight: 600;
        }

        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #1e88e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .data-section,
        .record-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .section-header,
        .card-header {
          background: #f1f5f9;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #475569;
          font-weight: 600;
          flex-wrap: wrap;
          gap: 12px;
        }

        .card-header {
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.2s;
          min-height: 44px;
          align-items: center;
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

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
          min-width: 800px;
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
        }

        .history-image.clickable {
          cursor: zoom-in;
          transition: transform 0.2s;
        }

        .history-image.clickable:hover {
          transform: scale(1.05);
        }

        /* Mobile Card Item Styles */
        .item-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .item-card:last-child {
          margin-bottom: 0;
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
          background: white;
          padding: 10px;
        }

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.4rem;
          }

          .apd-table {
            min-width: 700px;
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
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .header-banner {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: flex-start;
          }

          .btn-back-text {
            display: inline;
          }

          .page-title {
            font-size: 1.3rem;
            margin: 8px 0 0 0;
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
            min-width: 600px;
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

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .card-date,
          .card-checker {
            font-size: 0.85rem;
          }

          .item-lokasi {
            font-size: 0.95rem;
            padding: 10px 12px 4px;
          }

          .item-id {
            font-size: 0.8rem;
            padding: 0 12px 10px;
          }

          .item-details {
            padding: 0 12px 12px;
          }

          .detail-label {
            min-width: 80px;
            font-size: 0.8rem;
          }

          .detail-value {
            font-size: 0.85rem;
          }

          .item-photo {
            width: 50px;
            height: 50px;
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
            font-size: 1.1rem;
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
            font-size: 0.8rem;
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
            font-size: 0.75rem;
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
            min-width: 500px;
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

          .spinner {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </div>
  );
}