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
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setHistory(result.data);
        }
      } catch (e) {
        console.error("Error loading history:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) return <div className="loading">Loading...</div>;
    if (user.role !== "inspector-ga") return null;

    if (isLoading) {
      return <div className="loading">Loading riwayat...</div>;
    }

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
                  (item: any) => item?.hasil === "NOK"
                );
                const isExpanded = expandedId === entry.id;

                return (
                  <div key={entry.id} className="history-card">
                    <div
                      className="card-header"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      <div className="header-info">
                        <div>
                          <h3>{entry.area}</h3>
                          <p>{entry.tanggal}</p>
                        </div>
                        <span className={hasNOK ? "status-nok" : "status-ok"}>
                          {hasNOK ? "ADA MASALAH" : "BAIK"}
                        </span>
                      </div>
                      <span className="expand-icon">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="card-body">
                        <div className="meta-info">
                          <div>
                            <strong>PIC:</strong> {entry.pic}
                          </div>
                          <div>
                            <strong>Tanggal:</strong> {entry.tanggal}
                          </div>
                        </div>

                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Item Pengecekan</th>
                              <th>Hasil</th>
                              <th>Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {checklistInstalasi.map((item) => {
                              const data = entry.items[item.no];
                              return (
                                <tr key={item.no}>
                                  <td>{item.no}</td>
                                  <td>{item.item}</td>
                                  <td>
                                    <span className={`hasil-${data?.hasil.toLowerCase()}`}>
                                      {data?.hasil || "-"}
                                    </span>
                                  </td>
                                  <td>{data?.keterangan || "-"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

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
          .page-content {
            max-width: 1000px;
            margin: 0 auto;
            padding: 24px;
          }
          .back-btn {
            background: #f0f0f0;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 24px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          .back-btn:hover {
            background: #e0e0e0;
            transform: translateX(-2px);
          }
          h1 {
            color: #0d47a1;
            margin-bottom: 24px;
            font-size: 1.8rem;
          }
          .empty-state {
            text-align: center;
            padding: 48px 24px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(30, 136, 229, 0.2);
          }
          .btn-primary:hover {
            box-shadow: 0 4px 8px rgba(30, 136, 229, 0.3);
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
          }
          .card-header:hover {
            background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
          }
          .header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 32px;
            flex: 1;
          }
          .header-info h3 {
            margin: 0 0 6px 0;
            color: #0d47a1;
            font-size: 1.15rem;
            font-weight: 700;
          }
          .header-info p {
            margin: 0;
            color: #555;
            font-size: 0.95rem;
          }
          .expand-icon {
            color: #1565c0;
            font-size: 0.8rem;
            font-weight: bold;
          }
          .status-ok {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 7px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.9rem;
            border-left: 3px solid #2e7d32;
          }
          .status-nok {
            background: #ffebee;
            color: #c62828;
            padding: 7px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.9rem;
            border-left: 3px solid #c62828;
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
            padding: 14px;
            background: linear-gradient(135deg, #f8f9fa 0%, #f5f5f5 100%);
            border-radius: 8px;
            border-left: 4px solid #1e88e5;
          }
          .meta-info div {
            font-size: 0.95rem;
            color: #555;
          }
          .meta-info strong {
            color: #1a237e;
            font-weight: 700;
          }
          .detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 0.95rem;
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
          }
          .detail-table tbody tr:hover {
            background: #f8f9fa;
          }
          .hasil-ok {
            color: #2e7d32;
            font-weight: bold;
            background: #e8f5e9;
            padding: 6px 12px;
            border-radius: 6px;
            display: inline-block;
            border-left: 3px solid #2e7d32;
          }
          .hasil-nok {
            color: #c62828;
            font-weight: bold;
            background: #ffebee;
            padding: 6px 12px;
            border-radius: 6px;
            display: inline-block;
            border-left: 3px solid #c62828;
          }
          .card-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 14px;
            border-top: 1px solid #f0f0f0;
          }
          .btn-view {
            padding: 10px 18px;
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
          }
          .btn-view:hover {
            background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
            box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }
