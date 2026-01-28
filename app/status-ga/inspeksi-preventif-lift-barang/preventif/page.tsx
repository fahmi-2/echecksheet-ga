"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

type PreventiveItem = {
  id: number;
  checkItem: string;
  equipmentSupport: string;
  langkahKerja: string;
  standar: string;
};

const preventiveItems: PreventiveItem[] = [
  {
    id: 1,
    checkItem: "Hook Lift",
    equipmentSupport: "Dye Penetrant Test",
    langkahKerja: "Spray",
    standar: "Tidak ada keretakan",
  },
  {
    id: 2,
    checkItem: "Sling / Wire Rope",
    equipmentSupport: "Grease wire rope",
    langkahKerja: "Spray / oles",
    standar: "Terlumasi",
  },
  {
    id: 3,
    checkItem: "Holder Plate / Cantolan Hook",
    equipmentSupport: "Dye Penetrant Test",
    langkahKerja: "Spray",
    standar: "Tidak ada keretakan",
  },
  {
    id: 4,
    checkItem: "Roda Penggerak naik turun",
    equipmentSupport: "Grease",
    langkahKerja: "Oles",
    standar: "Terlumasi",
  },
  {
    id: 5,
    checkItem: "Limit Switch",
    equipmentSupport: "Kunci Foding",
    langkahKerja: "Mengencangkan Baut",
    standar: "Kepekaan Mendeteksi",
  },
];

type FormData = Record<
  number,
  {
    status: "OK" | "NG";
    keterangan?: string;
  }
>;

export default function PreventiveLiftBarangPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect jika tidak punya akses
  useEffect(() => {
    if (!user) return;
    if (user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== "inspector-ga") {
    return null;
  }

  const [formData, setFormData] = useState<FormData>({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleStatusChange = (id: number, status: "OK" | "NG") => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        keterangan: status === "OK" ? undefined : prev[id]?.keterangan || "",
      },
    }));
  };

  const handleKeteranganChange = (id: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], keterangan: value },
    }));
  };

  const validateForm = () => {
    for (const item of preventiveItems) {
      const entry = formData[item.id];
      if (entry?.status === "NG") {
        if (!entry.keterangan?.trim()) {
          alert(`❗ Keterangan wajib diisi untuk item "${item.checkItem}" yang berstatus NG.`);
          return false;
        }
      }
    }
    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setShowPreview(true);
  };

  const handleSave = () => {
    const today = new Date().toISOString().split("T")[0];
    const result = {
      id: `preventive-${today}-${Date.now()}`,
      date: today,
      inspector: user.fullName,
      items: formData,
      additionalNotes,
    };

    // Simpan ke localStorage
    const key = `preventive_lift_barang_${today}`;
    localStorage.setItem(key, JSON.stringify(result));

    // Simpan juga ke riwayat global
    const historyKey = "preventive_lift_barang_riwayat_semua";
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
    localStorage.setItem(historyKey, JSON.stringify([...existingHistory, result]));

    alert("✅ Data preventive maintenance berhasil disimpan!");
    router.push("/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat");
  };

  if (showPreview) {
    return (
      <div className="app-page">
        <NavbarStatic userName={user.fullName} />

        <div className="page-content">
          <h1>🔍 Preview Data Preventive</h1>

          <div className="preview-card">
            <h2>Data Pemeriksaan</h2>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Check Item</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {preventiveItems.map((item) => {
                  const entry = formData[item.id];
                  return (
                    <tr key={item.id}>
                      <td>{item.checkItem}</td>
                      <td>
                        <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                          {entry?.status || "-"}
                        </span>
                      </td>
                      <td>{entry?.keterangan || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {additionalNotes && (
              <div className="additional-preview">
                <h3>📝 Saran & Temuan Tambahan:</h3>
                <p>{additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button onClick={() => setShowPreview(false)} className="btn-secondary">
              Kembali ke Form
            </button>
            <button onClick={handleSave} className="btn-primary">
              Simpan Data
            </button>
          </div>
        </div>

        <style jsx>{`
          .page-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
          }
          h1 {
            color: #0277bd;
            text-align: center;
            margin-bottom: 24px;
          }
          .preview-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
          }
          .preview-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          .preview-table th,
          .preview-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .preview-table th {
            background: #e1f5fe;
          }
          .status-ok {
            color: green;
            font-weight: bold;
          }
          .status-ng {
            color: red;
            font-weight: bold;
          }
          .additional-preview {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eee;
          }
          .preview-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          .btn-primary {
            background: #0288d1;
            color: white;
          }
          .btn-secondary {
            background: #f5f5f5;
            color: #333;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <h1>🔧 B. Preventive Lift Barang</h1>
        <p className="subtitle">Isi hasil pelaksanaan tindakan preventif berkala</p>

        <table className="preventive-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Check Item</th>
              <th>Equipment Support</th>
              <th>Langkah Kerja</th>
              <th>Standar</th>
              <th>Status</th>
              <th>Keterangan (jika NG)</th>
            </tr>
          </thead>
          <tbody>
            {preventiveItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.checkItem}</td>
                <td>{item.equipmentSupport}</td>
                <td>{item.langkahKerja}</td>
                <td>{item.standar}</td>
                <td>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name={`status-${item.id}`}
                        checked={formData[item.id]?.status === "OK"}
                        onChange={() => handleStatusChange(item.id, "OK")}
                      /> OK
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`status-${item.id}`}
                        checked={formData[item.id]?.status === "NG"}
                        onChange={() => handleStatusChange(item.id, "NG")}
                      /> NG
                    </label>
                  </div>
                </td>
                <td>
                  {formData[item.id]?.status === "NG" && (
                    <textarea
                      placeholder="Jelaskan kondisi NG..."
                      value={formData[item.id]?.keterangan || ""}
                      onChange={(e) => handleKeteranganChange(item.id, e.target.value)}
                      className="text-area"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="additional-section">
          <h2>📝 Saran dan Temuan Tambahan</h2>
          <textarea
            placeholder="Masukkan saran atau temuan tambahan..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="text-area full"
          />
        </div>

        <div className="actions">
          <button onClick={() => router.back()} className="btn-secondary">Batal</button>
          <button onClick={handlePreview} className="btn-primary">Preview & Simpan</button>
        </div>
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        h1 {
          color: #0277bd;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 24px;
        }
        .preventive-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 32px;
        }
        .preventive-table th,
        .preventive-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .preventive-table th {
          background: #e1f5fe;
        }
        .radio-group {
          display: flex;
          gap: 12px;
        }
        .text-area {
          width: 100%;
          min-height: 60px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        .text-area.full {
          min-height: 100px;
        }
        .additional-section {
          margin: 32px 0;
        }
        .additional-section h2 {
          margin-bottom: 12px;
          color: #01579b;
        }
        .actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-primary {
          background: #0288d1;
          color: white;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }
      `}</style>
    </div>
  );
}