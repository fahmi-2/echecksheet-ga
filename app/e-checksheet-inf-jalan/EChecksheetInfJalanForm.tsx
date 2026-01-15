// app/e-checksheet-inf-jalan/EChecksheetInfJalanForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";

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

export function EChecksheetInfJalanForm({
  areaName,
  kategori,
  lokasi,
}: {
  areaName: string;
  kategori: string;
  lokasi: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const inspectionItems = [
    { 
      key: "jalanRata", 
      no: 1, 
      item: "Jalan Rata, tidak bergelombang. Tidak rusak, tidak licin dan tidak berpotensi menyebabkan kecelakaan kerja lainnya",
      subItems: ["Jalan Utama :", "Jalan tambahan :"]
    },
    { 
      key: "jalanTidakLicin", 
      no: 2, 
      item: "Jalan Tidak licin/ berlumut"
    },
    { 
      key: "pencahayaanMemadai", 
      no: 3, 
      item: "Pencahayaan memadai (cukup terang menyinari area jalan dan sekitarnya)"
    },
    { 
      key: "trotoarTidakRusak", 
      no: 4, 
      item: "Trotuar tidak rusak, dan bentuk masih utuh dan sesuai, warna masih bisa terlihat"
    },
    { 
      key: "boardessTrotuar", 
      no: 5, 
      item: "Boardess trotuar tidak berkarat, tidak keropos dan visualisasi jelas (Memastikan boardess dengan cara diperiksa jika diperlukan (tidak hanya secara visual) dan dicek kekuatan penyanggannya), (visualisasi sesuai fungsi, berwarna hijau atau kuning hitam sebagai larangan untuk dilewati)"
    },
    { 
      key: "tidakAdaTumpukan", 
      no: 6, 
      item: "Tidak ada tumpukan diatas boardess / Boardess cor"
    },
    { 
      key: "boardessCor", 
      no: 7, 
      item: "Boardess cor bentukan masih utuh, masih terlihat warnanya dan tidak licin"
    }
  ];

  useEffect(() => {
    if (!isMounted) return;

    try {
      const key = `e-checksheet-inf-jalan-${areaName}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedData(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaName]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    const allFieldsFilled = inspectionItems.every((item) => {
      const hasil = answers[`${item.key}_hasil`];
      return hasil;
    });

    if (!allFieldsFilled) {
      alert("Mohon isi minimal Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      const newData: SavedData = { ...savedData };

      inspectionItems.forEach((item) => {
        const entry: ChecksheetEntry = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
          keteranganTemuan: answers[`${item.key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
          pic: answers[`${item.key}_pic`] || "",
          dueDate: answers[`${item.key}_dueDate`] || "",
          verify: answers[`${item.key}_verify`] || "",
          inspector: user.fullName || "",
        };

        if (!newData[item.key]) {
          newData[item.key] = [];
        }

        const existingIndex = newData[item.key].findIndex((e) => e.date === selectedDate);
        if (existingIndex >= 0) {
          newData[item.key][existingIndex] = entry;
        } else {
          newData[item.key].push(entry);
        }

        newData[item.key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      const key = `e-checksheet-inf-jalan-${areaName}`;
      localStorage.setItem(key, JSON.stringify(newData));
      alert(`Data berhasil disimpan untuk tanggal: ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/ga-inf-jalan?openArea=${encodeURIComponent(areaName)}`);
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

    inspectionItems.forEach((item) => {
      const entries = savedData[item.key] || [];
      const entry = entries.find((e) => e.date === selectedDate);
      if (entry) {
        found = true;
        existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
        existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
        existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
        existingData[`${item.key}_pic`] = entry.pic;
        existingData[`${item.key}_dueDate`] = entry.dueDate;
        existingData[`${item.key}_verify`] = entry.verify;
      }
    });

    if (found) {
      setAnswers(existingData);
      alert("Data berhasil dimuat!");
    } else {
      alert("Tidak ada data untuk tanggal ini.");
      setAnswers({});
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <NavbarStatic userName={user.fullName} />
      <div style={{ padding: "20px 16px", maxWidth: "100%", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", letterSpacing: "-0.5px" }}>
              Check Sheet Inspeksi Infrastruktur Jalan
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Form Pemeriksaan Kelayakan Jalan & Boardess
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Nama Area</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{areaName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Kategori</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{kategori}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Lokasi</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{lokasi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>PIC Pengecekan</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div style={{
          background: "white",
          border: "2px solid #1e88e5",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ 
              fontWeight: "700", 
              color: "#0d47a1", 
              fontSize: "clamp(13px, 3vw, 15px)",
              minWidth: "180px"
            }}>
              📅 Tanggal Pemeriksaan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                padding: "10px 14px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "clamp(13px, 3vw, 15px)",
                color: "#333",
                fontWeight: "600",
                flex: "1 1 200px",
                minWidth: "200px"
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
                opacity: selectedDate ? 1 : 0.6
              }}
            >
              📂 Muat Data
            </button>
          </div>
          <p style={{ 
            margin: "12px 0 0 0", 
            fontSize: "clamp(11px, 2.5vw, 12px)", 
            color: "#666",
            fontStyle: "italic"
          }}>
            💡 Pilih tanggal pemeriksaan, lalu isi form di bawah. Klik "Muat Data" jika ingin mengedit data yang sudah ada.
          </p>
        </div>

        {/* Checksheet Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "20px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(11px, 2.5vw, 13px)",
              minWidth: "1000px"
            }}>
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "60px"
                  }}>No</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "300px"
                  }}>Item Pengecekan</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "120px"
                  }}>HASIL<br/>PEMERIKSAAN</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>KETERANGAN TEMUAN</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>TINDAKAN PERBAIKAN</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>PIC</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "120px"
                  }}>DUE DATE</th>
                  <th style={{
                    padding: "14px 10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>VERIFY</th>
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item) => (
                  <tr key={item.key}>
                    <td style={{
                      padding: "12px 10px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      fontWeight: "700",
                      color: "#333",
                      verticalAlign: "top"
                    }}>{item.no}</td>
                    <td style={{
                      padding: "12px 10px",
                      border: "1px solid #0d47a1",
                      color: "#333",
                      lineHeight: "1.6",
                      verticalAlign: "top"
                    }}>
                      <div>{item.item}</div>
                      {item.subItems && (
                        <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
                          {item.subItems.map((sub, subIdx) => (
                            <div key={subIdx} style={{ marginTop: "4px", fontSize: "clamp(10px, 2.5vw, 12px)", color: "#555" }}>
                              {sub}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      verticalAlign: "top"
                    }}>
                      <select
                        value={answers[`${item.key}_hasil`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_hasil`, e.target.value)}
                        disabled={!selectedDate}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "2px solid #1e88e5",
                          borderRadius: "4px",
                          fontSize: "clamp(11px, 2.5vw, 13px)",
                          fontWeight: "600",
                          cursor: selectedDate ? "pointer" : "not-allowed",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      >
                        <option value="">-</option>
                        <option value="OK">✓ OK</option>
                        <option value="NG">✗ NG</option>
                      </select>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top"
                    }}>
                      <textarea
                        value={answers[`${item.key}_keterangan`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_keterangan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Keterangan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "clamp(11px, 2.5vw, 12px)",
                          resize: "vertical",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top"
                    }}>
                      <textarea
                        value={answers[`${item.key}_tindakan`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_tindakan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Tindakan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "clamp(11px, 2.5vw, 12px)",
                          resize: "vertical",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top"
                    }}>
                      <input
                        type="text"
                        value={answers[`${item.key}_pic`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_pic`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="PIC"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "clamp(11px, 2.5vw, 12px)",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top"
                    }}>
                      <input
                        type="date"
                        value={answers[`${item.key}_dueDate`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_dueDate`, e.target.value)}
                        disabled={!selectedDate}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "clamp(10px, 2.5vw, 11px)",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top"
                    }}>
                      <input
                        type="text"
                        value={answers[`${item.key}_verify`] || ""}
                        onChange={(e) => handleInputChange(`${item.key}_verify`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Verify"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "clamp(11px, 2.5vw, 12px)",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          padding: "20px 0",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => router.push("/ga-inf-jalan")}
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
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
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
              background: selectedDate ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(13, 71, 161, 0.2)",
              opacity: selectedDate ? 1 : 0.6
            }}
          >
            ✓ Simpan Data
          </button>
        </div>

        {/* Legend Info */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8",
          marginTop: "20px"
        }}>
          <div style={{ 
            borderTop: "1px solid #e8e8e8",
            textAlign: "center"
          }}>
            <p style={{ 
              margin: "12px 0 0 0", 
              fontSize: "clamp(10px, 2.5vw, 11px)", 
              color: "#666",
              fontStyle: "italic"
            }}>
              💡 <strong>Tip:</strong> Pilih tanggal pemeriksaan, isi form, klik "Muat Data" jika ada data sebelumnya, lalu simpan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}