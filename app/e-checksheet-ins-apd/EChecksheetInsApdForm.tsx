// app/e-checksheet-ins-apd/EChecksheetInsApdForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
// ✅ Import API helper
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  ChecklistItem
} from "@/lib/api/checksheet";

export function EChecksheetInsApdForm({ areaId: initialAreaId }: { areaId: number }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'inspeksi-apd';

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [areaId, setAreaId] = useState<number>(initialAreaId);
  const [areaData, setAreaData] = useState<any>(null);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Load area data dan inspection items dari API
  useEffect(() => {
    const loadAreaAndItems = async () => {
      try {
        // Load area info
        const areasRes = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const areasData = await areasRes.json();
        
        if (areasData.success) {
          const area = areasData.data.find((a: any) => a.id === initialAreaId);
          if (area) {
            setAreaData(area);
          }
        }

        // Load inspection items
        const items = await getItemsByType(TYPE_SLUG);
        console.log('Loaded inspection items:', items);
        setInspectionItems(items);
        
        // Initialize rows from items
        initializeRowsFromItems(items);
        
        // Load available dates
        const dates = await getAvailableDates(TYPE_SLUG, initialAreaId);
        setAvailableDates(dates);
      } catch (error) {
        console.error("Failed to load data:", error);
        alert("Gagal memuat data. Silakan coba lagi.");
      }
    };
    
    if (isMounted) {
      loadAreaAndItems();
    }
  }, [isMounted, initialAreaId]);

  // ✅ Initialize rows dari inspection items
  const initializeRowsFromItems = (items: ChecklistItem[]) => {
    const newRows: any[] = [];
    
    // Group items by proses
    const prosesList = items.filter(item => item.item_group === 'PROSES');
    
    prosesList.forEach(prosesItem => {
      // Add proses row
      newRows.push({
        type: "proses",
        item_key: prosesItem.item_key,
        proses: prosesItem.item_check,
        r1: "",
        r2: "",
        r3: "",
        r4: "",
        r5: "",
        r6: "",
        persentaseOk: "",
        problem: "",
        tindakanPerbaikan: "",
        pic: "",
        verify: ""
      });
      
      // Find APD items for this proses
      const apdItems = items.filter(item => 
        item.item_group === prosesItem.item_key // APD items memiliki item_group = proses item_key
      );
      
      // Add APD rows
      apdItems.forEach(apdItem => {
        newRows.push({
          type: "apd",
          item_key: apdItem.item_key,
          proses: apdItem.item_check,
          r1: "",
          r2: "",
          r3: "",
          r4: "",
          r5: "",
          r6: "",
          persentaseOk: "",
          problem: "",
          tindakanPerbaikan: "",
          pic: "",
          verify: ""
        });
      });
    });
    
    setRows(newRows);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

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

  // ✅ Load existing data dari API
  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Please select a date first");
      return;
    }

    try {
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data && Object.keys(data).length > 0) {
        // Populate rows with existing data
        const newRows = rows.map(row => {
          const itemData = data[row.item_key];
          if (itemData) {
            // Parse notes untuk mendapatkan r1-r6 values
            let parsedNotes: any = {};
            try {
              if (itemData.notes) {
                parsedNotes = JSON.parse(itemData.notes);
              }
            } catch (e) {
              console.error('Error parsing notes:', e);
            }
            
            return {
              ...row,
              r1: parsedNotes.r1 || "",
              r2: parsedNotes.r2 || "",
              r3: parsedNotes.r3 || "",
              r4: parsedNotes.r4 || "",
              r5: parsedNotes.r5 || "",
              r6: parsedNotes.r6 || "",
              persentaseOk: itemData.hasilPemeriksaan || "",
              problem: itemData.keteranganTemuan || "",
              tindakanPerbaikan: itemData.tindakanPerbaikan || "",
              pic: itemData.pic || "",
              verify: itemData.verify || ""
            };
          }
          return row;
        });
        
        setRows(newRows);
        alert("Data loaded successfully");
      } else {
        alert("No data found for this date");
        initializeRowsFromItems(inspectionItems);
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
      alert("Failed to load data");
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
      alert("Please select an inspection date");
      return;
    }

    // Calculate percentage for APD items
    const updatedRows = rows.map(row => {
      if (row.type === "proses") {
        return { ...row, persentaseOk: "" };
      }
      const responses = [row.r1, row.r2, row.r3, row.r4, row.r5, row.r6];
      const okCount = responses.filter(r => r === "✓").length;
      const percentage = ((okCount / 6) * 100).toFixed(0) + "%";
      return { ...row, persentaseOk: percentage };
    });

    try {
      setIsSaving(true);

      // Format data untuk API
      const checklistData: any = {};
      
      updatedRows.forEach((row) => {
        // Store r1-r6 values in notes as JSON
        const notesData = {
          r1: row.r1 || "",
          r2: row.r2 || "",
          r3: row.r3 || "",
          r4: row.r4 || "",
          r5: row.r5 || "",
          r6: row.r6 || ""
        };
        
        checklistData[row.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: row.persentaseOk || "",
          keteranganTemuan: row.problem || "",
          tindakanPerbaikan: row.tindakanPerbaikan || "",
          pic: row.pic || "",
          dueDate: "",
          verify: row.verify || "",
          inspector: user.fullName || "",
          images: [],
          notes: JSON.stringify(notesData)
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

      alert(`Inspection data saved for ${new Date(selectedDate).toLocaleDateString("en-US")}`);
      
      // Redirect ke status page setelah 500ms
      setTimeout(() => {
        router.push(`/status-ga/inspeksi-apd`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRowField = (index: number, field: string, value: string) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  // Parse area name untuk display
  const areaName = areaData?.name?.split(' \u0007 ')[0] || `Area ${areaId}`;
  const areaType = areaData?.name?.split(' \u0007 ')[1] || "Produksi";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ 
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "25px",
        paddingBottom: "25px", 
        maxWidth: "100%", 
        margin: "0 auto" }}>        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              APD Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Monthly APD compliance checklist for {areaName} ({areaType})
            </p>
          </div>
        </div>
        
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area ID</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaId}</span>
            </div>
            <div> 
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Name</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaName}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Type</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaType}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Inspector</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        {/* Inspection Schedule */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "500", color: "#212121", fontSize: "15px" }}>Inspection Schedule</span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>\u0007 Every month</span>
          </div>

          {/* Input Tanggal Manual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                color: "#212121",
                padding: "7px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: "5px",
                fontSize: "14px",
                outline: "none",
                minWidth: "160px"
              }}
            />
          </div>

          {/* Dropdown Riwayat Pengisian */}
          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Riwayat Isian:</label>
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
                  minWidth: "180px"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate}
                style={{
                  padding: "7px 16px",
                  background: selectedDate ? "#ff9800" : "#e0e0e0",
                  color: selectedDate ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "5px",
                  cursor: selectedDate ? "pointer" : "not-allowed",
                  fontWeight: "500",
                  fontSize: "14px"
                }}
              >
                Load Existing
              </button>
            </div>
          )}
        </div>

        {/* Tabel APD */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px" }}>
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
                {rows.map((row, idx) => (
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
                      <input
                        value={row.proses}
                        disabled
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontWeight: row.type === "proses" ? "600" : "normal"
                        }}
                      />
                    </td>
                    {[...Array(6)].map((_, i) => {
                      const field = `r${i + 1}` as keyof typeof row;
                      return (
                        <td key={i} style={{ 
                          padding: "6px", 
                          border: "1px solid #ddd", 
                          textAlign: "center",
                          background: "white"
                        }}>
                          {row.type === "proses" ? (
                            <input
                              value={row[field]}
                              onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                              disabled={!selectedDate}
                              placeholder="NIK/Mesin"
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "12px",
                                border: "1px solid #ccc",
                                borderRadius: "3px",
                                background: "#f9f9f9"
                              }}
                            />
                          ) : (
                            <select
                              value={row[field]}
                              onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                              disabled={!selectedDate}
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "12px",
                                border: "1px solid #ccc",
                                borderRadius: "3px"
                              }}
                            >
                              <option value="">-</option>
                              <option value="✓">✓</option>
                              <option value="✗">✗</option>
                            </select>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ 
                      padding: "8px", 
                      border: "1px solid #ddd", 
                      textAlign: "center",
                      background: "white"
                    }}>
                      {row.persentaseOk}
                    </td>
                    <td colSpan={4} style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <textarea
                        value={row.problem}
                        onChange={(e) => updateRowField(idx, "problem", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Alasan tidak memakai APD..."
                        rows={1}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td colSpan={4} style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <textarea
                        value={row.tindakanPerbaikan}
                        onChange={(e) => updateRowField(idx, "tindakanPerbaikan", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Tindakan perbaikan..."
                        rows={1}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={row.pic}
                        onChange={(e) => updateRowField(idx, "pic", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="PIC"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={row.verify}
                        onChange={(e) => updateRowField(idx, "verify", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Verify"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/inspeksi-apd")}
            style={{
              padding: "11px 28px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isSaving}
            style={{
              padding: "11px 28px",
              background: (selectedDate && !isSaving) ? "#1976d2" : "#e0e0e0",
              color: (selectedDate && !isSaving) ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              opacity: (selectedDate && !isSaving) ? 1 : 0.6,
              cursor: (selectedDate && !isSaving) ? "pointer" : "not-allowed"
            }}
          >
            {isSaving ? "Menyimpan..." : "✓ Simpan Data"}
          </button>
        </div>
      </div>
    </div>
  );
}