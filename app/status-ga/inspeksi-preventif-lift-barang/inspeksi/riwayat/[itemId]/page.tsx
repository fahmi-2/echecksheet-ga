"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

type HistoryEntry = {
  id: string;
  itemId: string;
  date: string;
  inspector: string;
  data: Record<string, any>;
  photos: string[]; // Tambahkan properti photos
};

const itemTitles: Record<string, string> = {
  "1": "PONDASI / BAUT PENGIKAT",
  "2": "KOLOM / RANGKA",
  "3": "SANGKAR",
  "4": "BEAM DUDUKAN MOTOR HOIST",
  "5": "REL PEMANDU",
  "6": "RODA PENGGERAK (NAIK - TURUN)",
  "7": "RODA IDLE",
  "8": "PEREDAM / PENYANGGA",
  "9": "MOTOR HOIST & GEAR BOX",
  "10": "PULLY / CAKRA",
  "11": "KAIT UTAMA",
  "12": "TALI KABEL BAJA",
  "13": "TOMBOL PUSH BUTTON",
  "14": "SAFETY DEVICE",
  "15": "KOMPONEN LISTRIK",
  "16": "KETERSEDIAAN APAR DI DEKAT LIFT",
};

export default function RiwayatInspeksiPerItemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  // Ambil itemId - akan undefined pada render pertama, tapi tersedia setelah hydration
  const itemId = params?.itemId as string | undefined;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tunggu sampai user dan itemId tersedia
    if (!user || !itemId) {
      // Beri sedikit delay untuk memastikan hydration selesai
      const timer = setTimeout(() => {
        if (!user) {
          router.push("/home");
          return;
        }
        
        if (!itemId) {
          setError("Item tidak ditemukan");
          setIsLoading(false);
          return;
        }
        
        loadHistory(itemId);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    loadHistory(itemId);
  }, [user, itemId, router]);

  const loadHistory = async (id: string) => {
    try {
      if (user?.role !== "inspector-ga") {
        router.push("/home");
        return;
      }

      if (!itemTitles[id]) {
        setError("Item tidak valid");
        setIsLoading(false);
        return;
      }

      // Fetch history from API
      const response = await fetch(`/api/lift-barang/inspeksi/history?itemId=${id}`);
      const result = await response.json();

      if (response.ok && result.success) {
        // Transform API data to match HistoryEntry format
        const transformedHistory: HistoryEntry[] = result.data.map((entry: any) => {
          
          return {
            id: entry.id,
            itemId: id,
            date: entry.inspection_date,
            inspector: entry.inspector,
            data: entry.data,
          };
        });

        setHistory(transformedHistory);
      } else {
        setError(result.message || "Gagal memuat riwayat");
      }
    } catch (e) {
      console.error("Error loading history:", e);
      setError("Gagal memuat riwayat");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;
  if (user.role !== "inspector-ga") return null;

  if (isLoading) {
    return <div className="loading">Loading riwayat...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => router.back()} className="back-btn">
          ← Kembali
        </button>
      </div>
    );
  }

  // Pastikan itemId tersedia di sini
  const finalItemId = itemId!;
  const itemName = itemTitles[finalItemId] || `Item ${finalItemId}`;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali ke Daftar
        </button>

        <h1>📋 Riwayat Inspeksi: {itemName}</h1>
        
        {history.length === 0 ? (
          <p>Tidak ada riwayat inspeksi untuk {itemName}.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Inspector</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const hasNG = Object.values(entry.data).some(
                  (item: any) => item?.status === "NG"
                );
                return (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.inspector}</td>
                    <td>
                      <span className={hasNG ? "status-ng" : "status-ok"}>
                        {hasNG ? "NG" : "OK"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          router.push(
                            `/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/${entry.itemId}?view=${entry.id}`
                          )
                        }
                        className="btn-view"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .loading, .error {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 1.2rem;
          color: #666;
        }
        .error {
          color: #f44336;
        }
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: #fafafa;
        }
        .back-btn {
          background: white;
          border: 1.5px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 24px;
          display: inline-block;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
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
        .history-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .history-table th,
        .history-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        .history-table th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }
        .history-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .history-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .status-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #2e7d32;
        }
        .status-ng {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          border-left: 3px solid #c62828;
        }
        .btn-view {
          padding: 10px 18px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
        }
        .btn-view:hover {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          transform: translateY(-2px);
        }
        .btn-view:active {
          transform: translateY(0);
        }
        
      `}</style>
    </div>
  );
}