// app/e-checksheet-panel/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar"
import React from "react"
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  ChecklistItem
} from "@/lib/api/checksheet"

export default function EChecksheetPanelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  
  const TYPE_SLUG = 'panel'

  const [isMounted, setIsMounted] = useState(false)
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([])
  const [areaId, setAreaId] = useState<number | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const panelName = searchParams.get("panelName") || "Nama Panel"
  const area = searchParams.get("area") || "Area"
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0]
  
  const [selectedDate, setSelectedDate] = useState<string>(dateParam)
  const [answers, setAnswers] = useState<Record<string, string>>({})

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
    if (isMounted) {
      loadItems();
    }
  }, [isMounted]);

  useEffect(() => {
    if (!panelName || !isMounted) return;
    
    const loadAreaData = async () => {
      try {
        const fullAreaName = `${panelName} \u0007 ${area}`;
        
        const areasRes = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const areasData = await areasRes.json();
        
        if (!areasData.success) {
          throw new Error(areasData.message || 'Gagal mengambil data area');
        }
        
        const areaItem = areasData.data.find((a: any) => 
          a.name.trim().toLowerCase() === fullAreaName.trim().toLowerCase()
        );
        
        if (areaItem) {
          setAreaId(areaItem.id);
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
        } else {
          console.warn(`Area not found: ${fullAreaName}`);
          const fallbackArea = areasData.data.find((a: any) => 
            a.name.trim().toLowerCase().startsWith(panelName.trim().toLowerCase())
          );
          if (fallbackArea) {
            setAreaId(fallbackArea.id);
            const dates = await getAvailableDates(TYPE_SLUG, fallbackArea.id);
            setAvailableDates(dates);
          } else {
            alert(`Panel "${panelName}" tidak ditemukan di database.`);
          }
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };
    
    loadAreaData();
  }, [panelName, area, isMounted]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || loading) return
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page")
    }
  }, [user, loading, router, isMounted])

  if (!isMounted) return null
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
            background: #f5f5f5;
          }
        `}</style>
      </div>
    )
  }
  if (!user || (user.role !== "inspector-ga")) return null

  // Inspection items with type definition
  const inspectionItemsDisplay = [
    { no: 1, name: "Temp (°C)", key: "temp_c", type: "text" },
    { no: 2, name: "Temp Cable Connect", key: "temp_cable_connect", type: "text" },
    { no: 3, name: "Temp Cable", key: "temp_cable", type: "text" },
    { no: 4, name: "Bau", key: "bau", type: "dropdown" },
    { no: 5, name: "Suara", key: "suara", type: "dropdown" },
    { no: 6, name: "Sistem Grounding", key: "sistem_grounding", type: "dropdown" },
    { no: 7, name: "Kondisi kabel dan isolasinya", key: "kondisi_kabel_isolasi", type: "dropdown" },
    { no: 8, name: "Indikator panel", key: "indikator_panel", type: "dropdown" },
    { no: 9, name: "ELCB", key: "elcb", type: "dropdown" },
    { no: 10, name: "Safety warning", key: "safety_warning", type: "dropdown" },
    { no: 11, name: "Kondisi Sambungan", sub: ["R", "S", "T"], keys: ["sambungan_r", "sambungan_s", "sambungan_t"], type: "dropdown" },
    { no: 12, name: "Box Panel", key: "box_panel", type: "dropdown" },
    { no: 13, name: "5S", key: "s5", type: "dropdown" },
    { no: 14, name: "Lain-lain", key: "lain_lain", type: "text" },
  ]

  const handleInputChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

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
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data && Object.keys(data).length > 0) {
        const newAnswers: Record<string, string> = {};
        
        inspectionItemsDisplay.forEach(item => {
          if (item.sub && item.keys) {
            item.keys.forEach((key, idx) => {
              const itemData = data[key];
              if (itemData) {
                newAnswers[`${item.no}-${item.sub[idx]}`] = itemData.hasilPemeriksaan || "";
              }
            });
          } else if (item.key) {
            const itemData = data[item.key];
            if (itemData) {
              newAnswers[item.no.toString()] = itemData.hasilPemeriksaan || "";
            }
          }
        });
        
        if (data.signature) {
          newAnswers["signature"] = data.signature.hasilPemeriksaan || "";
        }
        
        setAnswers(newAnswers);
        alert("Data berhasil dimuat!");
      } else {
        alert("Tidak ada data untuk tanggal ini.");
        setAnswers({});
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
      alert("Gagal memuat data.");
    }
  };

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

    try {
      setIsSaving(true);

      const checklistData: any = {};
      
      inspectionItemsDisplay.forEach((item) => {
        if (item.sub && item.keys) {
          item.keys.forEach((key, idx) => {
            checklistData[key] = {
              date: selectedDate,
              hasilPemeriksaan: answers[`${item.no}-${item.sub[idx]}`] || "",
              keteranganTemuan: "",
              tindakanPerbaikan: "",
              pic: "",
              dueDate: "",
              verify: "",
              inspector: user.fullName || "",
              images: [],
              notes: ""
            };
          });
        } else if (item.key) {
          checklistData[item.key] = {
            date: selectedDate,
            hasilPemeriksaan: answers[item.no.toString()] || "",
            keteranganTemuan: "",
            tindakanPerbaikan: "",
            pic: "",
            dueDate: "",
            verify: "",
            inspector: user.fullName || "",
            images: [],
            notes: ""
          };
        }
      });

      if (answers["signature"]) {
        checklistData["signature"] = {
          date: selectedDate,
          hasilPemeriksaan: answers["signature"],
          keteranganTemuan: "",
          tindakanPerbaikan: "",
          pic: "",
          dueDate: "",
          verify: "",
          inspector: user.fullName || "",
          images: [],
          notes: ""
        };
      }

      await saveChecklist(
        TYPE_SLUG,
        areaId,
        selectedDate,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );

      alert("Data berhasil disimpan!");
      
      setTimeout(() => {
        router.push(`/status-ga/panel?openPanel=${encodeURIComponent(panelName)}`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (item: any) => {
    if (item.type === "dropdown") {
      return (
        <select
          value={answers[item.no.toString()] || ""}
          onChange={(e) => handleInputChange(item.no.toString(), e.target.value)}
          disabled={!selectedDate}
          className="input-field select-field"
        >
          <option value="">-</option>
          <option value="O">O</option>
          <option value="X">X</option>
        </select>
      );
    } else {
      return (
        <input
          type="text"
          value={answers[item.no.toString()] || ""}
          onChange={(e) => handleInputChange(item.no.toString(), e.target.value)}
          disabled={!selectedDate}
          className="input-field"
        />
      );
    }
  };

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header-section">
          <div className="header-content">
            <h1>Check Sheet Inspeksi Panel</h1>
            <p className="header-subtitle">Form Pemeriksaan Kelayakan Panel Listrik</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Nama Panel</span>
              <span className="info-value">{panelName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Area</span>
              <span className="info-value">{area}</span>
            </div>
            <div className="info-row">
              <span className="info-label">PIC Pengecekan</span>
              <span className="info-value">{user.fullName}</span>
            </div>
          </div>
        </div>

        <div className="date-section">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "600", color: "#0d47a1", fontSize: "14px", minWidth: "140px" }}>
              📅 Tanggal Pemeriksaan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#333",
                fontWeight: "600",
                minWidth: "160px"
              }}
            />
          </div>

          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "600", color: "#0d47a1", fontSize: "14px", minWidth: "140px" }}>
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
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  fontWeight: "600",
                  minWidth: "180px"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate}
                style={{
                  padding: "8px 16px",
                  background: selectedDate ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: selectedDate ? "pointer" : "not-allowed",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                📂 Muat Data
              </button>
            </div>
          )}

          <p style={{
            margin: "12px 0 0 0",
            fontSize: "12px",
            color: "#666",
            fontStyle: "italic"
          }}>
            💡 O = Aman/OK, X = NG/Tidak Aman, - = Belum Diisi
          </p>
        </div>

        <div className="table-container">
          <table className="checksheet-table">
            <thead>
              <tr>
                <th className="col-no">NO</th>
                <th className="col-item">ITEM PENGECEKAN</th>
                <th className="col-date">HASIL</th>
              </tr>
            </thead>
            <tbody>
              {inspectionItemsDisplay.map((item) => {
                if (item.sub) {
                  return (
                    <React.Fragment key={item.no}>
                      <tr>
                        <td rowSpan={item.sub.length} className="col-no">{item.no}</td>
                        <td rowSpan={item.sub.length} className="col-item">{item.name}</td>
                        <td className="col-input">
                          <select
                            value={answers[`${item.no}-R`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-R`, e.target.value)}
                            disabled={!selectedDate}
                            className="input-field select-field"
                          >
                            <option value="">-</option>
                            <option value="O">O</option>
                            <option value="X">X</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <select
                            value={answers[`${item.no}-S`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-S`, e.target.value)}
                            disabled={!selectedDate}
                            className="input-field select-field"
                          >
                            <option value="">-</option>
                            <option value="O">O</option>
                            <option value="X">X</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <select
                            value={answers[`${item.no}-T`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-T`, e.target.value)}
                            disabled={!selectedDate}
                            className="input-field select-field"
                          >
                            <option value="">-</option>
                            <option value="O">O</option>
                            <option value="X">X</option>
                          </select>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                }
                return (
                  <tr key={item.no}>
                    <td className="col-no">{item.no}</td>
                    <td className="col-item">{item.name}</td>
                    <td className="col-input">
                      {renderInputField(item)}
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={2} className="col-signature-label">TANDA TANGAN / NIK</td>
                <td className="col-input">
                  <input
                    type="text"
                    value={answers["signature"] || ""}
                    onChange={(e) => handleInputChange("signature", e.target.value)}
                    disabled={!selectedDate}
                    className="input-field"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push("/status-ga/panel")} className="btn-secondary">
            ← Kembali
          </button>
          <button 
            onClick={handleSave} 
            disabled={!selectedDate || isSaving}
            className="btn-primary"
            style={{
              opacity: (selectedDate && !isSaving) ? 1 : 0.6,
              cursor: (selectedDate && !isSaving) ? "pointer" : "not-allowed"
            }}
          >
            {isSaving ? "Menyimpan..." : "✓ Simpan"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-content {
          padding: 32px 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .header-section {
          margin-bottom: 32px;
        }

        .header-content {
          background: linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%);
          border-radius: 12px;
          padding: 24px 32px;
          box-shadow: 0 4px 12px rgba(13, 71, 161, 0.15);
        }

        .header-content h1 {
          margin: 0 0 8px 0;
          color: white;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .header-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 400;
        }

        .info-section {
          margin-bottom: 24px;
        }

        .info-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          padding: 20px 24px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #0d47a1;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 150px;
        }

        .info-value {
          color: #333;
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          flex: 1;
        }

        .date-section {
          background: white;
          border: 2px solid #1e88e5;
          border-radius: 10px;
          padding: 16px 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          overflow: hidden;
          border: 1px solid #e8e8e8;
          margin-bottom: 28px;
        }

        .checksheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .checksheet-table th {
          background: #f5f7fa;
          font-weight: 600;
          color: #0d47a1;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 2px solid #e8e8e8;
        }

        .checksheet-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }

        .checksheet-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .checksheet-table tbody tr:hover {
          background-color: #fafbfc;
        }

        .col-no {
          width: 50px;
          font-weight: 600;
          color: #333;
          text-align: center;
        }

        .col-item {
          font-weight: 500;
          color: #1e88e5;
          min-width: 250px;
        }

        .col-date {
          width: 120px;
        }

        .col-input {
          width: 120px;
        }

        .col-signature-label {
          text-align: right;
          font-weight: 600;
          color: #0d47a1;
          background: #f5f7fa;
        }

        select.input-field {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          color: #333;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .input-field.select-field {
          width: 100%;
          cursor: pointer;
          background: white;
        }

        .input-field:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .input-field:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30,136,229,0.1);
          background: #f9fbff;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          padding: 20px 0;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 28px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 140px;
        }

        .btn-primary {
          background: linear-gradient(135deg,#1e88e5,#1565c0);
          color: white;
          box-shadow: 0 2px 8px rgba(30,136,229,0.2);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg,#1565c0,#0d47a1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13,71,161,0.3);
        }

        .btn-secondary {
          background: #bdbdbd;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .btn-secondary:hover {
          background: #757575;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
          }

          .header-content {
            padding: 16px 20px;
          }

          .header-content h1 {
            font-size: 22px;
          }

          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .info-value {
            text-align: left;
          }

          .col-item {
            min-width: 150px;
            font-size: 12px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}