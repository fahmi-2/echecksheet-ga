// ExitLampChecklistContent.tsx
// app/exit-lamp-pintu-darurat/exit-lamp/ExitLampChecklistContent.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

interface ChecklistItem {
  no: number;
  lokasi: string;
  id: string;
  kondisiLampu: string;
  indikatorLampu: string;
  kebersihan: string;
  keterangan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verifikasi: string;
  ttdPic: string;
}

export function ExitLampChecklistContent({ date }: { date: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const locations = [
    { no: 1, lokasi: "Lobby", id: "OFFICE-01" },
    { no: 2, lokasi: "Depan Meeting Room", id: "OFFICE-02" },
    { no: 3, lokasi: "Pintu Keluar Main Office", id: "OFFICE-03" },
    { no: 4, lokasi: "Pintu Belakang Selatan Main Office", id: "OFFICE-04" },
    { no: 5, lokasi: "Pintu Keluar training room", id: "TRN-01" },
    { no: 6, lokasi: "Ruang kelas training A", id: "TRN-02" },
    { no: 7, lokasi: "Pintu Auditorium", id: "AUDI-01" },
    { no: 8, lokasi: "Pintu Darurat Auditorium", id: "AUDI-02" },
    { no: 9, lokasi: "Pintu 1 Genba A", id: "A-01" },
    { no: 10, lokasi: "Pintu 2 Genba A", id: "A-02" },
    { no: 11, lokasi: "Pintu 3 Genba A", id: "A-03" },
    { no: 12, lokasi: "Pintu 7 Genba A", id: "A-04" },
    { no: 13, lokasi: "Pintu 8 Genba A", id: "A-05" },
    { no: 14, lokasi: "Pintu 9 Genba A", id: "A-06" },
    { no: 15, lokasi: "Pintu utama Genba B", id: "B-01" },
    { no: 16, lokasi: "Pintu Darurat Genba B", id: "B-02" },
    { no: 17, lokasi: "Pintu 1 Genba C (Selatan)", id: "C-01" },
    { no: 18, lokasi: "Pintu 2 Genba C (tengah)", id: "C-02" },
    { no: 19, lokasi: "Pintu 3 Genba C (utara)", id: "C-03" },
    { no: 20, lokasi: "Gel sheet Pintu utara", id: "C-04" },
    { no: 21, lokasi: "Gel sheet Pintu darurat", id: "C-05" },
    { no: 22, lokasi: "OFFICE JIG PROTO", id: "JP-01" },
    { no: 23, lokasi: "PINTU SELATAN JIG PROTO", id: "JP-02" },
    { no: 24, lokasi: "PINTU UTAMA JIG PROTO (SISI UTARA)", id: "JP-03" },
    { no: 25, lokasi: "CNC ROOM", id: "JP-04" },
    { no: 26, lokasi: "KANTIN SISI UTARA", id: "KANTIN-01" },
    { no: 27, lokasi: "KANTIN SISI SELATAN", id: "KANTIN-02" },
    { no: 28, lokasi: "PARKIR MOTOR BAWAH TIMUR", id: "PARKIR-01" },
    { no: 29, lokasi: "PARKIR MOTOR BAWAH BARAT", id: "PARKIR-02" },
    { no: 30, lokasi: "PARKIR MOTOR ATAS BARAT", id: "PARKIR-03" },
    { no: 31, lokasi: "PARKIR MOTOR ATAS TIMUR", id: "PARKIR-04" },
  ];

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  useEffect(() => {
    const initialItems = locations.map(loc => ({
      no: loc.no,
      lokasi: loc.lokasi,
      id: loc.id,
      kondisiLampu: "",
      indikatorLampu: "",
      kebersihan: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verifikasi: "",
      ttdPic: ""
    }));
    setItems(initialItems);
  }, []);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleShowPreview = () => {
    for (const item of items) {
      if (!item.kondisiLampu || !item.indikatorLampu || !item.kebersihan) {
        alert("⚠️ Semua kolom status harus diisi!");
        return;
      }
    }

    const ngExists = items.some(
      item => item.kondisiLampu === "NG" || 
              item.indikatorLampu === "NG" || 
              item.kebersihan === "NG"
    );
    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleSave = () => {
    const storageKey = `ga_exit_exit-lamp_${date}`;
    const result = {
      id: `exit-lamp-${Date.now()}`,
      date,
      category: "exit-lamp",
      items,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(result));

    const historyKey = "ga_exit_history_exit-lamp";
    const existing = localStorage.getItem(historyKey) || "[]";
    const history = JSON.parse(existing);
    history.push({ ...result, id: storageKey });
    localStorage.setItem(historyKey, JSON.stringify(history));

    alert("✅ Data berhasil disimpan!");
    router.push("/exit-lamp-pintu-darurat");
  };

  const handleReportNg = () => {
    const ngItems = items.filter(item =>
      item.kondisiLampu === "NG" || 
      item.indikatorLampu === "NG" || 
      item.kebersihan === "NG"
    ).map(item => ({
      name: `${item.lokasi} (${item.id})`,
      notes: item.keterangan || "Tidak ada keterangan"
    }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: "Exit Lamp & Emergency Lamp",
      shift: "A",
      ngNotes: "Temuan NG dari checklist Exit Lamp",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/pelaporan");
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>💡 Exit Lamp & Emergency Lamp</h1>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        {!showPreview ? (
          <div className="form-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Lokasi</th>
                  <th>ID</th>
                  <th>Kondisi Lampu</th>
                  <th>Indikator Lampu</th>
                  <th>Kebersihan</th>
                  <th>Keterangan N-OK</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Due Date</th>
                  <th>Verifikasi</th>
                  <th>Ttd PIC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.no}</td>
                    <td>{item.lokasi}</td>
                    <td>{item.id}</td>
                    <td>
                      <select 
                        value={item.kondisiLampu} 
                        onChange={(e) => handleInputChange(index, "kondisiLampu", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        value={item.indikatorLampu} 
                        onChange={(e) => handleInputChange(index, "indikatorLampu", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        value={item.kebersihan} 
                        onChange={(e) => handleInputChange(index, "kebersihan", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.keterangan}
                        onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                        placeholder="Catatan..."
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.tindakanPerbaikan}
                        onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                        placeholder="Tindakan perbaikan..."
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.pic}
                        onChange={(e) => handleInputChange(index, "pic", e.target.value)}
                        placeholder="PIC"
                        className="notes-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => handleInputChange(index, "dueDate", e.target.value)}
                        className="date-input"
                      />
                    </td>
                    <td>
                      <select 
                        value={item.verifikasi} 
                        onChange={(e) => handleInputChange(index, "verifikasi", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.ttdPic}
                        onChange={(e) => handleInputChange(index, "ttdPic", e.target.value)}
                        placeholder="Tanda tangan"
                        className="notes-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button onClick={() => router.back()} className="btn-cancel">
                Batal
              </button>
              <button onClick={handleShowPreview} className="btn-submit">
                👁️ Preview & Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <h2 className="preview-title">🔍 Preview Data</h2>
            
            <div className="preview-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Lokasi</th>
                    <th>ID</th>
                    <th>Kondisi Lampu</th>
                    <th>Indikator Lampu</th>
                    <th>Kebersihan</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td>{item.id}</td>
                      <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>{item.kondisiLampu}</td>
                      <td className={item.indikatorLampu === "NG" ? "status-ng" : ""}>{item.indikatorLampu}</td>
                      <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan}</td>
                      <td>{item.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn">
                ← Kembali ke Form
              </button>
              {hasNg ? (
                <div className="ng-actions">
                  <button onClick={handleReportNg} className="report-btn">
                    📢 Laporkan ke Pelaporan NG
                  </button>
                  <button onClick={handleSave} className="save-btn">
                    💾 Simpan Tanpa Lapor
                  </button>
                </div>
              ) : (
                <button onClick={handleSave} className="save-btn">
                  💾 Simpan Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header h1 {
          margin: 0;
          color: #d32f2f;
          font-size: 2rem;
        }

        .subtitle {
          color: #666;
          margin-top: 8px;
        }

        .form-container,
        .preview-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
          overflow-x: auto;
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid #eee;
        }

        .checklist-table th,
        .simple-table th {
          background: #f5f9ff;
          font-weight: 600;
        }

        .status-select,
        .notes-input,
        .date-input {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .btn-cancel,
        .btn-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }

        .btn-submit {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }

        /* Preview Styles */
        .preview-title {
          margin: 0 0 24px;
          color: #0d47a1;
          font-size: 1.5rem;
          text-align: center;
        }

        .status-ng {
          background: #ffebee;
          color: #c62828;
          font-weight: bold;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-btn {
          padding: 10px 24px;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .save-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .report-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 12px;
        }

        .ng-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .checklist-table,
          .simple-table {
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 8px 4px;
          }

          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .report-btn {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
