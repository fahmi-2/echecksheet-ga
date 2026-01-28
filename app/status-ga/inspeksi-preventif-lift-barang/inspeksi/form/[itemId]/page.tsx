<<<<<<< HEAD
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

type SubItem = {
  id: string;
  label: string;
  method: "VISUAL" | "DICOBA";
};

const inspectionData: Record<string, { title: string; imageKey?: string; subItems: SubItem[] }> = {
  "1": {
    title: "PONDASI / BAUT PENGIKAT",
    imageKey: "pondasi",
    subItems: [
      { id: "1A", label: "KOROSI", method: "VISUAL" },
      { id: "1B", label: "KERETAKAN", method: "VISUAL" },
      { id: "1C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
    ],
  },
  "2": {
    title: "KOLOM / RANGKA",
    imageKey: "kolom-rangka",
    subItems: [
      { id: "2A", label: "KOROSI", method: "VISUAL" },
      { id: "2B", label: "KERETAKAN", method: "VISUAL" },
      { id: "2C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "2D", label: "PENGIKATAN", method: "VISUAL" },
      { id: "2E", label: "PENGUAT", method: "VISUAL" },
      { id: "2F", label: "MELINTANG", method: "VISUAL" },
    ],
  },
  "3": {
    title: "SANGKAR",
    imageKey: "sangkar",
    subItems: [
      { id: "3A", label: "PAGAR PENGAMANAN", method: "VISUAL" },
      { id: "3B", label: "PINTU", method: "VISUAL" },
      { id: "3C", label: "LANTAI KERJA", method: "VISUAL" },
      { id: "3D", label: "PENGUNCI PINTU", method: "VISUAL" },
      { id: "3E", label: "PENERANGAN", method: "DICOBA" },
      { id: "3F", label: "SIRINE / ROTARY LAMP SIGNAL", method: "DICOBA" },
      { id: "3G", label: "TANDA BATAS MAKSIMUM PENGANGKATAN", method: "VISUAL" },
      { id: "3H", label: "TANDA PENGOPERASIAN", method: "VISUAL" },
      { id: "3I", label: "KEBERSIHAN SANGKAR", method: "VISUAL" },
    ],
  },
  "4": {
    title: "BEAM DUDUKAN MOTOR HOIST",
    imageKey: "beam-dudukan-motor-hoist",
    subItems: [
      { id: "4A", label: "KOROSI", method: "VISUAL" },
      { id: "4B", label: "KERETAKAN", method: "VISUAL" },
      { id: "4C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "4D", label: "PENGIKATAN", method: "VISUAL" },
    ],
  },
  "5": {
    title: "REL PEMANDU",
    imageKey: "rel-pemandu",
    subItems: [
      { id: "5A", label: "KOROSI", method: "VISUAL" },
      { id: "5B", label: "KERETAKAN", method: "VISUAL" },
      { id: "5C", label: "SAMBU NGAN REL", method: "VISUAL" },
      { id: "5D", label: "KELURUSAN REL", method: "VISUAL" },
      { id: "5F", label: "KERATAAN REL", method: "VISUAL" },
    ],
  },
  "6": {
    title: "RODA PENGGERAK (NAIK - TURUN)",
    imageKey: "roda-penggerak",
    subItems: [
      { id: "6A", label: "KEAUSAN", method: "VISUAL" },
      { id: "6B", label: "KERETAKAN", method: "VISUAL" },
      { id: "6C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "6D", label: "KONDISI BEARING", method: "VISUAL" },
    ],
  },
  "7": {
    title: "RODA IDLE",
    imageKey: "roda-idle",
    subItems: [
      { id: "7A", label: "KEAUSAN", method: "VISUAL" },
      { id: "7B", label: "KERETAKAN", method: "VISUAL" },
      { id: "7C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "7D", label: "KONDISI FLENS", method: "VISUAL" },
    ],
  },
  "8": {
    title: "PEREDAM / PENYANGGA",
    imageKey: "peredam-penyangga",
    subItems: [
      { id: "8A", label: "BANTALAN KARET", method: "VISUAL" },
      { id: "8B", label: "LAYAK DIPAKAI", method: "VISUAL" },
      { id: "8C", label: "SESUAI DI LAYOUT", method: "VISUAL" },
    ],
  },
  "9": {
    title: "MOTOR HOIST & GEAR BOX",
    imageKey: "motor-hoist-gear-box",
    subItems: [
      { id: "9A", label: "KEAUSAN", method: "VISUAL" },
      { id: "9B", label: "PENYETELAN", method: "VISUAL" },
    ],
  },
  "10": {
    title: "PULLY / CAKRA (UTAMA, TAMBAHAN, PENGHANTAR)",
    imageKey: "pully-cahra",
    subItems: [
      { id: "10A", label: "ALUR PULLY", method: "VISUAL" },
      { id: "10B", label: "BIBIR PULLY", method: "VISUAL" },
      { id: "10C", label: "PIN PULLY", method: "VISUAL" },
      { id: "10D", label: "BANTALAN PULLY", method: "VISUAL" },
      { id: "10E", label: "PELINDUNG PULLY", method: "VISUAL" },
      { id: "10F", label: "PENGHADANG TALI KAWAT BAJA", method: "VISUAL" },
    ],
  },
  "11": {
    title: "KAIT UTAMA",
    imageKey: "kait-utama",
    subItems: [
      { id: "11A", label: "KEAUSAN", method: "VISUAL" },
      { id: "11B", label: "KERENGGANGAN MULUT KAIT", method: "VISUAL" },
      { id: "11C", label: "MUR DAN BANTALAN PUTAR (SWIFEL)", method: "VISUAL" },
      { id: "11D", label: "TRUNION", method: "VISUAL" },
      { id: "11E", label: "KUNCI KAIT", method: "VISUAL" },
      { id: "11F", label: "KERETAKAN HOOK", method: "VISUAL" },
    ],
  },
  "12": {
    title: "TALI KABEL BAJA",
    imageKey: "tali-kabel-baja",
    subItems: [
      { id: "12A", label: "KOROSI", method: "VISUAL" },
      { id: "12B", label: "KEAUSAN", method: "VISUAL" },
      { id: "12C", label: "PUTUS", method: "VISUAL" },
    ],
  },
  "13": {
    title: "TOMBOL PUSH BUTTON",
    imageKey: "tombol-push-button",
    subItems: [
      { id: "13A", label: "TOMBOL ANGKAT (GERAKAN ANGKAT)", method: "DICOBA" },
      { id: "13B", label: "TOMBOL TURUN (GERAKAN PENURUNAN)", method: "DICOBA" },
      { id: "13C", label: "TOMBOL EMERGENCY STOP", method: "DICOBA" },
      { id: "13D", label: "TANDA-TANDA PENGOPERASIAN", method: "VISUAL" },
    ],
  },
  "14": {
    title: "SAFETY DEVICE",
    imageKey: "safety-device",
    subItems: [
      { id: "14A", label: "LIMIT SWITCH PINTU", method: "DICOBA" },
      { id: "14B", label: "LIMIT SWITCH PENGAMAN", method: "DICOBA" },
      { id: "14C", label: "LIMIT SWITCH FINAL UP/DOWN", method: "DICOBA" },
      { id: "14D", label: "LIMIT SWITCH UP", method: "DICOBA" },
      { id: "14E", label: "LIMIT SWITCH DOWN", method: "DICOBA" },
      { id: "14F", label: "EMERGENCY STOP", method: "DICOBA" },
      { id: "14G", label: "DROP SAFETY DEVICE / SAFETY LATCH", method: "DICOBA" },
    ],
  },
  "15": {
    title: "KOMPONEN LISTRIK",
    imageKey: "komponen-listrik",
    subItems: [
      { id: "15A", label: "PENYAMBUNG PENGHANTAR PANEL", method: "VISUAL" },
      { id: "15B", label: "PELINDUNG PENGHANTAR", method: "VISUAL" },
      { id: "15C", label: "SISTEM PENGAMAN INSTALASI DARI MOTOR", method: "VISUAL" },
      { id: "15D", label: "INSTALASI", method: "VISUAL" },
      { id: "15E", label: "KUNCI PANEL", method: "VISUAL" },
    ],
  },
  "16": {
    title: "KETERSEDIAAN APAR DI DEKAT LIFT",
    imageKey: "apar",
    subItems: [{ id: "16A", label: "ALAT PEMADAM API RINGAN (APAR)", method: "VISUAL" }],
  },
};

type FormData = Record<
  string,
  {
    status: "OK" | "NG";
    keterangan?: string;
    solusi?: string;
    image?: File | null;
  }
>;

export default function InspeksiFormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const itemId = typeof params?.itemId === "string" ? params.itemId : "";
  const viewId = searchParams.get("view"); // Ambil ID riwayat dari query string

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

  const item = inspectionData[itemId];
  if (!item) {
    return <div>Item tidak ditemukan</div>;
  }

  const [formData, setFormData] = useState<FormData>({});
  const [isViewMode, setIsViewMode] = useState(false);

  // Load data riwayat jika ada parameter view
  useEffect(() => {
    if (viewId) {
      setIsViewMode(true);
      const itemHistoryKey = `inspeksi_lift_barang_history_${itemId}`;
      const saved = localStorage.getItem(itemHistoryKey);
      if (saved) {
        try {
          const history = JSON.parse(saved);
          const entry = history.find((e: any) => e.id === viewId);
          if (entry) {
            setFormData(entry.data);
          }
        } catch (e) {
          console.error("Gagal load data riwayat", e);
        }
      }
    }
  }, [viewId, itemId]);

  const handleStatusChange = (subId: string, status: "OK" | "NG") => {
    if (isViewMode) return; // Nonaktifkan di mode view
    setFormData((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        status,
        keterangan: status === "OK" ? undefined : prev[subId]?.keterangan || "",
        solusi: status === "OK" ? undefined : prev[subId]?.solusi || "",
      },
    }));
  };

  const handleInputChange = (subId: string, field: "keterangan" | "solusi", value: string) => {
    if (isViewMode) return; // Nonaktifkan di mode view
    setFormData((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: value },
    }));
  };

  const handleImageChange = (subId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return; // Nonaktifkan di mode view
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], image: file },
    }));
  };

  const handleSubmit = () => {
  if (isViewMode) return;

  for (const sub of item.subItems) {
    const entry = formData[sub.id];
    if (entry?.status === "NG") {
      if (!entry.keterangan?.trim() || !entry.solusi?.trim()) {
        alert("❗ Untuk kondisi NG, keterangan dan solusi wajib diisi.");
        return;
      }
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const timestamp = Date.now();
  const result = {
    id: `${itemId}-${timestamp}`, // ← Pastikan ada properti "id"
    itemId,
    date: today,
    inspector: user.fullName,
    data: formData,
  };

  // Simpan ke localStorage per item
  const itemHistoryKey = `inspeksi_lift_barang_history_${itemId}`;
  const existingHistory = JSON.parse(localStorage.getItem(itemHistoryKey) || "[]");
  localStorage.setItem(itemHistoryKey, JSON.stringify([...existingHistory, result]));

  alert("✅ Data berhasil disimpan!");
  router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi");
};

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali ke Daftar
        </button>

        <h1>
          {isViewMode ? "👁️‍🗨️ Detail Riwayat: " : "📋 Inspeksi: "}
          {item.title}
        </h1>
        
        {item.imageKey && (
          <div className="ref-image">
            <img
              src={`/images/lift-barang/${item.imageKey}.${item.imageKey === "tali-kabel-baja" ? "png" : "jpg"}`}
              alt={item.title}
            />
            <p><em>Gambar referensi</em></p>
          </div>
        )}

        <table className="form-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Sub-Item</th>
              <th>Metode</th>
              <th>Status</th>
              {!isViewMode && <th>Keterangan (jika NG)</th>}
              {!isViewMode && <th>Solusi (jika NG)</th>}
              {!isViewMode && <th>Foto Hasil</th>}
              {isViewMode && <th>Keterangan & Solusi</th>}
            </tr>
          </thead>
          <tbody>
            {item.subItems.map((sub, idx) => {
              const entry = formData[sub.id];
              return (
                <tr key={sub.id}>
                  <td>{String.fromCharCode(65 + idx)}.</td>
                  <td>{sub.label}</td>
                  <td>{sub.method}</td>
                  <td>
                    {isViewMode ? (
                      <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                        {entry?.status || "-"}
                      </span>
                    ) : (
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name={`status-${sub.id}`}
                            checked={entry?.status === "OK"}
                            onChange={() => handleStatusChange(sub.id, "OK")}
                            disabled={isViewMode}
                          /> OK
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${sub.id}`}
                            checked={entry?.status === "NG"}
                            onChange={() => handleStatusChange(sub.id, "NG")}
                            disabled={isViewMode}
                          /> NG
                        </label>
                      </div>
                    )}
                  </td>
                  
                  {!isViewMode && (
                    <>
                      <td>
                        {entry?.status === "NG" && (
                          <textarea
                            placeholder="Jelaskan kondisi NG..."
                            value={entry.keterangan || ""}
                            onChange={(e) => handleInputChange(sub.id, "keterangan", e.target.value)}
                            className="text-input"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td>
                        {entry?.status === "NG" && (
                          <textarea
                            placeholder="Usulan solusi/perbaikan..."
                            value={entry.solusi || ""}
                            onChange={(e) => handleInputChange(sub.id, "solusi", e.target.value)}
                            className="text-input"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(sub.id, e)}
                          disabled={isViewMode}
                        />
                      </td>
                    </>
                  )}
                  
                  {isViewMode && (
                    <td>
                      {entry?.status === "NG" ? (
                        <div>
                          <div><strong>Keterangan:</strong> {entry.keterangan || "-"}</div>
                          <div><strong>Solusi:</strong> {entry.solusi || "-"}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isViewMode && (
          <div className="actions">
            <button onClick={handleSubmit} className="btn-primary">Simpan Hasil</button>
          </div>
        )}
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
        h1 {
          color: #0d47a1;
          margin: 16px 0 24px 0;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .ref-image {
          text-align: center;
          margin: 24px 0;
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-radius: 12px;
          border: 1px solid #bbdefb;
        }
        .ref-image img {
          max-height: 280px;
          border: 2px solid #90caf9;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
        }
        .ref-image p {
          color: #512da8;
          margin: 0;
          font-weight: 500;
        }
        .form-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .form-table th,
        .form-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        .form-table th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }
        .form-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .form-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .radio-group {
          display: flex;
          gap: 20px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #424242;
          cursor: pointer;
        }
        .radio-group input[type="radio"] {
          cursor: pointer;
          width: 20px;
          height: 20px;
          accent-color: #1e88e5;
        }
        .text-input {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          color: #333;
          transition: all 0.3s ease;
        }
        .text-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }
        .text-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #999;
        }
        input[type="file"] {
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
        }
        input[type="file"]:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .actions {
          margin-top: 32px;
          text-align: right;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-primary {
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
        .btn-primary:hover {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.35);
          transform: translateY(-2px);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .status-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .status-ng {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
=======
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

type SubItem = {
  id: string;
  label: string;
  method: "VISUAL" | "DICOBA";
};

const inspectionData: Record<string, { title: string; imageKey?: string; subItems: SubItem[] }> = {
  "1": {
    title: "PONDASI / BAUT PENGIKAT",
    imageKey: "pondasi",
    subItems: [
      { id: "1A", label: "KOROSI", method: "VISUAL" },
      { id: "1B", label: "KERETAKAN", method: "VISUAL" },
      { id: "1C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
    ],
  },
  "2": {
    title: "KOLOM / RANGKA",
    imageKey: "kolom-rangka",
    subItems: [
      { id: "2A", label: "KOROSI", method: "VISUAL" },
      { id: "2B", label: "KERETAKAN", method: "VISUAL" },
      { id: "2C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "2D", label: "PENGIKATAN", method: "VISUAL" },
      { id: "2E", label: "PENGUAT", method: "VISUAL" },
      { id: "2F", label: "MELINTANG", method: "VISUAL" },
    ],
  },
  "3": {
    title: "SANGKAR",
    imageKey: "sangkar",
    subItems: [
      { id: "3A", label: "PAGAR PENGAMANAN", method: "VISUAL" },
      { id: "3B", label: "PINTU", method: "VISUAL" },
      { id: "3C", label: "LANTAI KERJA", method: "VISUAL" },
      { id: "3D", label: "PENGUNCI PINTU", method: "VISUAL" },
      { id: "3E", label: "PENERANGAN", method: "DICOBA" },
      { id: "3F", label: "SIRINE / ROTARY LAMP SIGNAL", method: "DICOBA" },
      { id: "3G", label: "TANDA BATAS MAKSIMUM PENGANGKATAN", method: "VISUAL" },
      { id: "3H", label: "TANDA PENGOPERASIAN", method: "VISUAL" },
      { id: "3I", label: "KEBERSIHAN SANGKAR", method: "VISUAL" },
    ],
  },
  "4": {
    title: "BEAM DUDUKAN MOTOR HOIST",
    imageKey: "beam-dudukan-motor-hoist",
    subItems: [
      { id: "4A", label: "KOROSI", method: "VISUAL" },
      { id: "4B", label: "KERETAKAN", method: "VISUAL" },
      { id: "4C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "4D", label: "PENGIKATAN", method: "VISUAL" },
    ],
  },
  "5": {
    title: "REL PEMANDU",
    imageKey: "rel-pemandu",
    subItems: [
      { id: "5A", label: "KOROSI", method: "VISUAL" },
      { id: "5B", label: "KERETAKAN", method: "VISUAL" },
      { id: "5C", label: "SAMBU NGAN REL", method: "VISUAL" },
      { id: "5D", label: "KELURUSAN REL", method: "VISUAL" },
      { id: "5F", label: "KERATAAN REL", method: "VISUAL" },
    ],
  },
  "6": {
    title: "RODA PENGGERAK (NAIK - TURUN)",
    imageKey: "roda-penggerak",
    subItems: [
      { id: "6A", label: "KEAUSAN", method: "VISUAL" },
      { id: "6B", label: "KERETAKAN", method: "VISUAL" },
      { id: "6C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "6D", label: "KONDISI BEARING", method: "VISUAL" },
    ],
  },
  "7": {
    title: "RODA IDLE",
    imageKey: "roda-idle",
    subItems: [
      { id: "7A", label: "KEAUSAN", method: "VISUAL" },
      { id: "7B", label: "KERETAKAN", method: "VISUAL" },
      { id: "7C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "7D", label: "KONDISI FLENS", method: "VISUAL" },
    ],
  },
  "8": {
    title: "PEREDAM / PENYANGGA",
    imageKey: "peredam-penyangga",
    subItems: [
      { id: "8A", label: "BANTALAN KARET", method: "VISUAL" },
      { id: "8B", label: "LAYAK DIPAKAI", method: "VISUAL" },
      { id: "8C", label: "SESUAI DI LAYOUT", method: "VISUAL" },
    ],
  },
  "9": {
    title: "MOTOR HOIST & GEAR BOX",
    imageKey: "motor-hoist-gear-box",
    subItems: [
      { id: "9A", label: "KEAUSAN", method: "VISUAL" },
      { id: "9B", label: "PENYETELAN", method: "VISUAL" },
    ],
  },
  "10": {
    title: "PULLY / CAKRA (UTAMA, TAMBAHAN, PENGHANTAR)",
    imageKey: "pully-cahra",
    subItems: [
      { id: "10A", label: "ALUR PULLY", method: "VISUAL" },
      { id: "10B", label: "BIBIR PULLY", method: "VISUAL" },
      { id: "10C", label: "PIN PULLY", method: "VISUAL" },
      { id: "10D", label: "BANTALAN PULLY", method: "VISUAL" },
      { id: "10E", label: "PELINDUNG PULLY", method: "VISUAL" },
      { id: "10F", label: "PENGHADANG TALI KAWAT BAJA", method: "VISUAL" },
    ],
  },
  "11": {
    title: "KAIT UTAMA",
    imageKey: "kait-utama",
    subItems: [
      { id: "11A", label: "KEAUSAN", method: "VISUAL" },
      { id: "11B", label: "KERENGGANGAN MULUT KAIT", method: "VISUAL" },
      { id: "11C", label: "MUR DAN BANTALAN PUTAR (SWIFEL)", method: "VISUAL" },
      { id: "11D", label: "TRUNION", method: "VISUAL" },
      { id: "11E", label: "KUNCI KAIT", method: "VISUAL" },
      { id: "11F", label: "KERETAKAN HOOK", method: "VISUAL" },
    ],
  },
  "12": {
    title: "TALI KABEL BAJA",
    imageKey: "tali-kabel-baja",
    subItems: [
      { id: "12A", label: "KOROSI", method: "VISUAL" },
      { id: "12B", label: "KEAUSAN", method: "VISUAL" },
      { id: "12C", label: "PUTUS", method: "VISUAL" },
    ],
  },
  "13": {
    title: "TOMBOL PUSH BUTTON",
    imageKey: "tombol-push-button",
    subItems: [
      { id: "13A", label: "TOMBOL ANGKAT (GERAKAN ANGKAT)", method: "DICOBA" },
      { id: "13B", label: "TOMBOL TURUN (GERAKAN PENURUNAN)", method: "DICOBA" },
      { id: "13C", label: "TOMBOL EMERGENCY STOP", method: "DICOBA" },
      { id: "13D", label: "TANDA-TANDA PENGOPERASIAN", method: "VISUAL" },
    ],
  },
  "14": {
    title: "SAFETY DEVICE",
    imageKey: "safety-device",
    subItems: [
      { id: "14A", label: "LIMIT SWITCH PINTU", method: "DICOBA" },
      { id: "14B", label: "LIMIT SWITCH PENGAMAN", method: "DICOBA" },
      { id: "14C", label: "LIMIT SWITCH FINAL UP/DOWN", method: "DICOBA" },
      { id: "14D", label: "LIMIT SWITCH UP", method: "DICOBA" },
      { id: "14E", label: "LIMIT SWITCH DOWN", method: "DICOBA" },
      { id: "14F", label: "EMERGENCY STOP", method: "DICOBA" },
      { id: "14G", label: "DROP SAFETY DEVICE / SAFETY LATCH", method: "DICOBA" },
    ],
  },
  "15": {
    title: "KOMPONEN LISTRIK",
    imageKey: "komponen-listrik",
    subItems: [
      { id: "15A", label: "PENYAMBUNG PENGHANTAR PANEL", method: "VISUAL" },
      { id: "15B", label: "PELINDUNG PENGHANTAR", method: "VISUAL" },
      { id: "15C", label: "SISTEM PENGAMAN INSTALASI DARI MOTOR", method: "VISUAL" },
      { id: "15D", label: "INSTALASI", method: "VISUAL" },
      { id: "15E", label: "KUNCI PANEL", method: "VISUAL" },
    ],
  },
  "16": {
    title: "KETERSEDIAAN APAR DI DEKAT LIFT",
    imageKey: "apar",
    subItems: [{ id: "16A", label: "ALAT PEMADAM API RINGAN (APAR)", method: "VISUAL" }],
  },
};

type FormData = Record<
  string,
  {
    status: "OK" | "NG";
    keterangan?: string;
    solusi?: string;
    image?: File | null;
  }
>;

export default function InspeksiFormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const itemId = typeof params?.itemId === "string" ? params.itemId : "";
  const viewId = searchParams.get("view"); // Ambil ID riwayat dari query string

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

  const item = inspectionData[itemId];
  if (!item) {
    return <div>Item tidak ditemukan</div>;
  }

  const [formData, setFormData] = useState<FormData>({});
  const [isViewMode, setIsViewMode] = useState(false);

  // Load data riwayat jika ada parameter view
  useEffect(() => {
    if (viewId) {
      setIsViewMode(true);
      const itemHistoryKey = `inspeksi_lift_barang_history_${itemId}`;
      const saved = localStorage.getItem(itemHistoryKey);
      if (saved) {
        try {
          const history = JSON.parse(saved);
          const entry = history.find((e: any) => e.id === viewId);
          if (entry) {
            setFormData(entry.data);
          }
        } catch (e) {
          console.error("Gagal load data riwayat", e);
        }
      }
    }
  }, [viewId, itemId]);

  const handleStatusChange = (subId: string, status: "OK" | "NG") => {
    if (isViewMode) return; // Nonaktifkan di mode view
    setFormData((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        status,
        keterangan: status === "OK" ? undefined : prev[subId]?.keterangan || "",
        solusi: status === "OK" ? undefined : prev[subId]?.solusi || "",
      },
    }));
  };

  const handleInputChange = (subId: string, field: "keterangan" | "solusi", value: string) => {
    if (isViewMode) return; // Nonaktifkan di mode view
    setFormData((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: value },
    }));
  };

  const handleImageChange = (subId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return; // Nonaktifkan di mode view
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], image: file },
    }));
  };

  const handleSubmit = () => {
  if (isViewMode) return;

  for (const sub of item.subItems) {
    const entry = formData[sub.id];
    if (entry?.status === "NG") {
      if (!entry.keterangan?.trim() || !entry.solusi?.trim()) {
        alert("❗ Untuk kondisi NG, keterangan dan solusi wajib diisi.");
        return;
      }
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const timestamp = Date.now();
  const result = {
    id: `${itemId}-${timestamp}`, // ← Pastikan ada properti "id"
    itemId,
    date: today,
    inspector: user.fullName,
    data: formData,
  };

  // Simpan ke localStorage per item
  const itemHistoryKey = `inspeksi_lift_barang_history_${itemId}`;
  const existingHistory = JSON.parse(localStorage.getItem(itemHistoryKey) || "[]");
  localStorage.setItem(itemHistoryKey, JSON.stringify([...existingHistory, result]));

  alert("✅ Data berhasil disimpan!");
  router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi");
};

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali ke Daftar
        </button>

        <h1>
          {isViewMode ? "👁️‍🗨️ Detail Riwayat: " : "📋 Inspeksi: "}
          {item.title}
        </h1>
        
        {item.imageKey && (
          <div className="ref-image">
            <img
              src={`/images/lift-barang/${item.imageKey}.${item.imageKey === "tali-kabel-baja" ? "png" : "jpg"}`}
              alt={item.title}
            />
            <p><em>Gambar referensi</em></p>
          </div>
        )}

        <table className="form-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Sub-Item</th>
              <th>Metode</th>
              <th>Status</th>
              {!isViewMode && <th>Keterangan (jika NG)</th>}
              {!isViewMode && <th>Solusi (jika NG)</th>}
              {!isViewMode && <th>Foto Hasil</th>}
              {isViewMode && <th>Keterangan & Solusi</th>}
            </tr>
          </thead>
          <tbody>
            {item.subItems.map((sub, idx) => {
              const entry = formData[sub.id];
              return (
                <tr key={sub.id}>
                  <td>{String.fromCharCode(65 + idx)}.</td>
                  <td>{sub.label}</td>
                  <td>{sub.method}</td>
                  <td>
                    {isViewMode ? (
                      <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                        {entry?.status || "-"}
                      </span>
                    ) : (
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name={`status-${sub.id}`}
                            checked={entry?.status === "OK"}
                            onChange={() => handleStatusChange(sub.id, "OK")}
                            disabled={isViewMode}
                          /> OK
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`status-${sub.id}`}
                            checked={entry?.status === "NG"}
                            onChange={() => handleStatusChange(sub.id, "NG")}
                            disabled={isViewMode}
                          /> NG
                        </label>
                      </div>
                    )}
                  </td>
                  
                  {!isViewMode && (
                    <>
                      <td>
                        {entry?.status === "NG" && (
                          <textarea
                            placeholder="Jelaskan kondisi NG..."
                            value={entry.keterangan || ""}
                            onChange={(e) => handleInputChange(sub.id, "keterangan", e.target.value)}
                            className="text-input"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td>
                        {entry?.status === "NG" && (
                          <textarea
                            placeholder="Usulan solusi/perbaikan..."
                            value={entry.solusi || ""}
                            onChange={(e) => handleInputChange(sub.id, "solusi", e.target.value)}
                            className="text-input"
                            disabled={isViewMode}
                          />
                        )}
                      </td>
                      <td>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageChange(sub.id, e)}
                          disabled={isViewMode}
                        />
                      </td>
                    </>
                  )}
                  
                  {isViewMode && (
                    <td>
                      {entry?.status === "NG" ? (
                        <div>
                          <div><strong>Keterangan:</strong> {entry.keterangan || "-"}</div>
                          <div><strong>Solusi:</strong> {entry.solusi || "-"}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isViewMode && (
          <div className="actions">
            <button onClick={handleSubmit} className="btn-primary">Simpan Hasil</button>
          </div>
        )}
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
        h1 {
          color: #0d47a1;
          margin: 16px 0 24px 0;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .ref-image {
          text-align: center;
          margin: 24px 0;
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-radius: 12px;
          border: 1px solid #bbdefb;
        }
        .ref-image img {
          max-height: 280px;
          border: 2px solid #90caf9;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
        }
        .ref-image p {
          color: #512da8;
          margin: 0;
          font-weight: 500;
        }
        .form-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .form-table th,
        .form-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        .form-table th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }
        .form-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .form-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .radio-group {
          display: flex;
          gap: 20px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #424242;
          cursor: pointer;
        }
        .radio-group input[type="radio"] {
          cursor: pointer;
          width: 20px;
          height: 20px;
          accent-color: #1e88e5;
        }
        .text-input {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          color: #333;
          transition: all 0.3s ease;
        }
        .text-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }
        .text-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #999;
        }
        input[type="file"] {
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
        }
        input[type="file"]:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .actions {
          margin-top: 32px;
          text-align: right;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-primary {
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
        .btn-primary:hover {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.35);
          transform: translateY(-2px);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .status-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .status-ng {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
>>>>>>> 4e122d36b5329b903ff02db0e1e9cdbcb4134941
