"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
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

interface AreaStatus {
  [areaId: number]: {
    statusLabel: string;
    statusColor: string;
    lastCheck: string;
  };
}

export function GaTanggaListrikContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  
  const openArea = searchParams.get('openArea') || '';
  const TYPE_SLUG = 'tg-listrik'; // ✅ Hardcode type slug
  
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  
  // ✅ NEW: State untuk menyimpan status semua area
  const [areaStatuses, setAreaStatuses] = useState<AreaStatus>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

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
      
      const statusMap: AreaStatus = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          
          if (dates.length > 0) {
            const latest = dates[0]; // Dates sudah sorted DESC dari API
            statusMap[area.id] = {
              statusLabel: "Ada Data",
              statusColor: "#4caf50",
              lastCheck: new Date(latest).toLocaleDateString("id-ID", { 
                day: "numeric", 
                month: "short" 
              })
            };
          } else {
            statusMap[area.id] = {
              statusLabel: "Belum Ada Data",
              statusColor: "#9e9e9e",
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

  // ✅ Auto-open modal jika ada openArea param
  useEffect(() => {
    if (!isMounted || loading || !openArea || areas.length === 0) return;
    
    console.log('🔍 Searching for area to auto-open:', openArea);
    const found = areas.find((item) => item.name === openArea);
    
    if (found) {
      console.log('✅ Found area, opening detail:', found);
      setTimeout(() => openDetail(found), 100);
    }
  }, [isMounted, loading, openArea, areas]);

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

  const openImageModal = (url: string) => {
    setCurrentImageUrl(url);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };

  const filteredData = areas.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }} className="header">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18}/> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", letterSpacing: "-0.5px" }}>
              GA Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Manajemen Data Inspeksi Tangga Listrik (Aerial Work Platform)
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <input
            type="text"
            placeholder="🔍 Cari area atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px 14px",
              border: "1px solid #1e88e5",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#333",
              width: "100%",
              outline: "none"
            }}
          />
        </div>

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          {isLoadingStatuses && (
            <div style={{ 
              padding: "12px 20px", 
              background: "#fff3cd", 
              borderBottom: "1px solid #e8e8e8",
              color: "#856404",
              fontSize: "13px",
              textAlign: "center"
            }}>
              ⏳ Loading status data...
            </div>
          )}
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Nama Area</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "#999" }}>
                      {searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : "Tidak ada data"}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((area) => {
                    // ✅ Ambil status dari state yang sudah di-load
                    const status = areaStatuses[area.id] || {
                      statusLabel: "Loading...",
                      statusColor: "#9e9e9e",
                      lastCheck: "-"
                    };

                    return (
                      <tr key={area.id}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: "600", color: "#0d47a1" }}>
                          {area.no}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: "500", color: "#1e88e5" }}>
                          {area.name}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: "13px" }}>
                          {area.location}
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{
                              padding: "5px 12px",
                              background: status.statusColor,
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700",
                              display: "inline-block"
                            }}>
                              {status.statusLabel}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>
                              {status.lastCheck}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openDetail(area)}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                background: "#1e88e5",
                                color: "white",
                                border: "none",
                                cursor: "pointer"
                              }}
                            >
                              DETAIL
                            </button>
                            <a
                              href={`/e-checksheet-tg-listrik?areaName=${encodeURIComponent(area.name)}&lokasi=${encodeURIComponent(area.location)}`}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                background: "#4caf50",
                                color: "white",
                                textDecoration: "none",
                                display: "inline-block"
                              }}
                            >
                              CHECK
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
                borderRadius: "12px",
                width: "95%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Modal Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "20px 24px",
                background: "#f5f7fa",
                borderBottom: "2px solid #e8e8e8"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
                    Detail Tangga Listrik
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontWeight: "500", fontSize: "14px" }}>
                    {selectedArea.name}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>
                    {selectedArea.location}
                  </p>
                </div>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    background: "none", 
                    border: "none", 
                    fontSize: "32px", 
                    cursor: "pointer", 
                    color: "#999",
                    lineHeight: "1"
                  }}
                >
                  ×
                </button>
              </div>

              {/* Dropdown Tanggal */}
              <div style={{ 
                padding: "14px 20px", 
                background: "#f9f9f9", 
                borderBottom: "1px solid #e0e0e0" 
              }}>
                <label style={{ 
                  fontWeight: "600", 
                  color: "#0d47a1", 
                  marginRight: "12px", 
                  fontSize: "13px" 
                }}>
                  Pilih Tanggal:
                </label>
                <select
                  value={selectedDateInModal}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  disabled={availableDates.length === 0}
                  style={{
                    color: "#0d47a1",
                    padding: "8px 12px",
                    border: "1px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    minWidth: "160px",
                    cursor: availableDates.length > 0 ? "pointer" : "not-allowed"
                  }}
                >
                  {availableDates.length === 0 ? (
                    <option value="">Belum ada data</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Tanggal --</option>
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

              {/* Modal Body */}
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    ⏳ Loading data...
                  </div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    {availableDates.length === 0 
                      ? "📭 Belum ada data pengecekan untuk area ini"
                      : "👆 Pilih tanggal untuk melihat detail"}
                  </div>
                ) : !checksheetData ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                    ❌ Tidak ada data untuk tanggal ini
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
                        <tr style={{ background: "#e3f2fd" }}>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "300px" }}>Item Pengecekan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Hasil</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Keterangan Temuan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Tindakan Perbaikan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>Dokumentasi</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Due Date</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>Verify</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                              Loading items...
                            </td>
                          </tr>
                        ) : (
                          inspectionItems.map(item => {
                            // ✅ Ambil data dari checksheetData berdasarkan item_key
                            const entry = checksheetData[item.item_key] || null;
                            const images = entry?.images || [];

                            return (
                              <tr key={item.id}>
                                <td style={{ 
                                  padding: "8px 6px", 
                                  border: "1px solid #0d47a1", 
                                  textAlign: "center", 
                                  fontWeight: "600",
                                  background: "white"
                                }}>
                                  {item.no}
                                </td>

                                <td style={{ 
                                  padding: "8px 6px", 
                                  border: "1px solid #0d47a1", 
                                  lineHeight: "1.4",
                                  background: "white"
                                }}>
                                  <div style={{ fontWeight: "600", color: "#0d47a1", marginBottom: "4px" }}>
                                    {item.item_group}
                                  </div>
                                  <div style={{ color: "#555" }}>
                                    {item.item_check}
                                  </div>
                                </td>

                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontWeight: "700",
                                  fontSize: "12px",
                                  background:
                                    entry?.hasilPemeriksaan === "OK"
                                      ? "#c8e6c9"
                                      : entry?.hasilPemeriksaan === "NG"
                                      ? "#ffcdd2"
                                      : "#fff",
                                  color:
                                    entry?.hasilPemeriksaan === "OK"
                                      ? "#2e7d32"
                                      : entry?.hasilPemeriksaan === "NG"
                                      ? "#c62828"
                                      : "#999"
                                }}>
                                  {entry?.hasilPemeriksaan === "OK"
                                    ? "✓ OK"
                                    : entry?.hasilPemeriksaan === "NG"
                                    ? "✗ NG"
                                    : "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", background: "white" }}>
                                  {entry?.keteranganTemuan || "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", background: "white" }}>
                                  {entry?.tindakanPerbaikan || "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", background: "white" }}>
                                  {images.length > 0 ? (
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                                      {images.map((imgUrl: string, idx: number) => (
                                        <div
                                          key={idx}
                                          onClick={() => openImageModal(imgUrl)}
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            border: "1px solid #ccc"
                                          }}
                                        >
                                          <img
                                            src={imgUrl}
                                            alt={`Dok ${idx + 1}`}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#999" }}>-</span>
                                  )}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", background: "white" }}>
                                  {entry?.pic || "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", background: "white" }}>
                                  {entry?.dueDate
                                    ? new Date(entry.dueDate).toLocaleDateString("id-ID", { 
                                        day: "2-digit", 
                                        month: "short",
                                        year: "numeric"
                                      })
                                    : "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", background: "white" }}>
                                  {entry?.verify || "-"}
                                </td>

                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "600", color: "#0d47a1", background: "white" }}>
                                  {entry?.inspector || "-"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ 
                padding: "16px 24px", 
                background: "#f5f7fa", 
                borderTop: "1px solid #e8e8e8", 
                textAlign: "right" 
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