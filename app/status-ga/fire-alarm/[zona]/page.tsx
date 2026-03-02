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
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

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

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    try {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoPreviews(prev => ({ ...prev, [index]: reader.result as string }));
      };
      reader.readAsDataURL(file);

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
        handleInputChange(index, "foto", result.data.path);
        setTempPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
        alert('✅ Foto berhasil diupload!');
      } else {
        setTempPhotoPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[index];
          return newPreviews;
        });
        alert('❌ Gagal upload foto: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setTempPhotoPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
      alert('❌ Terjadi kesalahan saat upload foto');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    handleInputChange(index, "foto", "");
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

  const handleCancelPreview = () => setShowPreview(false);

  const handleSave = async () => {
    try {
      setLoading(true);

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
          foto: item.foto || null
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

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
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
            <span className="btn-back-text">Kembali</span>
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
            {/* ✅ DESKTOP: Table View */}
            <div className="desktop-view">
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
                          placeholder="Tindakan..."
                          className="notes-input"
                          disabled={loading}
                        />
                      </td>
                      <td>
                        <div className="info-cell">{item.pic}</div>
                      </td>
                      <td>
                        <div className="image-upload">
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
            </div>

            {/* ✅ MOBILE: Card View */}
            <div className="mobile-view">
              {items.map((item, index) => (
                <div key={index} className="checklist-card">
                  <div className="card-header" onClick={() => toggleExpandItem(index)}>
                    <div className="card-no">{item.no}</div>
                    <div className="card-info">
                      <div className="card-zona">{item.zona}</div>
                      <div className="card-lokasi">{item.lokasi}</div>
                    </div>
                    <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>
                      ▼
                    </div>
                  </div>
                  
                  {expandedItem === index && (
                    <div className="card-body">
                      <div className="form-group">
                        <label>Alarm Bell</label>
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
                      </div>
                      
                      <div className="form-group">
                        <label>Indicator Lamp</label>
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
                      </div>
                      
                      <div className="form-group">
                        <label>Manual Call Point</label>
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
                      </div>
                      
                      <div className="form-group">
                        <label>ID Zona</label>
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
                      </div>
                      
                      <div className="form-group">
                        <label>Kebersihan</label>
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
                      </div>
                      
                      <div className="form-group">
                        <label>Kondisi N-OK</label>
                        <input
                          type="text"
                          value={item.kondisiNok}
                          onChange={(e) => handleInputChange(index, "kondisiNok", e.target.value)}
                          placeholder="Catatan..."
                          className="notes-input"
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Tindakan Perbaikan</label>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan..."
                          className="notes-input"
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>PIC</label>
                        <div className="info-cell">{item.pic}</div>
                      </div>
                      
                      <div className="form-group">
                        <label>Foto</label>
                        <div className="image-upload">
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
                              {loading && (
                                <div className="upload-loading">
                                  <div className="spinner-small"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <label className="file-label file-label-large">
                              📷 Unggah Foto
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
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

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
            
            {/* ✅ DESKTOP: Preview Table */}
            <div className="desktop-preview">
              <div className="table-wrapper-responsive">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Zona</th>
                      <th>Lokasi</th>
                      <th>Status</th>
                      <th>Keterangan</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const hasNgItem =
                        item.alarmBell === "NG" ||
                        item.indicatorLamp === "NG" ||
                        item.manualCallPoint === "NG" ||
                        item.idZona === "NG" ||
                        item.kebersihan === "NG";
                      return (
                        <tr key={index} className={hasNgItem ? "row-ng" : ""}>
                          <td>{item.no}</td>
                          <td>{item.zona}</td>
                          <td>{item.lokasi}</td>
                          <td className={hasNgItem ? "status-ng" : "status-ok"}>
                            {hasNgItem ? "NG" : "OK"}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Preview Cards */}
            <div className="mobile-preview">
              {items.map((item, index) => {
                const hasNgItem =
                  item.alarmBell === "NG" ||
                  item.indicatorLamp === "NG" ||
                  item.manualCallPoint === "NG" ||
                  item.idZona === "NG" ||
                  item.kebersihan === "NG";
                
                return (
                  <div key={index} className={`preview-card ${hasNgItem ? 'preview-card-ng' : ''}`}>
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className={`preview-card-status ${hasNgItem ? 'status-ng' : 'status-ok'}`}>
                        {hasNgItem ? 'NG' : 'OK'}
                      </span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Zona:</span>
                        <span className="preview-value">{item.zona}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Lokasi:</span>
                        <span className="preview-value">{item.lokasi}</span>
                      </div>
                      {item.kondisiNok && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.kondisiNok}</span>
                        </div>
                      )}
                      {item.foto && (
                        <div className="preview-row">
                          <span className="preview-label">Foto:</span>
                          <img
                            src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                            alt="Foto"
                            className="preview-card-image"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          width: 100%;
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
          flex-wrap: wrap;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-back-text {
          display: inline;
        }

        .page-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          flex: 1;
          word-break: break-word;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .date-text {
          font-weight: 700;
          font-size: 1.1rem;
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
          color: white;
          position: relative;
        }

        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* Desktop View */
        .desktop-view,
        .desktop-preview {
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-view,
        .mobile-preview {
          display: none;
        }

        .table-wrapper-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          color: #fff8f8;
          min-width: 1000px;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          white-space: nowrap;
        }

        .checklist-table th,
        .simple-table th {
          background: rgba(0, 0, 0, 0.15);
          font-weight: 600;
          position: sticky;
          top: 0;
          color: white;
          z-index: 10;
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
          min-height: 40px;
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

        /* Mobile Card View */
        .checklist-card,
        .preview-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .preview-card-ng {
          border-color: rgba(244, 67, 54, 0.5);
          background: rgba(244, 67, 54, 0.1);
        }

        .card-header,
        .preview-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover,
        .preview-card-header:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .card-no,
        .preview-card-no {
          width: 36px;
          height: 36px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .preview-card-status {
          margin-left: auto;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .preview-card-status.ok {
          background: rgba(76, 175, 80, 0.3);
          color: #c8e6c9;
        }

        .preview-card-status.ng {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-zona {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 4px;
        }

        .card-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          word-break: break-word;
        }

        .expand-icon {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body,
        .preview-card-body {
          padding: 16px;
          background: rgba(0, 0, 0, 0.1);
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          gap: 12px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          min-width: 80px;
          flex-shrink: 0;
        }

        .preview-value {
          font-size: 0.9rem;
          color: white;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        .preview-card-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
          cursor: pointer;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .image-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 44px;
        }

        .file-label {
          display: inline-block;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-label-large {
          width: 100%;
          padding: 12px 16px;
        }

        .file-label:hover {
          background: rgba(255, 255, 255, 1);
        }

        .file-input {
          display: none;
        }

        .image-preview {
          position: relative;
          width: 80px;
          height: 80px;
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
          width: 24px;
          height: 24px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s;
          min-height: 24px;
          min-width: 24px;
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
          flex-wrap: wrap;
        }

        .btn-cancel,
        .btn-submit,
        .cancel-btn,
        .save-btn,
        .report-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-height: 48px;
          min-width: 120px;
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
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
          font-weight: bold;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .status-ok {
          background: rgba(76, 175, 80, 0.3);
          color: #c8e6c9;
          font-weight: bold;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .row-ng {
          background: rgba(244, 67, 54, 0.1);
        }

        .ng-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
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

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.4rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 900px;
            font-size: 0.85rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 10px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
            margin-left: 0;
          }

          .header-banner {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: center;
          }

          .btn-back-text {
            display: inline;
          }

          .page-title {
            font-size: 1.3rem;
            width: 100%;
          }

          .subtitle {
            font-size: 0.9rem;
            width: 100%;
          }

          .date-text {
            font-size: 1rem;
            width: 100%;
            text-align: center;
          }

          .card-container {
            padding: 16px 12px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view,
          .desktop-preview {
            display: none;
          }

          .mobile-view,
          .mobile-preview {
            display: block;
          }

          .form-actions,
          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            width: 100%;
            min-height: 52px;
            font-size: 1rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 700px;
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 8px 6px;
          }

          .status-select,
          .notes-input {
            font-size: 0.9rem;
            min-height: 44px;
          }

          .image-preview {
            width: 70px;
            height: 70px;
          }

          .preview-image {
            max-width: 70px;
            max-height: 70px;
          }

          .card-no {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-lokasi {
            font-size: 0.95rem;
          }

          .preview-label {
            min-width: 70px;
            font-size: 0.8rem;
          }

          .preview-value {
            font-size: 0.85rem;
          }

          .preview-card-image {
            width: 50px;
            height: 50px;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .header-banner {
            padding: 10px 12px;
          }

          .page-title {
            font-size: 1.1rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .date-text {
            font-size: 0.9rem;
            padding: 3px 8px;
          }

          .card-container {
            padding: 12px 8px;
          }

          .card-header,
          .preview-card-header {
            padding: 12px;
          }

          .card-no,
          .preview-card-no {
            width: 28px;
            height: 28px;
            font-size: 0.85rem;
          }

          .card-body,
          .preview-card-body {
            padding: 12px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .status-select,
          .notes-input {
            font-size: 0.9rem;
            min-height: 44px;
          }

          .file-label {
            padding: 10px 14px;
            font-size: 0.85rem;
            min-height: 44px;
          }

          .file-label-large {
            padding: 12px 14px;
          }

          .image-preview {
            width: 60px;
            height: 60px;
          }

          .preview-image {
            max-width: 60px;
            max-height: 60px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            min-height: 56px;
            font-size: 0.95rem;
            padding: 14px 20px;
          }

          .checklist-table,
          .simple-table {
            min-width: 600px;
            font-size: 0.75rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 6px 4px;
          }

          .preview-title {
            font-size: 1.3rem;
          }

          .preview-label {
            min-width: 60px;
            font-size: 0.75rem;
          }

          .preview-value {
            font-size: 0.8rem;
          }

          .preview-card-image {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
    </div>
  );
}