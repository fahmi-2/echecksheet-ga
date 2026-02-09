"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

export default function PintuDaruratChecklist() {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const date = today;

  const locations = [
    { no: 1, lokasi: "Auditorium" },
    { no: 2, lokasi: "Training Room" },
    { no: 3, lokasi: "CNC Room" },
    { no: 4, lokasi: "Gel sheet" },
    { no: 5, lokasi: "Genba B" },
  ];

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  useEffect(() => {
    const initialItems = locations.map((loc) => ({
      no: loc.no,
      lokasi: loc.lokasi,
      kondisiPintu: "",
      areaSekitar: "",
      paluAlatBantu: "",
      identitasPintu: "",
      idPeringatan: "",
      doorCloser: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "", // ✅ otomatis isi nama
      foto: "", // ✅ tambahkan foto
    }));
    setItems(initialItems);
  }, [user]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // ✅ Handle upload gambar
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(index, "foto", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ Fungsi OK All - Mengisi semua item dengan status OK
  const handleOkAll = () => {
    if (!confirm("Apakah Anda yakin ingin mengisi semua item dengan status OK?")) {
      return;
    }

    const updatedItems = items.map(item => ({
      ...item,
      kondisiPintu: "OK",
      areaSekitar: "OK",
      paluAlatBantu: "OK",
      identitasPintu: "OK",
      idPeringatan: "OK",
      doorCloser: "OK",
      keterangan: "", // Kosongkan keterangan karena OK
      tindakanPerbaikan: "" // Kosongkan tindakan perbaikan karena OK
    }));

    setItems(updatedItems);
    alert("✅ Semua item telah diisi dengan status OK!");
  };

  const handleShowPreview = () => {
    for (const item of items) {
      if (
        !item.kondisiPintu ||
        !item.areaSekitar ||
        !item.paluAlatBantu ||
        !item.identitasPintu ||
        !item.idPeringatan ||
        !item.doorCloser
      ) {
        alert("⚠️ Semua kolom status harus diisi!");
        return;
      }
    }

    const ngExists = items.some(
      (item) =>
        item.kondisiPintu === "NG" ||
        item.areaSekitar === "NG" ||
        item.paluAlatBantu === "NG" ||
        item.identitasPintu === "NG" ||
        item.idPeringatan === "NG" ||
        item.doorCloser === "NG"
    );

    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          (item.kondisiPintu === "NG" ||
            item.areaSekitar === "NG" ||
            item.paluAlatBantu === "NG" ||
            item.identitasPintu === "NG" ||
            item.idPeringatan === "NG" ||
            item.doorCloser === "NG") &&
          (!item.keterangan || item.keterangan.trim() === "")
      );
      if (missingKeterangan) {
        alert("⚠️ Harap isi kolom 'Keterangan' untuk semua item yang berstatus NG!");
        return;
      }
    }

    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleSave = async () => {
  setIsSubmitting(true);
  
  try {
    // ✅ Validasi semua item harus diisi
    const hasEmpty = items.some(item => {
      return !item.kondisiPintu || !item.areaSekitar || !item.paluAlatBantu || 
             !item.identitasPintu || !item.idPeringatan || !item.doorCloser;
    });
    
    if (hasEmpty) {
      alert('❌ Semua kolom wajib diisi untuk setiap item!');
      setIsSubmitting(false);
      return;
    }

    // ✅ Kirim ke API PostgreSQL
    const response = await fetch('/api/pintu-darurat/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        checker: user?.fullName || '',
        nik: user?.nik || '',
        department: user?.department || '',
        items
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan data');
    }

    alert('✅ Data berhasil disimpan!');
    
    // ✅ LANGSUNG REDIRECT KE RIWAYAT SETELAH SIMPAN
    router.push('/status-ga/exit-lamp-pintu-darurat/riwayat/pintu-darurat');

  } catch (error) {
    console.error('Submit error:', error);
    alert(`❌ ${(error as Error).message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleReportNg = () => {
    const ngItems = items
      .filter(
        (item) =>
          item.kondisiPintu === "NG" ||
          item.areaSekitar === "NG" ||
          item.paluAlatBantu === "NG" ||
          item.identitasPintu === "NG" ||
          item.idPeringatan === "NG" ||
          item.doorCloser === "NG"
      )
      .map((item) => ({
        name: item.lokasi,
        notes: item.keterangan || "Tidak ada keterangan",
        foto: item.foto || undefined, // ✅ sertakan foto
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: "Pintu Darurat",
      shift: "A",
      ngNotes: "Temuan NG dari checklist Pintu Darurat",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
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
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-top">
            <button onClick={() => router.back()} className="btn-back">← Kembali</button>
            <h1 className="page-title">🚪 Pintu Darurat</h1>
          </div>
          <p className="subtitle">
            📅{" "}
            <span className="date-text">
              {new Date(date).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        {!showPreview ? (
          <div className="card-container">
            {/* Tombol OK All */}
            <div className="quick-actions">
              <button onClick={handleOkAll} className="btn-ok-all">
                ✅ OK All (Isi Semua dengan OK)
              </button>
            </div>

            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Lokasi</th>
                  <th>Kondisi Pintu</th>
                  <th>Area Sekitar</th>
                  <th>Palu/Alat Bantu</th>
                  <th>Identitas Pintu</th>
                  <th>ID Peringatan</th>
                  <th>Door Closer</th>
                  <th>Keterangan N-OK</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="info-cell">{item.no}</td>
                    <td className="info-cell">{item.lokasi}</td>
                    <td>
                      <select
                        value={item.kondisiPintu}
                        onChange={(e) => handleInputChange(index, "kondisiPintu", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.areaSekitar}
                        onChange={(e) => handleInputChange(index, "areaSekitar", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.paluAlatBantu}
                        onChange={(e) => handleInputChange(index, "paluAlatBantu", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.identitasPintu}
                        onChange={(e) => handleInputChange(index, "identitasPintu", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.idPeringatan}
                        onChange={(e) => handleInputChange(index, "idPeringatan", e.target.value)}
                        className="status-select"
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.doorCloser}
                        onChange={(e) => handleInputChange(index, "doorCloser", e.target.value)}
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
                        placeholder="Wajib diisi jika NG"
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
                      <div className="info-cell">{item.pic}</div>
                    </td>
                    <td>
                      <div className="image-upload">
                        {item.foto ? (
                          <div className="image-preview">
                            <img src={item.foto} alt="Preview" className="uploaded-image" />
                            <button
                              type="button"
                              onClick={() => handleInputChange(index, "foto", "")}
                              className="remove-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="file-label">
                            📷 Unggah
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              className="file-input"
                            />
                          </label>
                        )}
                      </div>
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
          <div className="card-container preview-mode">
            <h2 className="preview-title">🔍 Preview Data</h2>
            <div className="preview-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Lokasi</th>
                    <th>Kondisi Pintu</th>
                    <th>Area Sekitar</th>
                    <th>Palu/Alat Bantu</th>
                    <th>Identitas Pintu</th>
                    <th>ID Peringatan</th>
                    <th>Door Closer</th>
                    <th>Keterangan</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td className={item.kondisiPintu === "NG" ? "status-ng" : ""}>
                        {item.kondisiPintu}
                      </td>
                      <td className={item.areaSekitar === "NG" ? "status-ng" : ""}>
                        {item.areaSekitar}
                      </td>
                      <td className={item.paluAlatBantu === "NG" ? "status-ng" : ""}>
                        {item.paluAlatBantu}
                      </td>
                      <td className={item.identitasPintu === "NG" ? "status-ng" : ""}>
                        {item.identitasPintu}
                      </td>
                      <td className={item.idPeringatan === "NG" ? "status-ng" : ""}>
                        {item.idPeringatan}
                      </td>
                      <td className={item.doorCloser === "NG" ? "status-ng" : ""}>
                        {item.doorCloser}
                      </td>
                      <td>{item.keterangan || "-"}</td>
                      <td>
                        {item.foto ? (
                          <img src={item.foto} alt="Foto" className="preview-image" />
                        ) : (
                          "–"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn" disabled={isSubmitting}>
                ← Kembali ke Form
              </button>
              {hasNg ? (
                <div className="ng-actions">
                  <button onClick={handleReportNg} className="report-btn" disabled={isSubmitting}>
                    📢 Laporkan ke Pelaporan NG
                  </button>
                  <button onClick={handleSave} className="save-btn" disabled={isSubmitting}>
                    {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Tanpa Lapor'}
                  </button>
                </div>
              ) : (
                <button onClick={handleSave} className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Data'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          color: #1e293b;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .page-title {
          margin: 0;
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .btn-back {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-text {
          font-weight: 700;
          font-size: 1.2rem;
          color: #ffeb3b;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 12px;
          border-radius: 8px;
          letter-spacing: 0.3px;
        }

        .card-container {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          padding: 24px;
          overflow-x: auto;
          color: white;
        }

        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* Quick Actions Section */
        .quick-actions {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-ok-all {
          padding: 12px 24px;
          background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-ok-all:hover {
          background: linear-gradient(135deg, #43a047 0%, #1b5e20 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        }

        .btn-ok-all:active {
          transform: translateY(0);
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          color: #333;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checklist-table th,
        .simple-table th {
          background: rgba(0, 0, 0, 0.15);
          font-weight: 600;
          position: sticky;
          top: 0;
          color: white;
        }

        .status-select,
        .notes-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
        }

        .status-select:focus,
        .notes-input:focus {
          outline: none;
          border-color: #4fc3f7;
          box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.3);
        }

        .info-cell {
          background: rgba(255, 255, 255, 0.4);
          color: white;
          font-weight: 500;
        }

        /* Upload & Preview Image */
        .image-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 40px;
        }

        .file-label {
          display: inline-block;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .file-label:hover {
          background: rgba(255, 255, 255, 1);
        }

        .file-input {
          display: none;
        }

        .image-preview {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .uploaded-image,
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #f44336;
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .form-actions,
        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-cancel,
        .btn-submit,
        .cancel-btn,
        .save-btn,
        .report-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .btn-cancel,
        .cancel-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-cancel:hover,
        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-submit {
          background: #4caf50;
          color: white;
        }

        .btn-submit:hover {
          background: #43a047;
        }

        .save-btn {
          background: #2e7d32;
          color: white;
        }

        .save-btn:hover {
          background: #1b5e20;
        }

        .report-btn {
          background: #d32f2f;
          color: white;
        }

        .report-btn:hover {
          background: #b71c1c;
        }

        .preview-title {
          margin: 0 0 24px;
          color: white;
          font-size: 1.5rem;
          text-align: center;
          font-weight: 700;
        }

        .status-ng {
          background: rgba(244, 67, 54, 0.2);
          color: #ffcdd2;
          font-weight: bold;
          border-radius: 4px;
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

          .form-actions,
          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .image-preview {
            width: 40px;
            height: 40px;
          }

          .quick-actions {
            justify-content: center;
          }

          .btn-ok-all {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}