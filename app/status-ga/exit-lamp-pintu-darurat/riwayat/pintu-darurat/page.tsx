// app/exit-lamp-pintu-darurat/riwayat/pintu-darurat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PintuDaruratItem {
  no: number;
  lokasi: string;
  kondisiPintu: string;
  areaSekitar: string;
  paluAlatBantu: string;
  identitasPintu: string;
  idPeringatan: string;
  doorCloser: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string;
}

interface PintuDaruratRecord {
  id: string;
  date: string;
  category: string;
  items: PintuDaruratItem[];
  checker: string;
  submittedAt: string;
}

export default function RiwayatPintuDarurat() {
  const router = useRouter();
  const { user } = useAuth();

  const [records, setRecords] = useState<PintuDaruratRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PintuDaruratRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // ✅ Load data dari API (BUKAN localStorage)
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        
        // ✅ Fetch data dari API
        const response = await fetch('/api/pintu-darurat/history');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // ✅ Format data agar sesuai dengan interface
        const formattedData = data.map((record: any) => ({
          id: record.id.toString(), // Convert number ke string
          date: record.date,
          category: "pintu-darurat", // Tambahkan category
          checker: record.checker,
          submittedAt: record.submittedAt,
          items: record.items.map((item: any, index: number) => ({
            no: index + 1, // Generate nomor urut
            lokasi: item.lokasi,
            kondisiPintu: item.kondisiPintu || '',
            areaSekitar: item.areaSekitar || '',
            paluAlatBantu: item.paluAlatBantu || '',
            identitasPintu: item.identitasPintu || '',
            idPeringatan: item.idPeringatan || '',
            doorCloser: item.doorCloser || '',
            keterangan: item.keterangan || '',
            tindakanPerbaikan: item.tindakanPerbaikan || '',
            pic: item.pic || '',
            foto: item.foto || ''
          }))
        }));
        
        console.log('✅ Riwayat Pintu Darurat loaded:', formattedData);
        setRecords(formattedData);
        setFilteredRecords(formattedData);
      } catch (error) {
        console.error('❌ Load error:', error);
        alert('Gagal memuat riwayat: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, []); // ✅ Hanya load sekali saat component mount

  // Terapkan filter
  useEffect(() => {
    let filtered = [...records];

    if (filterDate) {
      filtered = filtered.filter((r) => r.date === filterDate);
    }

    if (filterLocation) {
      filtered = filtered.filter((r) =>
        r.items.some((item) => item.lokasi === filterLocation)
      );
    }

    setFilteredRecords(filtered);
  }, [filterDate, filterLocation, records]);

  // Ambil daftar lokasi unik
  const locations = Array.from(
    new Set(records.flatMap((r) => r.items.map((i) => i.lokasi)))
  ).sort();

  const openImagePreview = (src: string) => {
    if (src) setPreviewImage(src);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/exit-lamp-pintu-darurat")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <h1 className="page-title">🚪 Riwayat Pintu Darurat</h1>
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
          <Link href="/exit-lamp-pintu-darurat/pintu-darurat" className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {loading ? (
            <div className="loading-state">⏳ Memuat data...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              {records.length === 0 
                ? "Belum ada data Pintu Darurat." 
                : "Tidak ada data yang sesuai filter."}
            </div>
          ) : (
            <div className="data-tables">
              {filteredRecords.map((record) => (
                <div key={record.id} className="data-section">
                  <div className="section-header">
                    <span>📅 Tanggal: {new Date(record.date).toLocaleDateString('id-ID')}</span>
                    <span>👤 Petugas: {record.checker}</span>
                  </div>
                  <div className="table-wrapper">
                    <table className="apd-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Lokasi</th>
                          <th>Kondisi Pintu</th>
                          <th>Area Sekitar</th>
                          <th>Palu/Alat Bantu</th>
                          <th>Identitas Pintu</th>
                          <th>ID Peringatan</th>
                          <th>Door Closer</th>
                          <th>Keterangan</th>
                          <th>Foto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.items.map((item) => (
                          <tr key={`${record.id}-${item.no}`}>
                            <td>{item.no}</td>
                            <td>{item.lokasi}</td>
                            <td className={item.kondisiPintu === "NG" ? "status-ng" : ""}>
                              {item.kondisiPintu || "-"}
                            </td>
                            <td className={item.areaSekitar === "NG" ? "status-ng" : ""}>
                              {item.areaSekitar || "-"}
                            </td>
                            <td className={item.paluAlatBantu === "NG" ? "status-ng" : ""}>
                              {item.paluAlatBantu || "-"}
                            </td>
                            <td className={item.identitasPintu === "NG" ? "status-ng" : ""}>
                              {item.identitasPintu || "-"}
                            </td>
                            <td className={item.idPeringatan === "NG" ? "status-ng" : ""}>
                              {item.idPeringatan || "-"}
                            </td>
                            <td className={item.doorCloser === "NG" ? "status-ng" : ""}>
                              {item.doorCloser || "-"}
                            </td>
                            <td>{item.keterangan || "-"}</td>
                            <td>
                              {item.foto ? (
                                <img
                                  src={item.foto.startsWith('http') || item.foto.startsWith('data:') 
                                    ? item.foto 
                                    : `/uploads${item.foto.split('uploads')[1]}`}
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
          )}
        </div>

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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 24px;
          min-height: 400px;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 1.1rem;
        }

        .loading-state {
          color: #1e88e5;
          font-weight: 600;
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
          flex-wrap: wrap;
          gap: 12px;
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

        .modal-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border: 2px solid white;
          border-radius: 8px;
          background: white;
          padding: 10px;
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

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}