// app/status-ga/inspeksi-apar/[slug]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
import { format, parse, isBefore, isValid } from "date-fns";
import { aparDataBySlug } from "@/lib/apar-data";

const areaNames: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING (SEBELAH PINTU MASUK) FABRIKASI JP SISI BARAT",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM FABRIKASI C/B JP",
  "area-training-dining-mtc": "AREA TRAINING A& DINING ROOM , MTC OFFICE",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (UNTUK GENBA A)",
  "power-house-genba-c": "POWER HOUSE (UNTUK GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE AREA DAN WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR SEBELAH RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

const checkItems = [
  { label: "Masa Berlaku", help: "Lihat identitas APAR apakah masih berlaku atau tidak" },
  { label: "Tekanan", help: "Pastikan jarum penunjuk tekanan APAR tepat di warna hijau" },
  { label: "Isi Tabung", help: "Pastikan isi APAR tidak menggumpal dengan menggoyangkan, mengocok tabung dan menimbang APAR" },
  { label: "Selang", help: "Pastikan selang APAR tidak rusak & tidak tersumbat benda apapun" },
  { label: "Segel", help: "Periksa segel APAR apakah dalam kondisi terkunci ataukah dalam kondisi terbuka" },
  { label: "Kondisi Tabung & Kebersihan tabung", help: "Pastikan area APAR tidak terhalang benda apapun" },
  { label: "Gantungan Apar", help: "Pastikan masing-masing Gantungan APAR Tidak Rusak" },
  { label: "Lay out APAR", help: "Pastikan masing-masing APAR ada Lay out nya" },
  { label: "Papan Petunjuk & Nomor Apar", help: "Pastikan terpasang dan mudah dilihat" },
  { label: "OS & C/S", help: "Pastikan Operation standart & Check Sheet terpasang rapi dan jelas dan update" },
  { label: "Area Sekitar", help: "Pastikan Jalan/akses APAR mudah dan dapat dijangkau oleh tim" },
  { label: "Posisi APAR tidak bergeser", help: "Pastikan APAR tetap pada posisi semula dan tidak bergeser" },
];

export default function InspeksiAparForm({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { slug } = use(params);
  const today = new Date();
  const date = format(today, "yyyy-MM-dd");
  
  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPhotoPreviews, setTempPhotoPreviews] = useState<Record<number, string>>({});

  // Akses hanya untuk inspector-ga
  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "inspector-ga") {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  // Inisialisasi data
  useEffect(() => {
    const areaName = areaNames[slug];
    if (!areaName) {
      alert("Area tidak ditemukan!");
      router.push("/status-ga/inspeksi-apar");
      return;
    }
    
    const rawData = aparDataBySlug[slug as keyof typeof aparDataBySlug] || [];
    const initialItems = rawData.map((item) => ({
      no: item.no,
      jenisApar: item.jenisApar,
      lokasi: item.lokasi,
      noApar: item.noApar,
      expDate: item.expDate,
      ...Object.fromEntries(checkItems.map((_, idx) => [`check${idx + 1}`, "O"])), // ✅ Default "O" bukan kosong
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
  }, [slug, user]);

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
      formData.append('slug', slug);
      formData.append('lokasi', items[index].lokasi);

      const response = await fetch('/api/apar/upload', {
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
    if (fotoPath && !fotoPath.startsWith('')) {
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

  // ✅ FUNGSI AMAN - TAMBAHKAN PENGECEKAN NULL/UNDEFINED
const parseExpDate = (dateStr: string | null | undefined): Date | null => {
  // ✅ Tambahkan pengecekan awal
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  
  let parsed = parse(dateStr, "dd/MM/yyyy", new Date());
  if (isValid(parsed)) return parsed;
  
  parsed = parse(dateStr, "dd/MM/yy", new Date());
  if (isValid(parsed)) return parsed;
  
  return null;
};

const isExpired = (expDateString: string | null | undefined): boolean => {
  const expDate = parseExpDate(expDateString);
  return expDate ? isBefore(expDate, new Date()) : false;
};

  const handleShowPreview = () => {
    // ✅ Semua field check harus "O" atau "X" (tidak boleh kosong)
    for (const item of items) {
      for (let i = 1; i <= checkItems.length; i++) {
        const val = item[`check${i}`];
        if (!val || !["O", "X"].includes(val)) {
          alert("⚠️ Semua kolom pengecekan harus diisi dengan 'O' atau 'X'!");
          return;
        }
      }
    }

    const ngExists = items.some((item) =>
      Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean)
    );

    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean) &&
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

      // ✅ Pastikan semua data valid sebelum kirim
      const validItems = items.filter(item => 
        item.no && item.lokasi && item.noApar && item.expDate &&
        ["O", "X"].includes(item.check1) && ["O", "X"].includes(item.check2) &&
        ["O", "X"].includes(item.check3) && ["O", "X"].includes(item.check4) &&
        ["O", "X"].includes(item.check5) && ["O", "X"].includes(item.check6) &&
        ["O", "X"].includes(item.check7) && ["O", "X"].includes(item.check8) &&
        ["O", "X"].includes(item.check9) && ["O", "X"].includes(item.check10) &&
        ["O", "X"].includes(item.check11) && ["O", "X"].includes(item.check12)
      );

      if (validItems.length === 0) {
        alert("⚠️ Tidak ada item yang valid! Pastikan semua kolom diisi.");
        return;
      }

      // Siapkan data untuk submit
      const submitData = {
        date,
        slug, // ✅ Kirim slug, bukan nama area
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: validItems.map(item => ({
          no: item.no,
          jenisApar: item.jenisApar,
          lokasi: item.lokasi,
          noApar: item.noApar,
          expDate: item.expDate,
          check1: item.check1,
          check2: item.check2,
          check3: item.check3,
          check4: item.check4,
          check5: item.check5,
          check6: item.check6,
          check7: item.check7,
          check8: item.check8,
          check9: item.check9,
          check10: item.check10,
          check11: item.check11,
          check12: item.check12,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic,
          foto: item.foto || null // Path file atau null
        }))
      };

      console.log('📤 Mengirim ', submitData); // ✅ DEBUG

      const response = await fetch('/api/apar/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      console.log('📥 Response:', result); // ✅ DEBUG

      if (response.ok && result.success) {
        alert("✅ Data berhasil disimpan!");
        router.push(`/status-ga/inspeksi-apar/${slug}/riwayat`);
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
      .filter((item) =>
        Array.from({ length: checkItems.length }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean)
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.noApar})`,
        notes: item.keterangan || "Tidak ada keterangan",
        foto: item.foto || undefined,
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi APAR - ${areaNames[slug]}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist APAR",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/status-ga/pelaporan");
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/inspeksi-apar")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <h1 className="page-title">🧯 Inspeksi APAR - {areaNames[slug]}</h1>
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
                  <th>Jenis APAR</th>
                  <th>Lokasi</th>
                  <th>No. APAR</th>
                  <th>Exp. Date</th>
                  {checkItems.map((item, idx) => (
                    <th key={idx} title={item.help}>
                      {item.label}
                    </th>
                  ))}
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
                    <td className="info-cell">{item.jenisApar}</td>
                    <td className="info-cell">{item.lokasi}</td>
                    <td className="info-cell">{item.noApar}</td>
                    <td className={isExpired(item.expDate) ? "status-expired" : "info-cell"}>
                      {item.expDate}
                    </td>
                    {checkItems.map((_, idx) => (
                      <td key={idx}>
                        <select
                          value={item[`check${idx + 1}`]}
                          onChange={(e) => handleInputChange(index, `check${idx + 1}`, e.target.value)}
                          className="status-select"
                          disabled={loading}
                        >
                          <option value="O">O</option> {/* ✅ Default "O" */}
                          <option value="X">X</option>
                        </select>
                      </td>
                    ))}
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
                                (items[index].foto.startsWith('') 
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
                onClick={() => router.push("/status-ga/inspeksi-apar")}
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
                    <th>No. APAR</th>
                    {checkItems.map((item, idx) => (
                      <th key={idx}>{item.label}</th>
                    ))}
                    <th>Keterangan</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td>{item.noApar}</td>
                      {checkItems.map((_, idx) => (
                        <td key={idx} className={item[`check${idx + 1}`] === "X" ? "status-ng" : ""}>
                          {item[`check${idx + 1}`]}
                        </td>
                      ))}
                      <td>{item.keterangan || "-"}</td>
                      <td>
                        {item.foto ? (
                          <img 
                            src={item.foto.startsWith('') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`} 
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
          max-width: 1600px;
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

        .status-expired {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
          font-weight: bold;
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