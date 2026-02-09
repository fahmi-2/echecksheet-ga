"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Calendar, Download } from "lucide-react";

export default function RiwayatToilet({ params }: { params: Promise<{ area: string }> }) {
  const [areaId, setAreaId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setAreaId(resolvedParams.area);
    })();
  }, [params]);

  useEffect(() => {
    if (!user || !areaId) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams({
          area_code: areaId,
          limit: "100",
          offset: "0"
        });
        if (filterDate) queryParams.append("inspection_date", filterDate);
        
        const response = await fetch(`/api/toilet-inspections/history?${queryParams.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            let inspectionData = data.data;
            
            // Filter by status
            if (filterStatus !== "all") {
              inspectionData = inspectionData.filter((item: any) => item.overall_status === filterStatus);
            }
            
            setInspections(inspectionData);
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
        alert('Gagal memuat riwayat: ' + (error as any).message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, areaId, filterDate, filterStatus]);

  const areaNames: Record<string, string> = {
    "toilet-driver": "TOILET - DRIVER",
    "toilet-bea-cukai": "TOILET - BEA CUKAI",
    "toilet-parkir": "TOILET - PARKIR",
    "toilet-c2": "TOILET - C2",
    "toilet-c1": "TOILET - C1",
    "toilet-d": "TOILET - D",
    "toilet-auditorium": "TOILET - AUDITORIUM",
    "toilet-whs": "TOILET - WHS",
    "toilet-b1": "TOILET - B1",
    "toilet-a": "TOILET - A",
    "toilet-lobby": "TOILET - LOBBY",
    "toilet-office-main": "TOILET - OFFICE MAIN",
  };

  const areaName = areaId ? (areaNames[areaId] || decodeURIComponent(areaId)) : "";

  const handleExportExcel = () => {
    if (inspections.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    // Simple CSV export
    const headers = ["Tanggal", "Waktu", "Inspector", "Status"];
    const rows = inspections.map(item => [
      new Date(item.inspection_date).toLocaleDateString('id-ID'),
      item.inspection_time,
      item.inspector_name,
      item.overall_status
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `riwayat-${areaId}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || !areaId) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/checksheet-toilet")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>

          <div className="header-title">
            <Calendar size={28} color="#ffffff" />
            Riwayat {areaName}
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Tanggal:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Semua</option>
              <option value="OK">OK</option>
              <option value="NG">NG</option>
            </select>
          </div>
          <button className="btn-export" onClick={handleExportExcel}>
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="no-data">
            <p>Tidak ada data riwayat</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td>{new Date(inspection.inspection_date).toLocaleDateString('id-ID')}</td>
                    <td>{inspection.inspection_time}</td>
                    <td>{inspection.inspector_name}</td>
                    <td>
                      <span className={`status-badge ${inspection.overall_status.toLowerCase()}`}>
                        {inspection.overall_status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-detail"
                        onClick={() => router.push(`/status-ga/checksheet-toilet/${areaId}?date=${inspection.inspection_date}`)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        }

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
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .filters-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .filter-group label {
          font-weight: 600;
          color: #334155;
          font-size: 0.9rem;
        }

        .filter-input,
        .filter-select {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .btn-export {
          padding: 10px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          transition: all 0.3s ease;
        }

        .btn-export:hover {
          background: #059669;
          transform: translateY(-2px);
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

        .no-data {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 1.1rem;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
        }

        .history-table th {
          background: #f1f5f9;
          padding: 16px 12px;
          text-align: left;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #cbd5e1;
        }

        .history-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }

        .history-table tr:hover {
          background: #f8fafc;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .status-badge.ok {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.ng {
          background: #fee2e2;
          color: #b91c1c;
        }

        .btn-detail {
          padding: 6px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-detail:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
          }

          .filters-container {
            flex-direction: column;
          }

          .filter-group {
            min-width: 100%;
          }

          .btn-export {
            width: 100%;
            justify-content: center;
          }

          .history-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}