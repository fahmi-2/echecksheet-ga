// app/e-checksheet-lift-barang/EChecksheetLiftBarangForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";
// ✅ Import API helper yang reusable
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  getAreasByType,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

export function EChecksheetLiftBarangForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ Gunakan useSearchParams untuk membaca parameter
  const liftName = searchParams.get('liftName') || '';
  const area = searchParams.get('area') || '';
  const lokasi = searchParams.get('lokasi') || '';
  const TYPE_SLUG = 'lift-barang';
  
  // ✅ CRITICAL FIX: State untuk tracking auth verification
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date();

  // Helper function untuk format tanggal
  const formatDateKey = (day: number): string => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };

  const getMonthYear = () => {
    return currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const isDateEditable = (day: number): boolean => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cellDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    return cellDate.getTime() === todayDate.getTime();
  };

  const getDateStatus = (day: number): 'past' | 'today' | 'future' => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cellDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    if (cellDate.getTime() < todayDate.getTime()) return 'past';
    if (cellDate.getTime() === todayDate.getTime()) return 'today';
    return 'future';
  };

  // ✅ Load inspection items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load areaId dan available dates - HANYA SETELAH AUTH VERIFIED
  useEffect(() => {
    if (!liftName || !area || !lokasi || !isMounted || !authVerified) return;
    
    const loadAreaData = async () => {
      try {
        // Format area name sesuai database: "NAMA LIFT \u0007 AREA \u0007 LOKASI"
        const areaName = `${liftName} \u0007 ${area} \u0007 ${lokasi}`;
        
        const areas = await getAreasByType(TYPE_SLUG);
        const areaItem = areas.find((a: any) => a.name === areaName);
        
        if (areaItem) {
          setAreaId(areaItem.id);
          
          // Load available dates untuk area ini
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
          
          // Load data untuk bulan ini
          await loadMonthData(areaItem.id, currentMonth, dates);
        } else {
          console.warn(`Area not found: ${areaName}`);
          alert(`Area "${liftName}" tidak ditemukan di database.`);
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };

    loadAreaData();
  }, [liftName, area, lokasi, isMounted, authVerified, currentMonth]);

  // ✅ Load data untuk bulan tertentu
  const loadMonthData = async (areaId: number, monthDate: Date, allDates: string[]) => {
    setIsLoading(true);
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Filter tanggal yang ada di bulan ini
      const datesInMonth = allDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= firstDay && date <= lastDay;
      });

      // Fetch data untuk setiap tanggal di bulan ini
      const newData: Record<string, Record<string, string>> = {};
      
      for (const dateStr of datesInMonth) {
        try {
          const data = await getChecklistByDate(TYPE_SLUG, areaId, dateStr);
          
          if (data) {
            const convertedData: Record<string, string> = {};
            
            // Ambil inspector dari item pertama (semua item memiliki inspector yang sama per hari)
            let inspector = "";
            
            Object.entries(data).forEach(([itemKey, entry]) => {
              // Konversi hasil pemeriksaan
              if (entry.hasilPemeriksaan === "OK") {
                convertedData[itemKey] = "✓";
              } else if (entry.hasilPemeriksaan === "NG") {
                convertedData[itemKey] = "✗";
              } else {
                convertedData[itemKey] = "";
              }
              
              // Ambil inspector dari entry pertama
              if (!inspector && entry.inspector) {
                inspector = entry.inspector;
              }
            });
            
            convertedData["inspector"] = inspector || "";
            newData[dateStr] = convertedData;
          }
        } catch (error) {
          console.error(`Error loading data for ${dateStr}:`, error);
        }
      }
      
      setAnswers(newData);
    } catch (error) {
      console.error("Error loading month data:", error);
      alert("Gagal memuat data bulan ini.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ CRITICAL FIX: Authentication verification dengan state tracking dan delay
  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) {
      console.log('⏳ Auth still loading or component not mounted');
      setAuthVerified(false);
      return;
    }

    if (user && user.role === "inspector-ga") {
      console.log('✅ Auth verified successfully');
      setAuthVerified(true);
      return;
    }

    // Beri waktu 1.5 detik sebelum redirect
    const verificationTimeout = setTimeout(() => {
      if (!user || user.role !== "inspector-ga") {
        console.error('❌ Auth verification failed after delay:', { user, authLoading });
        router.push("/login-page");
      } else {
        setAuthVerified(true);
      }
    }, 1500);

    return () => clearTimeout(verificationTimeout);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Handle perubahan input (hanya untuk hari ini)
  const handleInputChange = (dateKey: string, itemKey: string, value: string, day: number) => {
    if (!isDateEditable(day)) {
      alert("Anda hanya dapat mengisi data untuk hari ini!");
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [itemKey]: value,
      },
    }));
  };

  // ✅ Handle perubahan inspector (hanya untuk hari ini)
  const handleInspectorChange = (dateKey: string, value: string, day: number) => {
    if (!isDateEditable(day)) {
      alert("Anda hanya dapat mengisi data untuk hari ini!");
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        inspector: value,
      },
    }));
  };

  // ✅ Save to API (hanya untuk hari ini)
  const handleSave = async () => {
    if (!user) {
      alert("User belum login");
      router.push("/login-page");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }

    // Format today's date
    const todayDateKey = formatDateKey(today.getDate());

    // Validasi: pastikan semua item diisi untuk hari ini
    const todayData = answers[todayDateKey] || {};
    const allItemsFilled = inspectionItems.every((item) => 
      todayData[item.item_key] === "✓" || todayData[item.item_key] === "✗"
    );

    if (!allItemsFilled) {
      alert("Mohon isi semua item untuk hari ini!");
      return;
    }

    if (!todayData.inspector || todayData.inspector.trim() === "") {
      alert("Mohon isi nama inspector untuk hari ini!");
      return;
    }

    try {
      setIsSaving(true);

      // Format data untuk API (konversi "✓"/"✗" ke "OK"/"NG")
      const checklistData: ChecklistData = {};
      
      inspectionItems.forEach((item) => {
        const value = todayData[item.item_key] || "";
        const hasilPemeriksaan = value === "✓" ? "OK" : value === "✗" ? "NG" : "";
        
        checklistData[item.item_key] = {
          date: todayDateKey,
          hasilPemeriksaan,
          keteranganTemuan: "",
          tindakanPerbaikan: "",
          pic: "",
          dueDate: "",
          verify: "",
          inspector: todayData.inspector || user.fullName || "",
          images: [],
          notes: ""
        };
      });

      // Save ke API
      await saveChecklist(
        TYPE_SLUG,
        areaId,
        todayDateKey,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );

      alert(`Data berhasil disimpan untuk tanggal ${today.toLocaleDateString("id-ID")}`);
      
      // Reload data bulan ini untuk update tampilan
      if (areaId) {
        await loadMonthData(areaId, currentMonth, availableDates);
      }
      
      // Redirect ke status page setelah 500ms
      setTimeout(() => {
        router.push(`/status-ga/lift-barang?openLift=${encodeURIComponent(liftName)}`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ CRITICAL FIX: Tampilkan loading screen selama auth belum verified
  if (!isMounted || !isInitialized || !authVerified) {
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
          <p style={{ fontSize: "16px", color: "#666" }}>
            {authLoading ? "Loading authentication..." : "Verifying session..."}
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ✅ Hanya render UI jika auth sudah verified
  const days = getDaysInMonth(currentMonth);
  
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
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
            <h1 style={{
              margin: "0 0 8px 0",
              color: "white",
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: "700"
            }}>
              Check Sheet Inspeksi Lift Barang
            </h1>
            <p style={{
              margin: 0,
              color: "rgba(255,255,255,0.9)",
              fontSize: "14px"
            }}>
              Form Pemeriksaan Kelayakan Lift Barang (Daily Calendar View)
            </p>
          </div>

          {/* Info Area */}
          <div style={{
            background: "white",
            border: "1px solid #e8e8e8",
            borderRadius: "10px",
            padding: "20px 24px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
            marginBottom: "28px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
                Nama Lift
              </span>
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>{liftName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
                Area
              </span>
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>{area}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
                Lokasi
              </span>
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>{lokasi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
                Bulan Pemeriksaan
              </span>
              <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>{getMonthYear()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
                Tanggal Hari Ini
              </span>
              <span style={{ color: "#e65100", fontSize: "14px", fontWeight: "700", textAlign: "right", flex: 1 }}>
                {today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div style={{
            background: "#e3f2fd",
            border: "1px solid #1e88e5",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>ℹ️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#01579b", fontSize: "13px" }}>
                Perhatian: Real-Time Access
              </p>
              <p style={{ margin: 0, color: "#01579b", fontSize: "12px", lineHeight: "1.5" }}>
                Anda hanya dapat mengisi checksheet untuk <strong>hari ini ({today.getDate()} {getMonthYear()})</strong>. 
                Kolom hari ini berwarna <strong style={{ color: "#2e7d32" }}>putih</strong>, 
                hari sebelumnya dan sesudahnya berwarna <strong style={{ color: "#757575" }}>abu-abu</strong> (tidak dapat diubah).
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "16px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => changeMonth(-1)}
              style={{
                padding: "10px 20px",
                background: "#1e88e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(30, 136, 229, 0.2)"
              }}
            >
              ← Bulan Lalu
            </button>
            <h3 style={{ margin: 0, color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
              {getMonthYear()}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              style={{
                padding: "10px 20px",
                background: "#1e88e5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(30, 136, 229, 0.2)"
              }}
            >
              Bulan Depan →
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ textAlign: "center", padding: "20px", color: "#1e88e5", fontWeight: "500" }}>
              Memuat data bulan ini...
            </div>
          )}

          {/* Checksheet Table */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
            border: "2px solid #0d47a1",
            marginBottom: "28px",
            position: "relative"
          }}>
            {isLoading && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
                borderRadius: "12px"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                  <p style={{ color: "#0d47a1", fontWeight: "500" }}>Memuat data...</p>
                </div>
              </div>
            )}
            
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                minWidth: "1200px"
              }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{
                      background: "#e3f2fd",
                      fontWeight: "600",
                      color: "#01579b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "14px 10px",
                      textAlign: "center",
                      border: "1px solid #0d47a1",
                      minWidth: "50px"
                    }}>
                      NO
                    </th>
                    <th rowSpan={2} style={{
                      background: "#e3f2fd",
                      fontWeight: "600",
                      color: "#01579b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "14px 10px",
                      textAlign: "center",
                      border: "1px solid #0d47a1",
                      minWidth: "200px"
                    }}>
                      ITEM
                    </th>
                    <th rowSpan={2} style={{
                      background: "#e3f2fd",
                      fontWeight: "600",
                      color: "#01579b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "14px 10px",
                      textAlign: "center",
                      border: "1px solid #0d47a1",
                      minWidth: "160px"
                    }}>
                      CONTENT
                    </th>
                    <th rowSpan={2} style={{
                      background: "#e3f2fd",
                      fontWeight: "600",
                      color: "#01579b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "14px 10px",
                      textAlign: "center",
                      border: "1px solid #0d47a1",
                      minWidth: "90px"
                    }}>
                      METHODE
                    </th>
                    <th colSpan={days.length} style={{
                      background: "#e3f2fd",
                      fontWeight: "600",
                      color: "#01579b",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "14px 10px",
                      textAlign: "center",
                      border: "1px solid #0d47a1"
                    }}>
                      Bulan: {getMonthYear()}
                    </th>
                  </tr>
                  <tr>
                    {days.map((day) => {
                      const dateStatus = getDateStatus(day);
                      const isToday = dateStatus === 'today';
                      
                      return (
                        <th key={day} style={{
                          background: isToday ? "#fff9c4" : "#e3f2fd",
                          fontWeight: isToday ? "700" : "600",
                          color: isToday ? "#e65100" : "#01579b",
                          fontSize: "11px",
                          padding: "12px 6px",
                          textAlign: "center",
                          border: isToday ? "2px solid #ff6f00" : "1px solid #0d47a1",
                          minWidth: "50px"
                        }}>
                          {day}
                          {isToday && <div style={{ fontSize: "9px", marginTop: "2px" }}>HARI INI</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {inspectionItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{
                        padding: "10px",
                        borderBottom: "1px solid #0d47a1",
                        borderRight: "1px solid #0d47a1",
                        borderLeft: "1px solid #0d47a1",
                        fontWeight: "600",
                        color: "#333",
                        textAlign: "center",
                        background: "white",
                        fontSize: "11px"
                      }}>
                        {item.no}
                      </td>
                      <td style={{
                        padding: "10px",
                        borderBottom: "1px solid #0d47a1",
                        borderRight: "1px solid #0d47a1",
                        fontWeight: "500",
                        color: "#333",
                        background: "white",
                        fontSize: "11px"
                      }}>
                        {item.item_group}
                      </td>
                      <td style={{
                        padding: "10px",
                        borderBottom: "1px solid #0d47a1",
                        borderRight: "1px solid #0d47a1",
                        fontWeight: "400",
                        color: "#555",
                        background: "white",
                        fontSize: "11px"
                      }}>
                        {item.item_check}
                      </td>
                      <td style={{
                        padding: "10px",
                        borderBottom: "1px solid #0d47a1",
                        borderRight: "1px solid #0d47a1",
                        textAlign: "center",
                        fontWeight: "400",
                        color: "#555",
                        background: "white",
                        fontSize: "11px"
                      }}>
                        {item.method}
                      </td>
                      {days.map((day) => {
                        const dateKey = formatDateKey(day);
                        const value = answers[dateKey]?.[item.item_key] || "";
                        const dateStatus = getDateStatus(day);
                        const isEditable = dateStatus === 'today';
                        
                        let cellBgColor = "#e0e0e0";
                        if (isEditable) {
                          cellBgColor = value === "✓" ? "#c8e6c9" : value === "✗" ? "#ffcdd2" : "white";
                        }

                        return (
                          <td key={day} style={{
                            padding: "4px",
                            borderBottom: "1px solid #0d47a1",
                            borderRight: "1px solid #0d47a1",
                            textAlign: "center",
                            verticalAlign: "middle",
                            background: cellBgColor,
                            opacity: isLoading ? 0.5 : 1
                          }}>
                            {isEditable ? (
                              <select
                                value={value}
                                onChange={(e) => handleInputChange(dateKey, item.item_key, e.target.value, day)}
                                style={{
                                  width: "100%",
                                  padding: "6px 4px",
                                  border: "1px solid #1e88e5",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: value === "✓" ? "#2e7d32" : value === "✗" ? "#c62828" : "#333",
                                  background: value === "✓" ? "#c8e6c9" : value === "✗" ? "#ffcdd2" : "white",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease"
                                }}
                              >
                                <option value="">-</option>
                                <option value="✓">✓</option>
                                <option value="✗">✗</option>
                              </select>
                            ) : (
                              <div style={{
                                padding: "6px 4px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: value ? (value === "✓" ? "#2e7d32" : "#c62828") : "#999",
                                cursor: "not-allowed",
                                opacity: 0.7
                              }}>
                                {value || "-"}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr style={{ background: "#e3f2fd" }}>
                    <td colSpan={4} style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#01579b",
                      background: "#e3f2fd",
                      border: "1px solid #0d47a1",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      NAMA (INISIAL) / NIK
                    </td>
                    {days.map((day) => {
                      const dateKey = formatDateKey(day);
                      const inspector = answers[dateKey]?.inspector || "";
                      const dateStatus = getDateStatus(day);
                      const isEditable = dateStatus === 'today';
                      
                      const cellBgColor = isEditable ? "white" : "#e0e0e0";

                      return (
                        <td key={day} style={{
                          padding: "4px",
                          border: "1px solid #0d47a1",
                          textAlign: "center",
                          background: cellBgColor,
                          opacity: isLoading ? 0.5 : 1
                        }}>
                          {isEditable ? (
                            <input
                              type="text"
                              value={inspector}
                              onChange={(e) => handleInspectorChange(dateKey, e.target.value, day)}
                              placeholder="inisial"
                              style={{
                                width: "100%",
                                padding: "6px 4px",
                                border: "1px solid #1e88e5",
                                borderRadius: "4px",
                                fontSize: "11px",
                                color: "#333",
                                textAlign: "center",
                                transition: "all 0.3s ease"
                              }}
                            />
                          ) : (
                            <div style={{
                              padding: "6px 4px",
                              fontSize: "11px",
                              color: inspector ? "#333" : "#999",
                              cursor: "not-allowed",
                              opacity: 0.7
                            }}>
                              {inspector || "-"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            padding: "20px 0",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => router.push("/status-ga/lift-barang")}
              style={{
                padding: "10px 28px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                minWidth: "140px",
                background: "#bdbdbd",
                color: "white",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
              }}
            >
              ← Kembali
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isDateEditable(today.getDate())}
              style={{
                padding: "10px 28px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                cursor: (isSaving || !isDateEditable(today.getDate())) ? "not-allowed" : "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                minWidth: "140px",
                background: isSaving ? "#9e9e9e" : isDateEditable(today.getDate()) ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
                color: "white",
                boxShadow: "0 2px 8px rgba(13, 71, 161, 0.2)",
                opacity: (isSaving || !isDateEditable(today.getDate())) ? 0.6 : 1
              }}
            >
              {isSaving ? "Menyimpan..." : "✓ Simpan"}
            </button>
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 1200px) {
            div[style*="paddingLeft"] {
              padding-left: 80px !important;
            }
          }

          @media (max-width: 768px) {
            div[style*="paddingLeft"] {
              padding-left: 25px !important;
              padding-right: 15px !important;
              padding-top: 20px !important;
              padding-bottom: 20px !important;
            }

            div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            h1 {
              font-size: 20px !important;
              margin-bottom: 6px !important;
            }

            p {
              font-size: 12px !important;
            }

            table {
              font-size: 12px !important;
              min-width: 600px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            table th,
            table td {
              padding: 8px 6px !important;
              border: 1px solid #ddd !important;
            }

            input[type="date"],
            input[type="text"],
            input[type="email"],
            select,
            textarea {
              font-size: 14px !important;
              min-height: 36px !important;
              width: 100% !important;
              padding: 8px 8px !important;
            }

            button {
              font-size: 13px !important;
              min-height: 36px !important;
              padding: 8px 12px !important;
            }

            div[style*="display: flex"] {
              flex-direction: column !important;
              gap: 10px !important;
            }
          }

          @media (max-width: 480px) {
            div[style*="paddingLeft"] {
              padding-left: 15px !important;
              padding-right: 12px !important;
              padding-top: 16px !important;
              padding-bottom: 16px !important;
            }

            h1 {
              font-size: 18px !important;
              margin-bottom: 4px !important;
            }

            p {
              font-size: 11px !important;
            }

            table {
              font-size: 10px !important;
              min-width: 500px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            table th,
            table td {
              padding: 6px 4px !important;
              border: 1px solid #ddd !important;
            }

            input[type="date"],
            input[type="text"],
            input[type="email"],
            select,
            textarea {
              font-size: 14px !important;
              min-height: 34px !important;
              width: 100% !important;
              padding: 6px 6px !important;
            }

            button {
              font-size: 12px !important;
              min-height: 40px !important;
              padding: 8px 10px !important;
              width: 100% !important;
            }

            div[style*="display: flex"] {
              flex-direction: column !important;
              gap: 8px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}