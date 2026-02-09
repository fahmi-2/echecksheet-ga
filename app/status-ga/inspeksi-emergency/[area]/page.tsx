// app/status-ga/inspeksi-emergency/[area]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

const locations = {
  "genba-a": [
    { no: 1, lokasi: "CV AB1", id: "A01" },
    { no: 2, lokasi: "CV AB3", id: "A02" },
    { no: 3, lokasi: "CV AB4", id: "A03" },
    { no: 4, lokasi: "CV AB7", id: "A04" },
    { no: 5, lokasi: "CV AB9", id: "A05" },
    { no: 6, lokasi: "CV 15A", id: "A06" },
    { no: 7, lokasi: "CV 14B", id: "A07" },
    { no: 8, lokasi: "SA AT19", id: "A08" },
    { no: 9, lokasi: "PINTU 7", id: "A09" },
    { no: 10, lokasi: "RAYCHEM 900B", id: "A10" },
    { no: 11, lokasi: "INSERT PLUG AT6", id: "A11" },
    { no: 12, lokasi: "CV AT9", id: "A12" },
    { no: 13, lokasi: "CV AT7", id: "A13" },
    { no: 14, lokasi: "CV AT6", id: "A14" },
    { no: 15, lokasi: "CV AT2", id: "A15" },
    { no: 16, lokasi: "PINTU 9", id: "A16" },
    { no: 17, lokasi: "PRE ASSY AB1", id: "A17" },
    { no: 20, lokasi: "DEPAN QA REC", id: "A18" },
    { no: 21, lokasi: "NEW CUTTING TUBE", id: "A19" },
    { no: 22, lokasi: "UTARA PINTU 2", id: "A20" },
  ],
  "genba-b": [
    { no: 51, lokasi: "PINTU MASUK GENBA B", id: "B01" },
    { no: 52, lokasi: "SEBELAH UTARA", id: "B02" },
    { no: 53, lokasi: "SEBELAH TIMUR", id: "B03" },
    { no: 54, lokasi: "SEBELAH TIMUR", id: "B04" },
    { no: 55, lokasi: "AREA SECOND FLOOR", id: "B05" },
    { no: 56, lokasi: "SEBELAH SELATAN", id: "B06" },
    { no: 57, lokasi: "SAMPING LIFT BARANG", id: "B07" },
    { no: 58, lokasi: "SEBELAH BARAT", id: "B08" },
    { no: 59, lokasi: "SEBELAH BARAT", id: "B09" },
    { no: 60, lokasi: "DI ATAS PANEL", id: "B10" },
  ],
  "genba-c": [
    { no: 61, lokasi: "RECEIVING", id: "C01" },
    { no: 62, lokasi: "CV C7", id: "C02" },
    { no: 63, lokasi: "CV C3", id: "C03" },
    { no: 64, lokasi: "CV C3", id: "C04" },
    { no: 65, lokasi: "PRE ASSY", id: "C05" },
    { no: 66, lokasi: "PRE ASSY", id: "C06" },
    { no: 67, lokasi: "CV C1", id: "C07" },
    { no: 68, lokasi: "CV C1", id: "C08" },
    { no: 69, lokasi: "CV C5", id: "C09" },
    { no: 70, lokasi: "CV C4", id: "C10" },
    { no: 71, lokasi: "PINTU SELATAN", id: "C11" },
    { no: 72, lokasi: "PINTU UTARA", id: "C12" },
  ],
  "jig-proto": [
    { no: 73, lokasi: "SAMPING PINTU", id: "JP01" },
    { no: 74, lokasi: "STOCK CONTROL / NYS", id: "JP02" },
    { no: 75, lokasi: "BOR DUDUK", id: "JP03" },
    { no: 76, lokasi: "OFFICE JIG PROTO", id: "JP04" },
  ],
  "gel-sheet": [
    { no: 77, lokasi: "GEL SHEET/STOK KONTROL", id: "GS01" },
    { no: 78, lokasi: "GEL SHEET", id: "GS02" },
  ],
  "warehouse": [
    { no: 23, lokasi: "RECEIVING WAREHOUSE", id: "WHS01" },
    { no: 24, lokasi: "SAMPING LIFT WAREHOUSE (BAWAH)", id: "WHS02" },
    { no: 25, lokasi: "SAMPING LIFT WHS SISI ATAS", id: "WHS03" },
    { no: 26, lokasi: "SECOND FLOOR WAREHOUSE JALUR TENGAH (SAMPING PAGAR)", id: "WHS04" },
    { no: 27, lokasi: "DEKAT TANGGA SISI BARAT SECOND FLOOR WHS", id: "WHS05" },
  ],
  "mezzanine": [
    { no: 28, lokasi: "TANGGA T08-B /", id: "TM01" },
    { no: 29, lokasi: "TANGGA KARAKURI", id: "TM02" },
    { no: 30, lokasi: "TANGGA REMOT AC", id: "TM03" },
    { no: 31, lokasi: "SAMPING TANGGA SELATAN", id: "MZA-01" },
    { no: 32, lokasi: "J72 MAZDA", id: "MZA-02" },
    { no: 33, lokasi: "J30 MAZDA", id: "MZA-03" },
    { no: 34, lokasi: "CV 900B", id: "MZA-04" },
    { no: 35, lokasi: "CV 900B TOYOTA", id: "MZA-05" },
    { no: 36, lokasi: "J72 MAZDA", id: "MZA-06" },
  ],
  "parkir": [
    { no: 84, lokasi: "PARKIR BAWAH SISI BARAT", id: "PARKIR BAWAH  01" },
    { no: 85, lokasi: "PARKIR BAWAH SISI TIMUR SEBELAH TANGGA", id: "PARKIR BAWAH 02" },
    { no: 86, lokasi: "PARKIR ATAS SISI BARAT", id: "PARKIR ATAS 01" },
    { no: 87, lokasi: "PARKIR ATAS SISI TIMUR SEBELAH TANGGA", id: "PARKIR ATAS 02" },
  ],
  "main-office": [
    { no: 88, lokasi: "PINTU TENGAH MAIN OFFICE", id: "MAIN OFFICE 01" },
    { no: 89, lokasi: "PPIC OFFICE", id: "MAIN OFFICE 02" },
    { no: 90, lokasi: "PP OFFICE SELATAN", id: "MAIN OFFICE 03" },
    { no: 91, lokasi: "PP OFFICE UTARA", id: "MAIN OFFICE 04" },
  ],
};

export default function EmergencyLampChecklist({ params }: { params: Promise<{ area: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { area } = use(params);
  const date = new Date().toISOString().split("T")[0];

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPhotoPreviews, setTempPhotoPreviews] = useState<Record<number, string>>({});

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home");
    }
  }, [user, router]);

  // Inisialisasi data
  useEffect(() => {
    const locs = locations[area as keyof typeof locations] || [];
    const initialItems = locs.map((loc) => ({
      no: loc.no,
      lokasi: loc.lokasi,
      id: loc.id,
      kondisiLampu: "",
      indicatorLamp: "",
      batteryCharger: "",
      idNumber: "",
      kebersihan: "",
      kondisiKabel: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
  }, [area, user]);

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
      formData.append('area', area);
      formData.append('lokasi', items[index].lokasi);

      const response = await fetch('/api/emergency-lamp/upload', {
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
        !item.kondisiLampu ||
        !item.indicatorLamp ||
        !item.batteryCharger ||
        !item.idNumber ||
        !item.kebersihan ||
        !item.kondisiKabel
      ) {
        alert("⚠️ Semua kolom status harus diisi!");
        return;
      }
    }

    const ngExists = items.some(
      (item) =>
        item.kondisiLampu === "NG" ||
        item.indicatorLamp === "NG" ||
        item.batteryCharger === "NG" ||
        item.idNumber === "NG" ||
        item.kebersihan === "NG" ||
        item.kondisiKabel === "NG"
    );

    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          (item.kondisiLampu === "NG" ||
            item.indicatorLamp === "NG" ||
            item.batteryCharger === "NG" ||
            item.idNumber === "NG" ||
            item.kebersihan === "NG" ||
            item.kondisiKabel === "NG") &&
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

  const handleCancelPreview = () => setShowPreview(false);

  // 🔥 SIMPAN KE API
  const handleSave = async () => {
    try {
      setLoading(true);

      // Siapkan data untuk submit
      const submitData = {
        date,
        area,
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: items.map(item => ({
          no: item.no,
          lokasi: item.lokasi,
          id: item.id,
          kondisiLampu: item.kondisiLampu,
          indicatorLamp: item.indicatorLamp,
          batteryCharger: item.batteryCharger,
          idNumber: item.idNumber,
          kebersihan: item.kebersihan,
          kondisiKabel: item.kondisiKabel,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic,
          foto: item.foto || null // Path file atau null
        }))
      };

      const response = await fetch('/api/emergency-lamp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("✅ Data berhasil disimpan!");
        router.push(`/status-ga/inspeksi-emergency/riwayat/${area}`);
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
          item.kondisiLampu === "NG" ||
          item.indicatorLamp === "NG" ||
          item.batteryCharger === "NG" ||
          item.idNumber === "NG" ||
          item.kebersihan === "NG" ||
          item.kondisiKabel === "NG"
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.id})`,
        notes: item.keterangan || "Tidak ada keterangan",
        foto: item.foto || undefined,
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi Emergency Lamp - ${area.toUpperCase()}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist Emergency Lamp",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/status-ga/pelaporan");
  };

  const getAreaTitle = () => {
    const titles: Record<string, string> = {
      "genba-a": "GENBA A",
      "genba-b": "GENBA B",
      "genba-c": "GENBA C",
      "jig-proto": "JIG PROTO",
      "gel-sheet": "GEL SHEET",
      "warehouse": "WAREHOUSE",
      "mezzanine": "MEZZANINE",
      "parkir": "PARKIR",
      "main-office": "MAIN OFFICE",
    };
    return titles[area] || area.toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/inspeksi-emergency")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <h1 className="page-title">💡 Inspeksi Emergency Lamp - {getAreaTitle()}</h1>
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
                  <th>Lokasi</th>
                  <th>ID</th>
                  <th>Kondisi Lampu</th>
                  <th>Indicator Lamp</th>
                  <th>Battery Charger</th>
                  <th>ID Number</th>
                  <th>Kebersihan</th>
                  <th>Kondisi Kabel</th>
                  <th>Keterangan</th>
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
                    <td className="info-cell">{item.id}</td>
                    <td>
                      <select
                        value={item.kondisiLampu}
                        onChange={(e) => handleInputChange(index, "kondisiLampu", e.target.value)}
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
                        value={item.batteryCharger}
                        onChange={(e) => handleInputChange(index, "batteryCharger", e.target.value)}
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
                        value={item.idNumber}
                        onChange={(e) => handleInputChange(index, "idNumber", e.target.value)}
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
                      <select
                        value={item.kondisiKabel}
                        onChange={(e) => handleInputChange(index, "kondisiKabel", e.target.value)}
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
                        value={item.keterangan}
                        onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                        placeholder="Wajib diisi jika NG"
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
                onClick={() => router.push("/status-ga/inspeksi-emergency")}
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
                    <th>Lokasi</th>
                    <th>ID</th>
                    <th>Kondisi Lampu</th>
                    <th>Indicator</th>
                    <th>Battery</th>
                    <th>ID Num</th>
                    <th>Kebersihan</th>
                    <th>Kabel</th>
                    <th>Keterangan</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td>{item.id}</td>
                      <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>{item.kondisiLampu}</td>
                      <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>{item.indicatorLamp}</td>
                      <td className={item.batteryCharger === "NG" ? "status-ng" : ""}>{item.batteryCharger}</td>
                      <td className={item.idNumber === "NG" ? "status-ng" : ""}>{item.idNumber}</td>
                      <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan}</td>
                      <td className={item.kondisiKabel === "NG" ? "status-ng" : ""}>{item.kondisiKabel}</td>
                      <td>{item.keterangan || "-"}</td>
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
          color: #1e293b;
        }

        /* Header Banner */
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