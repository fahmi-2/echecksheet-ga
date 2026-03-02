// app/status-ga/inspeksi-apar/[slug]/riwayat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format, parse, isBefore, isValid } from "date-fns";

const areaNames: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM",
  "area-training-dining-mtc": "AREA TRAINING & DINING ROOM",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (GENBA A)",
  "power-house-genba-c": "POWER HOUSE (GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE & WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

const checkItems = [
  { label: "Masa Berlaku", short: "Masa", help: "Lihat identitas APAR apakah masih berlaku" },
  { label: "Tekanan", short: "Tekanan", help: "Jarum tekanan di warna hijau" },
  { label: "Isi Tabung", short: "Isi", help: "Isi APAR tidak menggumpal" },
  { label: "Selang", short: "Selang", help: "Selang tidak rusak" },
  { label: "Segel", short: "Segel", help: "Segel terkunci" },
  { label: "Kondisi Tabung", short: "Tabung", help: "Area APAR tidak terhalang" },
  { label: "Gantungan", short: "Gantung", help: "Gantungan tidak rusak" },
  { label: "Lay out", short: "Layout", help: "APAR ada lay out" },
  { label: "Papan Petunjuk", short: "Papan", help: "Terpasang dan mudah dilihat" },
  { label: "OS & C/S", short: "OS/CS", help: "Terpasang rapi dan update" },
  { label: "Area Sekitar", short: "Area", help: "Akses APAR mudah" },
  { label: "Posisi APAR", short: "Posisi", help: "APAR tidak bergeser" },
];

interface AparItem {
  no: number;
  jenisApar: string;
  lokasi: string;
  noApar: string;
  expDate: string;
  check1: string;
  check2: string;
  check3: string;
  check4: string;
  check5: string;
  check6: string;
  check7: string;
  check8: string;
  check9: string;
  check10: string;
  check11: string;
  check12: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
}

interface AparRecord {
  id: string;
  date: string;
  area: string;
  items: AparItem[];
  checker: string;
  checkerNik?: string;
  submittedAt: string;
}

export default function RiwayatApar() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [records, setRecords] = useState<AparRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AparRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
      queryParams.append('slug', slug);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/api/apar/history?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedRecords = data.data.map((record: any) => ({
            id: record.id,
            date: record.date,
            area: record.area,
            checker: record.checker,
            checkerNik: record.checker_nik || null,
            submittedAt: record.submitted_at,
            items: record.items.map((item: any) => ({
              no: item.no,
              jenisApar: item.jenis_apar,
              lokasi: item.lokasi,
              noApar: item.no_apar,
              expDate: item.exp_date,
              check1: item.check1,
              check2: item.check2,
              check3: item.check3,
              check4: item.check4,
              check5: item.check5,
              check6: item.check6,
              check7: item.check7,
              check8: item.check8,
              check9: item.check9,
              check10: item.check10,
              check11: item.check11,
              check12: item.check12,
              keterangan: item.keterangan || "",
              tindakanPerbaikan: item.tindakan_perbaikan || "",
              pic: item.pic,
              foto: item.foto ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}` : null
            }))
          }));

          setRecords(formattedRecords);
          setFilteredRecords(formattedRecords);
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
    if (slug) {
      loadData();
    }
  }, [slug, filterDateFrom, filterDateTo]);

  const locations = Array.from(
    new Set(
      records
        .flatMap((r) => r.items || [])
        .map((i) => i.lokasi)
        .filter(Boolean)
    )
  ).sort();

  useEffect(() => {
    if (!filterLocation) {
      setFilteredRecords(records);
      return;
    }
    const filtered = records.filter((r) =>
      r.items.some((item) => item.lokasi === filterLocation)
    );
    setFilteredRecords(filtered);
  }, [filterLocation, records]);

  const parseExpDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }
    
    let parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return parsed;
    
    parsed = parse(dateStr, "dd/MM/yy", new Date());
    if (isValid(parsed)) return parsed;
    
    return null;
  };

  const isExpired = (expDateString: string | null | undefined): boolean => {
    const expDate = parseExpDate(expDateString);
    return expDate ? isBefore(expDate, new Date()) : false;
  };

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
      const response = await fetch(`/api/apar/delete?id=${recordId}`, {
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

  const toggleExpandItem = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
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

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/inspeksi-apar")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">📍 Riwayat Inspeksi APAR - {areaNames[slug]}</h1>
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
          <Link href={`/status-ga/inspeksi-apar/${slug}`} className="btn-add">
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
              <div className="empty-state">Belum ada data Inspeksi APAR.</div>
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
                              <th>Jenis APAR</th>
                              <th>Lokasi</th>
                              <th>No. APAR</th>
                              <th>Exp. Date</th>
                              {checkItems.map((item, idx) => (
                                <th key={idx} title={item.help} className="check-th">
                                  {item.short}
                                </th>
                              ))}
                              <th>Keterangan</th>
                              <th>Foto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item) => (
                              <tr key={`${record.id}-${item.no}`}>
                                <td>{item.no}</td>
                                <td>{item.jenisApar}</td>
                                <td>{item.lokasi}</td>
                                <td>{item.noApar}</td>
                                <td className={isExpired(item.expDate) ? "status-expired" : ""}>
                                  {item.expDate}
                                </td>
                                {checkItems.map((_, idx) => (
                                  <td key={idx} className={item[`check${idx + 1}` as keyof AparItem] === "X" ? "status-ng" : ""}>
                                    {item[`check${idx + 1}` as keyof AparItem] || "-"}
                                  </td>
                                ))}
                                <td>{item.keterangan || "-"}</td>
                                <td>
                                  {item.foto ? (
                                    <img
                                      src={item.foto}
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
                              const itemId = `${record.id}-${item.no}`;
                              const hasNg = Array.from({ length: 12 }, (_, i) => 
                                item[`check${i + 1}` as keyof AparItem] === "X"
                              ).some(Boolean);
                              
                              return (
                                <div key={itemId} className="item-card">
                                  <div className="item-header" onClick={() => toggleExpandItem(itemId)}>
                                    <div className="item-info">
                                      <span className="item-no">#{item.no}</span>
                                      <span className="item-lokasi">{item.lokasi}</span>
                                    </div>
                                    <div className="item-status">
                                      {hasNg ? (
                                        <span className="status-badge ng">NG</span>
                                      ) : (
                                        <span className="status-badge ok">OK</span>
                                      )}
                                    </div>
                                    <div className={`expand-icon ${expandedItem === itemId ? 'expanded' : ''}`}>
                                      ▼
                                    </div>
                                  </div>
                                  
                                  {expandedItem === itemId && (
                                    <div className="item-body">
                                      <div className="info-grid">
                                        <div className="info-row">
                                          <span className="info-label">Jenis APAR:</span>
                                          <span className="info-value">{item.jenisApar}</span>
                                        </div>
                                        <div className="info-row">
                                          <span className="info-label">No. APAR:</span>
                                          <span className="info-value">{item.noApar}</span>
                                        </div>
                                        <div className="info-row">
                                          <span className="info-label">Exp. Date:</span>
                                          <span className={`info-value ${isExpired(item.expDate) ? 'expired' : ''}`}>
                                            {item.expDate} {isExpired(item.expDate) && '⚠️'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="checklist-section">
                                        <h4 className="section-title">✅ Checklist Inspeksi</h4>
                                        <div className="check-grid">
                                          {checkItems.map((checkItem, idx) => {
                                            const checkValue = item[`check${idx + 1}` as keyof AparItem] as string;
                                            return (
                                              <div key={idx} className={`check-item ${checkValue === 'X' ? 'ng' : 'ok'}`}>
                                                <span className="check-label" title={checkItem.help}>
                                                  {checkItem.short}
                                                </span>
                                                <span className={`check-value ${checkValue === 'X' ? 'ng' : 'ok'}`}>
                                                  {checkValue || '-'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {item.keterangan && (
                                        <div className="info-row full">
                                          <span className="info-label">Keterangan:</span>
                                          <span className="info-value">{item.keterangan}</span>
                                        </div>
                                      )}

                                      {item.foto && (
                                        <div className="info-row full">
                                          <span className="info-label">Foto:</span>
                                          <img
                                            src={item.foto}
                                            alt="Foto"
                                            className="item-photo"
                                            onClick={() => openImagePreview(item.foto!)}
                                          />
                                        </div>
                                      )}

                                      <div className="info-row">
                                        <span className="info-label">PIC:</span>
                                        <span className="info-value">{item.pic}</span>
                                      </div>
                                    </div>
                                  )}
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
          max-width: 1800px;
          margin: 0 auto;
          color: #1e293b;
        }

        /* Header Banner */
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
          min-width: 1200px;
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
          white-space: nowrap;
        }

        .check-th {
          text-align: center;
        }

        .status-ng {
          background: #fee2e2;
          color: #dc2626;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
          text-align: center;
        }

        .status-expired {
          background: #fee2e2;
          color: #dc2626;
          font-weight: bold;
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

        .item-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          background: #f8fafc;
          transition: background 0.2s;
          min-height: 44px;
        }

        .item-header:hover {
          background: #f1f5f9;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .item-no {
          background: #1e88e5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .item-lokasi {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          word-break: break-word;
        }

        .item-status {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .status-badge.ok {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.ng {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-body {
          padding: 16px;
          background: #fafbfc;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.9rem;
        }

        .info-row.full {
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          color: #64748b;
          font-weight: 500;
          min-width: 100px;
          flex-shrink: 0;
        }

        .info-value {
          color: #1e293b;
          font-weight: 400;
          word-break: break-word;
        }

        .info-value.expired {
          color: #dc2626;
          font-weight: 600;
        }

        .checklist-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .check-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .check-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .check-item.ok {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .check-item.ng {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .check-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 500;
        }

        .check-value {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .check-value.ok {
          color: #059669;
          background: #d1fae5;
        }

        .check-value.ng {
          color: #dc2626;
          background: #fee2e2;
        }

        .item-photo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .item-photo:hover {
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
            min-width: 1000px;
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
            width: 70px;
            height: 70px;
          }

          .check-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .info-label {
            min-width: 80px;
            font-size: 0.85rem;
          }

          .item-lokasi {
            font-size: 0.9rem;
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

          .item-lokasi {
            font-size: 0.85rem;
          }

          .item-body {
            padding: 12px;
          }

          .section-title {
            font-size: 0.95rem;
          }

          .check-grid {
            grid-template-columns: 1fr;
          }

          .check-item {
            padding: 6px 10px;
          }

          .check-label {
            font-size: 0.8rem;
          }

          .info-row {
            font-size: 0.85rem;
          }

          .info-label {
            min-width: 70px;
            font-size: 0.8rem;
          }

          .item-photo {
            width: 60px;
            height: 60px;
          }

          .apd-table {
            min-width: 700px;
            font-size: 0.7rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 4px 3px;
          }
        }
      `}</style>
    </div>
  );
}