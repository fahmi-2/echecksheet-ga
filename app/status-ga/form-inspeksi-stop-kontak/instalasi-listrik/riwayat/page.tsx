// app/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

type HistoryEntry = {
  id: string;
  type: string;
  tanggal: string;
  area: string;
  pic: string;
  items: Record<number, { hasil: "OK" | "NOK"; keterangan: string; foto_path: string | null }>;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const checklistInstalasi = [
  {
    no: 1,
    item: "Standar Kabel Listrik",
    detail: "Kabel sesuai standar dan tidak terkelupas",
  },
  {
    no: 2,
    item: "Kerapihan Instalasi",
    detail: "Kabel tertata rapi dan tidak menggantung",
  },
  {
    no: 3,
    item: "Pelindung Kabel",
    detail: "Menggunakan conduit / ducting",
  },
  {
    no: 4,
    item: "Sambungan Kabel",
    detail: "Tidak ada sambungan terbuka",
  },
];

// ✅ Helper: Format tanggal saja (tanpa waktu)
const formatDateOnly = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateString;
  }
};

// ✅ Helper: Format waktu saja (HH:mm)
const formatTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

// ✅ Helper: Format tanggal & waktu lengkap (DD/MM/YYYY HH:mm)
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

export default function RiwayatInstalasiListrik() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
      return;
    }
    loadHistory();
  }, [user, router]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/electrical_inspections?type=instalasi-listrik');
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType?.includes('text/html')) {
          throw new Error('Endpoint tidak ditemukan');
        }
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const filtered = result.data.filter((item: HistoryEntry) => 
          item.type === 'instalasi-listrik'
        );
        setHistory(filtered);
      }
    } catch (e) {
      console.error("❌ Error loading history:", e);
      alert(`Gagal memuat riwayat: ${(e as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="loading">Loading...</div>;
  if (user.role !== "inspector-ga") return null;
  if (isLoading) return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading riwayat...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <button onClick={() => router.back()} className="back-btn">
          ← Kembali
        </button>

        <h1>📋 Riwayat Pengecekan Instalasi Listrik</h1>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Tidak ada riwayat inspeksi</p>
            <button
              onClick={() => router.push("/status-ga/form-inspeksi-stop-kontak/instalasi-listrik")}
              className="btn-primary"
            >
              + Buat Pengecekan Baru
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry) => {
              const hasNOK = Object.values(entry.items).some(
                (item) => item?.hasil === "NOK"
              );
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} className="history-card">
                  <div
                    className="card-header"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="header-info">
                      <div className="header-text">
                        <h3>{entry.area}</h3>
                        <p className="tanggal">{formatDateOnly(entry.tanggal)}</p>
                        <p className="waktu">Input: {formatDateTime(entry.createdAt)}</p>
                      </div>
                      <span className={hasNOK ? "status-nok" : "status-ok"}>
                        {hasNOK ? "⚠️ ADA MASALAH" : "✓ BAIK"}
                      </span>
                    </div>
                    <span className="expand-icon">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="card-body">
                      <div className="meta-info">
                        <div className="meta-item">
                          <span className="meta-label">PIC:</span>
                          <span className="meta-value">{entry.pic}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Tanggal Inspeksi:</span>
                          <span className="meta-value">{formatDateOnly(entry.tanggal)}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Waktu Input:</span>
                          <span className="meta-value">{formatDateTime(entry.createdAt)}</span>
                        </div>
                      </div>

                      <div className="table-wrapper">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th className="col-no">No</th>
                              <th className="col-item">Item Pengecekan</th>
                              <th className="col-hasil">Hasil</th>
                              <th className="col-ket">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {checklistInstalasi.map((item) => {
                              const data = entry.items[item.no];
                              return (
                                <tr key={item.no}>
                                  <td className="col-no">{item.no}</td>
                                  <td className="col-item">
                                    <div className="item-name">{item.item}</div>
                                    <div className="item-detail">{item.detail}</div>
                                  </td>
                                  <td className="col-hasil">
                                    <span className={`hasil-${data?.hasil?.toLowerCase()}`}>
                                      {data?.hasil || "-"}
                                    </span>
                                  </td>
                                  <td className="col-ket">{data?.keterangan || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() =>
                            router.push(
                              `/status-ga/form-inspeksi-stop-kontak/instalasi-listrik?view=${entry.id}`
                            )
                          }
                          className="btn-view"
                        >
                          👁️ Lihat Detail
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          max-width: 1200px;
        }

        .back-btn {
          background: white;
          border: 1.5px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 24px;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }

        h1 {
          color: #0d47a1;
          margin-bottom: 24px;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e0e0e0;
          border-top-color: #1e88e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p {
          color: #666;
          font-size: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state p {
          color: #999;
          font-size: 1.1rem;
          margin-bottom: 24px;
        }

        .btn-primary {
          padding: 12px 32px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.2);
          min-height: 44px;
        }

        .btn-primary:hover {
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
          transform: translateY(-2px);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border-left: 5px solid #1e88e5;
        }

        .history-card:hover {
          box-shadow: 0 6px 24px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          cursor: pointer;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .card-header:hover {
          background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex: 1;
          flex-wrap: wrap;
        }

        .header-text {
          flex: 1;
          min-width: 200px;
        }

        .header-text h3 {
          margin: 0 0 6px 0;
          color: #0d47a1;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .header-text .tanggal {
          margin: 0 0 4px 0;
          color: #555;
          font-size: 0.95rem;
        }

        .header-text .waktu {
          margin: 0;
          color: #888;
          font-size: 0.85rem;
        }

        .expand-icon {
          color: #1565c0;
          font-size: 1rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .status-ok {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border-left: 3px solid #2e7d32;
          white-space: nowrap;
        }

        .status-nok {
          background: #ffebee;
          color: #c62828;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border-left: 3px solid #c62828;
          white-space: nowrap;
        }

        .card-body {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
        }

        .meta-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #f8f9fa 0%, #f5f5f5 100%);
          border-radius: 8px;
          border-left: 4px solid #1e88e5;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
        }

        .meta-value {
          font-size: 0.95rem;
          color: #1a237e;
          font-weight: 500;
        }

        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-bottom: 16px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
          min-width: 600px;
        }

        .detail-table th,
        .detail-table td {
          padding: 14px;
          border-bottom: 1px solid #f0f0f0;
          text-align: left;
        }

        .detail-table th {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          font-weight: 700;
          color: #0d47a1;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .detail-table tbody tr:hover {
          background: #f8f9fa;
        }

        .col-no {
          width: 60px;
          text-align: center;
          font-weight: 600;
        }

        .col-item {
          min-width: 200px;
        }

        .item-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .item-detail {
          font-size: 0.85rem;
          color: #64748b;
        }

        .col-hasil {
          width: 120px;
          text-align: center;
        }

        .hasil-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #2e7d32;
          min-width: 60px;
        }

        .hasil-nok {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #c62828;
          min-width: 60px;
        }

        .col-ket {
          min-width: 200px;
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        .btn-view {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-view:hover {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          transform: translateY(-2px);
        }

        /* ✅ TABLET RESPONSIVE (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          h1 {
            font-size: 1.6rem;
          }

          .header-info {
            gap: 16px;
          }

          .status-ok,
          .status-nok {
            font-size: 0.85rem;
            padding: 6px 12px;
          }
        }

        /* ✅ MOBILE RESPONSIVE (≤ 768px) */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .back-btn {
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }

          h1 {
            font-size: 1.4rem;
            margin-bottom: 20px;
          }

          .card-header {
            padding: 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-info {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-text {
            width: 100%;
          }

          .header-text h3 {
            font-size: 1.1rem;
          }

          .header-text .tanggal {
            font-size: 0.9rem;
          }

          .header-text .waktu {
            font-size: 0.8rem;
          }

          .status-ok,
          .status-nok {
            width: 100%;
            text-align: center;
            padding: 10px 16px;
          }

          .expand-icon {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
          }

          .meta-info {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 12px;
          }

          .meta-item {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .meta-label {
            font-size: 0.8rem;
          }

          .meta-value {
            font-size: 0.9rem;
          }

          .detail-table {
            font-size: 0.85rem;
            min-width: 500px;
          }

          .detail-table th,
          .detail-table td {
            padding: 10px 8px;
          }

          .col-no {
            width: 50px;
          }

          .col-hasil {
            width: 100px;
          }

          .hasil-ok,
          .hasil-nok {
            font-size: 0.8rem;
            padding: 4px 10px;
            min-width: 50px;
          }

          .item-detail {
            font-size: 0.8rem;
          }

          .card-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-view {
            width: 100%;
            justify-content: center;
            min-height: 48px;
            font-size: 0.9rem;
          }
        }

        /* ✅ SMALL MOBILE (≤ 480px) */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .back-btn {
            padding: 10px 14px;
            font-size: 0.9rem;
            min-height: 44px;
          }

          h1 {
            font-size: 1.2rem;
            margin-bottom: 16px;
          }

          .empty-state {
            padding: 40px 16px;
          }

          .empty-icon {
            font-size: 3rem;
          }

          .empty-state p {
            font-size: 1rem;
          }

          .btn-primary {
            width: 100%;
            padding: 12px 24px;
            font-size: 0.95rem;
            min-height: 48px;
          }

          .card-header {
            padding: 14px 12px;
          }

          .header-text h3 {
            font-size: 1rem;
          }

          .header-text .tanggal {
            font-size: 0.85rem;
          }

          .header-text .waktu {
            font-size: 0.75rem;
          }

          .status-ok,
          .status-nok {
            font-size: 0.8rem;
            padding: 8px 12px;
          }

          .card-body {
            padding: 14px 12px;
          }

          .meta-info {
            padding: 12px;
          }

          .meta-label {
            font-size: 0.75rem;
          }

          .meta-value {
            font-size: 0.85rem;
          }

          .detail-table {
            font-size: 0.8rem;
            min-width: 450px;
          }

          .detail-table th,
          .detail-table td {
            padding: 8px 6px;
          }

          .col-no {
            width: 45px;
          }

          .col-hasil {
            width: 90px;
          }

          .hasil-ok,
          .hasil-nok {
            font-size: 0.75rem;
            padding: 4px 8px;
            min-width: 45px;
          }

          .item-name {
            font-size: 0.85rem;
          }

          .item-detail {
            font-size: 0.75rem;
          }

          .btn-view {
            padding: 10px 20px;
            font-size: 0.85rem;
            min-height: 44px;
          }
        }

        /* ✅ EXTRA SMALL MOBILE (≤ 360px) */
        @media (max-width: 360px) {
          .page-content {
            padding: 10px 6px;
          }

          h1 {
            font-size: 1.1rem;
          }

          .back-btn {
            font-size: 0.85rem;
            padding: 8px 12px;
            min-height: 40px;
          }

          .card-header {
            padding: 12px 10px;
          }

          .header-text h3 {
            font-size: 0.95rem;
          }

          .header-text .tanggal {
            font-size: 0.8rem;
          }

          .status-ok,
          .status-nok {
            font-size: 0.75rem;
            padding: 6px 10px;
          }

          .detail-table {
            font-size: 0.75rem;
            min-width: 400px;
          }

          .detail-table th,
          .detail-table td {
            padding: 6px 4px;
          }

          .btn-view {
            font-size: 0.8rem;
            padding: 8px 16px;
            min-height: 40px;
          }
        }
      `}</style>
    </div>
  );
}