// app/status-ga/checksheet-toilet/[area]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import * as React from "react";

// ─── TYPES ───────────────────────────────────────────────
interface ChecksheetEntry {
  date: string;
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  fotoTemuan?: string; // base64
  tindakanPerbaikan: string;
  pic: string;
  verify: string;
  inspector: string;
}

interface SavedData {
  [itemKey: string]: ChecksheetEntry[];
}

// ─── STATIC DATA ─────────────────────────────────────────
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

const AREA_MAP: Record<string, { title: string; desc: string }> = {
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

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function ChecksheetToiletForm({ params }: { params: Promise<{ area: string }> }) {
  const resolvedParams = React.use(params);
  const areaId = resolvedParams.area;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});

  const currentArea = AREA_MAP[areaId] || { title: decodeURIComponent(areaId), desc: "Lokasi tidak diketahui" };
  const isWanitaOnly = ["toilet-c2", "toilet-whs"].includes(areaId);
  const kategori = "Toilet";
  const lokasi = currentArea.desc;

  // ─── EFFECTS ────────────────────────────────────────────
  useEffect(() => setIsMounted(true), []);

  // Load saved data
  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-toilet-${areaId}`;
      const saved = localStorage.getItem(key);
      if (saved) setSavedData(JSON.parse(saved));
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaId]);

  // Auth guard
  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // Auto-fill default answers
  useEffect(() => {
    if (!isMounted || !user) return;
    const picName = user.fullName || "";
    const newAnswers: Record<string, string> = {};

    if (isWanitaOnly) {
      INSPECTION_ITEMS.forEach((item) => {
        newAnswers[`${item.key}_hasil`] = "OK";
        newAnswers[`${item.key}_keterangan`] = "";
        newAnswers[`${item.key}_foto`] = "";
        newAnswers[`${item.key}_tindakan`] = "";
        newAnswers[`${item.key}_pic`] = picName;
        
      });
    } else {
      INSPECTION_ITEMS.forEach((item) => {
        newAnswers[`${item.key}_L_hasil`] = "OK";
        newAnswers[`${item.key}_L_keterangan`] = "";
        newAnswers[`${item.key}_L_foto`] = "";
        newAnswers[`${item.key}_L_tindakan`] = "";
        newAnswers[`${item.key}_L_pic`] = picName;
        

        newAnswers[`${item.key}_P_hasil`] = "OK";
        newAnswers[`${item.key}_P_keterangan`] = "";
        newAnswers[`${item.key}_P_foto`] = "";
        newAnswers[`${item.key}_P_tindakan`] = "";
        newAnswers[`${item.key}_P_pic`] = picName;
        
      });
    }
    setAnswers(newAnswers);
  }, [isMounted, isWanitaOnly, user]);

  // ─── HANDLERS ───────────────────────────────────────────
  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnswers((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
          INSPECTION_ITEMS.forEach((item) => {
            const entry = (data[item.key] || []).find((e: any) => e.date === selectedDate);
            if (entry) {
              found = true;
              existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
              existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
              existingData[`${item.key}_foto`] = entry.fotoTemuan || "";
              existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
              existingData[`${item.key}_pic`] = entry.pic;
              
            }
          });
        } else {
          INSPECTION_ITEMS.forEach((item) => {
            const entryL = (data[`${item.key}_L`] || []).find((e: any) => e.date === selectedDate);
            if (entryL) {
              found = true;
              existingData[`${item.key}_L_hasil`] = entryL.hasilPemeriksaan;
              existingData[`${item.key}_L_keterangan`] = entryL.keteranganTemuan;
              existingData[`${item.key}_L_foto`] = entryL.fotoTemuan || "";
              existingData[`${item.key}_L_tindakan`] = entryL.tindakanPerbaikan;
              existingData[`${item.key}_L_pic`] = entryL.pic;
              
            }
            const entryP = (data[`${item.key}_P`] || []).find((e: any) => e.date === selectedDate);
            if (entryP) {
              found = true;
              existingData[`${item.key}_P_hasil`] = entryP.hasilPemeriksaan;
              existingData[`${item.key}_P_keterangan`] = entryP.keteranganTemuan;
              existingData[`${item.key}_P_foto`] = entryP.fotoTemuan || "";
              existingData[`${item.key}_P_tindakan`] = entryP.tindakanPerbaikan;
              existingData[`${item.key}_P_pic`] = entryP.pic;
              
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
      // Reset ke default
      const picName = user?.fullName || "";
      const resetData: Record<string, string> = {};
      if (isWanitaOnly) {
        INSPECTION_ITEMS.forEach((item) => {
          resetData[`${item.key}_hasil`] = "OK";
          resetData[`${item.key}_keterangan`] = "";
          resetData[`${item.key}_foto`] = "";
          resetData[`${item.key}_tindakan`] = "";
          resetData[`${item.key}_pic`] = picName;
          
        });
      } else {
        INSPECTION_ITEMS.forEach((item) => {
          resetData[`${item.key}_L_hasil`] = "OK";
          resetData[`${item.key}_L_keterangan`] = "";
          resetData[`${item.key}_L_foto`] = "";
          resetData[`${item.key}_L_tindakan`] = "";
          resetData[`${item.key}_L_pic`] = picName;
          

          resetData[`${item.key}_P_hasil`] = "OK";
          resetData[`${item.key}_P_keterangan`] = "";
          resetData[`${item.key}_P_foto`] = "";
          resetData[`${item.key}_P_tindakan`] = "";
          resetData[`${item.key}_P_pic`] = picName;
          
        });
      }
      setAnswers(resetData);
    }
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    const allFieldsFilled = isWanitaOnly
      ? INSPECTION_ITEMS.every((item) => answers[`${item.key}_hasil`])
      : INSPECTION_ITEMS.every(
          (item) => answers[`${item.key}_L_hasil`] && answers[`${item.key}_P_hasil`]
        );

    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    // Pastikan user tidak null saat simpan
    if (!user) {
      alert("User tidak ditemukan. Silakan login ulang.");
      return;
    }

    try {
      // Transform form data ke format database API
      const apiPayload: Record<string, any> = {
        area_code: areaId,
        area_name: currentArea.title,
        inspection_date: selectedDate,
        inspection_time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        user_id: user.id || "",
        inspector_name: user.fullName || "Unknown User",
        inspector_nik: user.nik || "",
        toilet_type: isWanitaOnly ? "wanita_only" : "laki_perempuan",
      };

      // Map form fields ke database fields (item_X_hasil_l/p format)
      // Form uses: kebersihanLantai_L_hasil, kebersihanLantai_P_hasil, dll
      // Database expects: item_1_hasil_l, item_1_hasil_p, dll
      if (isWanitaOnly) {
        INSPECTION_ITEMS.forEach((item) => {
          const itemNum = item.no;
          apiPayload[`item_${itemNum}_hasil_p`] = answers[`${item.key}_hasil`] || "OK";
          apiPayload[`item_${itemNum}_keterangan_p`] = answers[`${item.key}_keterangan`] || "";
          apiPayload[`item_${itemNum}_foto_p`] = answers[`${item.key}_foto`] || "";
          apiPayload[`item_${itemNum}_tindakan_p`] = answers[`${item.key}_tindakan`] || "";
          apiPayload[`item_${itemNum}_pic_p`] = answers[`${item.key}_pic`] || user.fullName || "";
        });
      } else {
        INSPECTION_ITEMS.forEach((item) => {
          const itemNum = item.no;
          // Laki-laki
          apiPayload[`item_${itemNum}_hasil_l`] = answers[`${item.key}_L_hasil`] || "OK";
          apiPayload[`item_${itemNum}_keterangan_l`] = answers[`${item.key}_L_keterangan`] || "";
          apiPayload[`item_${itemNum}_foto_l`] = answers[`${item.key}_L_foto`] || "";
          apiPayload[`item_${itemNum}_tindakan_l`] = answers[`${item.key}_L_tindakan`] || "";
          apiPayload[`item_${itemNum}_pic_l`] = answers[`${item.key}_L_pic`] || user.fullName || "";
          // Perempuan
          apiPayload[`item_${itemNum}_hasil_p`] = answers[`${item.key}_P_hasil`] || "OK";
          apiPayload[`item_${itemNum}_keterangan_p`] = answers[`${item.key}_P_keterangan`] || "";
          apiPayload[`item_${itemNum}_foto_p`] = answers[`${item.key}_P_foto`] || "";
          apiPayload[`item_${itemNum}_tindakan_p`] = answers[`${item.key}_P_tindakan`] || "";
          apiPayload[`item_${itemNum}_pic_p`] = answers[`${item.key}_P_pic`] || user.fullName || "";
        });
      }

      // Submit ke API
      const response = await fetch("/api/toilet-inspections/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      // Juga simpan ke localStorage untuk backup
      const newData: SavedData = { ...savedData };
      const storageKey = `e-checksheet-toilet-${areaId}`;
      const inspectorName = user.fullName || "Unknown User";

      if (isWanitaOnly) {
        INSPECTION_ITEMS.forEach((item) => {
          const entry: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
            pic: answers[`${item.key}_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };

          const arr = newData[item.key] || [];
          const idx = arr.findIndex((e) => e.date === selectedDate);
          if (idx >= 0) arr[idx] = entry;
          else arr.push(entry);
          newData[item.key] = arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      } else {
        INSPECTION_ITEMS.forEach((item) => {
          const entryL: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_L_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_L_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_L_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_L_tindakan`] || "",
            pic: answers[`${item.key}_L_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };
          const entryP: ChecksheetEntry = {
            date: selectedDate,
            hasilPemeriksaan: answers[`${item.key}_P_hasil`] || "",
            keteranganTemuan: answers[`${item.key}_P_keterangan`] || "",
            fotoTemuan: answers[`${item.key}_P_foto`] || undefined,
            tindakanPerbaikan: answers[`${item.key}_P_tindakan`] || "",
            pic: answers[`${item.key}_P_pic`] || inspectorName,
            verify: "",
            inspector: inspectorName,
          };

          const keyL = `${item.key}_L`;
          const keyP = `${item.key}_P`;

          const arrL = newData[keyL] || [];
          const idxL = arrL.findIndex((e) => e.date === selectedDate);
          if (idxL >= 0) arrL[idxL] = entryL;
          else arrL.push(entryL);
          newData[keyL] = arrL.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const arrP = newData[keyP] || [];
          const idxP = arrP.findIndex((e) => e.date === selectedDate);
          if (idxP >= 0) arrP[idxP] = entryP;
          else arrP.push(entryP);
          newData[keyP] = arrP.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(newData));

      // Simpan ke riwayat global
      const hasNG = INSPECTION_ITEMS.some((item) => {
        if (isWanitaOnly) return answers[`${item.key}_hasil`] === "NG";
        return answers[`${item.key}_L_hasil`] === "NG" || answers[`${item.key}_P_hasil`] === "NG";
      });

      const globalArea = `Toilet - ${currentArea.title.replace("TOILET - ", "")}`;
      const globalEntry = {
        id: `TOILET-${Date.now()}`,
        type: "toilet",
        area: globalArea,
        status: hasNG ? "NG" : "OK",
        filledBy: inspectorName,
        filledAt: new Date().toISOString(),
      };

      const globalHistory = JSON.parse(localStorage.getItem("checksheet_history") || "[]");
      globalHistory.push(globalEntry);
      localStorage.setItem("checksheet_history", JSON.stringify(globalHistory));

      alert(`✓ Data berhasil disimpan untuk tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/status-ga/checksheet-toilet`);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert(`❌ Gagal menyimpan data: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────
  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Guard: pastikan user valid
  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null;
  }

  const fullName = user.fullName || "Pengguna";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={fullName} />
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
            <InfoRow label="Nama Area" value={currentArea.title} />
            <InfoRow label="Kategori" value={kategori} />
            <InfoRow label="Lokasi" value={lokasi} />
            <InfoRow label="PIC Pengecekan" value={fullName} />
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
            💡 Pilih tanggal pemeriksaan, lalu isi form. Klik "Muat Data" jika ingin mengedit data sebelumnya.
          </p>
        </div>

        {/* Table */}
        <ChecksheetTable
          inspectionItems={INSPECTION_ITEMS}
          isWanitaOnly={isWanitaOnly}
          answers={answers}
          selectedDate={selectedDate}
          onInputChange={handleInputChange}
          onImageUpload={handleImageUpload}
        />

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
            💡 <strong>Tip:</strong> Lampirkan foto pada "Keterangan Temuan" jika diperlukan. Tanggal pemeriksaan mengikuti pilihan di atas.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
    <span style={{ fontWeight: "600", color: "#00b4dd", fontSize: "clamp(11px, 2.5vw, 13px)" }}>{label}</span>
    <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{value}</span>
  </div>
);

const ChecksheetTable = ({
  inspectionItems,
  isWanitaOnly,
  answers,
  selectedDate,
  onInputChange,
  onImageUpload,
}: {
  inspectionItems: typeof INSPECTION_ITEMS;
  isWanitaOnly: boolean;
  answers: Record<string, string>;
  selectedDate: string;
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
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
            minWidth: isWanitaOnly ? "900px" : "1300px",
          }}
        >
          <thead>
            <tr style={{ background: "#e3f2fd" }}>
              <th rowSpan={2} style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", width: "50px", background: "#bbdefb" }}>
                No
              </th>
              <th rowSpan={2} style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "280px", background: "#bbdefb" }}>
                Item Pengecekan
              </th>
              {isWanitaOnly ? (
                <>
                  <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "100px", background: "#bbdefb" }}>
                    HASIL
                  </th>
                  <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "180px", background: "#bbdefb" }}>
                    KETERANGAN + FOTO
                  </th>
                  <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", minWidth: "150px", background: "#bbdefb" }}>
                    TINDAKAN
                  </th>
                  <th style={{ padding: "12px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#0d47a1", textAlign: "center", width: "120px", background: "#bbdefb" }}>
                    PIC
                  </th>
                </>
              ) : (
                <>
                  <th colSpan={4} style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#1565c0", textAlign: "center", background: "#90caf9" }}>
                    LAKI-LAKI
                  </th>
                  <th colSpan={5} style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: "#ad1457", textAlign: "center", background: "#f48fb1" }}>
                    PEREMPUAN
                  </th>
                </>
              )}
            </tr>
            {!isWanitaOnly && (
              <tr style={{ background: "#e3f2fd" }}>
                {["L", "P"].map((gender) => (
                  <React.Fragment key={gender}>
                    <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "100px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>
                      HASIL
                    </th>
                    <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "180px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>
                      KETERANGAN + FOTO
                    </th>
                    <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", minWidth: "150px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>
                      TINDAKAN
                    </th>
                    <th style={{ padding: "8px 10px", border: "1px solid #1d8de8", fontWeight: "700", color: gender === "L" ? "#0d47a1" : "#880e4f", textAlign: "center", width: "120px", background: gender === "L" ? "#90caf9" : "#f48fb1" }}>
                      PIC
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {inspectionItems.map((item) => (
              <TableRow
                key={item.key}
                item={item}
                isWanitaOnly={isWanitaOnly}
                answers={answers}
                selectedDate={selectedDate}
                onInputChange={onInputChange}
                onImageUpload={onImageUpload}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableRow = ({
  item,
  isWanitaOnly,
  answers,
  selectedDate,
  onInputChange,
  onImageUpload,
}: {
  item: (typeof INSPECTION_ITEMS)[0];
  isWanitaOnly: boolean;
  answers: Record<string, string>;
  selectedDate: string;
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const renderCell = (
    prefix: string,
    label: string,
    borderColor: string,
    bgColor: string,
    textColor: string
  ) => (
    <>
      <td style={{ padding: "6px", border: "1px solid #e0e0e0", textAlign: "center", verticalAlign: "top" }}>
        <select
          value={answers[`${prefix}_hasil`] || ""}
          onChange={(e) => onInputChange(`${prefix}_hasil`, e.target.value)}
          disabled={!selectedDate}
          style={{
            width: "100%",
            padding: "8px",
            border: `2px solid ${borderColor}`,
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
          value={answers[`${prefix}_keterangan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_keterangan`, e.target.value)}
          disabled={!selectedDate}
          placeholder={`Keterangan ${label}...`}
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
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onImageUpload(`${prefix}_foto`, e)}
          disabled={!selectedDate}
          style={{ marginTop: "6px", fontSize: "clamp(10px, 2.5vw, 11px)" }}
        />
        {answers[`${prefix}_foto`] && (
          <div style={{ marginTop: "4px", textAlign: "center" }}>
            <img
              src={answers[`${prefix}_foto`]}
              alt={`Foto ${label}`}
              style={{ maxWidth: "80px", maxHeight: "80px", border: "1px solid #ddd", borderRadius: "4px" }}
            />
          </div>
        )}
      </td>
      <td style={{ padding: "6px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
        <textarea
          value={answers[`${prefix}_tindakan`] || ""}
          onChange={(e) => onInputChange(`${prefix}_tindakan`, e.target.value)}
          disabled={!selectedDate}
          placeholder={`Tindakan ${label}...`}
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
          value={answers[`${prefix}_pic`] || ""}
          disabled
          style={{
            width: "100%",
            padding: "6px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "clamp(11px, 2.5vw, 12px)",
            background: bgColor,
            fontWeight: "600",
            color: textColor,
          }}
        />
      </td>
    </>
  );

  return (
    <tr>
      <td style={{ padding: "10px 8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600", color: "#333", verticalAlign: "top", background: "#f5f5f5" }}>
        {item.no}
      </td>
      <td style={{ padding: "10px 8px", border: "1px solid #e0e0e0", color: "#333", lineHeight: "1.5", verticalAlign: "top", background: "#f5f5f5", fontWeight: "500" }}>
        {item.item}
      </td>
      {isWanitaOnly ? (
        renderCell(item.key, "", "#f44336", "#e8f5e9", "#2e7d32")
      ) : (
        <>
          {renderCell(`${item.key}_L`, "L", "#2196f3", "#e3f2fd", "#1565c0")}
          {renderCell(`${item.key}_P`, "P", "#e91e63", "#fce4ec", "#c2185b")}
        </>
      )}
    </tr>
  );
};