// app/status-ga/inspeksi-hydrant/GaInspeksiHydrantContent.tsx
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

export function GaInspeksiHydrantContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
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
  const videoRef = useRef(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('✅ Loaded inspection items:', items);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, []);

  // ✅ Load areas dari API berdasarkan type
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        console.log('✅ Loaded areas:', data);
        setAreas(data);
      } catch (error) {
        console.error("❌ Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // ✅ Load status untuk semua area SEKALI SAJA setelah areas loaded
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses) return;
    
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      console.log('🔄 Loading statuses for all areas...');
      
      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          
          if (dates.length > 0) {
            const latest = dates[0]; // Dates sudah sorted DESC dari API
            statusMap[area.id] = {
              statusLabel: "Checked",
              statusColor: "#43a047",
              lastCheck: new Date(latest).toLocaleDateString("id-ID", { 
                day: "numeric", 
                month: "short" 
              })
            };
          } else {
            statusMap[area.id] = {
              statusLabel: "No Data",
              statusColor: "#757575",
              lastCheck: "-"
            };
          }
        } catch (error) {
          console.error(`❌ Error loading status for area ${area.id}:`, error);
          statusMap[area.id] = {
            statusLabel: "Error",
            statusColor: "#f44336",
            lastCheck: "-"
          };
        }
      }

      console.log('✅ All statuses loaded:', statusMap);
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

  // ✅ Open detail dengan load data dari API
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      // Load available dates
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      console.log('📅 Available dates:', dates);
      setAvailableDates(dates);

      if (dates.length > 0) {
        const latestDate = dates[0]; // Sudah sorted DESC
        setSelectedDateInModal(latestDate);

        // Load checklist data untuk tanggal terbaru
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        console.log('📦 Loaded checklist data:', data);
        setChecksheetData(data);
      } else {
        setChecksheetData(null);
        setSelectedDateInModal("");
      }
    } catch (error) {
      console.error("❌ Error loading detail:", error);
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

  // ✅ Load data ketika tanggal berubah
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('📥 Loading data for date:', selectedDateInModal);
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        console.log('📦 Received data:', data);
        setChecksheetData(data);
      } catch (error) {
        console.error("❌ Error loading checklist:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDateInModal, selectedArea, showModal]);

  // Filter data berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    // Gunakan field 'location' sebagai zona
    const zona = item.location || '';
    // Tentukan jenis hydrant berdasarkan nomor area
    let jenisHydrant = 'HYDRANT INDOOR';

    // Area 27-33 = HYDRANT PILLAR
    if (item.no >= 27 && item.no <= 33) {
      jenisHydrant = 'HYDRANT PILLAR';
    } 
    // Area 36 = HYDRANT OUTDOOR
    else if (item.no === 36) {
      jenisHydrant = 'HYDRANT OUTDOOR';
    }

    return (
      jenisHydrant === selectedCategory &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       zona.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

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
      <div style={{ 
        paddingLeft: "96px", 
        paddingRight: "20px", 
        paddingTop: "24px", 
        paddingBottom: "24px", 
        maxWidth: "1400px", 
        margin: "0 auto" 
      }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <button
            onClick={() => router.push("/status-ga")}
            style={{
              background: "none",
              border: "none",
              color: "#1976d2",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ 
              margin: "0 0 6px 0", 
              color: "white", 
              fontSize: "26px", 
              fontWeight: "600", 
              letterSpacing: "-0.5px" 
            }}>
              🚒 Hydrant Inspection Dashboard
            </h1>
            <p style={{ 
              margin: 0, 
              color: "#e3f2fd", 
              fontSize: "14px", 
              fontWeight: "400" 
            }}>
              Monthly inspection schedule and maintenance records
            </p>
          </div>

          {/* Dropdown + Search */}
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e0e0e0",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "flex-end"
          }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
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

            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
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
              <div style={{ position: "relative" }}>
                <input
                  id="search-input"
                  type="text"
                  placeholder="e.g. KANTIN, BARAT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 16px",
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
          </div>

          {/* Loading Status Indicator */}
          {isLoadingStatuses && (
            <div style={{ 
              padding: "12px 20px", 
              background: "#fff3cd", 
              borderRadius: "6px",
              marginBottom: "16px",
              color: "#856404",
              fontSize: "13px",
              textAlign: "center"
            }}>
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
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                fontSize: "14px", 
                minWidth: "700px" 
              }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "center", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>No</th>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "left", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>Location</th>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "center", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>Zone</th>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "center", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>Type</th>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "center", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>Status</th>
                    <th style={{ 
                      padding: "14px 16px", 
                      textAlign: "center", 
                      background: "#fafafa", 
                      fontWeight: "600", 
                      color: "#424242", 
                      fontSize: "13px" 
                    }}>Actions</th>
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
                    
                    // ✅ Ambil status dari state yang sudah di-load
                    const status = areaStatuses[area.id] || {
                      statusLabel: "Loading...",
                      statusColor: "#757575",
                      lastCheck: "-"
                    };

                    return (
                      <tr 
                        key={area.id} 
                        style={{ 
                          borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" 
                        }}
                      >
                        <td style={{ 
                          padding: "14px 16px", 
                          textAlign: "center", 
                          fontWeight: "600", 
                          color: "#1976d2" 
                        }}>
                          {area.no}
                        </td>
                        <td style={{ 
                          padding: "14px 16px", 
                          fontWeight: "500", 
                          color: "#424242" 
                        }}>
                          {parts[0]}
                        </td>
                        <td style={{ 
                          padding: "14px 16px", 
                          textAlign: "center", 
                          fontWeight: "600", 
                          color: "#616161" 
                        }}>
                          {zona}
                        </td>
                        <td style={{ 
                          padding: "14px 16px", 
                          textAlign: "center", 
                          fontWeight: "600", 
                          color: "#616161" 
                        }}>
                          {jenisHydrant}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            gap: "4px" 
                          }}>
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
                            <span style={{ 
                              fontSize: "11px", 
                              color: "#9e9e9e" 
                            }}>
                              {status.lastCheck}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ 
                            display: "flex", 
                            gap: "8px", 
                            justifyContent: "center" 
                          }}>
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

          {/* Modal Detail */}
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
                  width: "95%",
                  maxWidth: "1400px",
                  maxHeight: "90vh",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  background: "#f5f5f5",
                  borderBottom: "1px solid #e0e0e0"
                }}>
                  <div>
                    <h2 style={{ 
                      margin: "0 0 4px 0", 
                      color: "#212121", 
                      fontSize: "20px", 
                      fontWeight: "600" 
                    }}>
                      Inspection History - Unit #{selectedArea.no}
                    </h2>
                    <p style={{ 
                      margin: "0", 
                      color: "#616161", 
                      fontSize: "14px" 
                    }}>
                      {selectedArea.name}
                    </p>
                  </div>
                  <button 
                    onClick={closeDetail} 
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      fontSize: "28px", 
                      cursor: "pointer", 
                      color: "#757575",
                      padding: "0",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ 
                  padding: "16px 24px", 
                  background: "white", 
                  borderBottom: "1px solid #e0e0e0" 
                }}>
                  <label style={{ 
                    fontWeight: "500", 
                    color: "#424242", 
                    marginRight: "12px", 
                    fontSize: "14px" 
                  }}>
                    Inspection Date:
                  </label>
                  <select
                    value={selectedDateInModal}
                    onChange={(e) => setSelectedDateInModal(e.target.value)}
                    disabled={availableDates.length === 0}
                    style={{
                      color: "#212121",
                      padding: "7px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "5px",
                      fontSize: "14px",
                      fontWeight: "500",
                      minWidth: "160px",
                      outline: "none",
                      cursor: availableDates.length > 0 ? "pointer" : "not-allowed"
                    }}
                  >
                    {availableDates.length === 0 ? (
                      <option value="">No data available</option>
                    ) : (
                      <>
                        <option value="">-- Select Date --</option>
                        {availableDates.map(date => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString("id-ID", { 
                              day: "2-digit", 
                              month: "short", 
                              year: "numeric" 
                            })}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div style={{ 
                  padding: "24px", 
                  overflowY: "auto", 
                  flex: 1, 
                  background: "#fafafa" 
                }}>
                  {!selectedDateInModal ? (
                    <div style={{ 
                      textAlign: "center", 
                      padding: "60px 20px", 
                      color: "#757575" 
                    }}>
                      <div style={{ 
                        fontSize: "48px", 
                        marginBottom: "12px", 
                        opacity: 0.5 
                      }}>
                        📅
                      </div>
                      <p style={{ 
                        fontSize: "15px", 
                        fontWeight: "500", 
                        margin: 0 
                      }}>
                        {availableDates.length === 0 
                          ? "📭 No inspection data available for this unit" 
                          : "👆 Please select an inspection date"}
                      </p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      {(() => {
                        if (!checksheetData) {
                          return (
                            <div style={{ 
                              textAlign: "center", 
                              padding: "40px", 
                              color: "#9e9e9e" 
                            }}>
                              ❌ No data found for this date
                            </div>
                          );
                        }

                        return (
                          <div>
                            <table style={{ 
                              width: "100%", 
                              borderCollapse: "collapse", 
                              fontSize: "12px", 
                              minWidth: "1600px", 
                              border: "1px solid #e0e0e0", 
                              background: "white" 
                            }}>
                              <thead>
                                <tr style={{ background: "#f5f5f5" }}>
                                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                                    <th key={num} style={{
                                      padding: "8px",
                                      border: "1px solid #e0e0e0",
                                      fontWeight: "600",
                                      color: "#424242",
                                      textAlign: "center",
                                      fontSize: "11px",
                                      minWidth: "100px",
                                      wordWrap: "break-word",
                                      lineHeight: "1.2"
                                    }}>
                                      {num}
                                    </th>
                                  ))}
                                  <th style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    fontWeight: "600", 
                                    color: "#424242", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    Findings
                                  </th>
                                  <th style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    fontWeight: "600", 
                                    color: "#424242", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    Corrective Action
                                  </th>
                                  <th style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    fontWeight: "600", 
                                    color: "#424242", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    PIC
                                  </th>
                                  <th style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    fontWeight: "600", 
                                    color: "#424242", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    Due Date
                                  </th>
                                  <th style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    fontWeight: "600", 
                                    color: "#424242", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    Verify
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  {Array.from({ length: 20 }, (_, i) => {
                                    const itemKey = `item${i + 1}`;
                                    const entry = checksheetData[itemKey];
                                    const value = entry?.hasilPemeriksaan || "-";
                                    return (
                                      <td key={i} style={{
                                        padding: "8px",
                                        border: "1px solid #e0e0e0",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        background: value === "OK" ? "#e8f5e9" : value === "NG" ? "#ffebee" : "#fff",
                                        color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#757575",
                                        fontSize: "11px"
                                      }}>
                                        {value}
                                      </td>
                                    );
                                  })}
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    lineHeight: "1.4", 
                                    fontSize: "11px" 
                                  }}>
                                    {checksheetData.item1?.keteranganTemuan || "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    lineHeight: "1.4", 
                                    fontSize: "11px" 
                                  }}>
                                    {checksheetData.item1?.tindakanPerbaikan || "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    {checksheetData.item1?.pic || "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    {checksheetData.item1?.dueDate 
                                      ? new Date(checksheetData.item1.dueDate).toLocaleDateString("id-ID", { 
                                          day: "2-digit", 
                                          month: "short",
                                          year: "numeric"
                                        })
                                      : "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #e0e0e0", 
                                    textAlign: "center", 
                                    fontSize: "11px" 
                                  }}>
                                    {checksheetData.item1?.verify || "-"}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            
                            {/* ✅ TAMPILKAN FOTO DOKUMENTASI DI SINI */}
                            {checksheetData.item1?.images && checksheetData.item1.images.length > 0 && (
                              <div style={{ marginTop: "24px" }}>
                                <h3 style={{ 
                                  margin: "0 0 12px 0", 
                                  fontSize: "14px", 
                                  fontWeight: "600", 
                                  color: "#212121" 
                                }}>
                                  📸 Documentation Photos ({checksheetData.item1.images.length})
                                </h3>
                                <div style={{ 
                                  display: "flex", 
                                  flexWrap: "wrap", 
                                  gap: "12px", 
                                  justifyContent: "flex-start" 
                                }}>
                                  {checksheetData.item1.images.map((imgUrl: string, idx: number) => (
                                    <div 
                                      key={idx} 
                                      style={{ 
                                        width: "120px", 
                                        height: "120px", 
                                        overflow: "hidden", 
                                        borderRadius: "6px", 
                                        border: "1px solid #ddd",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => openImageModal(imgUrl)}
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`doc-${idx}`}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover"
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div style={{ 
                              marginTop: "20px", 
                              padding: "12px", 
                              background: "#f9f9f9", 
                              borderRadius: "6px", 
                              border: "1px solid #e0e0e0" 
                            }}>
                              <p style={{ 
                                margin: "0 0 4px 0", 
                                fontSize: "11px", 
                                color: "#757575" 
                              }}>
                                Inspector
                              </p>
                              <p style={{ 
                                margin: "0", 
                                fontSize: "13px", 
                                fontWeight: "500", 
                                color: "#424242" 
                              }}>
                                {checksheetData.item1?.inspector || "N/A"}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div style={{ 
                  padding: "16px 24px", 
                  background: "#f5f5f5", 
                  borderTop: "1px solid #e0e0e0", 
                  textAlign: "right" 
                }}>
                  <button 
                    onClick={closeDetail} 
                    style={{ 
                      padding: "9px 20px", 
                      background: "#757575", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "5px", 
                      fontWeight: "500",
                      cursor: "pointer",
                      fontSize: "14px"
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
                <h3 style={{ 
                  margin: "0 0 12px 0", 
                  color: "#212121" 
                }}>
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
                <p style={{ 
                  fontSize: "13px", 
                  color: "#666", 
                  marginTop: "12px" 
                }}>
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
                <div style={{ 
                  marginTop: "16px", 
                  color: "white", 
                  fontSize: "14px" 
                }}>
                  Click outside to close
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}