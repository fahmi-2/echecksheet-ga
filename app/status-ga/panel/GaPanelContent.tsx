// app/status-ga/panel/GaPanelContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
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

export function GaPanelContent({ openPanel }: { openPanel: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const TYPE_SLUG = 'panel';

  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [checksheetData, setChecksheetData] = useState<any>(null);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        console.log('Loaded areas:', data);
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
    if (!openPanel) return;
    const found = areas.find((p) => {
      const parts = p.name.split(' \u0007 ');
      return parts[0] === openPanel;
    });
    if (found) {
      setTimeout(() => openDetail(found), 50);
    }
  }, [isMounted, loading, openPanel, areas]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID");
  };

  const openDetail = async (panel: Area) => {
    setSelectedArea(panel);
    setShowModal(true);
    setIsLoading(true);

    try {
      console.log('Opening detail for panel:', panel);
      const dates = await getAvailableDates(TYPE_SLUG, panel.id);
      console.log('Available dates:', dates);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        setSelectedDate(latestDate);
        await loadDateData(panel.id, latestDate);
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

  const loadDateData = async (areaId: number, date: string) => {
    setIsLoading(true);
    try {
      console.log('Loading data for areaId:', areaId, 'date:', date);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, date);
      console.log('Received data:', data);
      
      if (data && Object.keys(data).length > 0) {
        const transformedData = {
          _savedAt: date,
          tempC: data.temp_c?.hasilPemeriksaan || "",
          tempCableConnect: data.temp_cable_connect?.hasilPemeriksaan || "",
          tempCable: data.temp_cable?.hasilPemeriksaan || "",
          bau: data.bau?.hasilPemeriksaan || "",
          suara: data.suara?.hasilPemeriksaan || "",
          sistemGrounding: data.sistem_grounding?.hasilPemeriksaan || "",
          kondisiKabelIsolasi: data.kondisi_kabel_isolasi?.hasilPemeriksaan || "",
          indikatorPanel: data.indikator_panel?.hasilPemeriksaan || "",
          elcb: data.elcb?.hasilPemeriksaan || "",
          safetyWarning: data.safety_warning?.hasilPemeriksaan || "",
          kondisiSambunganR: data.sambungan_r?.hasilPemeriksaan || "",
          kondisiSambunganS: data.sambungan_s?.hasilPemeriksaan || "",
          kondisiSambunganT: data.sambungan_t?.hasilPemeriksaan || "",
          boxPanel: data.box_panel?.hasilPemeriksaan || "",
          s5: data.s5?.hasilPemeriksaan || "",
          keteranganNg1: data.lain_lain?.hasilPemeriksaan || "",
          signature: data.signature?.hasilPemeriksaan || "",
          inspector: data.temp_c?.inspector || data.bau?.inspector || ""
        };
        
        console.log('Transformed data:', transformedData);
        setChecksheetData([transformedData]);
      } else {
        console.log('No data found');
        setChecksheetData(null);
      }
    } catch (error) {
      console.error("Error loading date data:", error);
      setChecksheetData(null);
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderStatusBadge = (value: string) => {
    if (!value || value === "-" || value === "") {
      return <span className="status-badge status-empty">-</span>;
    }
    if (value === "O") {
      return <span className="status-badge status-ok">O</span>;
    }
    if (value === "X") {
      return <span className="status-badge status-ng">X</span>;
    }
    return <span className="status-badge status-text">{value}</span>;
  };

  if (!isMounted) return null;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }
  if (!user || (user.role !== "inspector-ga")) return null;

  return (
    <>
      <div className="app-page">
        <Sidebar userName={user?.fullName} />
        <div className="page-content">
          <div style={{marginBottom: "28px"}} className="header">
            <button onClick={() => router.push("/status-ga")} className="btn-back">
              <ArrowLeft size={18} /> Kembali
            </button>
            <div className="text-header">
              <h1>GA Panel Inspection</h1>
              <p>Manajemen Data Inspeksi Kelayakan Panel Listrik</p>
            </div>
          </div>

          <div className="table-container">
            <table className="status-table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th className="col-nama-panel">Nama Panel</th>
                  <th className="col-area">Area</th>
                  <th className="col-action">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((panel) => {
                  const parts = panel.name.split(' \u0007 ');
                  const panelName = parts[0] || '';
                  const areaName = parts[1] || '';
                  return (
                    <tr key={panel.id}>
                      <td className="col-no">{panel.no}</td>
                      <td className="col-nama-panel">{panelName}</td>
                      <td className="col-area">{areaName}</td>
                      <td className="col-action">
                        <div className="action-cell">
                          <button onClick={() => openDetail(panel)} className="btn-detail">DETAIL</button>
                          <a href={`/e-checksheet-panel?panelName=${encodeURIComponent(panelName)}&area=${encodeURIComponent(areaName)}&date=${new Date().toISOString().split("T")[0]}`} className="btn-check">CHECK</a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isMounted && showModal && selectedArea && (
            <div className="modal-overlay" onClick={closeDetail}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title-section">
                    <h2>Detail Panel</h2>
                    <p className="modal-subtitle">{selectedArea.name.split(' \u0007 ')[0]}</p>
                  </div>
                  <button onClick={closeDetail} className="btn-close">×</button>
                </div>
                <div style={{padding: "16px 24px", background: "white", borderBottom: "1px solid #e0e0e0"}}>
                  <label style={{fontWeight: "500", color: "#424242", marginRight: "12px", fontSize: "14px"}}>Tanggal Pemeriksaan:</label>
                  <select value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} style={{color: "#212121", padding: "7px 12px", border: "1px solid #d0d0d0", borderRadius: "5px", fontSize: "14px", fontWeight: "500", minWidth: "160px", outline: "none"}}>
                    <option value="">-- Pilih Tanggal --</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{new Date(date).toLocaleDateString("id-ID", {day: "2-digit", month: "short", year: "numeric"})}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-body">
                  {isLoading ? (
                    <div className="empty-state"><p>Memuat data...</p></div>
                  ) : !checksheetData || checksheetData.length === 0 ? (
                    <div className="empty-state"><p>Belum ada data pengecekan</p></div>
                  ) : !selectedDate ? (
                    <div className="empty-state"><p>Pilih tanggal untuk melihat detail pemeriksaan</p></div>
                  ) : (
                    <div className="detail-table-container">
                      {checksheetData.map((entry: any, idx: number) => (
                        <div key={idx} className="table-section">
                          <div className="table-section-header">
                            <h3>Pemeriksaan</h3>
                            <span className="table-section-date">{formatDate(entry._savedAt || "")}</span>
                          </div>
                          <table className="detail-table">
                            <tbody>
                              <tr><td className="label">Temp (°C)</td><td className="value">{renderStatusBadge(entry.tempC)}</td><td className="label">Temp Cable Connect</td><td className="value">{renderStatusBadge(entry.tempCableConnect)}</td></tr>
                              <tr><td className="label">Temp Cable</td><td className="value">{renderStatusBadge(entry.tempCable)}</td><td className="label">Bau</td><td className="value">{renderStatusBadge(entry.bau)}</td></tr>
                              <tr><td className="label">Suara</td><td className="value">{renderStatusBadge(entry.suara)}</td><td className="label">Grounding</td><td className="value">{renderStatusBadge(entry.sistemGrounding)}</td></tr>
                              <tr><td className="label">Kabel & Isolasi</td><td className="value">{renderStatusBadge(entry.kondisiKabelIsolasi)}</td><td className="label">Indikator Panel</td><td className="value">{renderStatusBadge(entry.indikatorPanel)}</td></tr>
                              <tr><td className="label">ELCB</td><td className="value">{renderStatusBadge(entry.elcb)}</td><td className="label">Safety Warning</td><td className="value">{renderStatusBadge(entry.safetyWarning)}</td></tr>
                              <tr><td className="label">Sambungan R</td><td className="value">{renderStatusBadge(entry.kondisiSambunganR)}</td><td className="label">Sambungan S</td><td className="value">{renderStatusBadge(entry.kondisiSambunganS)}</td></tr>
                              <tr><td className="label">Sambungan T</td><td className="value">{renderStatusBadge(entry.kondisiSambunganT)}</td><td className="label">Box Panel</td><td className="value">{renderStatusBadge(entry.boxPanel)}</td></tr>
                              <tr><td className="label">5S</td><td className="value">{renderStatusBadge(entry.s5)}</td><td className="label">Keterangan</td><td className="value">{renderStatusBadge(entry.keteranganNg1)}</td></tr>
                              {entry.signature && <tr><td className="label">Tanda Tangan/NIK</td><td className="value" colSpan={3}>{entry.signature}</td></tr>}
                              {entry.inspector && <tr><td className="label">Inspector</td><td className="value" colSpan={3}>{entry.inspector}</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button onClick={closeDetail} className="btn-cancel">Tutup</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .app-page{min-height:100vh;background:#f8f9fa}.page-content{padding:32px 24px;max-width:1400px;margin:0 auto}.table-container{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;border:1px solid #e8e8e8}.status-table{width:100%;border-collapse:collapse;font-size:14px}.status-table th,.status-table td{padding:12px 16px;text-align:left;border-bottom:1px solid #f0f0f0;vertical-align:middle}.status-table th{background:#f5f7fa;font-weight:600;color:#0d47a1;font-size:13px;text-transform:uppercase;letter-spacing:.5px}.status-table tbody tr{transition:background-color .2s ease}.status-table tbody tr:hover{background-color:#fafbfc}.col-no{width:50px;text-align:center;font-weight:600;color:#333}.col-nama-panel{min-width:200px;font-weight:500;color:#1e88e5}.col-area{min-width:180px;color:#666;font-size:13px}.col-action{width:220px}.action-cell{display:flex;gap:8px}.btn-detail,.btn-check{display:inline-flex;align-items:center;justify-content:center;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;cursor:pointer;border:none;transition:all .3s ease;white-space:nowrap;text-transform:uppercase;letter-spacing:.5px}.btn-detail{background:#1e88e5;color:white}.btn-detail:hover{background:#0d47a1;box-shadow:0 2px 8px rgba(13,71,161,.3);transform:translateY(-1px)}.btn-check{background:#4caf50;color:white}.btn-check:hover{background:#388e3c;box-shadow:0 2px 8px rgba(76,175,80,.3);transform:translateY(-1px)}.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1000;padding:20px}.modal-content{background:white;border-radius:12px;width:95%;max-width:1000px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column}.modal-header{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 28px;background:linear-gradient(135deg,#f5f7fa 0%,#e8ecf1 100%);border-bottom:2px solid #e8e8e8;flex-shrink:0}.modal-title-section h2{margin:0 0 4px 0;color:#0d47a1;font-size:20px;font-weight:700}.modal-subtitle{margin:0;color:#1e88e5;font-size:14px;font-weight:500}.btn-close{background:none;border:none;font-size:28px;cursor:pointer;color:#999;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:all .3s ease;flex-shrink:0}.btn-close:hover{color:#d32f2f;background:rgba(211,47,47,.1);border-radius:6px}.modal-body{padding:28px;overflow-y:auto;flex:1}.detail-table-container{display:flex;flex-direction:column;gap:20px}.table-section{background:white;border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.05)}.table-section-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#f5f9ff;border-bottom:1px solid #e8e8e8}.table-section-header h3{margin:0;color:#0d47a1;font-size:16px;font-weight:600}.table-section-date{color:#666;font-size:13px;font-weight:500}.detail-table{width:100%;border-collapse:collapse;font-size:14px}.detail-table tbody tr{border-bottom:1px solid #f0f0f0;transition:background-color .2s ease}.detail-table tbody tr:hover{background-color:#fafbfc}.detail-table td{padding:12px 16px;vertical-align:middle}.detail-table td.label{font-weight:600;color:#1e88e5;font-size:12px;text-transform:uppercase;letter-spacing:.3px;width:25%;background:#f9fbfd}.detail-table td.value{color:#333;font-weight:500;width:25%;word-break:break-word}.status-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 12px;border-radius:6px;font-weight:700;font-size:14px;min-width:40px}.status-badge.status-ok{background:#4caf50;color:white}.status-badge.status-ng{background:#f44336;color:white}.status-badge.status-empty{background:#e0e0e0;color:#757575}.status-badge.status-text{background:#2196f3;color:white}.empty-state{text-align:center;padding:40px 20px;color:#999;font-size:14px}.modal-footer{display:flex;justify-content:flex-end;padding:20px 28px;background:#f5f7fa;border-top:1px solid #e8e8e8;gap:12px;flex-shrink:0}.btn-cancel{padding:8px 20px;background:#bdbdbd;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;transition:all .3s ease;text-transform:uppercase;letter-spacing:.5px}.btn-cancel:hover{background:#757575;transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.15)}
      `}</style>
    </>
  );
}