// app/e-checksheet-hydrant/EChecksheetHydrantForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
// ✅ Import API helper yang reusable
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

export function EChecksheetHydrantForm({
  no,
  lokasi,
  zona,
  jenisHydrant,
}: {
  no: string;
  lokasi: string;
  zona: string;
  jenisHydrant: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'inspeksi-hydrant';
  
  // ✅ SEMUA HOOKS DI ATAS — TANPA KONDISI
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
  
  // ✅ Modal gambar
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  // ✅ Load inspection items dari API berdasarkan type
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, []);

  // ✅ Load areaId dan available dates
  useEffect(() => {
    if (!no || !isMounted) return;
    
    const loadAreaData = async () => {
      try {
        const areas = await (await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`)).json();
        const area = areas.data.find((a: any) => a.no.toString() === no);
        if (area) {
          setAreaId(area.id);
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
      }
    };
    
    loadAreaData();
  }, [no, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // ✅ Save to API (BUKAN localStorage)
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

    // Validasi semua item sudah diisi
    const allFieldsFilled = inspectionItems.every((item) => 
      items[item.item_key]
    );

    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      setIsLoading(true);

      // Format data untuk API
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
          images: [], // Hydrant tidak memiliki upload image per item
          notes: ""
        };
      });

      // Save ke API
      await saveChecklist(
        TYPE_SLUG,
        areaId,
        selectedDate,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );

      alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      
      // Redirect ke status page
      router.push(`/status-ga/inspeksi-hydrant`);
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

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
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data) {
        const existingData: Record<string, string> = {};
        
        // Ambil data dari salah satu item (karena hydrant menggunakan field global)
        const firstItemKey = Object.keys(data)[0];
        const firstItemData = data[firstItemKey];
        
        inspectionItems.forEach((item) => {
          existingData[item.item_key] = data[item.item_key]?.hasilPemeriksaan || "";
        });

        setItems(existingData);
        setKeteranganKondisi(firstItemData?.keteranganTemuan || "");
        setTindakanPerbaikan(firstItemData?.tindakanPerbaikan || "");
        setPic(firstItemData?.pic || "");
        setDueDate(firstItemData?.dueDate || "");
        setVerify(firstItemData?.verify || "");
        
        alert("Data berhasil dimuat!");
      } else {
        alert("Tidak ada data untuk tanggal ini.");
        setItems({});
        setKeteranganKondisi("");
        setTindakanPerbaikan("");
        setPic("");
        setDueDate("");
        setVerify("");
      }
    } catch (error) {
      console.error("Error loading checklist data:", error);
      alert("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setItems((prev) => ({ ...prev, [field]: value }));
  };

  const openImageModal = (imgPath: string) => {
    setCurrentImage(imgPath);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  // Static config untuk hydrant (untuk tampilan)
  const inspectionConfig = [
    { method: "Visually", image: "/hydrant/pillar-hydrant.png" },
    { method: "Visually", image: "/hydrant/pillar-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/id-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Check", image: "/hydrant/safety-valve-open.jpg" },
    { method: "Check", image: "/hydrant/safety-valve-closed.jpg" },
    { method: "Visually", image: "/hydrant/seal-valve.jpg" },
    { method: "Check", image: "/hydrant/nozzle-handle.jpg" },
    { method: "Check", image: "/hydrant/coupling-nozzle.jpg" },
    { method: "Visually", image: "/hydrant/seal-nozzle.jpg" },
    { method: "Check", image: "/hydrant/main-valve.jpg" },
    { method: "Check", image: "/hydrant/main-valve-closed.jpg" },
    { method: "Check", image: "/hydrant/valve-cover.jpg" },
    { method: "Check", image: "/hydrant/valve-lubrication.jpg" },
    { method: "Check", image: "/hydrant/fire-hose.jpg" },
    { method: "Visually", image: "/hydrant/layout-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/pipa-air.jpg" },
    { method: "Visually", image: "/hydrant/cs-os-label.jpg" },
  ];

  if (!isMounted) return null;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        Loading...
      </div>
    );
  }
  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user.fullName} />
      <div style={{
        paddingLeft: "96px",
        paddingRight: "20px",
        paddingTop: "24px",
        paddingBottom: "24px",
        maxWidth: "100%",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              Hydrant Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Monthly inspection checklist (20 items)
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ color: "black" }}><strong>Unit No:</strong> {no}</div>
            <div style={{ color: "black" }}><strong>Location:</strong> {lokasi}</div>
            <div style={{ color: "black" }}><strong>Zone:</strong> {zona}</div>
            <div style={{ color: "black" }}><strong>Type:</strong> {jenisHydrant}</div>
            <div style={{ color: "black" }}><strong>Inspector:</strong> {user.fullName}</div>
          </div>
        </div>

        {/* Date Selection */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "500", color: "#212121", fontSize: "15px" }}>
              Inspection Schedule
            </span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>
              • Every month
            </span>
          </div>

          {/* Input tanggal utama */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>
              Tanggal Inspeksi:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={{
                color: "#212121",
                padding: "7px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: "5px",
                fontSize: "14px",
                outline: "none",
                minWidth: "160px",
              }}
            />
          </div>

          {/* Dropdown riwayat pengisian */}
          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>
                Riwayat Isian:
              </label>
              <select
                value=""
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={{
                  color: "#212121",
                  padding: "7px 12px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "5px",
                  fontSize: "14px",
                  outline: "none",
                  minWidth: "180px",
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate || isLoading}
                style={{
                  padding: "7px 16px",
                  background: selectedDate ? "#ff9800" : "#e0e0e0",
                  color: selectedDate ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "5px",
                  cursor: selectedDate ? "pointer" : "not-allowed",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                {isLoading ? "Memuat..." : "Load Existing"}
              </button>
            </div>
          )}
        </div>

        {/* Tabel Inspeksi */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              minWidth: "2000px",
              fontFamily: "Arial, sans-serif",
            }}>
              <thead>
                <tr style={{ background: "#e3f2fd", borderBottom: "2px solid #1976d2" }}>
                  <th colSpan={2} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "100px" }}>
                      <button onClick={() => openImageModal("/hydrant/pillar-hydrant.png")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>PILLAR HYDRANT</button>
                    </span>
                  </th>
                  <th colSpan={4} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "200px" }}>  
                      <button onClick={() => openImageModal("/hydrant/box-hydrant.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>BOX HYDRANT, ID HYDRANT</button>
                    </span>
                  </th>
                  <th colSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "150px" }}> 
                      <button onClick={() => openImageModal("/hydrant/safety-valve.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>SAFETY VALVE</button>
                    </span>
                  </th>
                  <th colSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "150px" }}>
                      <button onClick={() => openImageModal("/hydrant/nozzle-handle.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>NOZZLE & HANDLE</button>
                    </span>
                  </th>
                  <th colSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "150px" }}>
                      <button onClick={() => openImageModal("/hydrant/main-valve.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>VALVE UTAMA, VALVE A,B</button>
                    </span>
                  </th>
                  <th style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "50px" }}>
                       <button onClick={() => openImageModal("/hydrant/valve-cover.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>PENUTUP VALVE A/B</button>
                    </span>
                  </th>
                  <th style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "50px" }}>
                      <button onClick={() => openImageModal("/hydrant/fire-hose.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>SELANG HYDRANT</button>
                    </span>
                  </th>
                  <th style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "50px" }}>
                      <button onClick={() => openImageModal("/hydrant/layout-hydrant.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>LAYOUT</button>
                    </span>
                  </th>
                  <th style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "50px" }}>
                      <button onClick={() => openImageModal("/hydrant/pipa-air.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>INSTALASI PIPA AIR</button>
                    </span>
                  </th>
                  <th style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px" }}>
                    <span style={{ display: "inline-block", minWidth: "50px" }}>
                      <button onClick={() => openImageModal("/hydrant/cs-os-label.jpg")} style={{ background: "none", border: "none", color: "#1565c0", fontWeight: "700", fontSize: "13px", padding: "4px 8px", cursor: "pointer", textDecoration: "underline" }}>C/S & O/S</button>
                    </span>
                  </th>
                  <th rowSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px", minWidth: "120px" }}>Findings (if NG)</th>
                  <th rowSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px", minWidth: "140px" }}>Corrective Action</th>
                  <th rowSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px", minWidth: "80px" }}>PIC</th>
                  <th rowSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px", minWidth: "90px" }}>Due Date</th>
                  <th rowSpan={3} style={{ padding: "10px 8px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", fontSize: "13px", minWidth: "70px" }}>Verify</th>
                </tr>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                  {[...Array(20)].map((_, i) => (
                    <th key={i} style={{ padding: "8px 6px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "12px", minWidth: "60px" }}>{i + 1}</th>
                  ))}
                </tr>
                <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                  {inspectionConfig.slice(0, 20).map((config, i) => (
                    <td key={i} style={{ padding: "6px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "middle", fontSize: "11px", fontWeight: "600", color: "#555", height: "32px" }}>{config.method}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[...Array(20)].map((_, i) => {
                    const itemKey = `item${i + 1}`;
                    const item = inspectionItems.find(item => item.item_key === itemKey);
                    return (
                      <td key={i} style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "top", height: "60px" }}>
                        <select
                          value={items[itemKey] || ""}
                          onChange={(e) => handleInputChange(itemKey, e.target.value)}
                          disabled={!selectedDate}
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            fontWeight: "500",
                            fontSize: "12px",
                            outline: "none",
                            height: "30px",
                          }}
                        >
                          <option value="">-</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </td>
                    );
                  })}
                  <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top", height: "60px" }}>
                    <textarea 
                      value={keteranganKondisi} 
                      onChange={(e) => setKeteranganKondisi(e.target.value)} 
                      disabled={!selectedDate} 
                      placeholder="Describe issues..." 
                      rows={2} 
                      style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical", border: "1px solid #d0d0d0", borderRadius: "4px", outline: "none", height: "100%" }} 
                    />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top", height: "60px" }}>
                    <textarea 
                      value={tindakanPerbaikan} 
                      onChange={(e) => setTindakanPerbaikan(e.target.value)} 
                      disabled={!selectedDate} 
                      placeholder="Action taken..." 
                      rows={2} 
                      style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical", border: "1px solid #d0d0d0", borderRadius: "4px", outline: "none", height: "100%" }} 
                    />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top", height: "60px" }}>
                    <input 
                      type="text" 
                      value={pic} 
                      onChange={(e) => setPic(e.target.value)} 
                      disabled={!selectedDate} 
                      placeholder="Name" 
                      style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #d0d0d0", borderRadius: "4px", outline: "none", height: "30px" }} 
                    />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top", height: "60px" }}>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)} 
                      disabled={!selectedDate} 
                      style={{ width: "100%", padding: "6px", border: "1px solid #d0d0d0", borderRadius: "4px", outline: "none", fontSize: "12px", height: "30px" }} 
                    />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top", height: "60px" }}>
                    <input 
                      type="text" 
                      value={verify} 
                      onChange={(e) => setVerify(e.target.value)} 
                      disabled={!selectedDate} 
                      placeholder="Name" 
                      style={{ width: "100%", padding: "6px", fontSize: "12px", border: "1px solid #d0d0d0", borderRadius: "4px", outline: "none", height: "30px" }} 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/inspeksi-hydrant")}
            style={{
              padding: "11px 28px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isLoading}
            style={{
              padding: "11px 28px",
              background: selectedDate ? "#1976d2" : "#e0e0e0",
              color: selectedDate ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              opacity: selectedDate ? 1 : 0.6,
              cursor: selectedDate ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? "Menyimpan..." : "Save Inspection"}
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
              padding: "20px",
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img
                src={currentImage}
                alt="Reference"
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
      </div>
    </div>
  );
}