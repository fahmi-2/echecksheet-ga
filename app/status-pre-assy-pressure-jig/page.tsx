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
  frequency: string
  judge: string
}

interface CheckResult {
  status: "OK" | "NG"
  ngCount: number
  items: Array<{ name: string; status: "OK" | "NG" | "N/A"; notes: string }>
  notes: string
  submittedAt: string
  submittedBy: string
}

export default function PressureJigPreAssyStatusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return
    if (!user) {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  // 🔹 Hanya Inspector boleh akses. Jika Group Leader, redirect diam-diam.
  useEffect(() => {
    if (redirected) return
    if (user && user.role !== "inspector") {
      setRedirected(true)
      router.push("/status-pre-assy")
    }
  }, [user, router, redirected])

  // 🔹 Data Pressure Jig (7 item × 2 shift)
  const checkpoints = useMemo<CheckPoint[]>(() => [
    { id: 1, checkPoint: "Apakah pressure jig diletakkan sesuai dengan tempatnya.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 1.1, checkPoint: "Apakah pressure jig diletakkan sesuai dengan tempatnya.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 2, checkPoint: "Tidak ada pressure jig yang hilang.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 2.1, checkPoint: "Tidak ada pressure jig yang hilang.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 3, checkPoint: "Tidak ada pressure jig yang rusak/bent/damage.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 3.1, checkPoint: "Tidak ada pressure jig yang rusak/bent/damage.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 4, checkPoint: "Apakah pin dari contact pressure jig bisa digunakan dengan mudah.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 4.1, checkPoint: "Apakah pin dari contact pressure jig bisa digunakan dengan mudah.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 5, checkPoint: "Tidak ada identitas warna tape pada pressure jig yang terkelupas.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 5.1, checkPoint: "Tidak ada identitas warna tape pada pressure jig yang terkelupas.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 6, checkPoint: "Tidak ada jig yang tidak diperlukan di area proses.", shift: "A", frequency: "1x /Hari", judge: "O/X" },
    { id: 6.1, checkPoint: "Tidak ada jig yang tidak diperlukan di area proses.", shift: "B", frequency: "1x /Hari", judge: "O/X" },
    { id: 7, checkPoint: "Apakah tekanan dari contact pressure jig masih dalam skala rata-rata.", shift: "A", frequency: "1x /Bulan", judge: "" },
    { id: 7.1, checkPoint: "Apakah tekanan dari contact pressure jig masih dalam skala rata-rata.", shift: "B", frequency: "1x /Bulan", judge: "" },
  ], [])

  const storageKey = `preAssyPressureJigInspectorDailyCheckResults`
  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
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

  const [modalData, setModalData] = useState<{ date: number; checkpoint: CheckPoint; result: CheckResult } | null>(null)

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
          href={`/e-checksheet?id=${checkpoint.id}&shift=${checkpoint.shift}&date=${dateStr}&mainType=pre-assy-pressure-jig&subType=inspector`}
          className="block w-full h-full"
        >
          <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer flex items-center justify-center w-full h-full">
            CHECK
          </span>
        </Link>
      )
    }
    return null
  }

  const title = "Daily Check Pressure Jig Inspector Pre Assy"

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>{title}</h1>
          <p className="subtitle">Hanya untuk Inspector – Data tersimpan otomatis per shift.</p>
        </div>

        <div className="status-table-section">
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                <tr>
                  <th colSpan={5}></th>
                  <th colSpan={31} className="month-header">
                    JANUARI 2026
                  </th>
                </tr>
                <tr>
                  <th className="col-no">#</th>
                  <th className="col-checkpoint">Item Check</th>
                  <th className="col-freq">Freq</th>
                  <th className="col-judge">Judge</th>
                  <th className="col-shift">Shift</th>
                  {januaryDates.map((date) => (
                    <th key={date} className={`col-date ${date === today ? "col-date-today" : ""}`}>
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((id) => {
                  const shiftA = checkpoints.find(cp => cp.id === id && cp.shift === 'A')
                  const shiftB = checkpoints.find(cp => cp.id === id + 0.1 && cp.shift === 'B')
                  if (!shiftA || !shiftB) return null
                  return (
                    <React.Fragment key={id}>
                      <tr>
                        <td className="col-no" rowSpan={2}>{id}</td>
                        <td className="col-checkpoint" rowSpan={2}>{shiftA.checkPoint}</td>
                        <td className="col-freq" rowSpan={2}>{shiftA.frequency}</td>
                        <td className="col-judge" rowSpan={2}>{shiftA.judge}</td>
                        <td className="col-shift">{shiftA.shift}</td>
                        {januaryDates.map((date) => (
                          <td key={`A-${id}-${date}`} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
                            {renderStatusCell(date, shiftA)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="col-shift">{shiftB.shift}</td>
                        {januaryDates.map((date) => (
                          <td key={`B-${id}-${date}`} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
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

        {modalData && <DetailModal data={modalData} onClose={() => setModalData(null)} />}
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 24px;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.75rem;
        }
        .subtitle {
          margin: 6px 0 0;
          color: #666;
          font-size: 0.95rem;
          font-style: italic;
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
        .status-table th,
        .status-table td {
          padding: 10px 6px;
          text-align: left;
          border: 1px solid #e0e0e0;
          vertical-align: top;
        }
        .status-table th {
          background: #f5f9ff;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .col-no {
          width: 40px;
          text-align: center;
        }
        .col-checkpoint {
          min-width: 360px;
          word-break: break-word;
        }
        .col-freq,
        .col-judge,
        .col-shift {
          min-width: 80px;
          text-align: center;
        }
        .col-date {
          min-width: 36px;
          text-align: center;
        }
        .col-date-today {
          background: #fff8e1;
          color: #e65100;
          font-weight: 600;
        }
        .status-badge-ok {
          background: #4caf50;
          color: white;
        }
        .status-badge-ng {
          background: #f44336;
          color: white;
        }
        .status-badge-check {
          background: #1e88e5;
          color: white;
        }
      `}</style>
    </div>
  )
}                   