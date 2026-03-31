// app/status-ga/selang-hydrant/GaSelangHydrantContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import QrScanner from 'qr-scanner';
import { ArrowLeft, Edit2, Plus, Trash2, X } from "lucide-react";
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

export function GaSelangHydrantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const openAreaParam = searchParams.get('openArea') || '';
  const TYPE_SLUG = 'selang-hydrant';
  
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [currentPreviewImage, setCurrentPreviewImage] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Edit Data States
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // ✅ Add Location Form State
  const [addFormData, setAddFormData] = useState({
    zona: '',
    jenisHydrant: '',
    lokasi: '',
    pic: ''
  });

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };

    if (showEditDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditDropdown]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized) return;
    if (authLoading) return;
    if (!user) {
      console.log('⏳ Waiting for user data...');
      return;
    }
    if (user.role !== "inspector-ga") {
      console.warn('⚠️ Unauthorized - wrong role:', user.role);
      router.replace("/login-page");
      return;
    }
    console.log('✅ Access granted:', user.fullName, 'Role:', user.role);
  }, [user, authLoading, isInitialized, router, isMounted]);

  useEffect(() => {
    if (!user) return;
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('✅ Loaded inspection items:', items.length);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        console.log('✅ Loaded areas:', data.length);
        setAreas(data);
      } catch (error) {
        console.error("❌ Failed to load areas:", error);
      }
    };
    loadAreas();
  }, [user]);

  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses || !user) return;
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      console.log('🔄 Loading statuses for', areas.length, 'areas...');
      
      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          
          if (dates.length > 0) {
            const latest = dates[0];
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

      console.log('✅ All statuses loaded');
      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };

    loadAllStatuses();
  }, [areas, user]);

  useEffect(() => {
    if (!isMounted || !user || !openAreaParam || areas.length === 0) return;
    console.log('🔍 Searching for area to auto-open:', openAreaParam);
    const found = areas.find((item) => {
      const parts = item.name.split(' \\x07 ');
      return parts[0] === openAreaParam;
    });

    if (found) {
      console.log('✅ Found area, opening detail:', found.name);
      setTimeout(() => openDetail(found), 300);
    } else {
      console.warn('⚠️ Area not found for auto-open:', openAreaParam);
    }
  }, [isMounted, user, openAreaParam, areas]);

  // ✅ Handle Add Location
  const handleAddLocation = async () => {
    if (!addFormData.zona || !addFormData.jenisHydrant || !addFormData.lokasi || !addFormData.pic) {
      alert('Semua field wajib diisi!');
      return;
    }

    try {
      setIsAdding(true);
      
      // Get next 'no'
      const maxNo = areas.reduce((max, area) => Math.max(max, area.no), 0);
      const newNo = maxNo + 1;
      
      // Format name: "LOKASI \x07 ZONA \x07 JENIS HYDRANT \x07 PIC"
      const newName = `${addFormData.lokasi} \\x07 ${addFormData.zona} \\x07 ${addFormData.jenisHydrant} \\x07 ${addFormData.pic}`;
      
      // Call API
      const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no: newNo,
          name: newName,
          location: addFormData.zona,
          type_id: 5,
          is_active: true
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      // Update local state
      const newArea: Area = {
        id: result.data?.id || Date.now(),
        no: newNo,
        name: newName,
        location: addFormData.zona
      };

      setAreas(prev => [...prev, newArea]);
      alert('✅ Lokasi berhasil ditambahkan!');
      
      // Reset form and close modal
      setAddFormData({ zona: '', jenisHydrant: '', lokasi: '', pic: '' });
      setShowAddModal(false);
      
    } catch (error) {
      console.error('❌ Error adding location:', error);
      alert('❌ Gagal menambahkan lokasi: ' + (error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  // ✅ Handle Delete Location
  const handleDeleteLocation = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      // Update local state
      setAreas(prev => prev.filter(area => area.id !== deleteTarget.id));
      alert('✅ Lokasi berhasil dihapus!');
      
      // Exit delete mode
      setIsDeleteMode(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      
    } catch (error) {
      console.error('❌ Error deleting location:', error);
      alert('❌ Gagal menghapus lokasi: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDetail = async (area: Area) => {
    if (isDeleteMode) return;
    
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      console.log('📅 Available dates:', dates.length);
      setAvailableDates(dates);

      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDateInModal(latestDate);

        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        console.log('📦 Loaded checklist data');
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
      alert("Gagal memuat data.");
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

  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal || !user) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('📥 Loading data for date:', selectedDateInModal);
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        console.log('📦 Received data');
        setChecksheetData(data);
      } catch (error) {
        console.error("❌ Error loading checklist:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDateInModal, selectedArea, showModal, user]);

  const filteredData = areas.filter(item => {
    const parts = item.name.split(' \\x07 ');
    const lokasi = parts[0] || '';
    const zona = parts[1] || '';
    const jenisHydrant = parts[2] || '';
    const pic = parts[3] || '';
    return (
      lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenisHydrant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pic.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const openImageModal = (url: string) => {
    setCurrentImageUrl(url);
    setShowImageModal(true);
  };
  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };
  const openImagePreviewModal = (imageUrl: string) => {
    setCurrentPreviewImage(imageUrl);
    setShowImagePreviewModal(true);
  };
  const closeImagePreviewModal = () => {
    setShowImagePreviewModal(false);
    setCurrentPreviewImage("");
  };

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
          if (url.pathname === '/e-checksheet-slg-hydrant') {
            router.push(urlStr);
            return;
          }
        }
        if (urlStr.startsWith('/e-checksheet-slg-hydrant?')) {
          router.push(urlStr);
          return;
        }
        alert("Invalid QR code. Please scan a valid selang hydrant inspection QR.");
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

  if (!isMounted || !isInitialized || authLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Loading...</p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "inspector-ga") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Access Denied</p>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "8px" }}>Wrong role for this page</p>
        </div>
      </div>
    );
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
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚒 Selang Hydrant Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Bi-monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* ✅ Search Bar + Edit Data Button (SEJAJAR) */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            {/* Search Input */}
            <div style={{ 
              position: "relative", 
              flex: 1, 
              minWidth: "200px" 
            }}>
              <input
                type="text"
                placeholder="Cari zona, jenis, lokasi, atau PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 40px 10px 16px",
                  border: "1px solid #1976d2",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#333",
                  width: "100%",
                  outline: "none",
                  height: "42px"
                }}
              />
            </div>

            {/* ✅ Edit Data Button (Dropdown dengan 2 OPSI) */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: isDeleteMode ? "#f44336" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  height: "42px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
              >
                {isDeleteMode ? <X size={18} /> : <Edit2 size={18} />}
                {isDeleteMode ? "Batal Edit" : "Edit Data"}
              </button>
              
              {/* ✅ Dropdown Menu dengan 2 OPSI */}
              {showEditDropdown && (
                <>
                  {/* Overlay untuk klik di luar */}
                  <div
                    onClick={() => setShowEditDropdown(false)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1500
                    }}
                  />
                  
                  {/* Dropdown Menu */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "1px solid #e0e0e0",
                      zIndex: 1600,
                      minWidth: "200px",
                      overflow: "hidden"
                    }}
                  >
                    {/* ✅ OPSI 1: Tambah Lokasi */}
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        setShowEditDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "white",
                        border: "none",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#424242",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <Plus size={18} color="#1976d2" />
                      <span>
                        <strong>Tambah Lokasi</strong>
                        <div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>Tambah area baru</div>
                      </span>
                    </button>
                    
                    {/* ✅ OPSI 2: Hapus Lokasi */}
                    <button
                      onClick={() => {
                        setIsDeleteMode(!isDeleteMode);
                        setShowEditDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: isDeleteMode ? "#ffebee" : "white",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: isDeleteMode ? "#c62828" : "#424242",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffcdd2" : "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffebee" : "white"}
                    >
                      <Trash2 size={18} color={isDeleteMode ? "#f44336" : "#757575"} />
                      <span>
                        <strong>{isDeleteMode ? "Mode Hapus Aktif" : "Hapus Lokasi"}</strong>
                        <div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>
                          {isDeleteMode ? "Klik trash untuk hapus" : "Aktifkan mode hapus"}
                        </div>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Mode Banner */}
          {isDeleteMode && (
            <div style={{
              marginTop: "12px",
              padding: "12px 16px",
              background: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c62828", fontWeight: "600", fontSize: "14px" }}>
                <Trash2 size={18} />
                Mode Hapus Aktif - Klik ikon sampah pada baris untuk menghapus
              </div>
              <button
                onClick={() => setIsDeleteMode(false)}
                style={{
                  padding: "6px 12px",
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Selesai
              </button>
            </div>
          )}
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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zona</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Jenis Hydrant</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>PIC</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                  {isDeleteMode && (
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#ffebee", fontWeight: "600", color: "#c62828", fontSize: "13px", width: "80px" }}>
                      🗑️ Hapus
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={isDeleteMode ? 8 : 7} style={{ padding: "40px 20px", textAlign: "center", color: "#999" }}>
                      {searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : "Tidak ada data"}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((area, idx) => {
                    const parts = area.name.split(' \\x07 ');
                    const lokasi = parts[0] || '';
                    const zona = parts[1] || '';
                    const jenisHydrant = parts[2] || '';
                    const pic = parts[3] || '';
                    
                    const status = areaStatuses[area.id] || {
                      statusLabel: "Loading...",
                      statusColor: "#757575",
                      lastCheck: "-"
                    };

                    return (
                      <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0", background: isDeleteMode ? "#fff5f5" : "white" }}>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                        <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{zona}</td>
                        <td style={{ padding: "14px 16px", color: "#666", fontSize: "13px" }}>
                          <span style={{
                            padding: "4px 8px",
                            background: "#e3f2fd",
                            color: "#0d47a1",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}>
                            {jenisHydrant}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#666" }}>{lokasi}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#333" }}>{pic}</td>
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
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openDetail(area)}
                              disabled={isDeleteMode}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "5px",
                                fontSize: "13px",
                                fontWeight: "500",
                                background: isDeleteMode ? "#bdbdbd" : "#1976d2",
                                color: "white",
                                border: "none",
                                cursor: isDeleteMode ? "not-allowed" : "pointer"
                              }}
                            >
                              View
                            </button>
                            <a
                              href={`/e-checksheet-slg-hydrant?lokasi=${encodeURIComponent(lokasi)}&zona=${encodeURIComponent(zona)}&jenisHydrant=${encodeURIComponent(jenisHydrant)}&pic=${encodeURIComponent(pic)}`}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "5px",
                                fontSize: "13px",
                                fontWeight: "500",
                                background: isDeleteMode ? "#bdbdbd" : "#43a047",
                                color: "white",
                                textDecoration: "none",
                                display: "inline-block",
                                pointerEvents: isDeleteMode ? "none" : "auto"
                              }}
                            >
                              Inspect
                            </a>
                          </div>
                        </td>
                        {isDeleteMode && (
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => {
                                setDeleteTarget({ id: area.id, name: lokasi });
                                setShowDeleteConfirm(true);
                              }}
                              style={{
                                padding: "8px 12px",
                                background: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto"
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Modal Tambah Lokasi */}
        {showAddModal && (
          <div
            onClick={() => setShowAddModal(false)}
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
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                overflow: "hidden"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#1976d2",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>
                  📍 Tambah Lokasi Baru
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "white",
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

              <div style={{ padding: "24px" }}>
                {/* Zona */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Zona <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <select
                    value={addFormData.zona}
                    onChange={(e) => setAddFormData({ ...addFormData, zona: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none",
                      background: "white"
                    }}
                  >
                    <option value="">— Pilih Zona —</option>
                    <option value="TIMUR">TIMUR</option>
                    <option value="BARAT">BARAT</option>
                    <option value="UTARA">UTARA</option>
                    <option value="SELATAN">SELATAN</option>
                  </select>
                </div>

                {/* Jenis Hydrant */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Jenis Hydrant <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <select
                    value={addFormData.jenisHydrant}
                    onChange={(e) => setAddFormData({ ...addFormData, jenisHydrant: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none",
                      background: "white"
                    }}
                  >
                    <option value="">— Pilih Jenis Hydrant —</option>
                    <option value="HYDRANT PILLAR">HYDRANT PILLAR</option>
                    <option value="HYDRANT INDOOR">HYDRANT INDOOR</option>
                    <option value="HYDRANT OUTDOOR">HYDRANT OUTDOOR</option>
                  </select>
                </div>

                {/* Lokasi */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Lokasi <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.lokasi}
                    onChange={(e) => setAddFormData({ ...addFormData, lokasi: e.target.value })}
                    placeholder="Contoh: KANTIN, RUANG MESIN, dll"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none"
                    }}
                  />
                </div>

                {/* PIC */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    PIC <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.pic}
                    onChange={(e) => setAddFormData({ ...addFormData, pic: e.target.value })}
                    placeholder="Nama PIC"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "16px 24px",
                background: "#f5f5f5",
                borderTop: "1px solid #e0e0e0"
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={isAdding}
                  style={{
                    padding: "10px 20px",
                    background: isAdding ? "#bdbdbd" : "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {isAdding ? "⏳ Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTarget(null);
            }}
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
              zIndex: 2500,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: "20px 24px",
                background: "#f44336",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>
                  ⚠️ Konfirmasi Hapus
                </h2>
              </div>

              <div style={{ padding: "24px" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#424242" }}>
                  Apakah Anda yakin ingin menghapus lokasi ini?
                </p>
                <div style={{
                  padding: "12px",
                  background: "#ffebee",
                  borderRadius: "6px",
                  marginBottom: "16px"
                }}>
                  <strong style={{ color: "#c62828" }}>{deleteTarget?.name}</strong>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#757575" }}>
                  ⚠️ Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "16px 24px",
                background: "#f5f5f5",
                borderTop: "1px solid #e0e0e0"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLocation}
                  disabled={isDeleting}
                  style={{
                    padding: "10px 20px",
                    background: isDeleting ? "#bdbdbd" : "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {isDeleting ? "⏳ Menghapus..." : "🗑️ Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                ) : isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    ⏳ Loading data...
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

                      const inspectionItemsList = [
                        { key: "pressureTank", label: "PRESSURE TANK (STD : 7 kg/cm2)" },
                        { key: "hasilTekananDgPitot", label: "HASIL TEKANAN DG PITOT (STD : titik terjauh min. 4.5 kg/cm2)" },
                        { key: "tekananEnginePump", label: "TEKANAN ENGINE PUMP" },
                        { key: "fireHose", label: "FIRE HOSE / SELANG" },
                        { key: "valve", label: "VALVE (TIDAK SERET)" },
                        { key: "couplingNozzle", label: "COUPLING NOZZLE" },
                        { key: "couplingHydrant", label: "COUPLING HYDRANT" },
                        { key: "seal", label: "SEAL" },
                      ];

                      return (
                        <div>
                          <table style={{ 
                            width: "100%", 
                            borderCollapse: "collapse", 
                            fontSize: "12px", 
                            minWidth: "1400px", 
                            border: "1px solid #e0e0e0", 
                            background: "white" 
                          }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "50px" }}>No</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>HASIL</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "200px" }}>DOKUMENTASI</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>PIC</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>DUE DATE</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>VERIFY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inspectionItemsList.map((item, index) => {
                                const entry = checksheetData[item.key];
                                const value = entry?.hasilPemeriksaan || "-";
                                const images = entry?.images || [];

                                return (
                                  <tr key={item.key}>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4" }}>{item.label}</td>
                                    <td style={{
                                      padding: "8px",
                                      border: "1px solid #e0e0e0",
                                      textAlign: "center",
                                      fontWeight: "700",
                                      background: value === "OK" ? "#e8f5e9" : value === "NG" ? "#ffebee" : "#fff",
                                      color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#757575",
                                      fontSize: "11px"
                                    }}>
                                      {value === "OK" ? "✓ OK" : value === "NG" ? "✗ NG" : "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>
                                      {entry?.keteranganTemuan || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                                      {images.length > 0 ? (
                                        <div style={{ 
                                          display: "flex", 
                                          flexWrap: "wrap", 
                                          gap: "6px",
                                          justifyContent: "center",
                                          maxHeight: "100px",
                                          overflowY: "auto"
                                        }}>
                                          {images.map((imgUrl: string, imgIdx: number) => (
                                            <div 
                                              key={imgIdx} 
                                              style={{ 
                                                position: "relative",
                                                width: "60px", 
                                                height: "60px", 
                                                overflow: "hidden", 
                                                borderRadius: "4px", 
                                                border: "1px solid #ddd",
                                                cursor: "pointer"
                                              }}
                                              onClick={() => openImagePreviewModal(imgUrl)}
                                            >
                                              <img
                                                src={imgUrl}
                                                alt={`Dok ${index + 1}-${imgIdx + 1}`}
                                                style={{
                                                  width: "100%",
                                                  height: "100%",
                                                  objectFit: "cover"
                                                }}
                                              />
                                              <div style={{
                                                position: "absolute",
                                                top: "2px",
                                                right: "2px",
                                                background: "rgba(0,0,0,0.6)",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: "18px",
                                                height: "18px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "10px"
                                              }}>
                                                {imgIdx + 1}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ 
                                          textAlign: "center", 
                                          color: "#9e9e9e", 
                                          fontSize: "11px",
                                          padding: "8px 0"
                                        }}>
                                          -
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>
                                      {entry?.tindakanPerbaikan || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.pic || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.verify || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

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
                            }}>Inspector</p>
                            <p style={{ 
                              margin: "0", 
                              fontSize: "13px", 
                              fontWeight: "500", 
                              color: "#424242" 
                            }}>
                              {checksheetData.pressureTank?.inspector || "N/A"}
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

        {/* Modal Preview Gambar */}
        {showImagePreviewModal && (
          <div
            onClick={closeImagePreviewModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 3000,
              padding: "20px"
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img
                src={currentPreviewImage}
                alt="Preview Dokumentasi"
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "3px solid white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                }}
              />
              <div style={{ 
                marginTop: "16px", 
                color: "white", 
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Click outside to close
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
                Scan Selang Hydrant QR Code
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
                Point your camera at the QR code on the selang hydrant
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