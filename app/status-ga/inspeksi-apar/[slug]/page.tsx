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
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM",
  "area-training-dining-mtc": "AREA TRAINING & DINING ROOM",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (GENBA A)",
  "power-house-genba-c": "POWER HOUSE (GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE & WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

const checkItems = [
  { label: "Masa Berlaku", short: "Masa", help: "Lihat identitas APAR apakah masih berlaku" },
  { label: "Tekanan", short: "Tekanan", help: "Jarum tekanan di warna hijau" },
  { label: "Isi Tabung", short: "Isi", help: "Isi APAR tidak menggumpal" },
  { label: "Selang", short: "Selang", help: "Selang tidak rusak" },
  { label: "Segel", short: "Segel", help: "Segel terkunci" },
  { label: "Kondisi Tabung", short: "Tabung", help: "Area APAR tidak terhalang" },
  { label: "Gantungan", short: "Gantung", help: "Gantungan tidak rusak" },
  { label: "Lay out", short: "Layout", help: "APAR ada lay out" },
  { label: "Papan Petunjuk", short: "Papan", help: "Terpasang dan mudah dilihat" },
  { label: "OS & C/S", short: "OS/CS", help: "Terpasang rapi dan update" },
  { label: "Area Sekitar", short: "Area", help: "Akses APAR mudah" },
  { label: "Posisi APAR", short: "Posisi", help: "APAR tidak bergeser" },
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
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

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
      ...Object.fromEntries(checkItems.map((_, idx) => [`check${idx + 1}`, "O"])),
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
      formData.append('slug', slug);
      formData.append('lokasi', items[index].lokasi);

      const response = await fetch('/api/apar/upload', {
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

  const parseExpDate = (dateStr: string | null | undefined): Date | null => {
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

  const handleSave = async () => {
    try {
      setLoading(true);

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (!item.no) throw new Error(`Baris ${index + 1}: Nomor urut tidak boleh kosong`);
        if (!item.lokasi || item.lokasi.trim() === '') throw new Error(`Baris ${index + 1}: Lokasi wajib diisi`);
        if (!item.noApar || item.noApar.trim() === '') throw new Error(`Baris ${index + 1}: Nomor APAR wajib diisi`);
        if (!item.expDate || item.expDate.trim() === '') throw new Error(`Baris ${index + 1}: Exp. Date wajib diisi`);

        for (let i = 1; i <= 12; i++) {
          const checkValue = item[`check${i}`];
          if (checkValue === undefined || checkValue === null || checkValue === '') {
            throw new Error(`Baris ${index + 1}: Check item ${i} harus diisi dengan 'O' atau 'X'`);
          }
          if (checkValue !== 'O' && checkValue !== 'X') {
            throw new Error(`Baris ${index + 1}: Check item ${i} harus diisi dengan 'O' atau 'X'`);
          }
        }

        const hasNg = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === 'X').some(Boolean);
        if (hasNg) {
          if (!item.keterangan || item.keterangan.trim() === '') {
            throw new Error(`Baris ${index + 1}: Keterangan wajib diisi untuk item dengan status NG`);
          }
        }
      }

      const submitData = {
        date,
        slug,
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: items.map((item) => ({
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
          foto: item.foto || null
        }))
      };

      const response = await fetch('/api/apar/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Data berhasil disimpan!');
        router.push(`/status-ga/inspeksi-apar/${slug}/riwayat`);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ Gagal menyimpan data: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
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
            <span className="btn-back-text">Kembali</span>
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
            {/* ✅ DESKTOP: Table View */}
            <div className="desktop-view">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Jenis APAR</th>
                    <th>Lokasi</th>
                    <th>No. APAR</th>
                    <th>Exp. Date</th>
                    {checkItems.map((item, idx) => (
                      <th key={idx} title={item.help} className="check-th">
                        {item.short}
                      </th>
                    ))}
                    <th>Keterangan</th>
                    <th>Tindakan</th>
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
                            <option value="O">O</option>
                            <option value="X">X</option>
                          </select>
                        </td>
                      ))}
                      <td>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib jika NG"
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
                <div key={index} className="apar-card">
                  <div className="card-header" onClick={() => toggleExpandItem(index)}>
                    <div className="card-no">{item.no}</div>
                    <div className="card-info">
                      <div className="card-jenis">{item.jenisApar}</div>
                      <div className="card-lokasi">{item.lokasi}</div>
                      <div className="card-noapar">No. APAR: {item.noApar}</div>
                    </div>
                    <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {expandedItem === index && (
                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">Exp. Date:</span>
                        <span className={`info-value ${isExpired(item.expDate) ? 'expired' : ''}`}>
                          {item.expDate} {isExpired(item.expDate) && '⚠️'}
                        </span>
                      </div>

                      <div className="checklist-section">
                        <h4 className="section-title">✅ Checklist Inspeksi</h4>
                        {checkItems.map((checkItem, idx) => (
                          <div key={idx} className="check-row">
                            <label className="check-label" title={checkItem.help}>
                              {checkItem.label}
                            </label>
                            <select
                              value={item[`check${idx + 1}`]}
                              onChange={(e) => handleInputChange(index, `check${idx + 1}`, e.target.value)}
                              className="check-select"
                              disabled={loading}
                            >
                              <option value="O">O - OK</option>
                              <option value="X">X - NG</option>
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="form-group">
                        <label>Keterangan</label>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib diisi jika NG"
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
                          placeholder="Tindakan perbaikan..."
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

            {/* ✅ DESKTOP: Preview Table */}
            <div className="desktop-preview">
              <div className="table-wrapper-responsive">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Lokasi</th>
                      <th>No. APAR</th>
                      <th>Status</th>
                      <th>Keterangan</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const hasNgItem = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean);
                      return (
                        <tr key={index} className={hasNgItem ? "row-ng" : ""}>
                          <td>{item.no}</td>
                          <td>{item.lokasi}</td>
                          <td>{item.noApar}</td>
                          <td className={hasNgItem ? "status-ng" : "status-ok"}>
                            {hasNgItem ? "NG" : "OK"}
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Preview Cards */}
            <div className="mobile-preview">
              {items.map((item, index) => {
                const hasNgItem = Array.from({ length: 12 }, (_, i) => item[`check${i + 1}`] === "X").some(Boolean);

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
                        <span className="preview-label">Lokasi:</span>
                        <span className="preview-value">{item.lokasi}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">No. APAR:</span>
                        <span className="preview-value">{item.noApar}</span>
                      </div>
                      {item.keterangan && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.keterangan}</span>
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
                    onClick={handleSave}
                    className="save-btn"
                    disabled={loading}
                  >
                    💾 Simpan
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
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
          min-width: 1400px;
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

        .check-th {
          text-align: center;
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
          min-height: 44px;
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

        /* Mobile Card Styles */
        .apar-card,
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
          width: 40px;
          height: 40px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
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

        .card-jenis {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 4px;
        }

        .card-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          word-break: break-word;
          margin-bottom: 4px;
        }

        .card-noapar {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
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

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .info-label {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .info-value {
          color: white;
          font-weight: 500;
        }

        .info-value.expired {
          color: #ffcdd2;
          font-weight: 700;
        }

        .checklist-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .check-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .check-row:last-child {
          border-bottom: none;
        }

        .check-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
          padding-right: 12px;
        }

        .check-select {
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          min-width: 100px;
          min-height: 44px;
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

        .image-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 44px;
        }

        .file-label {
          display: inline-block;
          padding: 10px 16px;
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
            font-size: 1.2rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 1200px;
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
            font-size: 1.1rem;
            width: 100%;
            text-align: center;
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
            min-width: 900px;
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

          .card-no,
          .preview-card-no {
            width: 36px;
            height: 36px;
            font-size: 1rem;
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

          .check-label {
            font-size: 0.85rem;
          }

          .check-select {
            min-width: 90px;
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
            font-size: 1rem;
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
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-body,
          .preview-card-body {
            padding: 12px;
          }

          .info-row {
            padding: 10px;
          }

          .section-title {
            font-size: 0.95rem;
          }

          .check-row {
            padding: 8px 0;
          }

          .check-label {
            font-size: 0.8rem;
          }

          .check-select {
            min-width: 80px;
            font-size: 0.85rem;
            padding: 6px 10px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .status-select,
          .notes-input {
            font-size: 0.85rem;
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
            min-width: 700px;
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