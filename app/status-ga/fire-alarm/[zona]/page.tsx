// app/status-ga/fire-alarm/[zona]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

// Data lokasi per zona dari Excel
const locations = {
  "zona-1": [
    { no: 1, zona: "ZONA 1", lokasi: "LOBBY" },
    { no: 2, zona: "ZONA 1", lokasi: "HYDRANT MAIN OFFICE" },
  ],
  "zona-2": [{ no: 3, zona: "ZONA 2", lokasi: "EXIM" }],
  "zona-3": [
    { no: 4, zona: "ZONA 3", lokasi: "TOILET C (BLKG) GENBA A" },
    { no: 5, zona: "ZONA 3", lokasi: "REST AREA PINTU 8" },
    { no: 6, zona: "ZONA 3", lokasi: "MUSHOLLA TIMUR GENBA A" },
    { no: 7, zona: "ZONA 3", lokasi: "ANTARA PINTU 1 & 2 GENBA A" },
    { no: 8, zona: "ZONA 3", lokasi: "SAMPING KANAN PINTU 2" },
  ],
  "zona-4": [
    { no: 9, zona: "ZONA 4", lokasi: "DEPAN OFFICE WAREHOUSE" },
    { no: 10, zona: "ZONA 4", lokasi: "SAMPING LIFT BARANG WHS" },
    { no: 11, zona: "ZONA 4", lokasi: "USM AREA (SMPG PINTU 7)" },
  ],
  "zona-5": [
    { no: 12, zona: "ZONA 5", lokasi: "HYDRANT JIG PROTO" },
    { no: 13, zona: "ZONA 5", lokasi: "JIG PROTO ( TIANG SISI UTARA) NEW" },
    { no: 14, zona: "ZONA 5", lokasi: "DEPAN OFFICE JIG PROTO NEW" },
  ],
  "zona-6": [{ no: 15, zona: "ZONA 6", lokasi: "HYDRANT TRAINING" }],
  "zona-7": [
    { no: 16, zona: "ZONA 7", lokasi: "HYDRANT ANTARA PINTU 1 & 2 GENBA C" },
    { no: 17, zona: "ZONA 7", lokasi: "HYDRANT ANTARA PINTU 2 & 3 GENBA C" },
    { no: 18, zona: "ZONA 7", lokasi: "HYDRANT AREA C5 GENBA C" },
    { no: 19, zona: "ZONA 7", lokasi: "HYDRANT  AREA PREA ASSY GENBA C" },
    { no: 20, zona: "ZONA 7", lokasi: "DINDING SISI TIMUR TENGAH NEW" },
    { no: 21, zona: "ZONA 7", lokasi: "DINDING SISI BARAT TENGAH NEW" },
    { no: 22, zona: "ZONA 7", lokasi: "HYDRANT GELSHEET" },
  ],
  "zona-8": [{ no: 23, zona: "ZONA 8", lokasi: "PUMP ROOM" }],
  "zona-9": [
    { no: 24, zona: "ZONA 9", lokasi: "POWER HOUSE A" },
    { no: 25, zona: "ZONA 9", lokasi: "TPS B3" },
  ],
  "zona-10": [{ no: 26, zona: "ZONA 10", lokasi: "HYDRANT CANTEEN" }],
  "zona-11": [{ no: 27, zona: "ZONA 11", lokasi: "AUDITORIUM" }],
  "zona-12": [{ no: 28, zona: "ZONA 12", lokasi: "SAMPING PANEL GENBA B" }],
  "zona-13": [{ no: 29, zona: "ZONA 13", lokasi: "AREA TIMUR GENBA B" }],
  "zona-14": [
    { no: 30, zona: "ZONA 14", lokasi: "POWER HOUSE B" },
    { no: 31, zona: "ZONA 14", lokasi: "PARKIR BAWAH" },
    { no: 32, zona: "ZONA 14", lokasi: "PARKIR ATAS" },
  ],
  "zona-15": [
    { no: 33, zona: "ZONA 15", lokasi: "PREPARE BOX EXIM NEW" },
    { no: 34, zona: "ZONA 15", lokasi: "DEPAN OFFICE EXIM NEW" },
  ],
  "zona-20": [{ no: 35, zona: "ZONA 20", lokasi: "AXIS 8 - SELATAN PINTU 7 NEW" }],
  "zona-22": [{ no: 36, zona: "ZONA 22", lokasi: "NEW WAREHOUSE NEW" }],
  "zona-23": [
    { no: 37, zona: "ZONA 23", lokasi: "BAWAH MEZZANINE - MESIN CUTTING AC 90 TRX-02 NEW" },
    { no: 38, zona: "ZONA 23", lokasi: "DEPAN MINISTORE WAREHOUSE SISI SELATAN NEW" },
  ],
};

export default function FireAlarmChecklist({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const [loading, setLoading] = useState(false);

  const { zona } = use(params);
  const date = new Date().toISOString().split("T")[0];

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [tempPhotoPreviews, setTempPhotoPreviews] = useState<Record<number, string>>({});

  // Redirect jika bukan inspector-ga
  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  // Inisialisasi data checklist
  useEffect(() => {
    const locs = locations[zona as keyof typeof locations] || [];
    const initialItems = locs.map((loc) => ({
      no: loc.no,
      zona: loc.zona,
      lokasi: loc.lokasi,
      alarmBell: "",
      indicatorLamp: "",
      manualCallPoint: "",
      idZona: "",
      kebersihan: "",
      kondisiNok: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
  }, [zona, user]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // 🔥 UPLOAD FOTO KE API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Tampilkan preview langsung dari file
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoPreviews(prev => ({ ...prev, [index]: reader.result as string }));
      };
      reader.readAsDataURL(file);

      // Upload ke API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('zona', zona);
      formData.append('lokasi', items[index].lokasi);

      const response = await fetch('/api/fire-alarm/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // ✅ Update item dengan path file dari server
        handleInputChange(index, "foto", result.data.path);
        
        // ✅ Hapus temporary preview
        setTempPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
        
        alert('✅ Foto berhasil diupload!');
      } else {
        // ❌ Jika gagal upload, hapus temporary preview
        setTempPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
        alert('❌ Gagal upload foto: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Hapus temporary preview jika error
      setTempPhotoPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
      alert('❌ Terjadi kesalahan saat upload foto');
    } finally {
      setLoading(false);
      // Reset input file
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Hapus foto dari database jika sudah tersimpan
    const fotoPath = items[index].foto;
    if (fotoPath && !fotoPath.startsWith('data:')) {
      console.log('Foto akan dihapus saat submit:', fotoPath);
    }
    
    // Hapus foto path
    handleInputChange(index, "foto", "");
    
    // Hapus temporary preview jika ada
    setTempPhotoPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[index];
      return newPreviews;
    });
  };

  const handleShowPreview = () => {
    for (const item of items) {
      if (
        !item.alarmBell ||
        !item.indicatorLamp ||
        !item.manualCallPoint ||
        !item.idZona ||
        !item.kebersihan
      ) {
        alert("⚠️ Semua kolom status harus diisi!");
        return;
      }
    }

    const ngExists = items.some(
      (item) =>
        item.alarmBell === 'NG' ||
        item.indicatorLamp === 'NG' ||
        item.manualCallPoint === 'NG' ||
        item.idZona === 'NG' ||
        item.kebersihan === 'NG'
    );
    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  // 🔥 SIMPAN KE API
  const handleSave = async () => {
    try {
      setLoading(true);

      // Siapkan data untuk submit
      const submitData = {
        date,
        zona,
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: items.map(item => ({
          no: item.no,
          zona: item.zona,
          lokasi: item.lokasi,
          alarmBell: item.alarmBell,
          indicatorLamp: item.indicatorLamp,
          manualCallPoint: item.manualCallPoint,
          idZona: item.idZona,
          kebersihan: item.kebersihan,
          kondisiNok: item.kondisiNok || "",
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic,
          foto: item.foto || null // Path file atau null
        }))
      };

      const response = await fetch('/api/fire-alarm/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("✅ Data berhasil disimpan!");
        
        // Redirect ke riwayat
        router.push(`/status-ga/fire-alarm/riwayat/${zona}`);
      } else {
        alert("❌ Gagal menyimpan data: " + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert("❌ Terjadi kesalahan saat menyimpan data: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportNg = () => {
    const ngItems = items
      .filter(
        (item) =>
          item.alarmBell === 'NG' ||
          item.indicatorLamp === 'NG' ||
          item.manualCallPoint === 'NG' ||
          item.idZona === 'NG' ||
          item.kebersihan === 'NG'
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.zona})`,
        notes: item.kondisiNok || "Tidak ada keterangan",
        foto: item.foto || undefined,
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi Fire Alarm - ${zona.toUpperCase()}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist Fire Alarm",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/status-ga/pelaporan");
  };

  const getZoneTitle = () => {
    const titles: Record<string, string> = {
      "zona-1": "ZONA 1",
      "zona-2": "ZONA 2",
      "zona-3": "ZONA 3",
      "zona-4": "ZONA 4",
      "zona-5": "ZONA 5",
      "zona-6": "ZONA 6",
      "zona-7": "ZONA 7",
      "zona-8": "ZONA 8",
      "zona-9": "ZONA 9",
      "zona-10": "ZONA 10",
      "zona-11": "ZONA 11",
      "zona-12": "ZONA 12",
      "zona-13": "ZONA 13",
      "zona-14": "ZONA 14",
      "zona-15": "ZONA 15",
      "zona-20": "ZONA 20",
      "zona-22": "ZONA 22",
      "zona-23": "ZONA 23",
    };
    return titles[zona] || zona.toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/fire-alarm")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <h1 className="page-title">🔔 Inspeksi Fire Alarm - {getZoneTitle()}</h1>
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

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memproses...</p>
          </div>
        )}

        {!showPreview ? (
          <div className="card-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Zona</th>
                  <th>Lokasi</th>
                  <th>Alarm Bell</th>
                  <th>Indicator Lamp</th>
                  <th>Manual Call Point</th>
                  <th>ID Zona</th>
                  <th>Kebersihan</th>
                  <th>Kondisi N-OK</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Foto</th> 
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="info-cell">{item.no}</td>
                    <td className="info-cell">{item.zona}</td>
                    <td className="info-cell">{item.lokasi}</td>
                    <td>
                      <select
                        value={item.alarmBell}
                        onChange={(e) => handleInputChange(index, "alarmBell", e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.indicatorLamp}
                        onChange={(e) => handleInputChange(index, "indicatorLamp", e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.manualCallPoint}
                        onChange={(e) => handleInputChange(index, "manualCallPoint", e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={item.idZona}
                        onChange={(e) => handleInputChange(index, "idZona", e.target.value)}
                        className="status-select"
                        disabled={loading}
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
                        disabled={loading}
                      >
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.kondisiNok}
                        onChange={(e) => handleInputChange(index, "kondisiNok", e.target.value)}
                        placeholder="Catatan..."
                        className="notes-input"
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.tindakanPerbaikan}
                        onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                        placeholder="Tindakan perbaikan..."
                        className="notes-input"
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <div className="info-cell">{item.pic}</div>
                    </td>
                    <td>
                      <div className="image-upload">
                        {/* ✅ Tampilkan foto yang sudah diupload ATAU temporary preview */}
                        {(items[index].foto || tempPhotoPreviews[index]) ? (
                          <div className="image-preview">
                            <img 
                              src={
                                tempPhotoPreviews[index] || 
                                (items[index].foto.startsWith('data:') 
                                  ? items[index].foto 
                                  : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${items[index].foto}`)
                              } 
                              alt="Preview" 
                              className="uploaded-image" 
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="remove-btn"
                              disabled={loading}
                            >
                              ✕
                            </button>
                            {/* ✅ Loading indicator saat upload */}
                            {loading && (
                              <div className="upload-loading">
                                <div className="spinner-small"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <label className="file-label">
                            📷 Unggah
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              className="file-input"
                              disabled={loading}
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
              <button
                onClick={() => router.push("/status-ga/fire-alarm")}
                className="btn-cancel"
                disabled={loading}
              >
                Batal
              </button>
              <button 
                onClick={handleShowPreview} 
                className="btn-submit"
                disabled={loading}
              >
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
                    <th>Zona</th>
                    <th>Lokasi</th>
                    <th>Alarm Bell</th>
                    <th>Indicator</th>
                    <th>Manual Call</th>
                    <th>ID Zona</th>
                    <th>Kebersihan</th>
                    <th>Keterangan</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.zona}</td>
                      <td>{item.lokasi}</td>
                      <td className={item.alarmBell === "NG" ? "status-ng" : ""}>
                        {item.alarmBell}
                      </td>
                      <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>
                        {item.indicatorLamp}
                      </td>
                      <td className={item.manualCallPoint === "NG" ? "status-ng" : ""}>
                        {item.manualCallPoint}
                      </td>
                      <td className={item.idZona === "NG" ? "status-ng" : ""}>
                        {item.idZona}
                      </td>
                      <td className={item.kebersihan === "NG" ? "status-ng" : ""}>
                        {item.kebersihan}
                      </td>
                      <td>{item.kondisiNok || "-"}</td>
                      <td>
                        {item.foto ? (
                          <img 
                            src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} 
                            alt="Foto" 
                            className="preview-image" 
                          />
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
              <button 
                onClick={handleCancelPreview} 
                className="cancel-btn"
                disabled={loading}
              >
                ← Kembali
              </button>
              {hasNg ? (
                <div className="ng-actions">
                  <button 
                    onClick={handleReportNg} 
                    className="report-btn"
                    disabled={loading}
                  >
                    📢 Laporkan NG
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="save-btn"
                    disabled={loading}
                  >
                    💾 Simpan Tanpa Lapor
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleSave} 
                  className="save-btn"
                  disabled={loading}
                >
                  💾 Simpan Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      {/* Component Styles */}
      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
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

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .page-title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          flex: 1;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          margin-bottom: 24px;
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
          position: relative;
        }

        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          color: #fff8f8;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
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

        .status-select:disabled,
        .notes-input:disabled {
          background: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
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

        .preview-image {
          max-width: 80px;
          max-height: 80px;
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
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
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

        .btn-cancel:disabled,
        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-submit {
          background: #4caf50;
          color: white;
        }

        .btn-submit:hover {
          background: #43a047;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn {
          background: #2e7d32;
          color: white;
        }

        .save-btn:hover {
          background: #1b5e20;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-btn {
          background: #d32f2f;
          color: white;
        }

        .report-btn:hover {
          background: #b71c1c;
        }

        .report-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .checklist-table .info-cell {
          background: rgba(255, 255, 255, 0.4);
          color: white;
          font-weight: 500;
        }

        /* Loading Overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: white;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top-color: #4caf50;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        .upload-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 6px;
        }

        .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #4caf50;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

          .preview-image {
            max-width: 60px;
            max-height: 60px;
          }
        }
      `}</style>
    </div>
  );
}