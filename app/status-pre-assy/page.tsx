"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import { DetailModal } from "@/components/ui/detailmodal"
import React from "react"
import Link from "next/link"

interface CheckPoint {
  id: number
  checkPoint: string
  shift: "A" | "B"
  waktuCheck: string
  standard: string
}

interface CheckResult {
  status: "OK" | "NG"
  ngCount: number
  items: Array<{
    name: string
    status: "OK" | "NG" | "N/A"
    notes: string
  }>
  notes: string
  submittedAt: string
  submittedBy: string
}

export default function PreAssyStatusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return;
    if (!user) {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  const [subType, setSubType] = useState<"group-leader" | "inspector">("group-leader")
  const [checkType, setCheckType] = useState<"daily-check" | "cc-stripping" | "pressure-jig">("daily-check")

  // 🔹 Data Pre Assy SESUAI EXCEL (14 checkpoint × 2 shift)
  const [checkpoints] = useState<CheckPoint[]>([
    { id: 1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", shift: "A", waktuCheck: "Setiap Hari", standard: "Check pengisian C/S 4M" },
    { id: 1.1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", shift: "B", waktuCheck: "Setiap Hari", standard: "Check pengisian C/S 4M" },
    { id: 2, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", shift: "A", waktuCheck: "Setiap Hari", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )" },
    { id: 2.1, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", shift: "A", waktuCheck: "Setiap Hari", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )" },
    { id: 3, checkPoint: "Circuit defect yang ada di hanger merah sudah terpasang defective tag...", shift: "A", waktuCheck: "Setiap Hari", standard: "" },
    { id: 3.1, checkPoint: "Circuit defect yang ada di hanger merah sudah terpasang defective tag...", shift: "B", waktuCheck: "Setiap Hari", standard: "" },
    { id: 4, checkPoint: "Inspector check visual terminal dengan memisahkan 1 lot menjadi beberapa bagian...", shift: "A", waktuCheck: "Setiap Hari", standard: "Sesuai IS no. QA-ACL-PA-IS-031" },
    { id: 4.1, checkPoint: "Inspector check visual terminal dengan memisahkan 1 lot menjadi beberapa bagian...", shift: "B", waktuCheck: "Setiap Hari", standard: "Sesuai IS no. QA-ACL-PA-IS-031" },
    { id: 5, checkPoint: "Cek implementasi pengecekan circuit A/B (Countermeasure claim no stripping J53C)", shift: "A", waktuCheck: "Setiap Hari", standard: "Sesuai IS no. QA-ACL-PA-IS-031 hal. 4" },
    { id: 5.1, checkPoint: "Cek implementasi pengecekan circuit A/B (Countermeasure claim no stripping J53C)", shift: "B", waktuCheck: "Setiap Hari", standard: "Sesuai IS no. QA-ACL-PA-IS-031 hal. 4" },
    { id: 6, checkPoint: "Circuit di supply dan di letakan di store sesuai dengan address...", shift: "A", waktuCheck: "Setiap Senin & Kamis", standard: "Sampling check circuit yang ada di store" },
    { id: 6.1, checkPoint: "Circuit di supply dan di letakan di store sesuai dengan address...", shift: "B", waktuCheck: "Setiap Senin & Kamis", standard: "Sampling check circuit yang ada di store" },
    { id: 7, checkPoint: "Jumlah circuit di troli tidak melebihi kapasitas trolly...", shift: "A", waktuCheck: "Setiap Senin & Kamis", standard: "Check kondisi actual ( sampling check min. 3 inspector )" },
    { id: 7.1, checkPoint: "Jumlah circuit di troli tidak melebihi kapasitas trolly...", shift: "B", waktuCheck: "Setiap Senin & Kamis", standard: "Check kondisi actual ( sampling check min. 3 inspector )" },
    { id: 8, checkPoint: "Cup di trolly di tempatkan sesuai dengan tempat yang di sediakan...", shift: "A", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 8.1, checkPoint: "Cup di trolly di tempatkan sesuai dengan tempat yang di sediakan...", shift: "B", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 9, checkPoint: "Cek kondisi Micrometer, Gauge, Tool dan Alat Potong", shift: "A", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 9.1, checkPoint: "Cek kondisi Micrometer, Gauge, Tool dan Alat Potong", shift: "B", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 10, checkPoint: "Daily Check Inspector sudah diisi dan update sesuai kondisi actual", shift: "A", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 10.1, checkPoint: "Daily Check Inspector sudah diisi dan update sesuai kondisi actual", shift: "B", waktuCheck: "Setiap Selasa & Jumat", standard: "Check kondisi actual sesuai IS no. QA-ACL-PA-IS-074, QA-ACL-IS-012" },
    { id: 11, checkPoint: "Tidak ada bagian trolly inspector yang rusak", shift: "A", waktuCheck: "1 Inspector / Minggu", standard: "Check kondisi actual" },
    { id: 11.1, checkPoint: "Tidak ada bagian trolly inspector yang rusak", shift: "B", waktuCheck: "1 Inspector / Minggu", standard: "Check kondisi actual" },
    { id: 12, checkPoint: "Inspector bekerja sesuai dengan urutan yang ada di SWCT", shift: "A", waktuCheck: "1 Inspector / Minggu", standard: "Check actual dengan SWCT" },
    { id: 12.1, checkPoint: "Inspector bekerja sesuai dengan urutan yang ada di SWCT", shift: "B", waktuCheck: "1 Inspector / Minggu", standard: "Check actual dengan SWCT" },
    { id: 13, checkPoint: "Stop kontak dalam keadaan bersih tidak berdebu...", shift: "A", waktuCheck: "Setiap Selasa", standard: "Check kondisi actual" },
    { id: 13.1, checkPoint: "Stop kontak dalam keadaan bersih tidak berdebu...", shift: "B", waktuCheck: "Setiap Selasa", standard: "Check kondisi actual" },
    { id: 14, checkPoint: "Memastikan semua inspector menggunakan penutup kepala...", shift: "A", waktuCheck: "Setiap Hari", standard: "Check kondisi actual" },
    { id: 14.1, checkPoint: "Memastikan semua inspector menggunakan penutup kepala...", shift: "B", waktuCheck: "Setiap Hari", standard: "Check kondisi actual" },
  ])

  // 🔹 Sesuaikan checkType saat subType berubah
  useEffect(() => {
    if (redirected) return;
    if (subType === "group-leader" && checkType === "pressure-jig") {
      setCheckType("daily-check")
    } else if (subType === "inspector" && checkType === "cc-stripping") {
      setCheckType("daily-check")
    }
  }, [subType, checkType])

  const storageKey = `preAssy${subType === "group-leader" ? "GroupLeader" : "Inspector"}DailyCheckResults`

  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
    if (redirected) return;
    // Hanya load untuk Daily Check
    if (checkType !== "daily-check") return

    const loadResults = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey)
        setResults(saved ? JSON.parse(saved) : {})
      }
    }
    loadResults()
    const handleStorage = () => loadResults()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [subType, checkType])

  const januaryDates = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  const today = new Date().getDate()

  const getResult = (date: number, checkpointId: number, shift: "A" | "B") => {
    const dateKey = `2026-01-${String(date).padStart(2, "0")}`
    const checkpointKey = `${checkpointId}-${shift}`
    return results[dateKey]?.[checkpointKey] || null
  }

  const [modalData, setModalData] = useState<{
    date: number
    checkpoint: CheckPoint
    result: CheckResult
  } | null>(null)

  const renderStatusCell = (date: number, checkpoint: CheckPoint) => {
    const result = getResult(date, checkpoint.id, checkpoint.shift)
    if (result) {
      return (
        <span
          className={`status-badge ${result.status === "OK" ? "status-badge-ok" : "status-badge-ng"} text-xs px-1 py-0.5 rounded cursor-pointer inline-block`}
          onClick={() => setModalData({ date, checkpoint, result })}
        >
          {result.status === "OK" ? "OK" : `NG (${result.ngCount})`}
        </span>
      )
    }
    if (date === today && checkType === "daily-check") {
      const dateStr = `2026-01-${String(date).padStart(2, "0")}`
      return (
        <Link 
          href={`/e-checksheet?id=${checkpoint.id}&shift=${checkpoint.shift}&date=${dateStr}&mainType=pre-assy&subType=${subType}`} 
          className="block w-full"
        >
          <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer inline-block w-full text-center">
            CHECK
          </span>
        </Link>
      )
    }
    return null
  }

  // 🔹 Judul dinamis sesuai pilihan
  let title = ""
  if (subType === "group-leader") {
    title = checkType === "cc-stripping" 
      ? "Check CC & Stripping GL Pre Assy" 
      : "Daily Check Group Leader Pre Assy"
  } else {
    title = checkType === "pressure-jig" 
      ? "Daily Check Pressure Jig Inspector Pre Assy" 
      : "Daily Check Inspector Pre Assy"
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>{title}</h1>
          
          {/* 🔹 Dua Dropdown Dinamis */}
          <div className="type-selector">
            {/* Dropdown Peran */}
            <div className="selector-group">
              <label>Peran:</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value as "group-leader" | "inspector")}
                className="dropdown"
              >
                <option value="group-leader">Group Leader</option>
                <option value="inspector">Inspector</option>
              </select>
            </div>

            {/* Dropdown Jenis Check (dinamis) */}
            <div className="selector-group">
              <label>Jenis Check:</label>
              <select
                value={checkType}
                onChange={(e) => {
                  const value = e.target.value as "daily-check" | "cc-stripping" | "pressure-jig"
                  setCheckType(value)
                  // Redirect ke halaman khusus jika bukan daily-check
                  if (value === "cc-stripping") {
                    router.push("/status-pre-assy-cc-stripping")
                  } else if (value === "pressure-jig") {
                    router.push("/status-pre-assy-pressure-jig")
                  }
                }}
                className="dropdown"
              >
                <option value="daily-check">Daily Check Umum</option>
                {subType === "group-leader" && (
                  <option value="cc-stripping">✅ Check CC & Stripping</option>
                )}
                {subType === "inspector" && (
                  <option value="pressure-jig">🔧 Pressure Jig</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* 🔹 Tabel hanya ditampilkan untuk Daily Check */}
        {checkType === "daily-check" && (
          <div className="status-table-section">
            <div className="table-wrapper">
              <table className="status-table">
                <thead>
                  <tr>
                    <th colSpan={4}></th>
                    <th colSpan={31} className="month-header">
                      JANUARI 2026
                    </th>
                  </tr>
                  <tr>
                    <th className="col-checkpoint">Check Point</th>
                    <th className="col-shift">Shift</th>
                    <th className="col-waktu">Waktu Check</th>
                    <th className="col-standard">Standard / Metode</th>
                    {januaryDates.map((date) => (
                      <th key={date} className={`col-date ${date === today ? "col-date-today" : ""}`}>
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((id) => {
                    const shiftA = checkpoints.find(cp => cp.id === id && cp.shift === 'A')
                    const shiftB = checkpoints.find(cp => cp.id === id + 0.1 && cp.shift === 'B')
                    if (!shiftA || !shiftB) return null
                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td className="col-checkpoint" rowSpan={2}>
                            {shiftA.checkPoint}
                          </td>
                          <td className="col-shift">{shiftA.shift}</td>
                          <td className="col-waktu">{shiftA.waktuCheck}</td>
                          <td className="col-standard">{shiftA.standard}</td>
                          {januaryDates.map((date) => (
                            <td key={date} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
                              {renderStatusCell(date, shiftA)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="col-shift">{shiftB.shift}</td>
                          <td className="col-waktu">{shiftB.waktuCheck}</td>
                          <td className="col-standard">{shiftB.standard}</td>
                          {januaryDates.map((date) => (
                            <td key={date} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
                              {renderStatusCell(date, shiftB)}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modalData && <DetailModal data={modalData} onClose={() => setModalData(null)} />}
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 20px;
        }
        .type-selector {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 16px;
          padding: 16px;
          background: #f8fbff;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .selector-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.875rem;
        }
        .dropdown {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          min-width: 180px;
          font-size: 0.95rem;
        }

        .month-header {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0d47a1;
          background: #e3f2fd;
          padding: 12px 0;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .status-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 0.875rem;
        }
        .status-table th, .status-table td {
          padding: 8px 6px;
          text-align: left;
          border: 1px solid #e0e0e0;
        }
        .status-table th {
          background: #f5f9ff;
          font-weight: 600;
        }
        .col-checkpoint { min-width: 300px; word-break: break-word; }
        .col-date { min-width: 36px; text-align: center; }
        .col-date-today { background: #fff8e1; color: #e65100; }
        .status-badge-ok { background: #4caf50; color: white; }
        .status-badge-ng { background: #f44336; color: white; }
        .status-badge-check { background: #1e88e5; color: white; }
      `}</style>
    </div>
  )
}