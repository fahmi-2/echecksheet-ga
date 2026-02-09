// app/status-ga/smoke-detector/GaSmokeDetectorContent.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import QrScanner from 'qr-scanner';
import { ArrowLeft } from "lucide-react";

interface DetectorArea {
  id: number;
  no: number;
  name: string;
  location: string;
  zone?: string;
}

interface ChecksheetStatus {
  hasData: boolean;
  lastCheck?: string;
  status: string;
  statusColor: string;
}

export function GaSmokeDetectorContent({ openArea }: { openArea: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Data from API
  const [areas, setAreas] = useState<DetectorArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Modal state
  const [selectedArea, setSelectedArea] = useState<DetectorArea | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const TYPE_SLUG = 'smoke-detector';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router]);

  // Fetch areas from API
  useEffect(() => {
    if (!isMounted || loading) return;
    
    const fetchAreas = async () => {
      try {
        setLoadingAreas(true);
        const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const result = await response.json();
        
        if (result.success) {
          // Transform data to match interface
          const transformedAreas = result.data.map((area: any) => ({
            id: area.id,
            no: area.no,
            name: area.name,
            location: area.location,
            zone: extractZone(area.name) // Extract zone from name
          }));
          setAreas(transformedAreas);
        } else {
          console.error('Failed to fetch areas:', result.message);
        }
      } catch (error) {
        console.error('Error fetching areas:', error);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, [isMounted, loading]);

  // Auto-open area if specified
  useEffect(() => {
    if (!isMounted || loading || loadingAreas) return;
    if (!openArea || areas.length === 0) return;
    
    const found = areas.find((area) => area.location === openArea);
    if (found) {
      setTimeout(() => openDetail(found), 50);
    }
  }, [isMounted, loading, openArea, areas, loadingAreas]);

  // Cleanup QR scanner
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  // QR Scanner logic
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

        // Handle full URLs
        if (urlStr.startsWith('http')) {
          const url = new URL(urlStr);
          if (url.pathname === '/e-checksheet-smoke-detector') {
            router.push(urlStr);
            return;
          }
        }

        // Handle relative paths
        if (urlStr.startsWith('/e-checksheet-smoke-detector?')) {
          router.push(urlStr);
          return;
        }

        alert("Invalid QR code. Please scan a valid smoke detector inspection QR.");
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

  const extractZone = (name: string): string => {
    const match = name.match(/Zone (\d+)/);
    return match ? match[1] : '-';
  };

  const openQrScanner = () => {
    setIsScanning(true);
  };

  const filteredData = areas.filter(area =>
    area.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.zone && area.zone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getChecksheetStatus = async (areaId: number): Promise<ChecksheetStatus> => {
    try {
      const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/dates`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const latestDate = result.data[0];
        return {
          hasData: true,
          lastCheck: new Date(latestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          status: "Checked",
          statusColor: "#43a047"
        };
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
    
    return {
      hasData: false,
      status: "No Data",
      statusColor: "#757575"
    };
  };

  const openDetail = async (area: DetectorArea) => {
    setSelectedArea(area);
    setLoadingDates(true);
    
    try {
      // Fetch available dates
      const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/by-area/${area.id}/dates`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const sortedDates = result.data.sort((a: string, b: string) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        setAvailableDates(sortedDates);
        setSelectedDateInModal(sortedDates[0] || "");
      } else {
        setAvailableDates([]);
        setSelectedDateInModal("");
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
      setAvailableDates([]);
      setSelectedDateInModal("");
    } finally {
      setLoadingDates(false);
      setShowModal(true);
    }
  };

  // Fetch detail when date is selected
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal) {
      setChecksheetData(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const response = await fetch(
          `/api/ga/checksheet/${TYPE_SLUG}/by-area/${selectedArea.id}/${selectedDateInModal}`
        );
        const result = await response.json();
        
        if (result.success && result.data) {
          setChecksheetData(result.data);
        } else {
          setChecksheetData(null);
        }
      } catch (error) {
        console.error('Error fetching detail:', error);
        setChecksheetData(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedArea, selectedDateInModal]);

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setSelectedDateInModal("");
    setAvailableDates([]);
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

  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{ 
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingBottom: "32px",
        paddingTop: "32px", 
        maxWidth: "1400px", 
        margin: "0 auto" 
      }}>
        <div style={{ marginBottom: "28px" }} className="header">
          <button 
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚨 Smoke & Heat Detector Inspection
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Bi-monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* Search Bar */}
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
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <label htmlFor="search-input" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Search Location or Zone:
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="search-input"
                type="text"
                placeholder="e.g. LOBBY, CANTEEN, Zone 10..."
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
              {/* QR Scan Button */}
              <button
                type="button"
                onClick={openQrScanner}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Scan QR Code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <path d="M7 7h.01"></path>
                  <path d="M17 7h.01"></path>
                  <path d="M17 17h.01"></path>
                  <path d="M7 17h.01"></path>
                </svg>
              </button>
            </div>
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
            {loadingAreas ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#9e9e9e" }}>
                <p>Loading detector areas...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#9e9e9e" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>🔍</div>
                <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>No detectors found</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Location</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zone</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((area, idx) => {
                    return (
                      <TableRow 
                        key={area.id} 
                        area={area} 
                        idx={idx} 
                        totalRows={filteredData.length}
                        onOpenDetail={openDetail}
                        typeSlug={TYPE_SLUG}
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Detail */}
        {showModal && selectedArea && (
          <DetailModal
            area={selectedArea}
            availableDates={availableDates}
            selectedDate={selectedDateInModal}
            onDateChange={setSelectedDateInModal}
            checksheetData={checksheetData}
            loadingDates={loadingDates}
            loadingDetail={loadingDetail}
            onClose={closeDetail}
          />
        )}

        {/* QR Scanner Modal */}
        {isScanning && (
          <QRScannerModal
            videoRef={videoRef}
            onClose={() => {
              setIsScanning(false);
              if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Separate component for table row with status fetching
function TableRow({ 
  area, 
  idx, 
  totalRows, 
  onOpenDetail,
  typeSlug 
}: { 
  area: DetectorArea; 
  idx: number; 
  totalRows: number;
  onOpenDetail: (area: DetectorArea) => void;
  typeSlug: string;
}) {
  const [status, setStatus] = useState({
    statusLabel: "No Data",
    statusColor: "#757575",
    lastCheck: "-"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/ga/checksheet/${typeSlug}/by-area/${area.id}/dates`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const latestDate = result.data[0];
          setStatus({
            statusLabel: "Checked",
            statusColor: "#43a047",
            lastCheck: new Date(latestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          });
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [area.id, typeSlug]);

  return (
    <tr style={{ borderBottom: idx === totalRows - 1 ? "none" : "1px solid #f0f0f0" }}>
      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{area.location}</td>
      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{area.zone || '-'}</td>
      <td style={{ padding: "14px 16px", textAlign: "center" }}>
        {loading ? (
          <span style={{ fontSize: "11px", color: "#9e9e9e" }}>Loading...</span>
        ) : (
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
            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
          </div>
        )}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={() => onOpenDetail(area)}
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
            href={`/e-checksheet-smoke-detector?areaId=${area.id}`}
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
}

// Detail Modal Component
function DetailModal({
  area,
  availableDates,
  selectedDate,
  onDateChange,
  checksheetData,
  loadingDates,
  loadingDetail,
  onClose
}: {
  area: DetectorArea;
  availableDates: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  checksheetData: any;
  loadingDates: boolean;
  loadingDetail: boolean;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
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
              Inspection History - Unit #{area.no}
            </h2>
            <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>
              {area.location} • Zone {area.zone || '-'}
            </p>
          </div>
          <button
            onClick={onClose}
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
          {loadingDates ? (
            <span style={{ fontSize: "14px", color: "#9e9e9e" }}>Loading dates...</span>
          ) : availableDates.length === 0 ? (
            <span style={{ fontSize: "14px", color: "#9e9e9e" }}>No inspection records</span>
          ) : (
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
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
          )}
        </div>
        
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
          {loadingDetail ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
              <p>Loading inspection data...</p>
            </div>
          ) : !checksheetData || Object.keys(checksheetData).length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
              <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>
                {!selectedDate ? "Please select an inspection date" : "No inspection data found"}
              </p>
            </div>
          ) : (
            <DetailTable data={checksheetData} />
          )}
        </div>
        
        <div style={{ padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
          <button
            onClick={onClose}
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
  );
}

// Detail Table Component
function DetailTable({ data }: { data: any }) {
  const items = [
    { key: 'alarm_bell', label: 'Alarm Bell' },
    { key: 'indicator_lamp', label: 'Indicator Lamp' },
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'overall_condition', label: 'Overall Condition' }
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "1200px", border: "1px solid #e0e0e0", background: "white" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "15%" }}>Item</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Result</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "20%" }}>Findings</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "20%" }}>Corrective Action</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>PIC</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Due Date</th>
            <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Verified By</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const itemData = data[item.key] || {};
            const result = itemData.hasilPemeriksaan || '-';
            
            return (
              <tr key={item.key}>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "500", color: "#424242" }}>{item.label}</td>
                <td style={{
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  textAlign: "center",
                  fontWeight: "600",
                  background: result === "OK" ? "#e8f5e9" : result === "NG" ? "#ffebee" : "#fff",
                  color: result === "OK" ? "#2e7d32" : result === "NG" ? "#c62828" : "#757575"
                }}>
                  {result}
                </td>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", lineHeight: "1.5", color: "#424242" }}>{itemData.keteranganTemuan || "-"}</td>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", lineHeight: "1.5", color: "#424242" }}>{itemData.tindakanPerbaikan || "-"}</td>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "500", color: "#424242" }}>{itemData.pic || "-"}</td>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", color: "#616161" }}>
                  {itemData.dueDate ? new Date(itemData.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                </td>
                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", color: "#616161" }}>{itemData.verify || "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.alarm_bell?.inspector && (
        <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#757575" }}>Inspector</p>
          <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>{data.alarm_bell.inspector}</p>
        </div>
      )}
    </div>
  );
}

// QR Scanner Modal Component
function QRScannerModal({ 
  videoRef, 
  onClose 
}: { 
  videoRef: React.RefObject<HTMLVideoElement | null>; 
  onClose: () => void;
}) {
  return (
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
      onClick={onClose}
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
        <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Scan Smoke Detector QR Code</h3>
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
          Point your camera at the QR code on the detector
        </p>
        <button
          onClick={onClose}
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
  );
}