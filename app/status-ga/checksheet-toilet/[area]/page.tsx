// app/status-ga/checksheet-toilet/[area]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import * as React from "react";

interface ChecksheetEntry {
  date: string;
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verify: string;
  inspector: string;
}

interface SavedData {
  [itemKey: string]: ChecksheetEntry[];
}

// ✅ Pindahkan inspectionItems ke luar komponen agar tidak berubah referensi
const INSPECTION_ITEMS = [
  { key: "kebersihanLantai", no: 1, item: "Kebersihan lantai (tidak licin, tidak basah, bebas sampah)" },
  { key: "kebersihanDinding", no: 2, item: "Kebersihan dinding (tidak berlumut, tidak kotor, tidak berjamur)" },
  { key: "bauToilet", no: 3, item: "Bau tidak menyengat / tidak ada bau tidak sedap" },
  { key: "ketersediaanAir", no: 4, item: "Ketersediaan air mencukupi" },
  { key: "klosetBersih", no: 5, item: "Kloset bersih, tidak mampet, tidak bocor" },
  { key: "wastafel", no: 6, item: "Wastafel bersih, air mengalir lancar, sabun tersedia" },
  { key: "tisuToilet", no: 7, item: "Tisu toilet tersedia" },
  { key: "tempatSampah", no: 8, item: "Tempat sampah tersedia dan tertutup" },
  { key: "ventilasi", no: 9, item: "Ventilasi cukup (tidak pengap)" },
  { key: "perlengkapanLain", no: 10, item: "Perlengkapan lain (pengharum, sapu, dll) tersedia dan rapi" },
];

export default function ChecksheetToiletForm({ params }: { params: Promise<{ area: string }> }) {
  const resolvedParams = React.use(params);
  const areaId = resolvedParams.area;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});

  // Mapping area
  const areaMap: Record<string, { title: string; desc: string }> = {
    "toilet-driver": { title: "TOILET - DRIVER", desc: "Toilet laki & perempuan" },
    "toilet-bea-cukai": { title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan" },
    "toilet-parkir": { title: "TOILET - PARKIR", desc: "Toilet laki & perempuan" },
    "toilet-c2": { title: "TOILET - C2", desc: "Toilet wanita" },
    "toilet-c1": { title: "TOILET - C1", desc: "Toilet laki & perempuan" },
    "toilet-d": { title: "TOILET - D", desc: "Toilet laki & perempuan" },
    "toilet-auditorium": { title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan" },
    "toilet-whs": { title: "TOILET - WHS", desc: "Toilet wanita" },
    "toilet-b1": { title: "TOILET - B1", desc: "Toilet laki & perempuan" },
    "toilet-a": { title: "TOILET - A", desc: "Toilet laki & perempuan" },
    "toilet-lobby": { title: "TOILET - LOBBY", desc: "Toilet laki & perempuan" },
    "toilet-office-main": { title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan" },
  };

  const currentArea = areaMap[areaId] || { title: decodeURIComponent(areaId), desc: "Lokasi tidak diketahui" };
  const isWanitaOnly = ["toilet-c2", "toilet-whs"].includes(areaId);
  const kategori = "Toilet";
  const lokasi = currentArea.desc;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Gunakan useMemo untuk areaMap agar tidak berubah referensi
  const areaMapMemo = useMemo(() => areaMap, []);
  
  // ✅ Gunakan inspectionItems yang sudah dipindahkan ke luar
  const inspectionItems = INSPECTION_ITEMS;

  // Load saved data
  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-toilet-${areaId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedData(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaId]);

  // Auth guard
  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // Auto-check "OK" saat form pertama kali dibuka & isi PIC otomatis
  useEffect(() => {
    if (!isMounted || !user) return;
    
    const picName = user.fullName || "";
    
    if (isWanitaOnly) {
      const newAnswers: Record<string, string> = {};
      inspectionItems.forEach((item) => {
        newAnswers[`${item.key}_hasil`] = "OK";
        newAnswers[`${item.key}_keterangan`] = "";
        newAnswers[`${item.key}_tindakan`] = "";
        newAnswers[`${item.key}_pic`] = picName;
        newAnswers[`${item.key}_dueDate`] = "";
      });
      setAnswers(newAnswers);
    } else {
      const newAnswers: Record<string, string> = {};
      inspectionItems.forEach((item) => {
        // Laki-laki
        newAnswers[`${item.key}_L_hasil`] = "OK";
        newAnswers[`${item.key}_L_keterangan`] = "";
        newAnswers[`${item.key}_L_tindakan`] = "";
        newAnswers[`${item.key}_L_pic`] = picName;
        newAnswers[`${item.key}_L_dueDate`] = "";
        
        // Perempuan
        newAnswers[`${item.key}_P_hasil`] = "OK";
        newAnswers[`${item.key}_P_keterangan`] = "";
        newAnswers[`${item.key}_P_tindakan`] = "";
        newAnswers[`${item.key}_P_pic`] = picName;
        newAnswers[`${item.key}_P_dueDate`] = "";
      });
      setAnswers(newAnswers);
    }
  }, [isMounted, isWanitaOnly, user, inspectionItems]);

  if (!isMounted) return null;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }
  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) return null;

  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    // Validasi: semua kolom hasil harus diisi
    let allFieldsFilled = true;
    if (isWanitaOnly) {
      allFieldsFilled = inspectionItems.every((item) => answers[`${item.key}_hasil`]);
    } else {
      allFieldsFilled = inspectionItems.every(
        (item) => answers[`${item.key}_L_hasil`] && answers[`${item.key}_P_hasil`]
      );
    }

    if (!allFieldsFilled) {
      alert("Mohon isi minimal Hasil Pemeriksaan untuk semua item dan jenis kelamin!");
      return;
    }

    try {
      const newData: SavedData = { ...savedData };
      const storageKey = `e-checksheet-toilet-${areaId}`;

      if (isWanitaOnly) {
        inspectionItems.forEach((item) => {
          const entry: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_keterangan`] || "",
            tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
            pic: answers[`${item.key}_pic`] || user.fullName || "",
            dueDate: answers[`${item.key}_dueDate`] || "",
            verify: "", // Kolom verify dihapus dari tampilan, tapi tetap disimpan kosong
            inspector: user.fullName || "",
          };

          if (!newData[item.key]) newData[item.key] = [];
          const existingIndex = newData[item.key].findIndex((e) => e.date === selectedDate);
          if (existingIndex >= 0) {
            newData[item.key][existingIndex] = entry;
          } else {
            newData[item.key].push(entry);
          }
        });
      } else {
        // Simpan terpisah untuk L dan P
        inspectionItems.forEach((item) => {
          // Laki-laki
          const entryL: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_L_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_L_keterangan`] || "",
            tindakanPerbaikan: answers[`${item.key}_L_tindakan`] || "",
            pic: answers[`${item.key}_L_pic`] || user.fullName || "",
            dueDate: answers[`${item.key}_L_dueDate`] || "",
            verify: "", // Kolom verify dihapus dari tampilan
            inspector: user.fullName || "",
          };

          // Perempuan
          const entryP: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_P_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_P_keterangan`] || "",
            tindakanPerbaikan: answers[`${item.key}_P_tindakan`] || "",
            pic: answers[`${item.key}_P_pic`] || user.fullName || "",
            dueDate: answers[`${item.key}_P_dueDate`] || "",
            verify: "", // Kolom verify dihapus dari tampilan
            inspector: user.fullName || "",
          };

          const keyL = `${item.key}_L`;
          const keyP = `${item.key}_P`;

          // Simpan L
          if (!newData[keyL]) newData[keyL] = [];
          const idxL = newData[keyL].findIndex((e) => e.date === selectedDate);
          if (idxL >= 0) newData[keyL][idxL] = entryL;
          else newData[keyL].push(entryL);

          // Simpan P
          if (!newData[keyP]) newData[keyP] = [];
          const idxP = newData[keyP].findIndex((e) => e.date === selectedDate);
          if (idxP >= 0) newData[keyP][idxP] = entryP;
          else newData[keyP].push(entryP);
        });
      }

      // Urutkan semua entri berdasarkan tanggal (descending)
      Object.keys(newData).forEach((key) => {
        newData[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      // 🔁 1. SIMPAN KE RIWAYAT LOKAL (PER AREA)
      localStorage.setItem(storageKey, JSON.stringify(newData));

      // 🔁 2. SIMPAN KE RIWAYAT GLOBAL (UNTUK DASHBOARD)
      const hasNG = inspectionItems.some((item) => {
        if (isWanitaOnly) {
          return answers[`${item.key}_hasil`] === "NG";
        } else {
          return answers[`${item.key}_L_hasil`] === "NG" || answers[`${item.key}_P_hasil`] === "NG";
        }
      });

      // ✅ Pastikan 'area' mengandung keyword "Toilet" (dengan huruf kapital T)
      const globalArea = `Toilet - ${currentArea.title.replace("TOILET - ", "")}`;
      const globalEntry = {
        id: `TOILET-${Date.now()}`,
        type: "toilet",
        area: globalArea, // ✅ Sekarang formatnya: "Toilet - DRIVER"
        status: hasNG ? "NG" : "OK",
        filledBy: user.fullName || "Unknown User",
        filledAt: new Date().toISOString(),
      };

      // Ambil riwayat yang ada
      const globalHistoryStr = localStorage.getItem("checksheet_history");
      const globalHistory = globalHistoryStr ? JSON.parse(globalHistoryStr) : [];
      globalHistory.push(globalEntry);
      localStorage.setItem("checksheet_history", JSON.stringify(globalHistory));

      alert(`Data berhasil disimpan untuk tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/status-ga/checksheet-toilet`);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }

    const existingData: Record<string, string> = {};
    let found = false;
    const storageKey = `e-checksheet-toilet-${areaId}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (isWanitaOnly) {
          inspectionItems.forEach((item) => {
            const entries = data[item.key] || [];
            const entry = entries.find((e: any) => e.date === selectedDate);
            if (entry) {
              found = true;
              existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
              existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
              existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
              existingData[`${item.key}_pic`] = entry.pic;
              existingData[`${item.key}_dueDate`] = entry.dueDate;
            }
          });
        } else {
          inspectionItems.forEach((item) => {
            // Laki-laki
            const keyL = `${item.key}_L`;
            const entriesL = data[keyL] || [];
            const entryL = entriesL.find((e: any) => e.date === selectedDate);
            if (entryL) {
              found = true;
              existingData[`${item.key}_L_hasil`] = entryL.hasilPemeriksaan;
              existingData[`${item.key}_L_keterangan`] = entryL.keteranganTemuan;
              existingData[`${item.key}_L_tindakan`] = entryL.tindakanPerbaikan;
              existingData[`${item.key}_L_pic`] = entryL.pic;
              existingData[`${item.key}_L_dueDate`] = entryL.dueDate;
            }

            // Perempuan
            const keyP = `${item.key}_P`;
            const entriesP = data[keyP] || [];
            const entryP = entriesP.find((e: any) => e.date === selectedDate);
            if (entryP) {
              found = true;
              existingData[`${item.key}_P_hasil`] = entryP.hasilPemeriksaan;
              existingData[`${item.key}_P_keterangan`] = entryP.keteranganTemuan;
              existingData[`${item.key}_P_tindakan`] = entryP.tindakanPerbaikan;
              existingData[`${item.key}_P_pic`] = entryP.pic;
              existingData[`${item.key}_P_dueDate`] = entryP.dueDate;
            }
          });
        }
      } catch (e) {
        console.warn("Error parsing existing data");
      }
    }

    if (found) {
      setAnswers(existingData);
      alert("Data berhasil dimuat!");
    } else {
      alert("Tidak ada data untuk tanggal ini.");
      
      // Reset ke nilai default dengan PIC terisi
      const picName = user.fullName || "";
      const resetData: Record<string, string> = {};
      
      if (isWanitaOnly) {
        inspectionItems.forEach((item) => {
          resetData[`${item.key}_hasil`] = "OK";
          resetData[`${item.key}_keterangan`] = "";
          resetData[`${item.key}_tindakan`] = "";
          resetData[`${item.key}_pic`] = picName;
          resetData[`${item.key}_dueDate`] = "";
        });
      } else {
        inspectionItems.forEach((item) => {
          resetData[`${item.key}_L_hasil`] = "OK";
          resetData[`${item.key}_L_keterangan`] = "";
          resetData[`${item.key}_L_tindakan`] = "";
          resetData[`${item.key}_L_pic`] = picName;
          resetData[`${item.key}_L_dueDate`] = "";
          
          resetData[`${item.key}_P_hasil`] = "OK";
          resetData[`${item.key}_P_keterangan`] = "";
          resetData[`${item.key}_P_tindakan`] = "";
          resetData[`${item.key}_P_pic`] = picName;
          resetData[`${item.key}_P_dueDate`] = "";
        });
      }
      
      setAnswers(resetData);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ padding: "20px 16px", maxWidth: "100%", margin: "0 0 0 75px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #065dd0 0%, #10b2ee 100%)",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
            }}
          >
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              🚻 Checksheet Toilet
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)" }}>
              Form Pemeriksaan Kebersihan & Kelayakan Toilet
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div
          style={{
            background: "white",
            border: "1px solid #e8e8e8",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#00b4dd", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Nama Area</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{currentArea.title}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#00b4dd", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Kategori</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{kategori}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#00b4dd", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Lokasi</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{lokasi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <span style={{ fontWeight: "600", color: "#00b4dd", fontSize: "clamp(11px, 2.5vw, 13px)" }}>PIC Pengecekan</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div
          style={{
            background: "white",
            border: "2px solid #36b8f4",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ fontWeight: "700", color: "#0051e6", fontSize: "clamp(13px, 3vw, 15px)", minWidth: "180px" }}>
              📅 Tanggal Pemeriksaan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={{
                padding: "10px 14px",
                border: "2px solid #0b8ee0",
                borderRadius: "6px",
                fontSize: "clamp(13px, 3vw, 15px)",
                color: "#333",
                fontWeight: "600",
                flex: "1 1 200px",
                minWidth: "200px",
              }}
            />
            <button
              onClick={handleLoadExisting}
              disabled={!selectedDate}
              style={{
                padding: "10px 20px",
                background: selectedDate ? "#ff9800" : "#bdbdbd",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: selectedDate ? "pointer" : "not-allowed",
                fontSize: "clamp(12px, 3vw, 13px)",
                fontWeight: "600",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                opacity: selectedDate ? 1 : 0.6,
              }}
            >
              📂 Muat Data
            </button>
          </div>
          <p style={{ margin: "12px 0 0 0", fontSize: "clamp(11px, 2.5vw, 12px)", color: "#666", fontStyle: "italic" }}>
            💡 Pilih tanggal pemeriksaan, lalu isi form di bawah. Klik "Muat Data" jika ingin mengedit data yang sudah ada.
          </p>
        </div>

        {/* Checksheet Table */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
            border: "2px solid #1fc7ff",
            marginBottom: "20px",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "clamp(11px, 2.5vw, 13px)",
                minWidth: isWanitaOnly ? "850px" : "1200px",
              }}
            >
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th rowSpan={2} style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", width: "50px", background: "#bbdefb" }}>No</th>
                  <th rowSpan={2} style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "280px", background: "#bbdefb" }}>Item Pengecekan</th>
                  
                  {isWanitaOnly ? (
                    <>
                      <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "100px", background: "#bbdefb" }}>HASIL</th>
                      <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "150px", background: "#bbdefb" }}>KETERANGAN TEMUAN</th>
                      <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "150px", background: "#bbdefb" }}>TINDAKAN PERBAIKAN</th>
                      <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", width: "120px", background: "#bbdefb" }}>PIC</th>
                      <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", width: "120px", background: "#bbdefb" }}>DUE DATE</th>
                    </>
                  ) : (
                    <>
                      <th colSpan={5} style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#1565c0", textAlign: "center", background: "#90caf9" }}>LAKI-LAKI</th>
                      <th colSpan={5} style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#ad1457", textAlign: "center", background: "#f48fb1" }}>PEREMPUAN</th>
                    </>
                  )}
                </tr>
                
                {!isWanitaOnly && (
                  <tr style={{ background: "#e3f2fd" }}>
                    {["L", "P"].map((gender) => (
                      <React.Fragment key={gender}>
                        <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "100px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>HASIL</th>
                        <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "150px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>KETERANGAN</th>
                        <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "150px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>TINDAKAN</th>
                        <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", width: "120px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>PIC</th>
                        <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", width: "120px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>DUE DATE</th>
                      </React.Fragment>
                    ))}
                  </tr>
                )}
              </thead>
              
              <tbody>
                {inspectionItems.map((item) => (
                  <tr key={item.key}>
                    <td style={{ padding: "10px 8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600", color: "#333", verticalAlign: "top", background: "#f5f5f5" }}>{item.no}</td>
                    <td style={{ padding: "10px 8px", border: "1px solid #e0e0e0", color: "#333", lineHeight: "1.5", verticalAlign: "top", background: "#f5f5f5", fontWeight: "500" }}>{item.item}</td>
                    
                    {isWanitaOnly ? (
                      <>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "top" }}>
                          <select
                            value={answers[`${item.key}_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_hasil`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "2px solid #f44336",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 13px)",
                              fontWeight: "600",
                              cursor: selectedDate ? "pointer" : "not-allowed",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          >
                            <option value="">Pilih</option>
                            <option value="OK">✓ OK</option>
                            <option value="NG">✗ NG</option>
                          </select>
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_keterangan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Keterangan temuan..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_tindakan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Tindakan perbaikan..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="text"
                            value={answers[`${item.key}_pic`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_pic`, e.target.value)}
                            disabled={true}
                            placeholder="PIC"
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              background: "#e8f5e9",
                              fontWeight: "600",
                              color: "#2e7d32",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="date"
                            value={answers[`${item.key}_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_dueDate`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(10px, 2.5vw, 11px)",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Laki-laki */}
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "top" }}>
                          <select
                            value={answers[`${item.key}_L_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_L_hasil`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "2px solid #2196f3",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 13px)",
                              fontWeight: "600",
                              cursor: selectedDate ? "pointer" : "not-allowed",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          >
                            <option value="">Pilih</option>
                            <option value="OK">✓ OK</option>
                            <option value="NG">✗ NG</option>
                          </select>
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_L_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_L_keterangan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Keterangan L..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_L_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_L_tindakan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Tindakan L..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="text"
                            value={answers[`${item.key}_L_pic`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_L_pic`, e.target.value)}
                            disabled={true}
                            placeholder="PIC L"
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#1565c0",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="date"
                            value={answers[`${item.key}_L_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_L_dueDate`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(10px, 2.5vw, 11px)",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        
                        {/* Perempuan */}
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "top" }}>
                          <select
                            value={answers[`${item.key}_P_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_P_hasil`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "2px solid #e91e63",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 13px)",
                              fontWeight: "600",
                              cursor: selectedDate ? "pointer" : "not-allowed",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          >
                            <option value="">Pilih</option>
                            <option value="OK">✓ OK</option>
                            <option value="NG">✗ NG</option>
                          </select>
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_P_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_P_keterangan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Keterangan P..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <textarea
                            value={answers[`${item.key}_P_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_P_tindakan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Tindakan P..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              resize: "vertical",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="text"
                            value={answers[`${item.key}_P_pic`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_P_pic`, e.target.value)}
                            disabled={true}
                            placeholder="PIC P"
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(11px, 2.5vw, 12px)",
                              background: "#fce4ec",
                              fontWeight: "600",
                              color: "#c2185b",
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                          <input
                            type="date"
                            value={answers[`${item.key}_P_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_P_dueDate`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "6px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "clamp(10px, 2.5vw, 11px)",
                              background: selectedDate ? "white" : "#f5f5f5",
                            }}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            padding: "20px 0",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => router.push("/status-ga/checksheet-toilet")}
            style={{
              padding: "12px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "clamp(13px, 3vw, 14px)",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "160px",
              background: "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate}
            style={{
              padding: "12px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "clamp(13px, 3vw, 14px)",
              cursor: selectedDate ? "pointer" : "not-allowed",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "160px",
              background: selectedDate ? "linear-gradient(135deg, #4caf50, #2196f3)" : "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(33, 150, 243, 0.3)",
              opacity: selectedDate ? 1 : 0.6,
            }}
          >
            ✓ Simpan Data
          </button>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e8e8e8",
            marginTop: "20px",
          }}
        >
          <p style={{ margin: "12px 0 0 0", fontSize: "clamp(10px, 2.5vw, 11px)", color: "#666", fontStyle: "italic" }}>
            💡 <strong>Tip:</strong> Pilih tanggal pemeriksaan, isi form, klik "Muat Data" jika ada data sebelumnya, lalu simpan.
          </p>
        </div>
      </div>
    </div>
  );
}