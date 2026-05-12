// app/e-checksheet-tg-listrik/EChecksheetTgListrikForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { QrCode } from "lucide-react";
import React from "react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

import {
  getAreasByType,
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

export function EChecksheetTgListrikForm() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();

  // ✅ FIX: Use native URL API instead of useSearchParams hook to avoid conflicts
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  const areaName = getQueryParam('areaName');
  const lokasi = getQueryParam('lokasi');
  const TYPE_SLUG = 'tg-listrik';
  
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

  // ✅ 3-Dropdown Riwayat States
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  const getYear = (d: string) => new Date(d).getFullYear();
  const getMonth = (d: string) => new Date(d).getMonth();

  const groupDatesByYearMonth = (dates: string[]) => {
    const grouped: Record<number, Record<number, string[]>> = {};
    dates.forEach(date => {
      const y = getYear(date);
      const m = getMonth(date);
      if (!grouped[y]) grouped[y] = {};
      if (!grouped[y][m]) grouped[y][m] = [];
      grouped[y][m].push(date);
    });
    Object.values(grouped).forEach(yd => Object.values(yd).forEach(md => md.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())));
    return grouped;
  };

  const availableYears = (() => {
    const years = new Set(availableDates.map(d => getYear(d)));
    return Array.from(years).sort((a, b) => b - a);
  })();

  // Update filtered dates saat tahun/bulan berubah
  useEffect(() => {
    if (selectedYear === "" || selectedMonth === "") { setFilteredDates([]); return; }
    const grouped = groupDatesByYearMonth(availableDates);
    setFilteredDates(grouped[selectedYear]?.[selectedMonth] || []);
  }, [selectedYear, selectedMonth, availableDates]);

  // Load inspection items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist. Silakan refresh halaman.");
      }
    };
    loadItems();
  }, []);

  // Load areaId dan available dates
  useEffect(() => {
    if (!areaName || !isMounted) return;
    const loadAreaData = async () => {
      try {
        const areas = await getAreasByType(TYPE_SLUG);
        const area = areas.find((a: any) => a.name === areaName);
        if (area) {
          setAreaId(area.id);
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          setAvailableDates(dates);
        } else {
          alert(`Area "${areaName}" tidak ditemukan di database.`);
        }
      } catch (error) {
        console.error("❌ Failed to load area ", error);
        alert("Gagal memuat data area. Silakan coba lagi.");
      }
    };
    loadAreaData();
  }, [areaName, isMounted]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || user.role !== "inspector-ga-equipment") router.push("/login-page");
  }, [user, loading, router, isMounted]);

  // Kamera
  useEffect(() => {
    if (!showCameraModal) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("❌ Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera.");
        setShowCameraModal(false);
      }
    };
    startCamera();
    return () => { if (cameraStream) cameraStream.getTracks().forEach(t => t.stop()); };
  }, [showCameraModal]);

  // ✅ Load existing data
  const handleLoadExisting = async () => {
    if (!selectedDate) { alert("Pilih tanggal terlebih dahulu!"); return; }
    if (!areaId) { alert("Area tidak valid!"); return; }
    try {
      setIsLoading(true);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];
        Object.entries(data).forEach(([itemKey, entry]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || user?.fullName || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          if (entry.images && Array.isArray(entry.images)) {
            entry.images.forEach((url: string) => loadedImages.push({ key: itemKey, url }));
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
      console.error("❌ Error loading:", error);
      alert("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Save
  const handleSave = async () => {
    if (!user) { alert("User belum login"); router.push("/login-page"); return; }
    if (!selectedDate) { alert("Pilih tanggal pemeriksaan terlebih dahulu!"); return; }
    if (!areaId) { alert("Area tidak valid!"); return; }

    const allFieldsFilled = inspectionItems.every(item => answers[`${item.item_key}_hasil`]);
    if (!allFieldsFilled) { alert("Mohon isi Hasil Pemeriksaan untuk semua item!"); return; }

    try {
      setIsLoading(true);
      const checklistData: ChecklistData = {};
      inspectionItems.forEach(item => {
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || user.fullName || "",
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: "",
          inspector: user.fullName || "",
          images: images.filter(img => img.key === item.item_key).map(img => img.url),
          notes: ""
        };
      });

      await saveChecklist(TYPE_SLUG, areaId, selectedDate, checklistData, user.id || "unknown", user.fullName || "Unknown Inspector");

      alert(`✅ Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      
      // Refresh available dates
      const dates = await getAvailableDates(TYPE_SLUG, areaId);
      setAvailableDates(dates);
      
      router.push(`/status-ga/tg-listrik?openArea=${encodeURIComponent(areaName)}`);
    } catch (error) {
      console.error("❌ Error saving:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, { key: itemKey, url: reader.result as string }]);
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));
  const openImageModal = (imgUrl: string) => { setCurrentImage(imgUrl); setShowImageModal(true); };
  const closeImageModal = () => { setShowImageModal(false); setCurrentImage(""); };
  const openCamera = (itemKey: string) => { setCurrentItemKey(itemKey); setShowCameraModal(true); };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImages(prev => [...prev, { key: currentItemKey, url: canvas.toDataURL('image/jpeg', 0.8) }]);
    setShowCameraModal(false);
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  };

  const groupedItems = inspectionItems.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    if (!acc[item.item_group]) acc[item.item_group] = [];
    acc[item.item_group].push(item);
    return acc;
  }, {});

  if (!isMounted) return null;
  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}><p>Loading...</p></div>;
  if (!user || user.role !== "inspector-ga-equipment") return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ paddingLeft: "95px", paddingRight: "25px", paddingTop: "32px", paddingBottom: "32px", maxWidth: "100%", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 4px 12px rgba(13,71,161,0.15)" }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              Check Sheet Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>Form Pemeriksaan Aerial Work Platform – 2x/bulan</p>
          </div>
        </div>

        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
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

        {/* Info */}
        <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ color: "black" }}><strong>Nama Area:</strong> {areaName}</div>
            <div style={{ color: "black" }}><strong>Lokasi:</strong> {lokasi}</div>
            <div style={{ color: "black" }}><strong>Inspector:</strong> {user.fullName}</div>
          </div>
        </div>

        {/* Date Selection + Riwayat 3-Dropdown */}
        <div style={{ background: "white", border: "2px solid #1e88e5", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#0d47a1" }}>📅 Jadwal Inspeksi Bulan Ini (2x)</strong>
          </div>

          {/* Input tanggal baru */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setAnswers({});
                setImages([]);
              }}
              max={new Date().toISOString().split('T')[0]}
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
            {selectedDate && (
              <span style={{ fontSize: "13px", color: "#43a047", fontWeight: "600" }}>
                ✅ Tanggal dipilih — silakan isi form di bawah
              </span>
            )}
          </div>

          {/* ✅ 3-Dropdown Riwayat */}
          {availableDates.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
              padding: "12px", background: "#f5f9ff", borderRadius: "8px", border: "1px solid #e3f2fd"
            }}>
              <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>📁 Muat Riwayat:</label>

              {/* Dropdown Tahun */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedYear(y);
                  setSelectedMonth("");
                  setFilteredDates([]);
                }}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{ 
                  color: "#0d47a1", 
                  padding: "8px 12px", 
                  border: "2px solid #1e88e5", 
                  borderRadius: "6px", 
                  fontSize: "14px", 
                  minWidth: "100px", 
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: isScanned ? "pointer" : "not-allowed",
                  fontWeight: "500" 
                }}
              >
                <option value="">— Tahun —</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              {/* Dropdown Bulan */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const m = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedMonth(m);
                  setFilteredDates([]);
                }}
                disabled={selectedYear === "" || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{ 
                  color: selectedYear === "" || !isScanned ? "#999" : "#0d47a1", 
                  padding: "8px 12px", 
                  border: "2px solid #1e88e5", 
                  borderRadius: "6px", 
                  fontSize: "14px", 
                  minWidth: "140px", 
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: (selectedYear !== "" && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "500" 
                }}
              >
                <option value="">— Bulan —</option>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>

              {/* Dropdown Tanggal */}
              {filteredDates.length > 0 && (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAnswers({});
                    setImages([]);
                  }}
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
                    cursor: isScanned ? "pointer" : "not-allowed",
                    fontWeight: "500" 
                  }}
                >
                  <option value="">— Pilih Tanggal —</option>
                  {filteredDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              )}

              {/* Tombol Muat */}
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
        </div>

        {/* ✅ Tabel Checklist – Hapus kolom VERIFIKASI, PIC auto-fill */}
        {inspectionItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "2px dashed #ccc" }}>
            <p style={{ color: "#999", fontSize: "16px", margin: 0 }}>⏳ Loading checklist items...</p>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", border: "2px solid #0d47a1", marginBottom: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1200px", border: "2px solid #0d47a1" }}>
                <thead>
                  <tr style={{ background: "#e3f2fd" }}>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "40px" }}>No</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "120px" }}>ITEM</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>GAMBAR</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "200px" }}>ITEM CEK</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>METODE</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>KONDISI</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "150px" }}>DOKUMENTASI</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>PIC</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "110px" }}>DUE DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                    <React.Fragment key={groupName}>
                      {groupItems.map((item, index) => (
                        <tr key={item.id} style={{ background: index % 2 === 0 ? "white" : "#fafcff" }}>
                          {index === 0 && (
                            <td rowSpan={groupItems.length} style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600", verticalAlign: "top" }}>
                              {item.no}
                            </td>
                          )}
                          {index === 0 && (
                            <td rowSpan={groupItems.length} style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600", verticalAlign: "top", lineHeight: "1.4" }}>
                              {groupName}
                            </td>
                          )}
                          {/* Gambar item */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>
                            <img
                              src={`/tangga_listrik/${item.image}`}
                              alt={item.item_check}
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' font-size='10' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Img%3C/text%3E%3C/svg%3E";
                              }}
                              style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                              onClick={() => openImageModal(`/tangga_listrik/${item.image}`)}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4", verticalAlign: "top" }}>{item.item_check}</td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>{item.method}</td>
                          {/* KONDISI */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>
                            <select
                              value={answers[`${item.item_key}_hasil`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              style={{ 
                                width: "100%", 
                                padding: "4px", 
                                border: "1px solid #1e88e5", 
                                borderRadius: "4px", 
                                fontSize: "11px",
                                background: isScanned ? "white" : "#f5f5f5",
                                cursor: isScanned ? "pointer" : "not-allowed"
                              }}
                            >
                              <option value="">-</option>
                              <option value="OK">✓ OK</option>
                              <option value="NG">✗ NG</option>
                            </select>
                          </td>
                          {/* KETERANGAN */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <textarea
                              value={answers[`${item.item_key}_keterangan`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="Keterangan..."
                              rows={2}
                              style={{ 
                                width: "100%", 
                                padding: "4px", 
                                fontSize: "11px", 
                                resize: "vertical",
                                background: isScanned ? "white" : "#f5f5f5",
                                cursor: isScanned ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          {/* DOKUMENTASI */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button
                                onClick={() => openCamera(item.item_key)}
                                disabled={!isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                style={{ 
                                  padding: "4px 8px", 
                                  background: isScanned ? "#1e88e5" : "#bdbdbd", 
                                  color: "white", 
                                  borderRadius: "4px", 
                                  fontSize: "11px", 
                                  cursor: isScanned ? "pointer" : "not-allowed", 
                                  border: "none", 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "4px", 
                                  justifyContent: "center" 
                                }}
                              >
                                📷 Kamera
                              </button>
                              <label
                                htmlFor={`file-${item.item_key}`}
                                style={{ 
                                  padding: "4px 8px", 
                                  background: isScanned ? "#4caf50" : "#bdbdbd", 
                                  color: "white", 
                                  borderRadius: "4px", 
                                  fontSize: "11px", 
                                  cursor: isScanned ? "pointer" : "not-allowed", 
                                  textAlign: "center",
                                  opacity: isScanned ? 1 : 0.6
                                }}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                🖼️ File
                              </label>
                              <input id={`file-${item.item_key}`} type="file" accept="image/*" multiple disabled={!isScanned} onChange={(e) => handleImageUpload(e, item.item_key)} style={{ display: "none" }} />
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                {images.filter(img => img.key === item.item_key).map((img, idx) => (
                                  <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden" }}>
                                    <img src={img.url} alt={`Dok ${idx + 1}`} onClick={() => openImageModal(img.url)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url)); }}
                                      disabled={!isScanned}
                                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                      style={{ 
                                        position: "absolute", 
                                        top: "2px", 
                                        right: "2px", 
                                        background: isScanned ? "rgba(244,67,54,0.9)" : "rgba(200,200,200,0.9)", 
                                        color: "white", 
                                        border: "none", 
                                        borderRadius: "50%", 
                                        width: "18px", 
                                        height: "18px", 
                                        fontSize: "12px", 
                                        cursor: isScanned ? "pointer" : "not-allowed", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center" 
                                      }}
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                          {/* TINDAKAN */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <textarea
                              value={answers[`${item.item_key}_tindakan`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="Tindakan..."
                              rows={2}
                              style={{ 
                                width: "100%", 
                                padding: "4px", 
                                fontSize: "11px", 
                                resize: "vertical",
                                background: isScanned ? "white" : "#f5f5f5",
                                cursor: isScanned ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          {/* ✅ PIC - otomatis terisi nama user, masih bisa diedit */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <input
                              type="text"
                              value={answers[`${item.item_key}_pic`] !== undefined ? answers[`${item.item_key}_pic`] : (selectedDate ? user.fullName : "")}
                              onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="PIC"
                              style={{ 
                                width: "100%", 
                                padding: "4px", 
                                fontSize: "11px",
                                background: isScanned ? "white" : "#f5f5f5",
                                cursor: isScanned ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          {/* DUE DATE */}
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <input
                              type="date"
                              value={answers[`${item.item_key}_dueDate`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                              disabled={!isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              style={{ 
                                width: "100%", 
                                padding: "4px", 
                                fontSize: "11px",
                                background: isScanned ? "white" : "#f5f5f5",
                                cursor: isScanned ? "pointer" : "not-allowed"
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/tg-listrik")}
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

        {/* Modal Gambar */}
        {showImageModal && (
          <div onClick={closeImageModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img src={currentImage} alt="Dokumentasi" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white" }} />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
            </div>
          </div>
        )}

        {/* Modal Kamera */}
        {showCameraModal && (
          <div
            onClick={() => { setShowCameraModal(false); if (cameraStream) cameraStream.getTracks().forEach(t => t.stop()); }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "8px", padding: "16px 20px", textAlign: "center", maxWidth: "90vw", width: "100%" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>📸 Ambil Foto</h3>
              <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "60vh", borderRadius: "6px", background: "#000", transform: "scaleX(-1)" }} />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
                <button 
                  onClick={captureImage} 
                  disabled={!isScanned}
                  style={{ 
                    padding: "10px 20px", 
                    background: isScanned ? "#4caf50" : "#bdbdbd", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "6px", 
                    fontWeight: "600", 
                    cursor: isScanned ? "pointer" : "not-allowed" 
                  }}
                >📸 Ambil Foto</button>
                <button onClick={() => { setShowCameraModal(false); if (cameraStream) cameraStream.getTracks().forEach(t => t.stop()); }} style={{ padding: "10px 20px", background: "#757575", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>Batal</button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
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
          
          @media (max-width: 480px) {
            div[style*="paddingLeft"] { padding-left: 15px !important; padding-right: 12px !important; }
          }
          
          *, *::before, *::after { box-sizing: border-box; }
          img, svg, video { max-width: 100%; height: auto; display: block; }
          html, body { overflow-x: hidden; width: 100%; min-width: 0; }
        `}</style>
      </div>
    </div>
  );
}