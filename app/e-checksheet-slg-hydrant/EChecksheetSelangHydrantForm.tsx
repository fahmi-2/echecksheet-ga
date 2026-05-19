// app/e-checksheet-slg-hydrant/EChecksheetSelangHydrantForm.tsx
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { QrCode } from "lucide-react";

// ✅ Import hook scan verification
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

// ✅ Helper functions (defined ONCE)
const getYear = (dateString: string) => new Date(dateString).getFullYear();
const getMonth = (dateString: string) => new Date(dateString).getMonth();

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const groupDatesByYearMonth = (dates: string[]) => {
  const grouped: Record<number, Record<number, string[]>> = {};
  
  dates.forEach(date => {
    const year = getYear(date);
    const month = getMonth(date);
    
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(date);
  });
  
  Object.values(grouped).forEach(yearData => {
    Object.values(yearData).forEach(monthDates => {
      monthDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    });
  });
  
  return grouped;
};

export function EChecksheetSelangHydrantForm() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const { isScanned, isLoading: scanLoading } = useScanVerification();

  // ✅ Use native URL API instead of useSearchParams
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  const lokasi = getQueryParam('lokasi');
  const zona = getQueryParam('zona');
  const jenisHydrant = getQueryParam('jenisHydrant');
  const picDefault = getQueryParam('pic');
  const TYPE_SLUG = 'selang-hydrant';
  
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState("");
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areaId, setAreaId] = useState<number | null>(null);
  
  // ✅ Filter States for history
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth check
  useEffect(() => {
    if (!isMounted || !isInitialized) return;
    if (authLoading) return;
    if (!user) return;
    if (user.role !== "inspector-ga-fire") {
      router.replace("/login-page");
      return;
    }
  }, [user, authLoading, isInitialized, router, isMounted]);

  // Load inspection items
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  // Load areaId and available dates
  useEffect(() => {
    if (!lokasi || !user) return;
    const loadAreaData = async () => {
      try {
        const areaName = `${lokasi}\u0007${zona}\u0007${jenisHydrant}\u0007${picDefault}`;
        
        const areas = await getAreasByType(TYPE_SLUG);
        const area = areas.find((a: any) => a.name === areaName);
        
        if (area) {
          setAreaId(area.id);
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          setAvailableDates(dates);
          
          if (dates.length > 0) {
            const latestDate = dates[0];
            setSelectedYear(getYear(latestDate));
            setSelectedMonth(getMonth(latestDate));
          }
        } else {
          const fallbackArea = areas.find((a: any) => a.name.startsWith(lokasi));
          if (fallbackArea) {
            setAreaId(fallbackArea.id);
            const dates = await getAvailableDates(TYPE_SLUG, fallbackArea.id);
            setAvailableDates(dates);
            
            if (dates.length > 0) {
              const latestDate = dates[0];
              setSelectedYear(getYear(latestDate));
              setSelectedMonth(getMonth(latestDate));
            }
          } else {
            alert(`Area "${lokasi}" tidak ditemukan.`);
          }
        }
      } catch (error) {
        console.error("❌ Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };
    loadAreaData();
  }, [lokasi, zona, jenisHydrant, picDefault, user]);

  // Filter dates when year or month changes
  useEffect(() => {
    if (selectedYear === "" || selectedMonth === "") {
      setFilteredDates([]);
      return;
    }
    
    const grouped = groupDatesByYearMonth(availableDates);
    const datesForSelection = grouped[selectedYear]?.[selectedMonth] || [];
    
    setFilteredDates(datesForSelection);
    
    if (datesForSelection.length > 0 && !selectedDate) {
      setSelectedDate(datesForSelection[0]);
    }
  }, [selectedYear, selectedMonth, availableDates, selectedDate]);

  // Camera useEffect
  useEffect(() => {
    if (!showCameraModal) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        setCameraStream(stream);
        if (videoRef.current) {
          (videoRef.current as any).srcObject = stream;
        }
      } catch (err) {
        console.error("❌ Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        setShowCameraModal(false);
      }
    };
    startCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

  // Load existing data
  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    try {
      setIsLoading(true);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];

        // ✅ FIX: Single forEach loop (was duplicated causing syntax error)
        Object.entries(data).forEach(([itemKey, entry]: [string, any]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          existingData[`${itemKey}_verify`] = entry.verify || "";

          if (entry.images && Array.isArray(entry.images)) {
            entry.images.forEach((url: string) => {
              loadedImages.push({ key: itemKey, url });
            });
          }
        });

        setAnswers(existingData);
        setImages(loadedImages);
        alert("✅ Data berhasil dimuat!");
      } else {
        alert("⚠️ Tidak ada data untuk tanggal ini.");
        setAnswers({});
        setImages([]);
      }
    } catch (error) {
      console.error("❌ Error loading checklist data:", error);
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save to API
  const handleSave = async () => {
    if (!user) {
      alert("User belum login");
      router.push("/login-page");
      return;
    }
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    const allFieldsFilled = inspectionItems.every((item) => 
      answers[`${item.item_key}_hasil`]
    );

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
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || picDefault,
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: answers[`${item.item_key}_verify`] || "",
          inspector: user.fullName || "",
          images: images
            .filter(img => img.key === item.item_key)
            .map(img => img.url),
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

      alert(`✅ Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/status-ga/selang-hydrant?openArea=${encodeURIComponent(lokasi)}`);
    } catch (error) {
      console.error("❌ Error saving checklist data:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  const openCamera = (itemKey: string) => {
    setCurrentItemKey(itemKey);
    setShowCameraModal(true);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current as any;
    const canvas = canvasRef.current as any;
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

  const getMaxDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
  };

  // Get unique years from available dates
  const availableYears = useMemo(() => {
    const years = new Set(availableDates.map(date => getYear(date)));
    return Array.from(years).sort((a, b) => b - a);
  }, [availableDates]);

  // Show loading during mount/init/auth
  if (!isMounted || !isInitialized || authLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "inspector-ga-fire") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Access Denied</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "32px",
        paddingBottom: "32px",
        maxWidth: "100%",
        margin: "0 auto"
      }}>
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

        {/* Scan Warning Banner */}
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
            <div style={{ color: "black" }}><strong>Zona:</strong> {zona}</div>
            <div style={{ color: "black" }}><strong>Jenis Hydrant:</strong> {jenisHydrant}</div>
            <div style={{ color: "black" }}><strong>Lokasi:</strong> {lokasi}</div>
            <div style={{ color: "black" }}><strong>PIC Default:</strong> {picDefault}</div>
            <div style={{ color: "black" }}><strong>Inspector:</strong> {user.fullName}</div>
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
            <strong style={{ color: "#0d47a1", fontSize: "15px" }}>
              📅 Jadwal Inspeksi: Setiap 2 Bulan (Jan, Mar, Mei, Jul, Sep, Nov)
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>
              Tanggal Inspeksi:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getMaxDate()}
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                color: "#0d47a1",
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "160px",
                background: isScanned ? "white" : "#f5f5f5",
                cursor: isScanned ? "pointer" : "not-allowed"
              }}
            />
          </div>

          {/* History with Year & Month Filter */}
          {availableDates.length > 0 && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              flexWrap: "wrap",
              padding: "12px",
              background: "#f5f9ff",
              borderRadius: "8px",
              border: "1px solid #e3f2fd"
            }}>
              <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>
                📁 Riwayat Isian:
              </label>
              
              {/* Year Dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedYear(year);
                  setSelectedMonth("");
                  setSelectedDate("");
                }}
                style={{
                  color: "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "100px",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                <option value="">— Pilih Tahun —</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {/* Month Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedMonth(month);
                  setSelectedDate("");
                }}
                disabled={selectedYear === ""}
                style={{
                  color: selectedYear === "" ? "#999" : "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "140px",
                  background: "white",
                  cursor: selectedYear === "" ? "not-allowed" : "pointer",
                  fontWeight: "500"
                }}
              >
                <option value="">— Pilih Bulan —</option>
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              
              {/* Date Dropdown */}
              {filteredDates.length > 0 && (
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    color: "#0d47a1",
                    padding: "8px 12px",
                    border: "2px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minWidth: "160px",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  <option value="">— Pilih Tanggal —</option>
                  {filteredDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate || isLoading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  padding: "8px 16px",
                  background: (selectedDate && !isLoading && isScanned) ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: (selectedDate && !isLoading && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                {isLoading ? "⏳ Memuat..." : "📥 Muat Data"}
              </button>
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "#f0f0f0",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#666"
            }}>
              <strong>Debug:</strong> date:{selectedDate || '-'} | yr:{selectedYear || '-'} | mo:{selectedMonth !== "" ? monthNames[selectedMonth] : '-'} | areas:{availableDates.length} | filtered:{filteredDates.length} | areaId:{areaId || 'null'}
            </div>
          )}
        </div>

        {/* Checksheet Table */}
        {inspectionItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "2px dashed #ccc" }}>
            <p style={{ color: "#999", fontSize: "16px", margin: 0 }}>⏳ Loading checklist items...</p>
          </div>
        ) : (
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
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>DOKUMENTASI</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>PIC</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>DUE DATE</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>VERIFY</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionItems.map((item, index) => (
                    <tr key={item.id}>
                      <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                      <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>{item.item_check}</td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                        <select
                          value={answers[`${item.item_key}_hasil`] || ""}
                          onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ 
                            width: "100%", padding: "6px", border: "1px solid #1e88e5", borderRadius: "4px",
                            background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "pointer" : "not-allowed"
                          }}
                        >
                          <option value="">-</option>
                          <option value="OK">✓ OK</option>
                          <option value="NG">✗ NG</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                        <textarea
                          value={answers[`${item.item_key}_keterangan`] || ""}
                          onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Keterangan jika NG..."
                          rows={2}
                          style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical", background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "text" : "not-allowed" }}
                        />
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            onClick={() => openCamera(item.item_key)}
                            disabled={!isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{ padding: "4px 8px", background: isScanned ? "#1e88e5" : "#bdbdbd", color: "white", borderRadius: "4px", fontSize: "11px", cursor: isScanned ? "pointer" : "not-allowed", textAlign: "center", border: "none" }}
                          >
                            📷 Kamera
                          </button>
                          <label
                            htmlFor={`file-${item.item_key}`}
                            style={{ padding: "4px 8px", background: isScanned ? "#4caf50" : "#bdbdbd", color: "white", borderRadius: "4px", fontSize: "11px", cursor: isScanned ? "pointer" : "not-allowed", textAlign: "center", opacity: isScanned ? 1 : 0.6 }}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          >
                            🖼️ File
                          </label>
                          <input
                            id={`file-${item.item_key}`}
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!isScanned}
                            onChange={(e) => handleImageUpload(e, item.item_key)}
                            style={{ display: "none" }}
                          />
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                            {images.filter(img => img.key === item.item_key).map((img, idx) => (
                              <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden" }}>
                                <img
                                  src={img.url}
                                  alt={`Dokumentasi ${item.item_key} ${idx + 1}`}
                                  onClick={() => openImageModal(img.url)}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url));
                                  }}
                                  disabled={!isScanned}
                                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                  style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(244,67,54,0.9)", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "12px", cursor: isScanned ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                          value={answers[`${item.item_key}_tindakan`] || ""}
                          onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Tindakan perbaikan..."
                          rows={2}
                          style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical", background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "text" : "not-allowed" }}
                        />
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                        <input
                          type="text"
                          value={answers[`${item.item_key}_pic`] || picDefault}
                          onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="PIC"
                          style={{ width: "100%", padding: "6px", fontSize: "12px", background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "text" : "not-allowed" }}
                        />
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                        <input
                          type="date"
                          value={answers[`${item.item_key}_dueDate`] || ""}
                          onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          style={{ width: "100%", padding: "6px", background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "pointer" : "not-allowed" }}
                        />
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                        <input
                          type="text"
                          value={answers[`${item.item_key}_verify`] || ""}
                          onChange={(e) => handleInputChange(`${item.item_key}_verify`, e.target.value)}
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Verifikasi"
                          style={{ width: "100%", padding: "6px", fontSize: "12px", background: isScanned ? "white" : "#f5f5f5", cursor: isScanned ? "text" : "not-allowed" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/selang-hydrant")}
            style={{ padding: "12px 28px", background: "#bdbdbd", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isLoading || !areaId || !isScanned}
            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
            style={{
              padding: "12px 28px",
              background: (selectedDate && !isLoading && areaId && isScanned) ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: (selectedDate && !isLoading && areaId && isScanned) ? "pointer" : "not-allowed",
              opacity: (selectedDate && !isLoading && areaId && isScanned) ? 1 : 0.6
            }}
          >
            {isLoading ? "⏳ Menyimpan..." : "✓ Simpan Data"}
          </button>
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div onClick={closeImageModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img src={currentImage} alt="Dokumentasi" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white" }} />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showCameraModal && (
          <div onClick={() => { setShowCameraModal(false); if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "8px", padding: "16px 20px", textAlign: "center", maxWidth: "90vw", width: "100%" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>📸 Ambil Foto</h3>
              <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "60vh", borderRadius: "6px", background: "#000", transform: "scaleX(-1)" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={captureImage} disabled={!isScanned} style={{ padding: "10px 20px", background: isScanned ? "#4caf50" : "#bdbdbd", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: isScanned ? "pointer" : "not-allowed" }}>📸 Ambil Foto</button>
                <button onClick={() => { setShowCameraModal(false); if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); }} style={{ padding: "10px 20px", background: "#757575", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>Batal</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style jsx global>{`
        .banner { border-radius: 10px; padding: 12px 18px; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 13px; }
        .banner-warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; color: #92400e; box-shadow: 0 2px 8px rgba(245,158,11,0.12); }
        .banner-btn { margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 7px; padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 6px rgba(245,158,11,0.3); display: inline-flex; align-items: center; gap: 6px; min-height: 36px; }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .banner-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .scan-warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; justify-content: space-between; }
        .scan-warning .banner-btn { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 8px 16px; }
        .scan-warning .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4); }
        input:disabled, select:disabled, textarea:disabled, button:disabled { background: #f5f5f5 !important; cursor: not-allowed !important; opacity: 0.7; color: #9e9e9e !important; }
        label:has(input:disabled), label:has(select:disabled), label:has(textarea:disabled) { opacity: 0.7; cursor: not-allowed; }
        @media (hover: none) and (pointer: coarse) { input, select, textarea, button { font-size: 16px !important; min-height: 44px !important; } }
        @media (max-width: 768px) { .page-content { padding: 12px !important; } table { font-size: 11px !important; } th, td { padding: 8px 6px !important; } }
      `}</style>
    </div>
  );
}