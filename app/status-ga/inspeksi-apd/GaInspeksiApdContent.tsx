// app/status-ga/inspeksi-apd/GaInspeksiApdContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
// ✅ Import API helper
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

export function GaInspeksiApdContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'inspeksi-apd';

  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Produksi");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [checksheetData, setChecksheetData] = useState<any>(null);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!user || (user.role !== "group-leader-qa" && user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router]);

  // Filter areas berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    const parts = item.name.split(' \u0007 ');
    const areaName = parts[0] || '';
    const areaType = parts[1] || '';
    
    const matchCategory = areaType === selectedCategory;
    const matchSearch = areaName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

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
      
      if (data) {
        // Transform data untuk display
        const rows: any[] = [];
        
        // Get proses items
        const prosesItems = inspectionItems.filter(item => item.item_group === 'PROSES');
        
        prosesItems.forEach(prosesItem => {
          const prosesData = data[prosesItem.item_key];
          let parsedNotes: any = {};
          try {
            if (prosesData?.notes) {
              parsedNotes = JSON.parse(prosesData.notes);
            }
          } catch (e) {
            console.error('Error parsing notes:', e);
          }
          
          // Add proses row
          rows.push({
            type: "proses",
            proses: prosesItem.item_check,
            r1: parsedNotes.r1 || "",
            r2: parsedNotes.r2 || "",
            r3: parsedNotes.r3 || "",
            r4: parsedNotes.r4 || "",
            r5: parsedNotes.r5 || "",
            r6: parsedNotes.r6 || "",
            persentaseOk: "",
            problem: prosesData?.keteranganTemuan || "",
            tindakanPerbaikan: prosesData?.tindakanPerbaikan || "",
            pic: prosesData?.pic || "",
            verify: prosesData?.verify || ""
          });
          
          // Find and add APD rows for this proses
          const apdItems = inspectionItems.filter(item => item.item_group === prosesItem.item_key);
          
          apdItems.forEach(apdItem => {
            const apdData = data[apdItem.item_key];
            let apdNotes: any = {};
            try {
              if (apdData?.notes) {
                apdNotes = JSON.parse(apdData.notes);
              }
            } catch (e) {
              console.error('Error parsing APD notes:', e);
            }
            
            rows.push({
              type: "apd",
              proses: apdItem.item_check,
              r1: apdNotes.r1 || "",
              r2: apdNotes.r2 || "",
              r3: apdNotes.r3 || "",
              r4: apdNotes.r4 || "",
              r5: apdNotes.r5 || "",
              r6: apdNotes.r6 || "",
              persentaseOk: apdData?.hasilPemeriksaan || "",
              problem: apdData?.keteranganTemuan || "",
              tindakanPerbaikan: apdData?.tindakanPerbaikan || "",
              pic: apdData?.pic || "",
              verify: apdData?.verify || ""
            });
          });
        });
        
        // Get inspector from first item
        const firstItemKey = Object.keys(data)[0];
        const inspector = data[firstItemKey]?.inspector || "";
        
        setChecksheetData({
          date: date,
          data: rows,
          inspector: inspector
        });
      } else {
        setChecksheetData(null);
      }
      
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

  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{ 
        paddingLeft : "95px",
        paddingRight : "25px",
        paddingBottom : "32px",
        paddingTop : "32px",
        maxWidth: "1400px", 
        margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }} className="header">
          <button
          onClick={() => router.push("/status-ga")}
          className="btn-back"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🛡️ APD Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Monthly inspection schedule and maintenance records for Personal Protective Equipment
            </p>
          </div>
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
            <label htmlFor="category-select" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Area Type:
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
              <option value="Produksi">Produksi</option>
              <option value="QA">QA</option>
              <option value="Gudang">Gudang</option>
              <option value="Logistik">Logistik</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="search-input" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Search Area:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. GENBA, FINAL, WAREHOUSE..."
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
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Area Name</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  const parts = area.name.split(' \u0007 ');
                  const areaName = parts[0] || '';
                  const areaType = parts[1] || '';
                  
                  let statusLabel = "No Data";
                  let statusColor = "#757575";
                  let lastCheck = "-";

                  return (
                    <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{areaName}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{areaType}</td>
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
                            href={`/e-checksheet-ins-apd?areaId=${area.id}&areaName=${encodeURIComponent(areaName)}&areaType=${encodeURIComponent(areaType)}`}
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

        {/* Modal */}
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
                  <h2 style={{ margin: "0 0 4px 0", color: "#212121", fontSize: "20px", fontWeight: "600" }}>
                    Inspection History - {selectedArea.name.split(' \u0007 ')[0]}
                  </h2>
                  <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>
                    {selectedArea.name.split(' \u0007 ')[1]}
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

              <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "500", color: "#424242", marginRight: "12px", fontSize: "14px" }}>
                  Inspection Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    color: "#212121",
                    padding: "7px 12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "160px",
                    outline: "none"
                  }}
                >
                  <option value="">Select date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Loading data...</p>
                  </div>
                ) : !checksheetData ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>No inspection records found</p>
                  </div>
                ) : !selectedDate ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#757575" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Please select an inspection date</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px", border: "1px solid #e0e0e0", background: "white" }}>
                      <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                          <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "4%" }}>NO</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "12%" }}>PROSES</th>
                          <th rowSpan={2} colSpan={6} style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "30%" }}>NO. MESIN/NIK</th>
                          <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PROSENTASE OK</th>
                          <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>PROBLEM</th>
                          <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>TINDAKAN PERBAIKAN</th>
                          <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PIC</th>
                          <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>VERIFY</th>
                        </tr>
                        <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                          <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "18%" }}>STANDART APD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checksheetData.data.map((row: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ 
                              padding: "8px", 
                              border: "1px solid #ddd", 
                              textAlign: "center", 
                              fontWeight: "600",
                              background: row.type === "proses" ? "#f5f5f5" : "white"
                            }}>
                              {idx + 1}
                            </td>
                            <td style={{ 
                              padding: "8px", 
                              border: "1px solid #ddd", 
                              textAlign: "left", 
                              fontWeight: row.type === "proses" ? "600" : "normal",
                              background: row.type === "proses" ? "#f5f5f5" : "white"
                            }}>
                              {row.proses || "-"}
                            </td>
                            {[...Array(6)].map((_, i) => {
                              const val = row[`r${i + 1}`] || "";
                              return (
                                <td key={i} style={{ 
                                  padding: "6px", 
                                  border: "1px solid #ddd", 
                                  textAlign: "center",
                                  background: "white"
                                }}>
                                  {val}
                                </td>
                              );
                            })}
                            <td style={{ 
                              padding: "8px", 
                              border: "1px solid #ddd", 
                              textAlign: "center",
                              background: "white"
                            }}>
                              {row.persentaseOk || ""}
                            </td>
                            <td colSpan={4} style={{ 
                              padding: "6px", 
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.problem || "-"}
                            </td>
                            <td colSpan={4} style={{ 
                              padding: "6px", 
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.tindakanPerbaikan || "-"}
                            </td>
                            <td style={{ 
                              padding: "6px", 
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.pic || "-"}
                            </td>
                            <td style={{ 
                              padding: "6px", 
                              border: "1px solid #ddd",
                              background: "white"
                            }}>
                              {row.verify || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                      <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#757575" }}>Inspector</p>
                      <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>{checksheetData.inspector || "N/A"}</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#757575" }}>Inspection Date</p>
                      <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
                        {new Date(checksheetData.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
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
      </div>
    </div>
  );
}