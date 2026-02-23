// app/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/[itemId]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Clock, User, CheckCircle, XCircle, FileText, Wrench, Camera } from "lucide-react";

// ✅ Data item langsung di dalam file
const inspectionItems = [
  { id: "1", label: "PONDASI / BAUT PENGIKAT" },
  { id: "2", label: "KOLOM / RANGKA" },
  { id: "3", label: "SANGKAR" },
  { id: "4", label: "BEAM DUDUKAN MOTOR HOIST" },
  { id: "5", label: "REL PEMANDU" },
  { id: "6", label: "RODA PENGGERAK (NAIK - TURUN)" },
  { id: "7", label: "RODA IDLE" },
  { id: "8", label: "PEREDAM / PENYANGGA" },
  { id: "9", label: "MOTOR HOIST & GEAR BOX" },
  { id: "10", label: "PULLY / CAKRA" },
  { id: "11", label: "KAIT UTAMA" },
  { id: "12", label: "TALI KABEL BAJA" },
  { id: "13", label: "TOMBOL PUSH BUTTON" },
  { id: "14", label: "SAFETY DEVICE" },
  { id: "15", label: "KOMPONEN LISTRIK" },
  { id: "16", label: "KETERSEDIAAN APAR DI DEKAT LIFT" },
];

// ✅ Helper untuk mendapatkan nama item
const getItemNameById = (id: string): string => {
  const item = inspectionItems.find(i => i.id === id);
  return item?.label || `Item ${id}`;
};

// ✅ Helper khusus untuk sub-item (sesuai kebutuhan Anda)
const getSubItemLabel = (subItemId: string): string => {
  // Ambil huruf terakhir dari subItemId (misal: "1A" -> "A")
  const suffix = subItemId.charAt(subItemId.length - 1);
  
  switch (suffix.toUpperCase()) {
    case "A": return "KOROSI";
    case "B": return "KERETAKAN";
    case "C": return "PERUBAHAN BENTUK";
    case "D": return "KETEBALAN";
    case "E": return "KELONGGARAN";
    case "F": return "KETIDAKRATAAN";
    default: return `Sub-Item ${suffix}`;
  }
};

interface InspectionRecord {
  id: string;
  date: string;
  inspector: string;
  inspectorNik: string;
  submittedAt: string;
  items: Record<string, {
    status: string;
    keterangan: string;
    solusi: string;
    foto_path: string | null;
  }>;
}

export default function RiwayatInspeksiPerItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = use(params);
  
  // ✅ Dapatkan nama item dari data lokal
  const itemDisplayName = getItemNameById(itemId);
  
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/lift-barang/inspeksi/history?item_id=${itemId}&limit=20`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Gagal mengambil data');
        }

        const safeRecords = Array.isArray(result.data?.records) ? result.data.records : [];
        const validatedRecords: InspectionRecord[] = safeRecords.map((record: any): InspectionRecord => ({
          ...record,
          items: record.items && typeof record.items === 'object' && record.items !== null
            ? record.items
            : {}
        }));
        
        setRecords(validatedRecords);
      } catch (err) {
        console.error('❌ Fetch history error:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [itemId, user, router]);

  if (!user) return null;

  // ✅ Helper untuk mengubah items object menjadi array dengan sub_item_id
  const getItemsArray = (items: Record<string, any>) => {
    if (!items || typeof items !== 'object' || Array.isArray(items)) return [];
    
    return Object.entries(items).map(([subItemId, itemData]) => ({
      sub_item_id: subItemId,
      ...itemData
    }));
  };

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header - Tampilkan nama item lengkap */}
        <div className="header">
          <button onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi")} className="btn-back">
            <ArrowLeft size={20} />
          </button>
          <div className="header-title">
            <h1>Riwayat Inspeksi</h1>
            <p>{itemDisplayName}</p> {/* ✅ Tampilkan nama item lengkap */}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="alert error">
            <div className="alert-content">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Memuat riwayat...</p>
          </div>
        ) : records.length === 0 ? (
          /* Empty State - Tampilkan nama item */
          <div className="empty">
            <div className="empty-icon">📋</div>
            <h3>Belum Ada Riwayat</h3>
            <p>Belum ada data inspeksi untuk {itemDisplayName.toLowerCase()}</p>
            <button 
              onClick={() => router.push(`/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/${itemId}`)}
              className="btn-primary"
            >
              Input Inspeksi {itemDisplayName}
            </button>
          </div>
        ) : (
          /* Records List */
          <div className="records">
            {records.map((record: InspectionRecord) => {
              // ✅ Dapatkan array items dengan sub_item_id
              const itemsArray = getItemsArray(record.items);
              const ngCount = itemsArray.filter((item: any) => item.status === 'NG').length;
              const okCount = itemsArray.length - ngCount;

              return (
                <div key={record.id} className="card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="meta">
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>{new Date(record.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={16} />
                        <span>{new Date(record.submittedAt).toLocaleTimeString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                    </div>
                    <div className="inspector">
                      <User size={16} />
                      <span>{record.inspector}</span>
                      <span className="nik">{record.inspectorNik}</span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="stats">
                    <div className="stat ok">
                      <CheckCircle size={18} />
                      <span>{okCount} OK</span>
                    </div>
                    <div className="stat ng">
                      <XCircle size={18} />
                      <span>{ngCount} NG</span>
                    </div>
                  </div>

                  {/* Items List - Tampilkan sub-item dengan label yang sesuai */}
                  <div className="items">
                    {itemsArray.map((item: any, index: number) => (
                      <div key={index} className={`item ${item.status === 'NG' ? 'item-ng' : 'item-ok'}`}>
                        <div className="item-header">
                          {/* ✅ Tampilkan label sub-item yang sesuai (KOROSI, KERETAKAN, dll) */}
                          <span className="item-label">{getSubItemLabel(item.sub_item_id)}</span>
                          <span className={`badge ${item.status === 'NG' ? 'badge-ng' : 'badge-ok'}`}>
                            {item.status}
                          </span>
                        </div>

                        {item.status === 'NG' && (
                          <div className="item-details">
                            {item.keterangan && (
                              <div className="detail">
                                <FileText size={14} />
                                <span>{item.keterangan}</span>
                              </div>
                            )}
                            {item.solusi && (
                              <div className="detail">
                                <Wrench size={14} />
                                <span>{item.solusi}</span>
                              </div>
                            )}
                            {item.foto_path && (
                              <div className="detail-photo">
                                <Camera size={14} />
                                <img 
                                  src={item.foto_path.startsWith('http') ? item.foto_path : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto_path}`} 
                                  alt="Dokumentasi" 
                                  className="photo"
                                  onClick={(e) => {
                                    const modal = document.createElement('div');
                                    modal.className = 'photo-modal';
                                    modal.innerHTML = `
                                      <div class="photo-modal-content">
                                        <img src="${e.currentTarget.src}" alt="Dokumentasi" />
                                      </div>
                                    `;
                                    modal.onclick = () => modal.remove();
                                    document.body.appendChild(modal);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-back {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.625rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .btn-back:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .header-title h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.2;
        }

        .header-title p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        /* Alert */
        .alert {
          background: white;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .alert.error {
          border-left: 4px solid #ef4444;
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #dc2626;
        }

        .btn-retry {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-retry:hover {
          background: #dc2626;
        }

        /* Loading */
        .loading {
          text-align: center;
          padding: 4rem 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading p {
          color: #64748b;
          font-size: 0.875rem;
        }

        /* Empty State */
        .empty {
          text-align: center;
          padding: 4rem 1rem;
          background: white;
          border-radius: 1rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
        }

        .empty p {
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        /* Records */
        .records {
          display: grid;
          gap: 1.25rem;
        }

        /* Card */
        .card {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .card-header {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .inspector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .nik {
          color: #64748b;
          font-weight: 400;
        }

        /* Stats */
        .stats {
          display: flex;
          gap: 0.75rem;
          padding: 0 1.25rem 1.25rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .stat.ok {
          background: #f0fdf4;
          color: #16a34a;
        }

        .stat.ng {
          background: #fef2f2;
          color: #dc2626;
        }

        /* Items */
        .items {
          display: grid;
          gap: 0.5rem;
          padding: 0 1.25rem 1.25rem;
        }

        .item {
          border-radius: 0.5rem;
          padding: 0.875rem;
          transition: all 0.2s;
        }

        .item-ok {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .item-ng {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }

        .item-label {
          font-weight: 500;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .badge-ok {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge-ng {
          background: #fee2e2;
          color: #dc2626;
        }

        .item-details {
          display: grid;
          gap: 0.625rem;
          margin-top: 0.875rem;
          padding-top: 0.875rem;
          border-top: 1px dashed #fecaca;
        }

        .detail {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #475569;
        }

        .detail-photo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .photo {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 0.5rem;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .photo:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Photo Modal */
        :global(.photo-modal) {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
          cursor: pointer;
        }

        :global(.photo-modal-content) {
          max-width: 90vw;
          max-height: 90vh;
        }

        :global(.photo-modal-content img) {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .page-content {
            padding: 1rem;
          }

          .header-title h1 {
            font-size: 1.25rem;
          }

          .meta {
            flex-direction: column;
            gap: 0.5rem;
          }

          .stats {
            flex-direction: column;
          }

          .photo {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
}