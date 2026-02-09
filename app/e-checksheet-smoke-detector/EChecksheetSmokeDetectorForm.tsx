// app/e-checksheet-smoke-detector/EChecksheetSmokeDetectorForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ Import useSearchParams
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

interface ChecklistItem {
  id: number;
  item_key: string;
  no: number;
  item_group: string;
  item_check: string;
  method: string;
  image: string | null;
}

interface ItemData {
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verify: string;
  images: string[];
  notes: string;
}

interface AreaInfo {
  id: number;
  no: number;
  name: string;
  location: string;
}

// ✅ Hapus prop areaId, ambil dari query string
export function EChecksheetSmokeDetectorForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Ambil query params
  const { user, loading } = useAuth();
  
  // ✅ Ambil areaId dari query string
  const areaId = searchParams.get('areaId');

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  // ✅ Validasi areaId
  useEffect(() => {
    if (isMounted && !areaId) {
      alert('Area ID tidak ditemukan. Silakan pilih area dari halaman sebelumnya.');
      router.push('/status-ga/smoke-detector');
    }
  }, [isMounted, areaId, router]);


  // Data from API
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistData, setChecklistData] = useState<Record<string, ItemData>>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Loading states
  const [loadingArea, setLoadingArea] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingDates, setLoadingDates] = useState(true);
  const [saving, setSaving] = useState(false);

  const TYPE_SLUG = 'smoke-detector';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // Fetch area info
  useEffect(() => {
    if (!isMounted || !areaId) return;

    const fetchAreaInfo = async () => {
      try {
        setLoadingArea(true);
        const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const result = await response.json();
        
        if (result.success) {
          const area = result.data.find((a: any) => a.id === parseInt(areaId));
          if (area) {
            setAreaInfo(area);
          } else {
            alert('Area tidak ditemukan');
            router.push('/status-ga/smoke-detector');
          }
        }
      } catch (error) {
        console.error('Error fetching area:', error);
        alert('Gagal memuat informasi area');
      } finally {
        setLoadingArea(false);
      }
    };

    fetchAreaInfo();
  }, [isMounted, areaId, router]);

  // Fetch checklist items
  useEffect(() => {
    if (!isMounted) return;

    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/items`);
        const result = await response.json();
        
        if (result.success) {
          setChecklistItems(result.data);
          
          // Initialize empty data for each item
          const initialData: Record<string, ItemData> = {};
          result.data.forEach((item: ChecklistItem) => {
            initialData[item.item_key] = {
              hasilPemeriksaan: '',
              keteranganTemuan: '',
              tindakanPerbaikan: '',
              pic: '',
              dueDate: '',
              verify: '',
              images: [],
              notes: ''
            };
          });
          setChecklistData(initialData);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [isMounted]);

  // Fetch available dates
  useEffect(() => {
    if (!isMounted || !areaId) return;

    const fetchDates = async () => {
      try {
        setLoadingDates(true);
        const response = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/dates`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const sortedDates = result.data.sort((a: string, b: string) => 
            new Date(b).getTime() - new Date(a).getTime()
          );
          setAvailableDates(sortedDates);
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, [isMounted, areaId]);

  // Load existing data when date is selected
  useEffect(() => {
    if (!selectedDate || !areaId) {
      return;
    }

    const loadExistingData = async () => {
      try {
        const response = await fetch(
          `/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/${selectedDate}`
        );
        const result = await response.json();
        
        if (result.success && result.data) {
          setChecklistData(result.data);
        } else {
          // Reset to empty if no data found
          const emptyData: Record<string, ItemData> = {};
          checklistItems.forEach((item) => {
            emptyData[item.item_key] = {
              hasilPemeriksaan: '',
              keteranganTemuan: '',
              tindakanPerbaikan: '',
              pic: '',
              dueDate: '',
              verify: '',
              images: [],
              notes: ''
            };
          });
          setChecklistData(emptyData);
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      }
    };

    loadExistingData();
  }, [selectedDate, areaId, checklistItems]);

  const updateItemData = (itemKey: string, field: keyof ItemData, value: any) => {
    setChecklistData(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Silakan pilih tanggal inspeksi");
      return;
    }

    // Validate that at least one item has a result
    const hasData = Object.values(checklistData).some(
      item => item.hasilPemeriksaan !== ''
    );

    if (!hasData) {
      alert("Silakan lengkapi minimal satu item inspeksi");
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(
        `/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/${selectedDate}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checklistData,
            inspectorId: user?.id || '',
            inspectorName: user?.fullName || '',
            status: 'submitted'
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`Data inspeksi berhasil disimpan untuk ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        router.push(`/status-ga/smoke-detector?openArea=${encodeURIComponent(areaInfo?.location || '')}`);
      } else {
        alert(`Gagal menyimpan: ${result.message}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isMounted) return null;

  // ✅ Tambahkan validasi areaId sebelum loading
  if (!areaId) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#757575" }}>Area ID tidak ditemukan</p>
        </div>
      </div>
    );
  }

  if (loading || loadingArea || loadingItems) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        Loading...
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null;
  }

  if (!areaInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        Area tidak ditemukan
      </div>
    );
  }

  const extractZone = (name: string): string => {
    const match = name.match(/Zone (\d+)/);
    return match ? match[1] : '-';
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ padding: "24px 20px", maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              Smoke Detector Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Bi-monthly inspection checklist
            </p>
          </div>
        </div>

        {/* Area Info */}
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
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Unit Number</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaInfo.no}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Location</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaInfo.location}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Zone</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{extractZone(areaInfo.name)}</span>
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
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>• Every 2 months (Jan, Mar, May, Jul, Sep, Nov)</span>
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
          {!loadingDates && availableDates.length > 0 && (
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
                {availableDates.map((date) => (
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
          )}
        </div>

        {/* Checklist Table */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "1200px" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "15%" }}>Item Check</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Result</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Findings (if NG)</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Corrective Action</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>PIC</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "11%" }}>Due Date</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item) => {
                  const data = checklistData[item.item_key] || {};
                  
                  return (
                    <tr key={item.id}>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "500", color: "#424242" }}>
                        <div style={{ marginBottom: "4px" }}>{item.item_check}</div>
                        {item.method && (
                          <div style={{ fontSize: "11px", color: "#757575", fontStyle: "italic" }}>
                            Method: {item.method}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                        <select
                          value={data.hasilPemeriksaan || ''}
                          onChange={(e) => updateItemData(item.item_key, 'hasilPemeriksaan', e.target.value)}
                          disabled={!selectedDate}
                          style={{ 
                            width: "100%", 
                            padding: "8px", 
                            border: "1px solid #d0d0d0", 
                            borderRadius: "5px",
                            fontWeight: "500",
                            fontSize: "14px",
                            outline: "none",
                            background: "white"
                          }}
                        >
                          <option value="">-</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <textarea
                          value={data.keteranganTemuan || ''}
                          onChange={(e) => updateItemData(item.item_key, 'keteranganTemuan', e.target.value)}
                          disabled={!selectedDate}
                          placeholder="Describe any issues..."
                          rows={3}
                          style={{ 
                            width: "100%", 
                            padding: "8px", 
                            fontSize: "13px", 
                            resize: "vertical",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            outline: "none",
                            fontFamily: "inherit"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <textarea
                          value={data.tindakanPerbaikan || ''}
                          onChange={(e) => updateItemData(item.item_key, 'tindakanPerbaikan', e.target.value)}
                          disabled={!selectedDate}
                          placeholder="Action taken..."
                          rows={3}
                          style={{ 
                            width: "100%", 
                            padding: "8px", 
                            fontSize: "13px", 
                            resize: "vertical",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            outline: "none",
                            fontFamily: "inherit"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="text"
                          value={data.pic || ''}
                          onChange={(e) => updateItemData(item.item_key, 'pic', e.target.value)}
                          disabled={!selectedDate}
                          placeholder="Name"
                          style={{ 
                            width: "100%", 
                            padding: "8px", 
                            fontSize: "13px",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            outline: "none"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="date"
                          value={data.dueDate || ''}
                          onChange={(e) => updateItemData(item.item_key, 'dueDate', e.target.value)}
                          disabled={!selectedDate}
                          style={{ 
                            width: "100%", 
                            padding: "8px",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            outline: "none",
                            fontSize: "13px"
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                        <input
                          type="text"
                          value={data.verify || ''}
                          onChange={(e) => updateItemData(item.item_key, 'verify', e.target.value)}
                          disabled={!selectedDate}
                          placeholder="Name"
                          style={{ 
                            width: "100%", 
                            padding: "8px", 
                            fontSize: "13px",
                            border: "1px solid #d0d0d0",
                            borderRadius: "4px",
                            outline: "none"
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/smoke-detector")}
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
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || saving}
            style={{
              padding: "11px 28px",
              background: selectedDate && !saving ? "#1976d2" : "#e0e0e0",
              color: selectedDate && !saving ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              opacity: selectedDate && !saving ? 1 : 0.6,
              cursor: selectedDate && !saving ? "pointer" : "not-allowed"
            }}
          >
            {saving ? "Saving..." : "Save Inspection"}
          </button>
        </div>

        {/* Keterangan Cara Pengecekan */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "24px",
          marginTop: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 20px 0",
            color: "#212121",
            fontSize: "17px",
            fontWeight: "600",
            paddingBottom: "12px",
            borderBottom: "2px solid #1976d2"
          }}>
            📋 KETERANGAN CARA PENGECEKAN
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              border: "1px solid #e0e0e0",
              backgroundColor: "white",
              borderRadius: "6px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "#e3f2fd",
                  borderBottom: "2px solid #1976d2"
                }}>
                  <th style={{
                    padding: "12px 14px",
                    fontWeight: "600",
                    color: "#1976d2",
                    textAlign: "left",
                    width: "50%",
                    borderRight: "1px solid #bbdefb"
                  }}>ITEM PENGECEKAN</th>
                  <th style={{
                    padding: "12px 14px",
                    fontWeight: "600",
                    color: "#1976d2",
                    textAlign: "left",
                    width: "50%"
                  }}>CARA PENGECEKAN</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    item: "1. Bunyi Alarm Bell",
                    ok: "Berbunyi keras",
                    ng: "Tidak berbunyi atau berbunyi pelan",
                    cara: [
                      "1. Tekan tombol fire alarm",
                      "2. Test heat detector dengan api",
                      "3. Test smoke detector dengan asap"
                    ]
                  },
                  {
                    item: "2. Indicator Lamp",
                    ok: "Lampu nyala",
                    ng: "Lampu tidak nyala",
                    cara: ["Lihat lampu nyala atau tidak"]
                  },
                  {
                    item: "3. Kebersihan",
                    ok: "Bersih",
                    ng: "Kotor",
                    cara: ["Periksa kebersihan detector dari debu/kotoran"]
                  },
                  {
                    item: "4. Kondisi Lainnya",
                    ok: "Masih Baik",
                    ng: "Tidak baik/rusak",
                    cara: ["Cek kondisi fisik (casing, mounting, kabel)"]
                  }
                ].map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: index % 2 === 0 ? "white" : "#fafafa"
                  }}>
                    <td style={{
                      padding: "12px 14px",
                      verticalAlign: "top",
                      borderRight: "1px solid #e0e0e0",
                      fontWeight: "600",
                      color: "#212121",
                      width: "50%"
                    }}>
                      {item.item}
                      <br />
                      <span style={{ fontSize: "11px", color: "#43a047", display: "block", marginTop: "4px" }}>
                        ✓ {item.ok}
                      </span>
                      <span style={{ fontSize: "11px", color: "#e53935", display: "block", marginTop: "4px" }}>
                        ✘ {item.ng}
                      </span>
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      verticalAlign: "top",
                      lineHeight: "1.6",
                      color: "#424242",
                      width: "50%"
                    }}>
                      {item.cara.map((step, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>
                          {step}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}