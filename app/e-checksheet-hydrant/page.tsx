// /app/e-checksheet-hydrant/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface ChecksheetEntry {
  date: string
  item1: string; item2: string; item3: string; item4: string; item5: string;
  item6: string; item7: string; item8: string; item9: string; item10: string;
  item11: string; item12: string; item13: string; item14: string; item15: string;
  item16: string; item17: string; item18: string; item19: string; item20: string;
  keteranganKondisi: string
  tindakanPerbaikan: string
  pic: string
  dueDate: string
  verify: string
  inspector: string
}

export default function EChecksheetHydrantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [items, setItems] = useState<Record<string, string>>({})
  const [keteranganKondisi, setKeteranganKondisi] = useState<string>("")
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState<string>("")
  const [pic, setPic] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [verify, setVerify] = useState<string>("")
  const [savedData, setSavedData] = useState<ChecksheetEntry[]>([])

  // Modal gambar
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImage, setCurrentImage] = useState<string>("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const no = searchParams?.get("no") || "0"
  const lokasi = searchParams?.get("lokasi") || "Hydrant Location"
  const zona = searchParams?.get("zona") || "Zone"
  const jenisHydrant = searchParams?.get("jenisHydrant") || "HYDRANT TYPE"

  useEffect(() => {
    if (!isMounted) return
    try {
      const key = `e-checksheet-hydrant-${no}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedData(parsed)
      }
    } catch (err) {
      console.warn("Failed to parse saved data")
    }
  }, [isMounted, no])

  useEffect(() => {
    if (!isMounted || loading) return
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
      router.push("/login-page")
    }
  }, [user, loading, router, isMounted])

  if (!isMounted) return null

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setItems(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!selectedDate) {
      alert("Please select an inspection date")
      return
    }

    const allFilled = [...Array(20)].every((_, i) => items[`item${i + 1}`])
    if (!allFilled) {
      alert("Please complete all 20 inspection items")
      return
    }

    try {
      const entry: ChecksheetEntry = {
        date: selectedDate,
        item1: items.item1 || "",
        item2: items.item2 || "",
        item3: items.item3 || "",
        item4: items.item4 || "",
        item5: items.item5 || "",
        item6: items.item6 || "",
        item7: items.item7 || "",
        item8: items.item8 || "",
        item9: items.item9 || "",
        item10: items.item10 || "",
        item11: items.item11 || "",
        item12: items.item12 || "",
        item13: items.item13 || "",
        item14: items.item14 || "",
        item15: items.item15 || "",
        item16: items.item16 || "",
        item17: items.item17 || "",
        item18: items.item18 || "",
        item19: items.item19 || "",
        item20: items.item20 || "",
        keteranganKondisi,
        tindakanPerbaikan,
        pic,
        dueDate,
        verify,
        inspector: user.fullName || ""
      }

      const newData = [...savedData]
      const existingIndex = newData.findIndex(e => e.date === selectedDate)
      
      if (existingIndex >= 0) {
        newData[existingIndex] = entry
      } else {
        newData.unshift(entry)
      }

      newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const key = `e-checksheet-hydrant-${no}`
      localStorage.setItem(key, JSON.stringify(newData))
      alert(`Inspection data saved for ${new Date(selectedDate).toLocaleDateString("en-US")}`)
      router.push(`/ga-inspeksi-hydrant`)
    } catch (err) {
      console.error("Save failed:", err)
      alert("Failed to save data")
    }
  }

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Please select a date first")
      return
    }

    const entry = savedData.find(e => e.date === selectedDate)
    
    if (entry) {
      setItems({
        item1: entry.item1,
        item2: entry.item2,
        item3: entry.item3,
        item4: entry.item4,
        item5: entry.item5,
        item6: entry.item6,
        item7: entry.item7,
        item8: entry.item8,
        item9: entry.item9,
        item10: entry.item10,
        item11: entry.item11,
        item12: entry.item12,
        item13: entry.item13,
        item14: entry.item14,
        item15: entry.item15,
        item16: entry.item16,
        item17: entry.item17,
        item18: entry.item18,
        item19: entry.item19,
        item20: entry.item20,
      })
      setKeteranganKondisi(entry.keteranganKondisi)
      setTindakanPerbaikan(entry.tindakanPerbaikan)
      setPic(entry.pic)
      setDueDate(entry.dueDate)
      setVerify(entry.verify)
      alert("Data loaded successfully")
    } else {
      alert("No data found for this date")
      setItems({})
      setKeteranganKondisi("")
      setTindakanPerbaikan("")
      setPic("")
      setDueDate("")
      setVerify("")
    }
  }

  const generateMonthlyDates = () => {
    const today = new Date()
    const year = today.getFullYear()
    const currentMonth = today.getMonth()

    const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth + 1 > 11 ? year + 1 : year

    return [
      new Date(year, currentMonth, 1).toISOString().split('T')[0],
      new Date(nextYear, nextMonth, 1).toISOString().split('T')[0]
    ]
  }

  const inspectionSchedule = generateMonthlyDates()

  const itemLabels = [
    "1. kondisi tidak berkarat",
    "2. posisi tidak terhalang benda apapun",
    "3. kondisi bagus tidak berkarat",
    "4. tidak keropos",
    "5. ada nomor id & papan petunjuk",
    "6. posisi tidak terhalang benda apapun",
    "7. pada posisi Normally open",
    "8. saat posisi tertutup aliran air tidak keluar",
    "9. tidak ada kebocoran pada seal",
    "10. Tersedia",
    "11. Pengunci coupling berfungsi (ditekan)",
    "12. Seal tidak rusak",
    "13. Dapat diputar/dibuka dengan mudah",
    "14. saat posisi tertutup aliran air tidak keluar",
    "15. penutup tersedia & dapat diputar/dibuka dengan mudah",
    "16. Ulir bagian dalam terlumasi",
    "17. Tersedia",
    "18. Layout Jelas",
    "19. Tidak Bocor / pecah, Cat tidak pudar",
    "20. Terpasang dengan rapi & Jelas"
  ]

  // Mapping metode pemeriksaan dan path gambar
  const inspectionConfig = [
    { method: "Visually", image: "/hydrant/pillar-hydrant.png" },
    { method: "Visually", image: "/hydrant/pillar-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/id-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/box-hydrant.jpg" },
    { method: "Check", image: "/hydrant/safety-valve-open.jpg" },
    { method: "Check", image: "/hydrant/safety-valve-closed.jpg" },
    { method: "Visually", image: "/hydrant/seal-valve.jpg" },
    { method: "Check", image: "/hydrant/nozzle-handle.jpg" },
    { method: "Check", image: "/hydrant/coupling-nozzle.jpg" },
    { method: "Visually", image: "/hydrant/seal-nozzle.jpg" },
    { method: "Check", image: "/hydrant/main-valve.jpg" },
    { method: "Check", image: "/hydrant/main-valve-closed.jpg" },
    { method: "Check", image: "/hydrant/valve-cover.jpg" },
    { method: "Check", image: "/hydrant/valve-lubrication.jpg" },
    { method: "Check", image: "/hydrant/fire-hose.jpg" },
    { method: "Visually", image: "/hydrant/layout-hydrant.jpg" },
    { method: "Visually", image: "/hydrant/pipa-air.jpg" },
    { method: "Visually", image: "/hydrant/cs-os-label.jpg" }
  ]

  const openImageModal = (imgPath: string) => {
    setCurrentImage(imgPath)
    setShowImageModal(true)
  }

  const closeImageModal = () => {
    setShowImageModal(false)
    setCurrentImage("")
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <NavbarStatic userName={user.fullName} />
      <div style={{ padding: "24px 20px", maxWidth: "100%", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              Hydrant Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Monthly inspection checklist (20 items)
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{color:"black"}}><strong>Unit No:</strong> {no}</div>
            <div style={{color:"black"}}><strong>Location:</strong> {lokasi}</div>
            <div style={{color:"black"}}><strong>Zone:</strong> {zona}</div>
            <div style={{color:"black"}}><strong>Type:</strong> {jenisHydrant}</div>
            <div style={{color:"black"}}><strong>Inspector:</strong> {user.fullName}</div>
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
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "500", color: "#212121", fontSize: "15px" }}>Inspection Schedule</span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>• Every month</span>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {inspectionSchedule.map(date => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                style={{
                  padding: "8px 16px",
                  background: selectedDate === date ? "#1976d2" : "white",
                  color: selectedDate === date ? "white" : "#424242",
                  border: "1px solid #d0d0d0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Pilih Tanggal:</label>
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
                outline: "none"
              }}
            />
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
        </div>

        {/* Tabel Inspeksi */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px"
        }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            minWidth: "2000px",
            fontFamily: "Arial, sans-serif"
        }}>
            <thead>
            {/* Header Utama - Grouping Kolom (sekarang jadi tombol) */}
            <tr style={{ background: "#e3f2fd", borderBottom: "2px solid #1976d2" }}>
                <th colSpan={2} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "120px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/pillar-hydrant.png")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    PILLAR HYDRANT
                </button>
                </th>

                <th colSpan={4} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "160px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/box-hydrant.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    BOX HYDRANT, ID HYDRANT
                </button>
                </th>

                <th colSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "120px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/safety-valve.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    SAFETY VALVE
                </button>
                </th>

                <th colSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "120px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/nozzle-handle.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    NOZZLE & HANDLE
                </button>
                </th>

                <th colSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "120px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/main-valve.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    VALVE UTAMA, VALVE A,B
                </button>
                </th>

                <th style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "100px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/valve-cover.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    PENUTUP VALVE A/B
                </button>
                </th>

                <th style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "100px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/fire-hose.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    SELANG HYDRANT
                </button>
                </th>

                <th style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "100px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/layout-hydrant.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    LAYOUT
                </button>
                </th>

                <th style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "100px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/pipa-air.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    INSTALASI PIPA AIR
                </button>
                </th>

                <th style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "80px"
                }}>
                <button
                    onClick={() => openImageModal("/hydrant/cs-os-label.jpg")}
                    style={{
                    background: "none",
                    border: "none",
                    color: "#1565c0",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px"
                    }}
                >
                    C/S & O/S
                </button>
                </th>

                <th rowSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "120px"
                }}>Findings (if NG)</th>

                <th rowSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "140px"
                }}>Corrective Action</th>

                <th rowSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "80px"
                }}>PIC</th>

                <th rowSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "90px"
                }}>Due Date</th>

                <th rowSpan={3} style={{
                padding: "10px 8px",
                border: "1px solid #bbdefb",
                fontWeight: "700",
                color: "#1565c0",
                textAlign: "center",
                fontSize: "13px",
                minWidth: "70px"
                }}>Verify</th>
            </tr>

            {/* Baris Nomor Item (1-20) */}
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                {[...Array(20)].map((_, i) => (
                <th key={i} style={{
                    padding: "8px 6px",
                    border: "1px solid #e0e0e0",
                    fontWeight: "600",
                    color: "#424242",
                    textAlign: "center",
                    fontSize: "12px",
                    minWidth: "60px"
                }}>
                    {i + 1}
                </th>
                ))}
            </tr>

            {/* Baris Metode Pemeriksaan — SEBAGAI TEKS BIASA (bukan tombol) */}
            <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                {inspectionConfig.slice(0, 20).map((config, i) => (
                <td key={i} style={{
                    padding: "6px",
                    border: "1px solid #e0e0e0",
                    textAlign: "center",
                    verticalAlign: "middle",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#555",
                    height: "32px"
                }}>
                    {config.method}
                </td>
                ))}
                {/* Kolom tambahan sudah di-handle oleh rowSpan */}
            </tr>
            </thead>
            <tbody>
            <tr>
                {[...Array(20)].map((_, i) => (
                <td key={i} style={{
                    padding: "8px",
                    border: "1px solid #e0e0e0",
                    textAlign: "center",
                    verticalAlign: "top",
                    height: "60px"
                }}>
                    <select
                    value={items[`item${i + 1}`] || ""}
                    onChange={(e) => handleInputChange(`item${i + 1}`, e.target.value)}
                    disabled={!selectedDate}
                    style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        fontWeight: "500",
                        fontSize: "12px",
                        outline: "none",
                        height: "30px"
                    }}
                    >
                    <option value="">-</option>
                    <option value="OK">OK</option>
                    <option value="NG">NG</option>
                    </select>
                    <div style={{
                    fontSize: "9px",
                    color: "#757575",
                    marginTop: "4px",
                    textAlign: "center",
                    lineHeight: "1.2",
                    maxHeight: "30px",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                    }}>
                    {itemLabels[i]}
                    </div>
                </td>
                ))}

                {/* Kolom Findings */}
                <td style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                verticalAlign: "top",
                height: "60px"
                }}>
                <textarea
                    value={keteranganKondisi}
                    onChange={(e) => setKeteranganKondisi(e.target.value)}
                    disabled={!selectedDate}
                    placeholder="Describe issues..."
                    rows={2}
                    style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "12px",
                    resize: "vertical",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    outline: "none",
                    height: "100%"
                    }}
                />
                </td>

                {/* Kolom Corrective Action */}
                <td style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                verticalAlign: "top",
                height: "60px"
                }}>
                <textarea
                    value={tindakanPerbaikan}
                    onChange={(e) => setTindakanPerbaikan(e.target.value)}
                    disabled={!selectedDate}
                    placeholder="Action taken..."
                    rows={2}
                    style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "12px",
                    resize: "vertical",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    outline: "none",
                    height: "100%"
                    }}
                />
                </td>

                {/* Kolom PIC */}
                <td style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                verticalAlign: "top",
                height: "60px"
                }}>
                <input
                    type="text"
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    disabled={!selectedDate}
                    placeholder="Name"
                    style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    outline: "none",
                    height: "30px"
                    }}
                />
                </td>

                {/* Kolom Due Date */}
                <td style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                verticalAlign: "top",
                height: "60px"
                }}>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={!selectedDate}
                    style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    outline: "none",
                    fontSize: "12px",
                    height: "30px"
                    }}
                />
                </td>

                {/* Kolom Verify */}
                <td style={{
                padding: "8px",
                border: "1px solid #e0e0e0",
                verticalAlign: "top",
                height: "60px"
                }}>
                <input
                    type="text"
                    value={verify}
                    onChange={(e) => setVerify(e.target.value)}
                    disabled={!selectedDate}
                    placeholder="Name"
                    style={{
                    width: "100%",
                    padding: "6px",
                    fontSize: "12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "4px",
                    outline: "none",
                    height: "30px"
                    }}
                />
                </td>
            </tr>
            </tbody>
        </table>
        </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/ga-inspeksi-hydrant")}
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
            disabled={!selectedDate}
            style={{
              padding: "11px 28px",
              background: selectedDate ? "#1976d2" : "#e0e0e0",
              color: selectedDate ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              opacity: selectedDate ? 1 : 0.6,
              cursor: selectedDate ? "pointer" : "not-allowed"
            }}
          >
            Save Inspection
          </button>
        </div>
      </div>

      {/* Modal Gambar */}
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
              src={currentImage}
              alt="Reference"
              style={{
                maxHeight: "90vh",
                maxWidth: "90vw",
                objectFit: "contain",
                borderRadius: "8px",
                border: "3px solid white"
              }}
            />
            <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
              Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}