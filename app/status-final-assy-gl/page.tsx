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

export default function FinalAssyGLStatusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "group-leader") {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  const [checkpoints] = useState<CheckPoint[]>([
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

  const storageKey = "finalAssyGroupLeaderDailyCheckResults"

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
  }, [])

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
          title={`Status: ${result.status}${result.status === "NG" ? ` (${result.ngCount})` : ""}`}
        >
          {result.status === "OK" ? "OK" : `NG (${result.ngCount})`}
        </span>
      )
    }
    if (date === today) {
      const dateStr = `2026-01-${String(date).padStart(2, "0")}`
      return (
        <Link
          href={`/e-checksheet?id=${checkpoint.id}&shift=${checkpoint.shift}&date=${dateStr}&mainType=final-assy&subType=group-leader`}
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

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>Daily Check Group Leader Final Assy</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
            <a href="/login-page" className="logout-link">
              Logout
            </a>
          </div>
        </div>

        <div className="status-table-section">
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                <tr>
                  <th colSpan={4}></th>
                  <th colSpan={31} style={{ textAlign: "center", fontSize: "12px", fontWeight: "bold" }}>
                    JANUARI
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
                {Array.from(
                  new Map(
                    checkpoints.map((cp) => [
                      Math.floor(cp.id),
                      checkpoints.filter((item) => Math.floor(item.id) === Math.floor(cp.id)),
                    ])
                  ).values()
                ).map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    <tr>
                      <td className="col-checkpoint" rowSpan={2}>
                        {group[0].checkPoint}
                      </td>
                      <td className="col-shift">{group[0].shift}</td>
                      <td className="col-waktu">{group[0].waktuCheck}</td>
                      <td className="col-standard">{group[0].standard}</td>
                      {januaryDates.map((date) => (
                        <td
                          key={date}
                          className={`col-date px-1.5 py-1 text-xs border ${
                            date === today ? "bg-blue-50" : ""
                          }`}
                        >
                          {renderStatusCell(date, group[0])}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="col-shift">{group[1].shift}</td>
                      <td className="col-waktu">{group[1].waktuCheck}</td>
                      <td className="col-standard">{group[1].standard}</td>
                      {januaryDates.map((date) => (
                        <td
                          key={date}
                          className={`col-date px-1.5 py-1 text-xs border ${
                            date === today ? "bg-blue-50" : ""
                          }`}
                        >
                          {renderStatusCell(date, group[1])}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modalData && (
          <DetailModal
            data={{
              date: modalData.date,
              checkpoint: modalData.checkpoint,
              result: modalData.result,
            }}
            onClose={() => setModalData(null)}
          />
        )}
      </div>

      <style jsx>{`
        .status-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 12px;
        }

        .status-table th,
        .status-table td {
          padding: 8px 4px;
          text-align: center;
          border: 1px solid #ddd;
        }

        .status-table th {
          background-color: #e3f2fd;
          font-weight: 600;
          color: #0d47a1;
        }

        .col-checkpoint {
          text-align: left;
          min-width: 250px;
          word-wrap: break-word;
        }

        .col-shift {
          min-width: 50px;
        }

        .col-waktu {
          min-width: 80px;
        }

        .col-standard {
          min-width: 100px;
        }

        .col-date {
          min-width: 40px;
        }

        .col-date-today {
          background-color: #e8f5e9;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          display: inline-block;
          text-decoration: none;
        }

        .status-badge-ok {
          background-color: #4caf50;
          color: white;
        }

        .status-badge-ng {
          background-color: #f44336;
          color: white;
        }

        .status-badge-check {
          background-color: #2196f3;
          color: white;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}
