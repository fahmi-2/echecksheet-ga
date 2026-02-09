// app/status-ga/lift-barang/GaLiftBarangContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import QrScanner from 'qr-scanner';
import { ArrowLeft } from "lucide-react";

// ✅ Import API helper yang reusable
import { 
  getAreasByType, 
  getAvailableDates, 
  getChecklistByDate,
  getItemsByType,
  ChecklistItem
} from "@/lib/api/checksheet";

interface Area {
  id: number;
  no: number;
  name: string;
  location: string;
}

export function GaLiftBarangContent({ openLift }: { openLift: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'lift-barang';
  
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [monthData, setMonthData] = useState<Record<string, any>>({});
  
  // ✅ Load inspection items dari API (PENTING!)
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('Loaded inspection items:', items); // DEBUG
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist. Silakan coba lagi.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load areas dari API berdasarkan type
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        setAreas(data);
      } catch (error) {
        console.error("Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!openLift) return;
    
    const found = areas.find((item) => {
      const parts = item.name.split(' \u0007 ');
      return parts[0] === openLift;
    });
    
    if (found) {
      setTimeout(() => openDetail(found), 50);
    }
  }, [isMounted, loading, openLift, areas]);

  // ✅ Open detail dengan load data dari API
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);

    try {
      // Load available dates untuk area ini
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      
      // Load data untuk bulan ini
      await loadMonthData(area.id, currentMonth, dates);
    } catch (error) {
      console.error("Error loading detail:", error);
      setMonthData({});
      setAvailableDates([]);
      alert("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load data untuk bulan tertentu - DIPERBAIKI
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
      const dataMap: Record<string, any> = {};
      
      for (const dateStr of datesInMonth) {
        try {
          const data = await getChecklistByDate(TYPE_SLUG, areaId, dateStr);
          
          if (data) {
            console.log(`✅ Data loaded for ${dateStr}:`, data); // DEBUG
            dataMap[dateStr] = data; // Data sudah dalam format: { item_key: { hasilPemeriksaan, ... }, ... }
          }
        } catch (error) {
          console.error(`Error loading data for ${dateStr}:`, error);
        }
      }
      
      console.log('📊 Final monthData:', dataMap); // DEBUG
      setMonthData(dataMap);
    } catch (error) {
      console.error("Error loading month data:", error);
      alert("Gagal memuat data bulan ini. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setMonthData({});
    setAvailableDates([]);
    setShowModal(false);
  };

  // ✅ Change month dan reload data
  const changeMonth = async (direction: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(newMonth);
    
    if (selectedArea) {
      setIsLoading(true);
      try {
        await loadMonthData(selectedArea.id, newMonth, availableDates);
      } catch (error) {
        console.error("Error loading month data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ✅ Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  // ✅ Format date key untuk API - DIPERBAIKI
  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${month}-${d}`;
  };

  // ✅ Get month year label
  const getMonthYear = () => {
    return currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  // ✅ Cek apakah tanggal editable (hanya hari ini)
  const isDateEditable = (day: number): boolean => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayDate = new Date();
    cellDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    return cellDate.getTime() === todayDate.getTime();
  };

  // ✅ Get date status
  const getDateStatus = (day: number): 'past' | 'today' | 'future' => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const todayDate = new Date();
    cellDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    if (cellDate.getTime() < todayDate.getTime()) return 'past';
    if (cellDate.getTime() === todayDate.getTime()) return 'today';
    return 'future';
  };

  // ✅ Fungsi buka modal gambar
  const openImageModal = (url: string) => {
    setCurrentImageUrl(url);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };

  // QR Scanner functions
  const openQrScanner = () => {
    setIsScanning(true);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;
    
    const video = videoRef.current;

    const onScanSuccess = (result: string) => {
      console.log("QR Scanned:", result);
      setIsScanning(false);
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      try {
        let urlStr = result.trim();

        if (urlStr.startsWith('http')) {
          const url = new URL(urlStr);
          if (url.pathname === '/e-checksheet-lift-barang') {
            router.push(urlStr);
            return;
          }
        }

        if (urlStr.startsWith('/e-checksheet-lift-barang?')) {
          router.push(urlStr);
          return;
        }

        alert("Invalid QR code. Please scan a valid lift barang inspection QR.");
      } catch (err) {
        alert("Invalid QR format.");
      }
    };

    const onScanError = (error: string | Error) => {
      console.warn("QR scan error:", error);
    };

    qrScannerRef.current = new QrScanner(
      video,
      onScanSuccess,
      onScanError
    );

    qrScannerRef.current.start();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
    };
  }, [isScanning, router]);

  // Filter data berdasarkan search
  const filteredData = areas.filter(item => {
    const parts = item.name.split(' \u0007 ');
    const lokasi = parts[0] || '';
    const area = parts[1] || '';
    const lokasiDetail = parts[2] || '';
    
    return (
      lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lokasiDetail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{
        paddingLeft: "96px",
        paddingRight: "20px",
        paddingTop: "24px",
        paddingBottom: "24px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }} className="header">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18}/> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚒 Lift Barang Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Daily inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* Search + QR Scan */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          position: "relative"
        }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Cari lokasi, area, atau detail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 40px 10px 16px",
                border: "1px solid #1976d2",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                width: "100%",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Nama Lift Barang</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Area</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  // Extract data from name field
                  const parts = area.name.split(' \u0007 ');
                  const lokasi = parts[0] || '';
                  const areaName = parts[1] || '';
                  const lokasiDetail = parts[2] || '';
                  
                  let statusLabel = "No Data";
                  let statusColor = "#757575";
                  let lastCheck = "-";

                  // ✅ Cek status dari API
                  const checkStatus = async () => {
                    try {
                      const dates = await getAvailableDates(TYPE_SLUG, area.id);
                      
                      if (dates.length > 0) {
                        const latest = dates.sort().pop();
                        lastCheck = new Date(latest!).toLocaleDateString("en-US", { day: "numeric", month: "short" });
                        statusLabel = "Checked";
                        statusColor = "#43a047";
                      }
                    } catch (error) {
                      console.error("Error checking status:", error);
                    }
                  };

                  // Panggil checkStatus
                  checkStatus();

                  return (
                    <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{lokasi}</td>
                      <td style={{ padding: "14px 16px", color: "#666", fontSize: "13px" }}>{areaName}</td>
                      <td style={{ padding: "14px 16px", color: "#666" }}>{lokasiDetail}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: statusColor,
                            color: "white",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            display: "inline-block"
                          }}>
                            {statusLabel}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{lastCheck}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#1976d2",
                              color: "white",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                          <a
                            href={`/e-checksheet-lift-barang?liftName=${encodeURIComponent(lokasi)}&area=${encodeURIComponent(areaName)}&lokasi=${encodeURIComponent(lokasiDetail)}`}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#43a047",
                              color: "white",
                              textDecoration: "none",
                              display: "inline-block"
                            }}
                          >
                            Inspect
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail - DIPERBAIKI */}
        {showModal && selectedArea && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "98%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "24px 28px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
                borderBottom: "2px solid #e8e8e8",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
                    Inspection History - {selectedArea.no}
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "14px", fontWeight: "500" }}>
                    {selectedArea.name.split(' \u0007 ')[0]}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>
                    {selectedArea.name.split(' \u0007 ')[1]} - {selectedArea.name.split(' \u0007 ')[2]}
                  </p>
                </div>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    background: "none", 
                    border: "none", 
                    fontSize: "28px", 
                    cursor: "pointer", 
                    color: "#999",
                    padding: 0,
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
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
                      padding: "8px 16px",
                      background: "#1e88e5",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  >
                    ← Bulan Lalu
                  </button>
                  <h3 style={{ margin: 0, color: "#0d47a1", fontSize: "18px", fontWeight: "600" }}>
                    {getMonthYear()}
                  </h3>
                  <button
                    onClick={() => changeMonth(1)}
                    style={{
                      padding: "8px 16px",
                      background: "#1e88e5",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  >
                    Bulan Depan →
                  </button>
                </div>

                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    Loading data...
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "11px",
                      minWidth: "1200px",
                      border: "2px solid #0d47a1"
                    }}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            background: "#e3f2fd",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            textAlign: "center",
                            border: "1px solid #0d47a1",
                            minWidth: "50px"
                          }}>
                            NO
                          </th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            background: "#e3f2fd",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            textAlign: "center",
                            border: "1px solid #0d47a1",
                            minWidth: "180px"
                          }}>
                            ITEM
                          </th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            background: "#e3f2fd",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            textAlign: "center",
                            border: "1px solid #0d47a1",
                            minWidth: "150px"
                          }}>
                            CONTENT
                          </th>
                          <th rowSpan={2} style={{
                            padding: "10px 8px",
                            background: "#e3f2fd",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            textAlign: "center",
                            border: "1px solid #0d47a1",
                            minWidth: "80px"
                          }}>
                            METHODE
                          </th>
                          <th colSpan={getDaysInMonth(currentMonth).length} style={{
                            padding: "10px 8px",
                            background: "#e3f2fd",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            textAlign: "center",
                            border: "1px solid #0d47a1"
                          }}>
                            Bulan: {getMonthYear()}
                          </th>
                        </tr>
                        <tr>
                          {getDaysInMonth(currentMonth).map((day) => {
                            const dateStatus = getDateStatus(day);
                            const isToday = dateStatus === 'today';
                            
                            return (
                              <th key={day} style={{
                                padding: "8px 4px",
                                background: isToday ? "#fff9c4" : "#e3f2fd",
                                fontWeight: isToday ? "700" : "600",
                                color: isToday ? "#e65100" : "#01579b",
                                fontSize: "10px",
                                textAlign: "center",
                                border: isToday ? "2px solid #ff6f00" : "1px solid #0d47a1",
                                minWidth: "35px"
                              }}>
                                {day}
                                {isToday && <div style={{ fontSize: "9px", marginTop: "2px" }}>HARI INI</div>}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map((item, idx) => {
                          return (
                            <tr key={item.id || idx}>
                              <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#333",
                                fontSize: "10px",
                                background: "white"
                              }}>
                                {item.no}
                              </td>
                              <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                fontWeight: "500",
                                color: "#333",
                                fontSize: "10px",
                                background: "white"
                              }}>
                                {item.item_group}
                              </td>
                              <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                fontWeight: "400",
                                color: "#555",
                                fontSize: "10px",
                                background: "white"
                              }}>
                                {item.item_check}
                              </td>
                              <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontWeight: "400",
                                color: "#555",
                                fontSize: "10px",
                                background: "white"
                              }}>
                                {item.method}
                              </td>
                              {getDaysInMonth(currentMonth).map((day) => {
                                const dateKey = formatDateKey(day);
                                
                                // ✅ PERBAIKAN UTAMA: Gunakan item.item_key dari API, bukan item.key manual
                                const itemData = monthData[dateKey]?.[item.item_key];
                                
                                const value = itemData?.hasilPemeriksaan || "-";
                                const bgColor = value === "OK" ? "#c8e6c9" : value === "NG" ? "#ffcdd2" : "#fff";
                                const displayValue = value === "OK" ? "✓" : value === "NG" ? "✗" : "-";
                                
                                return (
                                  <td key={day} style={{
                                    padding: "6px 4px",
                                    border: "1px solid #0d47a1",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    background: bgColor,
                                    color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#999"
                                  }}>
                                    {displayValue}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#f5f9ff" }}>
                          <td colSpan={4} style={{
                            padding: "10px 8px",
                            border: "1px solid #0d47a1",
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#01579b",
                            fontSize: "10px",
                            background: "#e3f2fd"
                          }}>
                            NAMA(INISIAL)/NIK
                          </td>
                          {getDaysInMonth(currentMonth).map((day) => {
                            const dateKey = formatDateKey(day);
                            
                            // ✅ Ambil inspector dari item pertama (semua item memiliki inspector yang sama per hari)
                            const firstItemKey = inspectionItems[0]?.item_key;
                            const inspector = monthData[dateKey]?.[firstItemKey]?.inspector || "-";
                            
                            return (
                              <td key={day} style={{
                                padding: "6px 4px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: "500",
                                color: "#333"
                              }}>
                                {inspector}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "20px 28px",
                background: "#f5f7fa",
                borderTop: "1px solid #e8e8e8",
                flexShrink: 0
              }}>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    padding: "8px 20px", 
                    background: "#bdbdbd", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "6px", 
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {isScanning && (
          <div
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
            onClick={() => {
              setIsScanning(false);
              if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                maxWidth: "90vw",
                width: "100%",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Scan Lift Barang QR Code</h3>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  maxHeight: "60vh",
                  borderRadius: "6px",
                  background: "#000"
                }}
              />
              <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
                Point your camera at the QR code on the lift barang
              </p>
              <button
                onClick={() => {
                  setIsScanning(false);
                  if (qrScannerRef.current) {
                    qrScannerRef.current.destroy();
                    qrScannerRef.current = null;
                  }
                }}
                style={{
                  marginTop: "16px",
                  padding: "8px 20px",
                  background: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal Popup Gambar Dokumentasi */}
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
                src={currentImageUrl}
                alt="Dokumentasi"
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "3px solid white"
                }}
              />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
                Click outside to close
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}