// app/status-ga/inf-jalan/GaInfJalanContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
// ✅ Import API helper
import {
  getAreasByType,
  getAvailableDates,
  getChecklistByDate,
  getItemsByType,
  ChecklistItem
} from "@/lib/api/checksheet";
import { ArrowLeft } from "lucide-react";

interface Area {
  id: number;
  no: number;
  name: string;
  location: string;
}

export function GaInfJalanContent({ openArea }: { openArea: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'inf-jalan';

  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [checksheetData, setChecksheetData] = useState<any>(null);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ State untuk modal gambar
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('Loaded inspection items:', items);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
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
    if (!openArea) return;
    const found = areas.find((item) => {
      const parts = item.name.split(' \u0007 ');
      return parts[0] === openArea;
    });
    if (found) {
      setTimeout(() => openDetail(found), 50);
    }
  }, [isMounted, loading, openArea, areas]);

  // ✅ Open detail dengan load data dari API
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);

    try {
      // Load available dates untuk area ini
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      
      // Set tanggal terbaru sebagai default
      if (dates.length > 0) {
        const latestDate = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        setSelectedDate(latestDate);
        
        // Load data untuk tanggal terbaru
        await loadDateData(area.id, latestDate);
      } else {
        setChecksheetData(null);
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      setChecksheetData(null);
      setAvailableDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load data untuk tanggal tertentu
  const loadDateData = async (areaId: number, date: string) => {
    setIsLoading(true);
    try {
      const data = await getChecklistByDate(TYPE_SLUG, areaId, date);
      setChecksheetData(data);
      console.log('Loaded data for date:', date, data);
    } catch (error) {
      console.error("Error loading date data:", error);
      setChecksheetData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle perubahan tanggal
  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedArea && newDate) {
      await loadDateData(selectedArea.id, newDate);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setAvailableDates([]);
    setSelectedDate("");
    setShowModal(false);
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

  // ✅ Get area status dari API
  const getAreaStatus = (area: Area) => {
    // Status akan di-update secara real-time melalui useEffect
    return { 
      status: "loading", 
      color: "#9e9e9e", 
      label: "Loading...", 
      completion: "-", 
      lastCheck: "-" 
    };
  };

  // Filter data berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    const parts = item.name.split(' \u0007 ');
    const namaArea = parts[0] || '';
    const kategori = parts[1] || '';
    const lokasi = parts[2] || '';
    
    const matchKategori = filterKategori === "all" || kategori === filterKategori;
    const matchSearch = namaArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });

  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{ paddingLeft: "96px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }} className="header">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", letterSpacing: "-0.5px" }}>
              🛣️ GA Infrastruktur Jalan
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Manajemen Data Inspeksi Infrastruktur Jalan & Boardess
            </p>
          </div>
        </div>

        {/* Filter & Search */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0d47a1",
                background: "white",
                cursor: "pointer",
                minWidth: "150px",
                flex: "1 1 150px"
              }}
            >
              <option value="all">Semua Kategori</option>
              <option value="Jalan Utama">Jalan Utama</option>
              <option value="Jalan Tambahan">Jalan Tambahan</option>
              <option value="Trotuar">Trotuar</option>
              <option value="Boardess">Boardess</option>
            </select>
            <input
              type="text"
              placeholder="Cari area atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#333",
                flex: "1 1 200px",
                minWidth: "200px"
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    width: "50px"
                  }}>No</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "200px"
                  }}>Nama Area</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "120px"
                  }}>Kategori</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "180px"
                  }}>Lokasi</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "100px"
                  }}>Status</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "220px"
                  }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area) => {
                  const parts = area.name.split(' \u0007 ');
                  const namaArea = parts[0] || '';
                  const kategori = parts[1] || '';
                  const lokasi = parts[2] || '';
                  const status = getAreaStatus(area);
                  
                  return (
                    <tr key={area.id} style={{ transition: "background-color 0.2s ease" }}>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#333"
                      }}>{area.no}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        fontWeight: "500",
                        color: "#1e88e5"
                      }}>{namaArea}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        color: "#666",
                        fontSize: "13px"
                      }}>
                        <span style={{
                          padding: "4px 8px",
                          background: "#e3f2fd",
                          color: "#0d47a1",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          maxWidth: "140px"
                        }}>
                          {kategori}
                        </span>
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        color: "#666",
                        fontSize: "13px"
                      }}>{lokasi}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center"
                      }}>
                        <div style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span style={{
                            padding: "4px 12px",
                            background: status.color,
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase"
                          }}>
                            {status.label}
                          </span>
                          <span style={{ fontSize: "10px", color: "#999", fontWeight: "600" }}>
                            {status.completion}
                          </span>
                          <span style={{ fontSize: "9px", color: "#666", fontWeight: "500" }}>
                            {status.lastCheck}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              background: "#1e88e5",
                              color: "white"
                            }}
                          >
                            DETAIL
                          </button>
                          <a
                            href={`/e-checksheet-inf-jalan?areaName=${encodeURIComponent(namaArea)}&kategori=${encodeURIComponent(kategori)}&lokasi=${encodeURIComponent(lokasi)}`}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {isMounted && showModal && selectedArea && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
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
                width: "98%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "20px 24px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
                borderBottom: "2px solid #e8e8e8",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "700" }}>
                    Detail Area Jalan - {selectedArea.no}
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>
                    {selectedArea.name.split(' \u0007 ')[0]}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "clamp(11px, 2.5vw, 12px)" }}>
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
                    transition: "all 0.3s ease",
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                padding: "12px 20px",
                background: "#f9f9f9",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>
                  Pilih Tanggal:
                </label>
                <select
                  value={selectedDate || ""}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    color: "#0d47a1",
                    padding: "6px 10px",
                    border: "1px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    minWidth: "140px"
                  }}
                >
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
                </select>
              </div>

              <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Memuat data...</p>
                  </div>
                ) : !checksheetData || Object.keys(checksheetData).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Belum ada data pengecekan</p>
                  </div>
                ) : !selectedDate ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "14px" }}>
                    <p>Pilih tanggal untuk melihat detail pemeriksaan</p>
                  </div>
                ) : (
                  <div>
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
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "50px"
                            }}>No</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              minWidth: "280px"
                            }}>Item Pengecekan</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "100px"
                            }}>Tanggal</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "100px"
                            }}>Hasil<br/>Pemeriksaan</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              minWidth: "180px"
                            }}>Keterangan<br/>Temuan</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              minWidth: "180px"
                            }}>Tindakan<br/>Perbaikan</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              minWidth: "120px"
                            }}>Dokumentasi</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "80px"
                            }}>PIC</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "100px"
                            }}>Due Date</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "80px"
                            }}>Verify</th>
                            <th style={{
                              padding: "12px 10px",
                              border: "1px solid #0d47a1",
                              fontWeight: "700",
                              color: "#01579b",
                              textAlign: "center",
                              fontSize: "10px",
                              width: "100px"
                            }}>Inspector</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectionItems.map((row) => {
                            const entryForDate = checksheetData?.[row.item_key];
                            const images = entryForDate?.images || [];

                            return (
                              <tr key={row.item_key}>
                                <td style={{
                                  padding: "10px 8px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontWeight: "600",
                                  color: "#333",
                                  fontSize: "10px",
                                  background: "white",
                                  verticalAlign: "top"
                                }}>{row.no}</td>
                                <td style={{
                                  padding: "10px 8px",
                                  border: "1px solid #0d47a1",
                                  fontWeight: "500",
                                  color: "#333",
                                  fontSize: "10px",
                                  background: "white",
                                  verticalAlign: "top",
                                  lineHeight: "1.5"
                                }}>{row.item_check}</td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  fontWeight: "600",
                                  color: "#01579b",
                                  background: "#f5f9ff"
                                }}>
                                  {new Date(selectedDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: entryForDate?.hasilPemeriksaan === "OK" ? "#c8e6c9" : entryForDate?.hasilPemeriksaan === "NG" ? "#ffcdd2" : "#fff",
                                  color: entryForDate?.hasilPemeriksaan === "OK" ? "#2e7d32" : entryForDate?.hasilPemeriksaan === "NG" ? "#c62828" : "#999"
                                }}>
                                  {entryForDate?.hasilPemeriksaan === "OK" ? "✓ OK" : entryForDate?.hasilPemeriksaan === "NG" ? "✗ NG" : "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  fontSize: "10px",
                                  color: "#555",
                                  background: "white",
                                  lineHeight: "1.4"
                                }}>
                                  {entryForDate?.keteranganTemuan || "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  fontSize: "10px",
                                  color: "#555",
                                  background: "white",
                                  lineHeight: "1.4"
                                }}>
                                  {entryForDate?.tindakanPerbaikan || "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  verticalAlign: "top",
                                  background: "white"
                                }}>
                                  {images.length > 0 ? (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
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
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover"
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  fontWeight: "500",
                                  color: "#333",
                                  background: "white"
                                }}>
                                  {entryForDate?.pic || "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  color: "#555",
                                  background: "white"
                                }}>
                                  {entryForDate?.dueDate 
                                    ? new Date(entryForDate.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) 
                                    : "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  fontWeight: "500",
                                  color: "#333",
                                  background: "white"
                                }}>
                                  {entryForDate?.verify || "-"}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  fontWeight: "500",
                                  color: "#333",
                                  background: "#f5f9ff"
                                }}>
                                  {entryForDate?.inspector || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "16px 20px",
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
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Gambar Dokumentasi */}
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