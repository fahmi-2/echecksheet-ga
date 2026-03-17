// app/status-ga/inspeksi-hydrant/GaInspeksiHydrantContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import QrScanner from 'qr-scanner';
import { ArrowLeft } from "lucide-react";
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

export function GaInspeksiHydrantContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const TYPE_SLUG = 'inspeksi-hydrant';
  
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("HYDRANT INDOOR");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Load inspection items dari API
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

  // Load areas dari API berdasarkan type
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

  // Load status untuk semua area
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses) return;
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          if (dates.length > 0) {
            const latest = dates[0];
            statusMap[area.id] = {
              statusLabel: "Checked",
              statusColor: "#43a047",
              lastCheck: new Date(latest).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            };
          } else {
            statusMap[area.id] = {
              statusLabel: "No Data",
              statusColor: "#757575",
              lastCheck: "-"
            };
          }
        } catch (error) {
          console.error(`Error loading status for area ${area.id}:`, error);
          statusMap[area.id] = {
            statusLabel: "Error",
            statusColor: "#f44336",
            lastCheck: "-"
          };
        }
      }

      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };

    loadAllStatuses();
  }, [areas]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router]);

  // Open detail dengan load data dari API
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDateInModal(latestDate);
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        setChecksheetData(data);
      } else {
        setChecksheetData(null);
        setSelectedDateInModal("");
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      setChecksheetData(null);
      setAvailableDates([]);
      setSelectedDateInModal("");
      alert("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setSelectedDateInModal("");
    setAvailableDates([]);
    setShowModal(false);
  };

  // Load data ketika tanggal berubah
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        setChecksheetData(data);
      } catch (error) {
        console.error("Error loading checklist:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDateInModal, selectedArea, showModal]);

  // Filter data berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    const zona = item.location || '';
    let jenisHydrant = 'HYDRANT INDOOR';
    if (item.no >= 27 && item.no <= 33) {
      jenisHydrant = 'HYDRANT PILLAR';
    } else if (item.no === 36) {
      jenisHydrant = 'HYDRANT OUTDOOR';
    }

    return (
      jenisHydrant === selectedCategory &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       zona.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Fungsi buka modal gambar
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
          if (url.pathname === '/e-checksheet-hydrant') {
            router.push(urlStr);
            return;
          }
        }
        if (urlStr.startsWith('/e-checksheet-hydrant?')) {
          router.push(urlStr);
          return;
        }
        alert("Invalid QR code. Please scan a valid hydrant inspection QR.");
      } catch (err) {
        alert("Invalid QR format.");
      }
    };

    const onScanError = (error: string | Error) => {
      console.warn("QR scan error:", error);
    };

    qrScannerRef.current = new QrScanner(video, onScanSuccess, onScanError);
    qrScannerRef.current.start();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
    };
  }, [isScanning, router]);

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
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header */}
        <div className="header">
          <button
            className="btn-back"
            onClick={() => router.push("/status-ga")}
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <div className="header-text">
            <h1>
              🚒 Hydrant Inspection Dashboard
            </h1>
            <p>
              Monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

          {/* Dropdown + Search */}
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
              display: "flex",
              gap: "16px",
              alignItems: "flex-end"
            }}
          >
            {/* Dropdown */}
            <div style={{ flex: 1 }}>
              <label
                htmlFor="category-select"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#424242"
                }}
              >
                Hydrant Type:
              </label>

              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#333",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              >
                <option value="HYDRANT INDOOR">HYDRANT INDOOR</option>
                <option value="HYDRANT PILLAR">HYDRANT PILLAR</option>
                <option value="HYDRANT OUTDOOR">HYDRANT OUTDOOR</option>
              </select>
            </div>

            {/* Search */}
            <div style={{ flex: 2 }}>
              <label
                htmlFor="search-input"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#424242"
                }}
              >
                Search Location or Zone:
              </label>

              <input
                id="search-input"
                type="text"
                placeholder="e.g. KANTIN, BARAT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#333",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              />
            </div>
          </div>

          {/* Loading Status Indicator */}
          {isLoadingStatuses && (
            <div style={{ padding: "12px 20px", background: "#fff3cd", borderRadius: "6px", marginBottom: "16px", color: "#856404", fontSize: "13px", textAlign: "center" }}>
              ⏳ Loading status data...
            </div>
          )}

          {/* Table */}
          <div style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            overflow: "hidden",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Location</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zone</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Type</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((area, idx) => {
                    const parts = area.name.split(' • ');
                    const zona = area.location || '';
                    let jenisHydrant = 'HYDRANT INDOOR';

                    if (area.no >= 27 && area.no <= 33) {
                      jenisHydrant = 'HYDRANT PILLAR';
                    } else if (area.no === 36) {
                      jenisHydrant = 'HYDRANT OUTDOOR';
                    }
                     
                    const status = areaStatuses[area.id] || {
                      statusLabel: "Loading...",
                      statusColor: "#757575",
                      lastCheck: "-"
                    };

                    return (
                      <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>
                          {area.no}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>
                          {parts[0]}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>
                          {zona}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>
                          {jenisHydrant}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{
                              padding: "4px 12px",
                              background: status.statusColor,
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "inline-block"
                            }}>
                              {status.statusLabel}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>
                              {status.lastCheck}
                            </span>
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
                              href={`/e-checksheet-hydrant?no=${area.no}&lokasi=${encodeURIComponent(parts[0])}&zona=${encodeURIComponent(zona)}&jenisHydrant=${encodeURIComponent(jenisHydrant)}`}
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

          {/* MODAL DETAIL - UPDATED: Konsisten dengan EChecksheetHydrantForm */}
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
                  borderRadius: "12px",
                  width: "95%",
                  maxWidth: "1600px",
                  maxHeight: "90vh",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Modal Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  borderBottom: "1px solid #e0e0e0"
                }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px 0", color: "white", fontSize: "18px", fontWeight: "600" }}>
                      📋 Inspection History - Unit #{selectedArea.no}
                    </h2>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "13px" }}>
                      {selectedArea.name} • {selectedArea.location}
                    </p>
                  </div>
                  <button 
                    onClick={closeDetail} 
                    style={{ 
                      background: "rgba(255,255,255,0.2)", 
                      border: "none", 
                      fontSize: "24px", 
                      cursor: "pointer", 
                      color: "white",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Date Selector */}
                <div style={{ padding: "12px 24px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                  <label style={{ fontWeight: "600", color: "#424242", marginRight: "12px", fontSize: "13px" }}>
                    Inspection Date:
                  </label>
                  <select
                    value={selectedDateInModal}
                    onChange={(e) => setSelectedDateInModal(e.target.value)}
                    disabled={availableDates.length === 0}
                    style={{
                      color: "#212121",
                      padding: "8px 12px",
                      border: "1px solid #1976d2",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "500",
                      minWidth: "180px",
                      outline: "none",
                      cursor: availableDates.length > 0 ? "pointer" : "not-allowed",
                      background: "white"
                    }}
                  >
                    {availableDates.length === 0 ? (
                      <option value="">No data available</option>
                    ) : (
                      <>
                        <option value="">-- Select Date --</option>
                        {availableDates.map(date => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* Modal Body - Scrollable Table */}
                <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
                  {!selectedDateInModal ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#757575" }}>
                      <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                      <p style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>
                        {availableDates.length === 0 
                          ? "📭 No inspection data available for this unit" 
                          : "👆 Please select an inspection date"}
                      </p>
                    </div>
                  ) : isLoading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#1976d2" }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                      <p>Loading data...</p>
                    </div>
                  ) : !checksheetData ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>
                      ❌ No data found for this date
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ 
                        width: "100%", 
                        borderCollapse: "collapse", 
                        fontSize: "12px", 
                        minWidth: "1400px",
                        background: "white",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                      }}>
                        <thead>
                          <tr style={{ background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)", borderBottom: "2px solid #1976d2" }}>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "50px" }}>No</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "left", minWidth: "200px" }}>Item Check</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "90px" }}>Hasil</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "80px" }}>Metode</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "140px" }}>Keterangan Temuan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "140px" }}>Tindakan Perbaikan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "90px" }}>PIC</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "100px" }}>Due Date</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", width: "90px" }}>Verify</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #bbdefb", fontWeight: "700", color: "#1565c0", textAlign: "center", minWidth: "150px" }}>Dokumentasi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectionItems.map((item, index) => {
                            const itemData = checksheetData[item.item_key];
                            const itemImages = itemData?.images || [];
                            const hasilValue = itemData?.hasilPemeriksaan || "-";
                            
                            return (
                              <tr key={item.id} style={{ borderBottom: "1px solid #e0e0e0", background: index % 2 === 0 ? "#ffffff" : "#f9f9f9" }}>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600", color: "#555" }}>{index + 1}</td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>
                                  <div style={{ fontWeight: "600", color: "#212121", marginBottom: "2px" }}>{item.item_check}</div>
                                  {item.item_group && <div style={{ fontSize: "11px", color: "#757575" }}>{item.item_group}</div>}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                                  <span style={{
                                    padding: "4px 12px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                    fontSize: "11px",
                                    background: hasilValue === "OK" ? "#e8f5e9" : hasilValue === "NG" ? "#ffebee" : "#f5f5f5",
                                    color: hasilValue === "OK" ? "#2e7d32" : hasilValue === "NG" ? "#c62828" : "#757575"
                                  }}>
                                    {hasilValue}
                                  </span>
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center", color: "#757575", fontSize: "11px" }}>
                                  {item.method || "Visual"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", color: "#424242", fontSize: "11px", lineHeight: "1.4" }}>
                                  {itemData?.keteranganTemuan || "-"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", color: "#424242", fontSize: "11px", lineHeight: "1.4" }}>
                                  {itemData?.tindakanPerbaikan || "-"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px", fontWeight: "500" }}>
                                  {itemData?.pic || "-"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                  {itemData?.dueDate 
                                    ? new Date(itemData.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                                    : "-"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px", fontWeight: "500" }}>
                                  {itemData?.verify || "-"}
                                </td>
                                <td style={{ padding: "10px", border: "1px solid #e0e0e0" }}>
                                  {itemImages.length > 0 ? (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                      {itemImages.slice(0, 3).map((imgUrl: string, idx: number) => (
                                        <div 
                                          key={idx} 
                                          style={{ 
                                            width: "40px", 
                                            height: "40px", 
                                            borderRadius: "4px", 
                                            overflow: "hidden", 
                                            border: "1px solid #ddd",
                                            cursor: "pointer"
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImageModal(imgUrl);
                                          }}
                                        >
                                          <img
                                            src={imgUrl}
                                            alt={`doc-${idx}`}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        </div>
                                      ))}
                                      {itemImages.length > 3 && (
                                        <div style={{ 
                                          width: "40px", 
                                          height: "40px", 
                                          borderRadius: "4px", 
                                          background: "#1976d2", 
                                          color: "white", 
                                          display: "flex", 
                                          alignItems: "center", 
                                          justifyContent: "center",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          cursor: "pointer"
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openImageModal(itemImages[0]);
                                        }}
                                        >
                                          +{itemImages.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#9e9e9e", fontSize: "11px" }}>No images</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: "12px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                  <button 
                    onClick={closeDetail} 
                    style={{ 
                      padding: "10px 24px", 
                      background: "#757575", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "6px", 
                      fontWeight: "500",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Close
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
                <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>
                  Scan Hydrant QR Code
                </h3>
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
                  Point your camera at the QR code on the hydrant
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

              input[type="search"],
              input[type="text"],
              select {
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

              input[type="search"],
              input[type="text"],
              select {
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