"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

const checklistStopKontak = [
  {
    no: 1,
    item: "Kondisi Fisik Stop Kontak",
    detail: "Tidak retak, pecah, atau longgar",
  },
  {
    no: 2,
    item: "Penutup Stop Kontak",
    detail: "Penutup terpasang dan aman",
  },
  {
    no: 3,
    item: "Fungsi Stop Kontak",
    detail: "Berfungsi dengan baik saat diuji",
  },
  {
    no: 4,
    item: "Keamanan",
    detail: "Tidak panas dan tidak berbau",
  },
];

type CheckData = {
  hasil: "OK" | "NOK" | "";
  keterangan: string;
};

export default function FormStopKontak() {
  const router = useRouter();
  const { user } = useAuth();
  const [meta, setMeta] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    area: "",
    pic: user?.fullName || "",
  });

  const [checkData, setCheckData] = useState<Record<number, CheckData>>({});

  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  if (!user) return <div className="loading">Memuat...</div>;
  if (user.role !== "inspector-ga") return null;

  const handleResultChange = (no: number, hasil: "OK" | "NOK") => {
    setCheckData(prev => ({
      ...prev,
      [no]: { ...prev[no], hasil }
    }));
  };

  const handleKeteranganChange = (no: number, keterangan: string) => {
    setCheckData(prev => ({
      ...prev,
      [no]: { ...prev[no], keterangan }
    }));
  };

  const handleSubmit = () => {
    if (!meta.area.trim()) {
      alert("❗ Area harus diisi");
      return;
    }

    const allChecked = checklistStopKontak.every(item => checkData[item.no]?.hasil);
    if (!allChecked) {
      alert("❗ Semua item harus diisi");
      return;
    }

    const result = {
      id: `stopkontak-${Date.now()}`,
      type: "stop-kontak",
      tanggal: meta.tanggal,
      area: meta.area,
      pic: meta.pic,
      data: checkData,
    };

    const historyKey = "form_inspeksi_stop_kontak_history";
    const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
    localStorage.setItem(historyKey, JSON.stringify([...existing, result]));

    alert("✅ Data berhasil disimpan!");
    router.push("/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat");
  };

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali
        </button>

        <h1 className="title">🔌 Pengecekan Stop Kontak</h1>

        <div className="form-header">
          <div className="form-group">
            <label>Tanggal</label>
            <input
              type="date"
              value={meta.tanggal}
              onChange={(e) => setMeta({ ...meta, tanggal: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Area</label>
            <input
              type="text"
              placeholder="Masukkan area..."
              value={meta.area}
              onChange={(e) => setMeta({ ...meta, area: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>PIC</label>
            <input
              type="text"
              placeholder="Person in Charge"
              value={meta.pic}
              onChange={(e) => setMeta({ ...meta, pic: e.target.value })}
            />
          </div>
        </div>

        <table className="checksheet">
          <thead>
            <tr>
              <th>No</th>
              <th>Item Pengecekan</th>
              <th>Detail</th>
              <th>OK</th>
              <th>N-OK</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {checklistStopKontak.map((row) => (
              <tr key={row.no}>
                <td className="no-cell">{row.no}</td>
                <td>{row.item}</td>
                <td>{row.detail}</td>
                <td className="radio-cell">
                  <input
                    type="radio"
                    name={`hasil-${row.no}`}
                    checked={checkData[row.no]?.hasil === "OK"}
                    onChange={() => handleResultChange(row.no, "OK")}
                  />
                </td>
                <td className="radio-cell">
                  <input
                    type="radio"
                    name={`hasil-${row.no}`}
                    checked={checkData[row.no]?.hasil === "NOK"}
                    onChange={() => handleResultChange(row.no, "NOK")}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Catatan..."
                    value={checkData[row.no]?.keterangan || ""}
                    onChange={(e) => handleKeteranganChange(row.no, e.target.value)}
                    className="text-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="actions">
          <button className="submit-btn" onClick={handleSubmit}>💾 Simpan Checksheet</button>
        </div>
      </div>

      <style jsx>{`
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
        .title {
          margin-bottom: 24px;
          color: #0d47a1;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .form-header {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 200px;
        }
        .form-group label {
          font-weight: 600;
          color: #1a237e;
          font-size: 0.95rem;
        }
        .form-group input {
          padding: 11px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
        }
        .form-group input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }
        .checksheet {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }
        .checksheet th,
        .checksheet td {
          border: 1px solid #f0f0f0;
          padding: 16px;
          font-size: 0.95rem;
          text-align: left;
        }
        .checksheet th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }
        .checksheet tbody tr {
          transition: background-color 0.2s ease;
        }
        .checksheet tbody tr:hover {
          background-color: #f8f9fa;
        }
        .no-cell {
          width: 60px;
          text-align: center;
          font-weight: 600;
          color: #1565c0;
        }
        .radio-cell {
          width: 70px;
          text-align: center;
        }
        .radio-cell input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #1e88e5;
        }
        .text-input {
          width: 100%;
          padding: 11px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          background: white;
        }
        .text-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .submit-btn {
          padding: 13px 36px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
        }
        .submit-btn:hover {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.35);
          transform: translateY(-2px);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
