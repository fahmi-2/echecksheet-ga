"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

type HistoryEntry = {
  id: string;
  itemId: string;
  date: string;
  inspector: string;
  data: Record<string, any>;
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

export default function RiwayatInspeksiPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
      return;
    }

    // Ambil riwayat global
    const globalKey = "inspeksi_lift_barang_riwayat_semua";
    const saved = localStorage.getItem(globalKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved).reverse(); // Terbaru di atas
        setHistory(parsed);
      } catch (e) {
        console.error("Gagal parse riwayat", e);
      }
    }
  }, [user, router]);

  if (!user) return <div>Loading...</div>;
  if (user.role !== "inspector-ga") return null;

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <h1>📋 Riwayat Inspeksi Lift Barang</h1>
        {history.length === 0 ? (
          <p>Tidak ada riwayat inspeksi.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Item</th>
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
                    <td>{itemTitles[entry.itemId] || entry.itemId}</td>
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
  Lihat
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
        .page-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
        }
        h1 {
          color: #0d47a1;
          margin-bottom: 24px;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .history-table th,
        .history-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .history-table th {
          background: #e3f2fd;
        }
        .status-ok {
          color: green;
          font-weight: bold;
        }
        .status-ng {
          color: red;
          font-weight: bold;
        }
        .btn-view {
          padding: 6px 12px;
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}