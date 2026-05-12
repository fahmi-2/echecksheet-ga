// app/e-checksheet-hydrant/EChecksheetHydrantForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { QrCode, Camera, Upload, X } from "lucide-react";

// ✅ HOOK SCAN VERIFICATION - Tetap digunakan
import { useScanVerification } from "@/lib/hooks/useScanVerification";

import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  getAreasByType,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

export function EChecksheetHydrantForm() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ HOOK SCAN VERIFICATION
  const { isScanned, isLoading: scanLoading } = useScanVerification();

  // ✅ FIX: Use native URL API instead of useSearchParams hook
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  const no = getQueryParam('no');
  const lokasi = getQueryParam('lokasi');
  const zona = getQueryParam('zona');
  const jenisHydrant = getQueryParam('jenisHydrant');

  const TYPE_SLUG = 'inspeksi-hydrant';
  
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [items, setItems] = useState<Record<string, string>>({});
  const [keteranganKondisi, setKeteranganKondisi] = useState("");
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState("");
  const [pic, setPic] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [verify, setVerify] = useState("");
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Image states
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  
  // 🔹 NATIVE CAMERA INPUT - Gantikan WebRTC
  const [showNativeCamera, setShowNativeCamera] = useState(false);
  const [currentItemKeyForCamera, setCurrentItemKeyForCamera] = useState("");
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || user.role !== "inspector-ga-fire") {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (!no || !isMounted) return;
    const loadAreaData = async () => {
      try {
        const areas = await getAreasByType(TYPE_SLUG);
        const area = areas.find((a: any) => a.no.toString() === no);
        if (area) {
          setAreaId(area.id);
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          setAvailableDates(dates);
        } else {
          alert(`Area dengan nomor "${no}" tidak ditemukan.`);
        }
      } catch (error) {
        console.error("❌ Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };
    loadAreaData();
  }, [no, isMounted]);

  // 🔹 HAPUS: useEffect untuk WebRTC camera (tidak lagi digunakan)

  const handleLoadExisting = async () => {
    if (!selectedDate || !areaId) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }
    try {
      setIsLoading(true);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];

        inspectionItems.forEach((item) => {
          const itemData = data[item.item_key];
          existingData[item.item_key] = itemData?.hasilPemeriksaan || "";
          if (itemData?.images && Array.isArray(itemData.images)) {
            itemData.images.forEach((url: string) => {
              loadedImages.push({ key: item.item_key, url });
            });
          }
        });

        setItems(existingData);
        setImages(loadedImages);
        const firstItemKey = inspectionItems[0]?.item_key;
        setKeteranganKondisi(data[firstItemKey]?.keteranganTemuan || "");
        setTindakanPerbaikan(data[firstItemKey]?.tindakanPerbaikan || "");
        setPic(data[firstItemKey]?.pic || "");
        setDueDate(data[firstItemKey]?.dueDate || "");
        setVerify(data[firstItemKey]?.verify || "");
        alert("✅ Data berhasil dimuat!");
      } else {
        alert("⚠️ Tidak ada data untuk tanggal ini.");
        resetForm();
      }
    } catch (error) {
      console.error("❌ Error loading checklist data:", error);
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setItems({});
    setImages([]);
    setKeteranganKondisi("");
    setTindakanPerbaikan("");
    setPic("");
    setDueDate("");
    setVerify("");
  };

  const handleSave = async () => {
    if (!user || !selectedDate || !areaId) {
      alert("Lengkapi data terlebih dahulu!");
      return;
    }
    const allFieldsFilled = inspectionItems.every((item) => items[item.item_key]);
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }
    try {
      setIsLoading(true);
      const checklistData: ChecklistData = {};
      inspectionItems.forEach((item) => {
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: items[item.item_key] || "",
          keteranganTemuan: keteranganKondisi,
          tindakanPerbaikan: tindakanPerbaikan,
          pic: pic,
          dueDate: dueDate,
          verify: verify,
          inspector: user.fullName || "",
          images: images.filter(img => img.key === item.item_key).map(img => img.url),
          notes: ""
        };
      });
      await saveChecklist(
        TYPE_SLUG,
        areaId,
        selectedDate,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );
      alert(`✅ Data berhasil disimpan!`);
      router.push(`/status-ga/inspeksi-hydrant`);
    } catch (error) {
      console.error("❌ Error saving:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setItems((prev) => ({ ...prev, [field]: value }));
  };

  // 🔹 IMAGE UPLOAD HANDLER - Untuk native camera & gallery
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
    
    // Reset input agar bisa pilih file yang sama lagi
    event.target.value = "";
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Open image modal
  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  // 🔹 OPEN NATIVE CAMERA - Trigger input file dengan capture
  const openNativeCamera = (itemKey: string) => {
    setCurrentItemKeyForCamera(itemKey);
    setShowNativeCamera(true);
    // Trigger click setelah state update
    setTimeout(() => {
      nativeCameraInputRef.current?.click();
    }, 100);
  };

  // 🔹 HANDLE NATIVE CAMERA RESULT
  const handleNativeCameraResult = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setShowNativeCamera(false);
      setCurrentItemKeyForCamera("");
      return;
    }
    
    // Proses file seperti upload biasa
    handleImageUpload(event, currentItemKeyForCamera);
    setShowNativeCamera(false);
    setCurrentItemKeyForCamera("");
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
  };

  if (!isMounted || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (!user || user.role !== "inspector-ga-fire") {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(25,118,210,0.2)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "28px", fontWeight: "700" }}>
              🔥 Hydrant Inspection Form
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Monthly inspection checklist • {inspectionItems.length} items
            </p>
          </div>
        </div>

        {/* ✅ SCAN WARNING BANNER */}
        {!isScanned && (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={isLoading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}

        {/* Info Card */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <InfoItem label="Unit No" value={no} />
            <InfoItem label="Location" value={lokasi} />
            <InfoItem label="Zone" value={zona} />
            <InfoItem label="Type" value={jenisHydrant} />
            <InfoItem label="Inspector" value={user.fullName} />
            <InfoItem label="Frequency" value="Monthly" />
          </div>
        </div>

        {/* Date Selection */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "600", color: "#212121", fontSize: "16px" }}>📅 Inspection Schedule</span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>• Every month</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "600", color: "#424242", fontSize: "14px" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getMaxDate()}
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                color: "#212121",
                padding: "10px 14px",
                border: "2px solid #1976d2",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                minWidth: "180px",
                background: isScanned ? "white" : "#f5f5f5",
                cursor: isScanned ? "pointer" : "not-allowed"
              }}
            />
          </div>
          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "600", color: "#424242", fontSize: "14px" }}>Riwayat Isian:</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  color: "#212121",
                  padding: "10px 14px",
                  border: "2px solid #1976d2",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  minWidth: "200px",
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: isScanned ? "pointer" : "not-allowed"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate || isLoading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  padding: "10px 20px",
                  background: (selectedDate && isScanned) ? "#ff9800" : "#e0e0e0",
                  color: (selectedDate && isScanned) ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                {isLoading ? "Memuat..." : "Load Data"}
              </button>
            </div>
          )}
        </div>

        {/* Reference Images */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px",
          border: "1px solid #e0e0e0"
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "15px", fontWeight: "600" }}>
            📷 Reference Images
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <RefButton label="Pillar Hydrant" onClick={() => openImageModal("/hydrant/pillar-hydrant.png")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Box Hydrant" onClick={() => openImageModal("/hydrant/box-hydrant.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Safety Valve" onClick={() => openImageModal("/hydrant/safety-valve.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Nozzle & Handle" onClick={() => openImageModal("/hydrant/nozzle-handle.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Main Valve" onClick={() => openImageModal("/hydrant/main-valve.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Valve Cover" onClick={() => openImageModal("/hydrant/valve-cover.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Fire Hose" onClick={() => openImageModal("/hydrant/fire-hose.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
            <RefButton label="Layout" onClick={() => openImageModal("/hydrant/layout-hydrant.jpg")} disabled={!isScanned} title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""} />
          </div>
        </div>

        {/* Checksheet Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
          marginBottom: "20px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1400px" }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)", borderBottom: "2px solid #1976d2" }}>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "60px" }}>No</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "left", minWidth: "200px" }}>Item Check</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "100px" }}>Hasil</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "80px" }}>Metode</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "150px" }}>Keterangan Temuan</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "150px" }}>Tindakan Perbaikan</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "100px" }}>PIC</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "110px" }}>Due Date</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "100px" }}>Verify</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "180px" }}>Dokumentasi</th>
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item, index) => {
                  const itemImages = images.filter(img => img.key === item.item_key);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #e0e0e0", background: index % 2 === 0 ? "#ffffff" : "#f9f9f9" }}>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600", color: "#555" }}>{index + 1}</td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <div style={{ fontWeight: "600", color: "#212121", marginBottom: "4px" }}>{item.item_check}</div>
                        {item.item_group && <div style={{ fontSize: "12px", color: "#757575" }}>{item.item_group}</div>}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                        <select
                          value={items[item.item_key] || ""}
                          onChange={(e) => handleInputChange(item.item_key, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #1976d2",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "13px",
                            outline: "none",
                            background: isScanned ? "white" : "#f5f5f5",
                            color: isScanned ? "#212121" : "#9e9e9e",
                            cursor: isScanned ? "pointer" : "not-allowed"
                          }}
                        >
                          <option value="">-</option>
                          <option value="OK" style={{ color: "green" }}>✓ OK</option>
                          <option value="NG" style={{ color: "red" }}>✗ NG</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", color: "#757575", fontSize: "12px" }}>
                        {item.method || 'Visual'}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <textarea
                          value={keteranganKondisi}
                          onChange={(e) => setKeteranganKondisi(e.target.value)}
                          disabled={!isScanned}
                          placeholder="Jika NG..."
                          rows={2}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", 
                            padding: "6px", 
                            fontSize: "12px", 
                            resize: "vertical", 
                            border: "1px solid #1976d2", 
                            borderRadius: "6px", 
                            outline: "none", 
                            background: isScanned ? "white" : "#f5f5f5",
                            cursor: isScanned ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <textarea
                          value={tindakanPerbaikan}
                          onChange={(e) => setTindakanPerbaikan(e.target.value)}
                          disabled={!isScanned}
                          placeholder="Tindakan..."
                          rows={2}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", 
                            padding: "6px", 
                            fontSize: "12px", 
                            resize: "vertical", 
                            border: "1px solid #1976d2", 
                            borderRadius: "6px", 
                            outline: "none", 
                            background: isScanned ? "white" : "#f5f5f5",
                            cursor: isScanned ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="text"
                          value={pic}
                          onChange={(e) => setPic(e.target.value)}
                          disabled={!isScanned}
                          placeholder="Nama PIC"
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", 
                            padding: "6px", 
                            fontSize: "12px", 
                            border: "1px solid #1976d2", 
                            borderRadius: "6px", 
                            outline: "none", 
                            background: isScanned ? "white" : "#f5f5f5",
                            cursor: isScanned ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", 
                            padding: "6px", 
                            fontSize: "12px", 
                            border: "1px solid #1976d2", 
                            borderRadius: "6px", 
                            outline: "none", 
                            background: isScanned ? "white" : "#f5f5f5",
                            cursor: isScanned ? "pointer" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="text"
                          value={verify}
                          onChange={(e) => setVerify(e.target.value)}
                          disabled={!isScanned}
                          placeholder="Verifier"
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", 
                            padding: "6px", 
                            fontSize: "12px", 
                            border: "1px solid #1976d2", 
                            borderRadius: "6px", 
                            outline: "none", 
                            background: isScanned ? "white" : "#f5f5f5",
                            cursor: isScanned ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {/* 🔹 TOMBOL KAMERA - Menggunakan Native Camera Input */}
                            <button
                              onClick={() => openNativeCamera(item.item_key)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                background: isScanned ? "#1976d2" : "#e0e0e0",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: isScanned ? "pointer" : "not-allowed",
                                fontWeight: "500",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px"
                              }}
                            >
                              <Camera size={14} /> Kamera
                            </button>
                            
                            {/* 🔹 TOMBOL UPLOAD - Gallery */}
                            <label
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                background: isScanned ? "#4caf50" : "#e0e0e0",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "12px",
                                textAlign: "center",
                                cursor: isScanned ? "pointer" : "not-allowed",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                opacity: isScanned ? 1 : 0.6
                              }}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            >
                              <Upload size={14} /> Upload
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={!isScanned}
                                onChange={(e) => handleImageUpload(e, item.item_key)}
                                style={{ display: "none" }}
                              />
                            </label>
                          </div>
                          
                          {/* 🔹 NATIVE CAMERA HIDDEN INPUT */}
                          <input
                            ref={nativeCameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleNativeCameraResult}
                            className="hidden"
                            disabled={!isScanned}
                          />
                          
                          {itemImages.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {itemImages.map((img, idx) => {
                                const globalIndex = images.findIndex(i => i.key === item.item_key && i.url === img.url);
                                return (
                                  <div key={idx} style={{ position: "relative", width: "50px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #ddd" }}>
                                    <img
                                      src={img.url}
                                      alt={`Doc ${idx+1}`}
                                      onClick={() => openImageModal(img.url)}
                                      style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(globalIndex);
                                      }}
                                      disabled={!isScanned}
                                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                      style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-4px",
                                        width: "16px",
                                        height: "16px",
                                        background: isScanned ? "rgba(244,67,54,0.9)" : "rgba(200,200,200,0.9)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        fontSize: "11px",
                                        cursor: isScanned ? "pointer" : "not-allowed",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/inspeksi-hydrant")}
            style={{
              padding: "12px 32px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isLoading || !areaId || !isScanned}
            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
            style={{
              padding: "12px 32px",
              background: (selectedDate && !isLoading && areaId && isScanned) ? "#1976d2" : "#e0e0e0",
              color: (selectedDate && !isLoading && areaId && isScanned) ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: (selectedDate && !isLoading && areaId && isScanned) ? "pointer" : "not-allowed"
            }}
          >
            {isLoading ? "⏳ Menyimpan..." : "💾 Simpan Data"}
          </button>
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div
            onClick={closeImageModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img
                src={currentImage}
                alt="Preview"
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "4px solid white"
                }}
              />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
                Click outside to close
              </div>
            </div>
          </div>
        )}

        {/* 🔹 HAPUS: Camera Modal WebRTC - Tidak lagi digunakan */}
        
        {/* 🔹 INFO BOX: Penjelasan Native Camera */}
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "12px",
          padding: "16px 20px",
          maxWidth: "700px",
          margin: "20px auto",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#92400e", fontSize: "13px", fontWeight: "500" }}>
            💡 <strong>Tips Kamera:</strong> Tombol "Kamera" akan membuka kamera native perangkat Anda. 
            Fitur ini bekerja di koneksi HTTP. Untuk pengalaman live scan yang lebih baik, 
            gunakan koneksi HTTPS.
          </p>
        </div>
      </div>

      {/* ✅ CSS STYLES */}
      <style jsx global>{`
        .hidden { display: none !important; }
        .banner {
          border-radius: 10px; 
          padding: 12px 18px; 
          margin-bottom: 18px;
          display: flex; 
          align-items: center; 
          gap: 10px; 
          font-weight: 500;
          font-size: 13px;
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; 
          color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-btn {
          margin-left: auto; 
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; 
          border: none; 
          border-radius: 7px; 
          padding: 8px 16px;
          cursor: pointer; 
          font-size: 12px; 
          font-weight: 600; 
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          min-height: 36px;
        }
        .banner-btn:hover { 
          transform: translateY(-1px); 
          box-shadow: 0 4px 10px rgba(245,158,11,0.4); 
        }
        .banner-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
          transform: none; 
        }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; 
          justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 8px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px); 
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }
        
        /* Disabled states for form elements */
        input:disabled,
        select:disabled,
        textarea:disabled,
        button:disabled {
          background: #f5f5f5 !important;
          cursor: not-allowed !important;
          opacity: 0.7;
          color: #9e9e9e !important;
        }
        
        label:has(input:disabled),
        label:has(select:disabled),
        label:has(textarea:disabled) {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        /* Touch-friendly for mobile */
        @media (hover: none) and (pointer: coarse) {
          input, select, textarea, button {
            font-size: 16px !important;
            min-height: 44px !important;
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .page-content {
            padding: 12px !important;
          }
          table {
            font-size: 11px !important;
          }
          th, td {
            padding: 8px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Sub-components
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "#757575", fontSize: "12px", fontWeight: "500" }}>{label}:</span>
      <div style={{ color: "#212121", fontWeight: "600", fontSize: "14px", marginTop: "4px" }}>{value || '-'}</div>
    </div>
  );
}

function RefButton({ label, onClick, disabled, title }: { label: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: "8px 16px",
        background: disabled ? "#e0e0e0" : "#e3f2fd",
        color: disabled ? "#9e9e9e" : "#1976d2",
        border: `1px solid ${disabled ? "#ccc" : "#1976d2"}`,
        borderRadius: "6px",
        fontSize: "12px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "500",
        opacity: disabled ? 0.6 : 1
      }}
    >
      {label}
    </button>
  );
}