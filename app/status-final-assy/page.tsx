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

export default function FinalAssyStatusPage() {
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

  const [checkpoints] = useState<CheckPoint[]>([
    // Final Assy (10 checkpoint × 2 shift) — tetap
    { id: 1, checkPoint: "Check 4M Kondisi - Product yang mengalami perubahan 4M sudah di check dan tidak ada masalah", shift: "A", waktuCheck: "07:30 - 08:00", standard: "Abseni Inspector" },
    { id: 1.1, checkPoint: "Check 4M Kondisi - Product yang mengalami perubahan 4M sudah di check dan tidak ada masalah", shift: "B", waktuCheck: "19:30 - 20:00", standard: "Abseni Inspector" },
    { id: 2, checkPoint: "Dilakukan Pengecekan HLC Checker Fixture - Check HLC checker fixture dengan alignment gauge", shift: "A", waktuCheck: "08:00 - 09:00", standard: "Check Sheet HLC Checker" },
    { id: 2.1, checkPoint: "Dilakukan Pengecekan HLC Checker Fixture - Check HLC checker fixture dengan alignment gauge", shift: "B", waktuCheck: "20:00 - 21:00", standard: "Check Sheet HLC Checker" },
    { id: 3, checkPoint: "Torque Wrench - Torque wrench ada nomor registrasi & kalibrasi tidak expired", shift: "A", waktuCheck: "08:00 - 08:00", standard: "Check Actual Torque Wrench" },
    { id: 3.1, checkPoint: "Torque Wrench - Torque wrench ada nomor registrasi & kalibrasi tidak expired", shift: "B", waktuCheck: "20:00 - 20:00", standard: "Check Actual Torque Wrench" },
    { id: 4, checkPoint: "Kandas Lock dan Gauge - Kandas lock dan gauge di area inspection tidak ada yang rusak atau hilang", shift: "A", waktuCheck: "09:00 - 11:00", standard: "Check Actual Tool / Gauge" },
    { id: 4.1, checkPoint: "Kandas Lock dan Gauge - Kandas lock dan gauge di area inspection tidak ada yang rusak atau hilang", shift: "B", waktuCheck: "21:00 - 23:00", standard: "Check Actual Tool / Gauge" },
    { id: 5, checkPoint: "Setting Connector HE Checker Fixture - Setting connector HE checker fixture dengan hati-hati", shift: "A", waktuCheck: "09:00 - 11:00", standard: "QA-ACL-FA-IS-046" },
    { id: 5.1, checkPoint: "Setting Connector HE Checker Fixture - Setting connector HE checker fixture dengan hati-hati", shift: "B", waktuCheck: "21:00 - 23:00", standard: "QA-ACL-FA-IS-046" },
    { id: 6, checkPoint: "Inspection Board Dpasang Cover - Inspection board dpasang cover jika tidak ada loading", shift: "A", waktuCheck: "00:00 - 11:00", standard: "Check Actual Kondisi Board" },
    { id: 6.1, checkPoint: "Inspection Board Dpasang Cover - Inspection board dpasang cover jika tidak ada loading", shift: "B", waktuCheck: "12:00 - 23:00", standard: "Check Actual Kondisi Board" },
    { id: 7, checkPoint: "Box / Polieteer Harness Finish Good - Box / polieteer harness finish good yang quantity-nya tidak standard", shift: "A", waktuCheck: "11:00 - 12:00", standard: "Ada Identitas Qty Tidak Standard" },
    { id: 7.1, checkPoint: "Box / Polieteer Harness Finish Good - Box / polieteer harness finish good yang quantity-nya tidak standard", shift: "B", waktuCheck: "23:00 - 00:00", standard: "Ada Identitas Qty Tidak Standard" },
    { id: 8, checkPoint: "Box / Polieteer Pada Saat Proses Dpasang - Box / polieteer pada saat proses dpasang tutup pada bagian atasnya", shift: "A", waktuCheck: "11:00 - 12:00", standard: "Check Actual Polieter" },
    { id: 8.1, checkPoint: "Box / Polieteer Pada Saat Proses Dpasang - Box / polieteer pada saat proses dpasang tutup pada bagian atasnya", shift: "B", waktuCheck: "23:00 - 00:00", standard: "Check Actual Polieter" },
    { id: 9, checkPoint: "Pengajian LKI dan DP - Pengajian LKI dan DP oleh inspector sudah dilakukan dengan banar", shift: "A", waktuCheck: "13:00 - 14:00", standard: "Check Actual LKI" },
    { id: 9.1, checkPoint: "Pengajian LKI dan DP - Pengajian LKI dan DP oleh inspector sudah dilakukan dengan banar", shift: "B", waktuCheck: "01:00 - 02:00", standard: "Check Actual LKI" },
    { id: 10, checkPoint: "Harness Defect di Hanger - Harness defect di hanger merah dpasang defect tag dan pengisian defect tag", shift: "A", waktuCheck: "14:00 - 15:00", standard: "Check Defect Tag" },
    { id: 10.1, checkPoint: "Harness Defect di Hanger - Harness defect di hanger merah dpasang defect tag dan pengisian defect tag", shift: "B", waktuCheck: "02:00 - 03:00", standard: "Check Defect Tag" },
  ])

  const storageKey = `finalAssy${subType === "group-leader" ? "GroupLeader" : "Inspector"}DailyCheckResults`

  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
    if (redirected) return;
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
  }, [subType])

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
    if (date === today) {
      const dateStr = `2026-01-${String(date).padStart(2, "0")}`
      return (
        <Link 
          href={`/e-checksheet?id=${checkpoint.id}&shift=${checkpoint.shift}&date=${dateStr}&mainType=final-assy&subType=${subType}`} 
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

  const title = 
    subType === "group-leader" 
      ? "Daily Check Group Leader Final Assy" 
      : "Daily Check Inspector Final Assy"

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>{title}</h1>
          
          {/* 🔹 Dropdown hanya subkelas */}
          <div className="type-selector">
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
          </div>
        </div>

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
                {Array.from({ length: 10 }, (_, i) => i + 1).map((id) => {
                  const shiftA = checkpoints.find(cp => cp.id === id && cp.shift === 'A');
                  const shiftB = checkpoints.find(cp => cp.id === id + 0.1 && cp.shift === 'B');
                  if (!shiftA || !shiftB) return null;
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {modalData && <DetailModal data={modalData} onClose={() => setModalData(null)} />}
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 20px;
        }
        .type-selector {
          display: flex;
          align-items: center;
          margin-top: 12px;
          padding: 12px 0;
        }
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .selector-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }
        .dropdown {
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          min-width: 160px;
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