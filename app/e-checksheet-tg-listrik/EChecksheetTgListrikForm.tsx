"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";

// ✅ Import API helper yang reusable
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
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  
  // ✅ Get params dari URL
  const areaName = searchParams.get('areaName') || '';
  const lokasi = searchParams.get('lokasi') || '';
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'tg-listrik';
  
  // ✅ SEMUA HOOKS DI ATAS — TANPA KONDISI
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Load inspection items dari API berdasarkan type
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('✅ Loaded inspection items:', items);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist. Silakan refresh halaman.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load areaId dan available dates - DIPERBAIKI
  useEffect(() => {
    if (!areaName || !isMounted) return;
    
    const loadAreaData = async () => {
      try {
        const areas = await getAreasByType(TYPE_SLUG);
        console.log('🔍 Searching for area:', areaName);
        console.log('📋 Available areas:', areas);
        
        // ✅ PERBAIKAN: Cari area yang exact match
        const area = areas.find((a: any) => a.name === areaName);
        
        if (area) {
          console.log('✅ Found area:', area);
          setAreaId(area.id);
          
          // Load available dates untuk area ini
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          console.log('📅 Available dates:', dates);
          setAvailableDates(dates);
        } else {
          console.warn('⚠️ Area not found:', areaName);
          alert(`Area "${areaName}" tidak ditemukan di database.`);
        }
      } catch (error) {
        console.error("❌ Failed to load area data:", error);
        alert("Gagal memuat data area. Silakan coba lagi.");
      }
    };
    
    loadAreaData();
  }, [areaName, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // ✅ useEffect untuk kamera
  useEffect(() => {
    if (!showCameraModal) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" } // ✅ Gunakan kamera belakang di mobile
        });

        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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

  // ✅ Load existing data dari API
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
      console.log('📥 Loading data for date:', selectedDate);
      
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      console.log('📦 Received data:', data);
      
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];

        Object.entries(data).forEach(([itemKey, entry]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          existingData[`${itemKey}_verify`] = entry.verify || "";

          // ✅ Handle images dari PostgreSQL JSONB
          if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
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
      alert("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Save to API
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
      alert("Area tidak valid! Silakan kembali ke halaman status.");
      return;
    }

    // Validasi semua item sudah diisi
    const allFieldsFilled = inspectionItems.every((item) => 
      answers[`${item.item_key}_hasil`]
    );

    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      setIsLoading(true);
      console.log('💾 Saving checklist data...');

      // Format data untuk API
      const checklistData: ChecklistData = {};
      
      inspectionItems.forEach((item) => {
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || "",
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: answers[`${item.item_key}_verify`] || "",
          inspector: user.fullName || "",
          images: images
            .filter(img => img.key === item.item_key)
            .map(img => img.url),
          notes: ""
        };
      });

      console.log('📤 Checklist data to save:', checklistData);

      // Save ke API
      await saveChecklist(
        TYPE_SLUG,
        areaId,
        selectedDate,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );

      alert(`✅ Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      
      // Redirect ke status page
      router.push(`/status-ga/tg-listrik?openArea=${encodeURIComponent(areaName)}`);
    } catch (error) {
      console.error("❌ Error saving checklist data:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
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

  // ✅ Group items untuk tampilan tabel
  const groupedItems = inspectionItems.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    if (!acc[item.item_group]) acc[item.item_group] = [];
    acc[item.item_group].push(item);
    return acc;
  }, {});

  if (!isMounted) return null;
  
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>Loading...</p>
      </div>
    );
  }
  
  if (!user || (user.role !== "inspector-ga")) {
    return null;
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
              Check Sheet Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Form Pemeriksaan Aerial Work Platform – 2x/bulan
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div className="text-black"><strong>Nama Area:</strong> {areaName}</div>
            <div className="text-black"><strong>Lokasi:</strong> {lokasi}</div>
            <div className="text-black"><strong>PIC:</strong> {user.fullName}</div>
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
            <strong style={{ color: "#0d47a1" }}>📅 Jadwal Inspeksi Bulan Ini (2x)</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                color: "#0d47a1",
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "160px"
              }}
            />
          </div>

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
                  color: "#0d47a1",
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
                disabled={!selectedDate || isLoading}
                style={{
                  padding: "8px 16px",
                  background: (selectedDate && !isLoading) ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: (selectedDate && !isLoading) ? "pointer" : "not-allowed",
                  fontWeight: "600"
                }}
              >
                {isLoading ? "Memuat..." : "Muat Data"}
              </button>
            </div>
          )}
        </div>

        {/* Checksheet Table */}
        {inspectionItems.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            background: "white",
            borderRadius: "12px",
            border: "2px dashed #ccc"
          }}>
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1200px", border: "2px solid #0d47a1" }}>
                {/* Table content sama seperti sebelumnya */}
                <thead>
                  <tr style={{ background: "#e3f2fd" }}>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "40px" }}>No</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "120px" }}>ITEM</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>GAMBAR ITEM</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "200px" }}>ITEM CEK</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>METODE</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>KONDISI</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN HASIL PENGECEKAN</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>DOKUMENTASI</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>DUE DATE</th>
                    <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>VERIFIKASI</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                    <React.Fragment key={groupName}>
                      {groupItems.map((item, index) => (
                        <tr key={item.id}>
                          {index === 0 && (
                            <td rowSpan={groupItems.length} style={{
                              padding: "8px",
                              border: "1px solid #0d47a1",
                              textAlign: "center",
                              fontWeight: "600",
                              verticalAlign: "top"
                            }}>
                              {item.no}
                            </td>
                          )}
                          {index === 0 && (
                            <td rowSpan={groupItems.length} style={{
                              padding: "8px",
                              border: "1px solid #0d47a1",
                              textAlign: "center",
                              fontWeight: "600",
                              verticalAlign: "top"
                            }}>
                              {groupName}
                            </td>
                          )}
                          <td style={{
                            padding: "8px",
                            border: "1px solid #0d47a1",
                            textAlign: "center",
                            verticalAlign: "top"
                          }}>
                            <img
                              src={`/tangga_listrik/${item.image}`}
                              alt={item.item_check}
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                                e.currentTarget.style.backgroundColor = "#f5f5f5";
                                e.currentTarget.style.border = "1px dashed #999";
                              }}
                              style={{
                                maxWidth: "80px",
                                maxHeight: "80px",
                                objectFit: "contain",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageModal(`/tangga_listrik/${item.image}`);
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4", verticalAlign: "top" }}>
                            {item.item_check}
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>
                            {item.method}
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>
                            <select
                              value={answers[`${item.item_key}_hasil`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                              disabled={!selectedDate}
                              style={{
                                width: "100%",
                                padding: "4px",
                                border: "1px solid #1e88e5",
                                borderRadius: "4px",
                                fontSize: "11px"
                              }}
                            >
                              <option value="">-</option>
                              <option value="OK">✓ OK</option>
                              <option value="NG">✗ NG</option>
                            </select>
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <textarea
                              value={answers[`${item.item_key}_keterangan`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                              disabled={!selectedDate}
                              placeholder="Keterangan..."
                              rows={2}
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "11px",
                                resize: "vertical"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button
                                onClick={() => openCamera(item.item_key)}
                                disabled={!selectedDate}
                                style={{
                                  padding: "4px 8px",
                                  background: selectedDate ? "#1e88e5" : "#bdbdbd",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: selectedDate ? "pointer" : "not-allowed",
                                  border: "none"
                                }}
                              >
                                📷 Kamera
                              </button>
                              <label
                                htmlFor={`file-${item.item_key}`}
                                style={{
                                  padding: "4px 8px",
                                  background: selectedDate ? "#4caf50" : "#bdbdbd",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: selectedDate ? "pointer" : "not-allowed",
                                  textAlign: "center"
                                }}
                              >
                                🖼️ File
                              </label>
                              <input
                                id={`file-${item.item_key}`}
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={!selectedDate}
                                onChange={(e) => handleImageUpload(e, item.item_key)}
                                style={{ display: "none" }}
                              />
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                {images.filter(img => img.key === item.item_key).map((img, idx) => (
                                  <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden" }}>
                                    <img
                                      src={img.url}
                                      alt={`Dok ${idx + 1}`}
                                      onClick={() => openImageModal(img.url)}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        cursor: "pointer"
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url));
                                      }}
                                      style={{
                                        position: "absolute",
                                        top: "2px",
                                        right: "2px",
                                        background: "rgba(0,0,0,0.6)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "18px",
                                        height: "18px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <textarea
                              value={answers[`${item.item_key}_tindakan`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                              disabled={!selectedDate}
                              placeholder="Tindakan..."
                              rows={2}
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "11px",
                                resize: "vertical"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <input
                              type="text"
                              value={answers[`${item.item_key}_pic`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                              disabled={!selectedDate}
                              placeholder="PIC"
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "11px"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <input
                              type="date"
                              value={answers[`${item.item_key}_dueDate`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                              disabled={!selectedDate}
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "11px"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                            <input
                              type="text"
                              value={answers[`${item.item_key}_verify`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_verify`, e.target.value)}
                              disabled={!selectedDate}
                              placeholder="Verify"
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "11px"
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
            style={{
              padding: "12px 28px",
              background: "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isLoading || !areaId}
            style={{
              padding: "12px 28px",
              background: (selectedDate && !isLoading && areaId) 
                ? "linear-gradient(135deg, #1e88e5, #0d47a1)" 
                : "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: (selectedDate && !isLoading && areaId) ? "pointer" : "not-allowed",
              opacity: (selectedDate && !isLoading && areaId) ? 1 : 0.6
            }}
          >
            {isLoading ? "⏳ Menyimpan..." : "✓ Simpan Data"}
          </button>
        </div>

        {/* Modal Gambar */}
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
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
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
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
                Click outside to close
              </div>
            </div>
          </div>
        )}

        {/* Modal Kamera */}
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
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>📸 Ambil Foto</h3>
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
    </div>
  );
}