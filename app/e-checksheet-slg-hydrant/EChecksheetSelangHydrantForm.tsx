// app/e-checksheet-slg-hydrant/EChecksheetSelangHydrantForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";
import { Sidebar } from "@/components/Sidebar";

interface ChecksheetEntry {
  date: string;
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verify: string;
  inspector: string;
  images: string[]; // ✅ Tambahkan array gambar
}

interface SavedData {
  [itemKey: string]: ChecksheetEntry[];
}

export function EChecksheetSelangHydrantForm({
  lokasi,
  zona,
  jenisHydrant,
  picDefault,
}: {
  lokasi: string;
  zona: string;
  jenisHydrant: string;
  picDefault: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ SEMUA HOOKS DI ATAS — TANPA KONDISI
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);

  // Modal gambar
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  // Modal kamera
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Semua useEffect di atas
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-slg-hydrant-${lokasi}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedData(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, lokasi]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // ✅ useEffect untuk kamera
  useEffect(() => {
    if (!showCameraModal) return;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        setShowCameraModal(false);
      });

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

  // ✅ Baru di sini boleh ada conditional return
  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  const inspectionItems = [
    { key: "pressureTank", label: "PRESSURE TANK (STD : 7 kg/cm2)" },
    { key: "hasilTekananDgPitot", label: "HASIL TEKANAN DG PITOT (STD : titik terjauh min. 4.5 kg/cm2)" },
    { key: "tekananEnginePump", label: "TEKANAN ENGINE PUMP" },
    { key: "fireHose", label: "FIRE HOSE / SELANG" },
    { key: "valve", label: "VALVE (TIDAK SERET)" },
    { key: "couplingNozzle", label: "COUPLING NOZZLE" },
    { key: "couplingHydrant", label: "COUPLING HYDRANT" },
    { key: "seal", label: "SEAL" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Fungsi upload gambar
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { key: itemKey, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Ambil foto dari kamera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImages(prev => [...prev, { key: currentItemKey, url: imageUrl }]);
    setShowCameraModal(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
  };

  // ✅ Buka kamera
  const openCamera = (itemKey: string) => {
    setCurrentItemKey(itemKey);
    setShowCameraModal(true);
  };

  // ✅ Hapus gambar
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Buka modal gambar
  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  // ✅ Tutup modal gambar
  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  const handleSave = () => {
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    const allFieldsFilled = inspectionItems.every((item) => answers[`${item.key}_hasil`]);
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      const newData: SavedData = { ...savedData };

      inspectionItems.forEach((item) => {
        const entry: ChecksheetEntry = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
          keteranganTemuan: answers[`${item.key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
          pic: answers[`${item.key}_pic`] || "",
          dueDate: answers[`${item.key}_dueDate`] || "",
          verify: answers[`${item.key}_verify`] || "",
          inspector: user.fullName || "",
          images: images.filter(img => img.key === item.key).map(img => img.url)
        };

        if (!newData[item.key]) newData[item.key] = [];
        const existingIndex = newData[item.key].findIndex((e) => e.date === selectedDate);
        if (existingIndex >= 0) {
          newData[item.key][existingIndex] = entry;
        } else {
          newData[item.key].push(entry);
        }
        newData[item.key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      const key = `e-checksheet-slg-hydrant-${lokasi}`;
      localStorage.setItem(key, JSON.stringify(newData));
      alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/status-ga/selang-hydrant?openArea=${encodeURIComponent(lokasi)}`);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }

    const existingData: Record<string, string> = {};
    let found = false;

    inspectionItems.forEach((item) => {
      const entries = savedData[item.key] || [];
      const entry = entries.find((e) => e.date === selectedDate);
      if (entry) {
        found = true;
        existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
        existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
        existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
        existingData[`${item.key}_pic`] = entry.pic;
        existingData[`${item.key}_dueDate`] = entry.dueDate;
        existingData[`${item.key}_verify`] = entry.verify;
      }
    });

    if (found) {
      setAnswers(existingData);
      // ✅ Muat gambar
      const loadedImages: { key: string; url: string }[] = [];
      inspectionItems.forEach(item => {
        const entries = savedData[item.key] || [];
        const entry = entries.find(e => e.date === selectedDate);
        if (entry?.images) {
          entry.images.forEach(url => {
            loadedImages.push({ key: item.key, url });
          });
        }
      });
      setImages(loadedImages);
      alert("Data berhasil dimuat!");
    } else {
      alert("Tidak ada data untuk tanggal ini.");
      setAnswers({});
      setImages([]);
    }
  };

  // ❌ HAPUS fungsi generateBiMonthlyDates — tidak digunakan

  // ✅ Ambil semua tanggal tersedia
  const getAllSavedDates = (): string[] => {
    const dates = new Set<string>();
    Object.values(savedData).forEach((entries: ChecksheetEntry[]) => {
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          if (entry?.date) dates.add(entry.date);
        });
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const availableDates = getAllSavedDates();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ 
        paddingLeft : "95px",
        paddingRight : "25px",
        paddingBottom : "32px",
        paddingTop : "32px", 
        maxWidth: "100%", 
        margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              Check Sheet Selang & Hydrant
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Inspeksi 2 Bulan Sekali – Fire Hydrant System
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div className="text-black"><strong>Zona:</strong> {zona}</div>
            <div className="text-black"><strong>Jenis Hydrant:</strong> {jenisHydrant}</div>
            <div className="text-black"><strong>Lokasi:</strong> {lokasi}</div>
            <div className="text-black"><strong>PIC Default:</strong> {picDefault}</div>
            <div className="text-black"><strong>Inspector:</strong> {user.fullName}</div>
          </div>
        </div>

        {/* Date Selection */}
        <div style={{
          background: "white",
          border: "2px solid #1e88e5",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#0d47a1" }}>📅 Jadwal Inspeksi: Setiap 2 Bulan (Jan, Mar, Mei, Jul, Sep, Nov)</strong>
          </div>

          {/* Input Tanggal Manual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                color : "black",
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "160px"
              }}
            />
          </div>

          {/* Dropdown Riwayat Pengisian */}
          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "700", color: "#0d47a1" }}>Riwayat Isian:</label>
              <select
                value=""
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={{
                  color : "black",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "180px"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate}
                style={{
                  padding: "8px 16px",
                  background: selectedDate ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: selectedDate ? "pointer" : "not-allowed"
                }}
              >
                Muat Data
              </button>
            </div>
          )}
        </div>

        {/* Checksheet Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "20px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1000px" }}>
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>HASIL</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                  {/* ✅ Kolom Dokumentasi */}
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>DOKUMENTASI</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>PIC</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>DUE DATE</th>
                  <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>VERIFY</th>
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item, index) => (
                  <tr key={item.key}>
                    <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                    <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>{item.label}</td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                      <select
                        value={answers[`${item.key}_hasil`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_hasil`, e.target.value)}
                        disabled={!selectedDate}
                        style={{ width: "100%", padding: "6px", border: "1px solid #1e88e5", borderRadius: "4px" }}
                      >
                        <option value="">-</option>
                        <option value="OK">✓ OK</option>
                        <option value="NG">✗ NG</option>
                      </select>
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <textarea
                        value={answers[`${item.key}_keterangan`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_keterangan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Keterangan jika NG..."
                        rows={2}
                        style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical" }}
                      />
                    </td>
                    {/* ✅ Kolom Dokumentasi */}
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => openCamera(item.key)}
                          style={{
                            padding: "4px 8px",
                            background: "#1e88e5",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            cursor: "pointer",
                            textAlign: "center",
                            whiteSpace: "nowrap"
                          }}
                        >
                          📷 Kamera
                        </button>
                        <label
                          htmlFor={`file-${item.key}`}
                          style={{
                            padding: "4px 8px",
                            background: "#4caf50",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            cursor: "pointer",
                            textAlign: "center",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🖼️ File
                        </label>
                        <input
                          id={`file-${item.key}`}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageUpload(e, item.key)}
                          style={{ display: "none" }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {images.filter(img => img.key === item.key).map((img, idx) => (
                            <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}>
                              <img
                                src={img.url}
                                alt={`Dokumentasi ${item.key} ${idx + 1}`}
                                onClick={() => openImageModal(img.url)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "4px"
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(images.findIndex(i => i.key === item.key && i.url === img.url));
                                }}
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "2px",
                                  background: "rgba(0,0,0,0.5)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "16px",
                                  height: "16px",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  padding: "0"
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <textarea
                        value={answers[`${item.key}_tindakan`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_tindakan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Tindakan perbaikan..."
                        rows={2}
                        style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical" }}
                      />
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <input
                        type="text"
                        value={answers[`${item.key}_pic`] || picDefault}
                        onChange={(e) => handleInputChange(`${item.key}_pic`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="PIC"
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <input
                        type="date"
                        value={answers[`${item.key}_dueDate`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_dueDate`, e.target.value)}
                        disabled={!selectedDate}
                        style={{ width: "100%", padding: "6px" }}
                      />
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                      <input
                        type="text"
                        value={answers[`${item.key}_verify`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_verify`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Verifikasi"
                        style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/selang-hydrant")}
            style={{
              padding: "12px 28px",
              background: "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate}
            style={{
              padding: "12px 28px",
              background: selectedDate ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              opacity: selectedDate ? 1 : 0.6
            }}
          >
            ✓ Simpan Data
          </button>
        </div>

        {/* Keterangan Cara Pengecekan */}
        <div style={{
          background: "#f9fbfd",
          border: "1px solid #cfd8dc",
          borderRadius: "12px",
          padding: "20px",
          marginTop: "24px",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#37474f",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          overflowX: "auto"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            color: "#0d47a1",
            fontSize: "16px",
            fontWeight: "700",
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            📋 KETERANGAN CARA PENGECEKAN
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: "1px solid #b3e5fc",
              borderRadius: "8px",
              backgroundColor: "white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "#e3f2fd",
                  borderBottom: "2px solid #1e88e5",
                  textAlign: "left"
                }}>
                  <th style={{
                    padding: "10px 12px",
                    fontWeight: "700",
                    color: "#0d47a1",
                    borderRight: "1px solid #bbdefb"
                  }}>ITEM PENGECEKAN</th>
                  <th style={{
                    padding: "10px 12px",
                    fontWeight: "700",
                    color: "#0d47a1"
                  }}>CARA PENGECEKAN</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    item: "Pressure Tank",
                    ok: "Tekanan pump room sesuai dengan standar",
                    ng: "Tekanan disetting lebih rendah dari standar / pompa tidak layak",
                    cara: "Lihat kondisi selang saat pengecekan, pastikan selang tidak ada kebocoran"
                  },
                  {
                    item: "Hasil Tekanan dg Pitot",
                    ok: "Hasil tekanan sesuai standar yaitu titik terjauh min. 4.5 kg/cm²",
                    ng: "Hasil tekanan di bawah standar (kurang dari 4.5 kg/cm²)",
                    cara: "Gunakan pitot tube pada titik terjauh, catat tekanan dan bandingkan dengan standar"
                  },
                  {
                    item: "Fire Hose / Selang (2)",
                    ok: "Tidak bocor / tidak pecah",
                    ng: "Bocor / pecah",
                    cara: "Lihat kondisi selang saat pengecekan, pastikan selang tidak ada kebocoran atau retak"
                  },
                  {
                    item: "Valve",
                    ok: "Tidak seret / mudah dibuka",
                    ng: "Seret / tidak bisa dibuka",
                    cara: "Pastikan hydrant valve mudah dibuka dan ditutup tanpa hambatan"
                  },
                  {
                    item: "Coupling Nozzle",
                    ok: "Pir tidak rusak / bisa normal kembali saat ditekan",
                    ng: "Pir rusak / tidak bisa kembali ke posisi awal saat ditekan",
                    cara: "Pastikan pir nozzle elastis atau mudah ditekan dan kembali seperti semula, tidak berkarat"
                  },
                  {
                    item: "Coupling Hydrant",
                    ok: "Pir tidak rusak / bisa normal kembali saat ditekan",
                    ng: "Pir rusak / tidak bisa kembali ke posisi awal saat ditekan",
                    cara: "Pastikan pir coupling elastis, tidak berkarat, dan dapat dikunci dengan baik"
                  },
                  {
                    item: "Seal",
                    ok: "Tidak retak & patah, tidak ada kebocoran",
                    ng: "Retak, patah dan ada kebocoran",
                    cara: "Pastikan seal tidak ada kebocoran dan cek apakah ada seal yang retak atau patah"
                  }
                ].map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa"
                  }}>
                    <td style={{
                      padding: "10px 12px",
                      verticalAlign: "top",
                      borderRight: "1px solid #e0e0e0",
                      fontWeight: "600"
                    }}>
                      {item.item}
                      <br />
                      <span style={{ fontSize: "11px", color: "#1e88e5", display: "block", marginTop: "4px" }}>
                        ✓ {item.ok}
                      </span>
                      <span style={{ fontSize: "11px", color: "#d32f2f", display: "block", marginTop: "4px" }}>
                        ✘ {item.ng}
                      </span>
                    </td>
                    <td style={{
                      padding: "10px 12px",
                      verticalAlign: "top"
                    }}>
                      {item.cara}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ Modal Gambar */}
      {showImageModal && (
        <div
          onClick={closeImageModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              textAlign: "center"
            }}
          >
            <img
              src={currentImage}
              alt="Dokumentasi"
              style={{
                maxHeight: "90vh",
                maxWidth: "90vw",
                objectFit: "contain",
                borderRadius: "8px",
                border: "3px solid white",
              }}
            />
            <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
          </div>
        </div>
      )}

      {/* ✅ Modal Kamera */}
      {showCameraModal && (
        <div
          onClick={() => {
            setShowCameraModal(false);
            if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "16px 20px",
              textAlign: "center",
              maxWidth: "90vw",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Ambil Foto</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: "60vh",
                borderRadius: "6px",
                background: "#000",
                transform: "scaleX(-1)"
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={captureImage}
                style={{
                  padding: "10px 20px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                📸 Ambil Foto
              </button>
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                  }
                }}
                style={{
                  padding: "10px 20px",
                  background: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}