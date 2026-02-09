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

const checkItems = [
  { label: "Masa Berlaku", help: "Lihat identitas APAR apakah masih berlaku atau tidak" },
  { label: "Tekanan", help: "Pastikan jarum penunjuk tekanan APAR tepat di warna hijau" },
  { label: "Isi Tabung", help: "Pastikan isi APAR tidak menggumpal dengan menggoyangkan, mengocok tabung dan menimbang APAR" },
  { label: "Selang", help: "Pastikan selang APAR tidak rusak & tidak tersumbat benda apapun" },
  { label: "Segel", help: "Periksa segel APAR apakah dalam kondisi terkunci ataukah dalam kondisi terbuka" },
  { label: "Kondisi Tabung & Kebersihan tabung", help: "Pastikan area APAR tidak terhalang benda apapun" },
  { label: "Gantungan Apar", help: "Pastikan masing-masing Gantungan APAR Tidak Rusak" },
  { label: "Lay out APAR", help: "Pastikan masing-masing APAR ada Lay out nya" },
  { label: "Papan Petunjuk & Nomor Apar", help: "Pastikan terpasang dan mudah dilihat" },
  { label: "OS & C/S", help: "Pastikan Operation standart & Check Sheet terpasang rapi dan jelas dan update" },
  { label: "Area Sekitar", help: "Pastikan Jalan/akses APAR mudah dan dapat dijangkau oleh tim" },
  { label: "Posisi APAR tidak bergeser", help: "Pastikan APAR tetap pada posisi semula dan tidak bergeser" },
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
      queryParams.append('slug', slug);
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom);
      if (filterDateTo) queryParams.append('date_to', filterDateTo);
      queryParams.append('limit', '100');
      queryParams.append('offset', '0');

      const response = await fetch(`/api/apar/history?${queryParams.toString()}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // ✅ Format data dari API ke format frontend
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

  // Ambil daftar lokasi unik
  const locations = Array.from(
    new Set(
      records
        .flatMap((r) => r.items || [])
        .map((i) => i.lokasi)
        .filter(Boolean)
    )
  ).sort();

  // Filter berdasarkan lokasi
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

  // ✅ FUNGSI AMAN - TAMBAHKAN PENGECEKAN NULL/UNDEFINED
const parseExpDate = (dateStr: string | null | undefined): Date | null => {
  // ✅ Tambahkan pengecekan awal
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
      const imageUrl = src.startsWith('') 
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
        // Reload data
        await loadData();
        alert('Data berhasil dihapus!');
      } else {
        const error = await response.json();
        alert('Gagal menghapus  ' + error.message);
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
            onClick={() => router.push("/status-ga/inspeksi-apar")}
            className="btn-back"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
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
                            <th>Jenis APAR</th>
                            <th>Lokasi</th>
                            <th>No. APAR</th>
                            <th>Exp. Date</th>
                            {checkItems.map((item, idx) => (
                              <th key={idx} title={item.help}>
                                {item.label}
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
                                    src={item.foto.startsWith('') 
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
          max-width: 1800px;
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