"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import { DetailModal } from "@/components/ui/detailmodal"
import React from "react"
import Link from "next/link"

// 🔹 Tipe Umum
interface CheckResult {
  status: "OK" | "NG"
  ngCount: number
  items: Array<{ name: string; status: "OK" | "NG" | "N/A"; notes: string }>
  notes: string
  submittedAt: string
  submittedBy: string
}

// 🔹 Tipe Daily Check
interface DailyCheckPoint {
  id: number
  checkPoint: string
  shift: "A" | "B"
  waktuCheck: string
  standard: string
}

// 🔹 Tipe CC & Stripping
interface CcStrippingCheckPoint {
  id: number
  machine: string
  kind: string
  size: string
  shift: "A" | "B"
}

export default function PreAssyGLStatusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return;
    if (!user || user.role !== "group-leader-qa") {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  const [viewMode, setViewMode] = useState<"daily" | "cc-stripping">("daily")

  // 🔹 DATA: Daily Check (14 item)
  const DAILY_CHECKPOINTS: DailyCheckPoint[] = useMemo(() => [
    { id: 1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", shift: "A", waktuCheck: "Setiap Hari", standard: "Check pengisian C/S 4M" },
    { id: 1.1, checkPoint: "Inspector check product yang mengalami perubahan 4M dan hasilnya di up date di C/S 4M", shift: "B", waktuCheck: "Setiap Hari", standard: "Check pengisian C/S 4M" },
    { id: 2, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", shift: "A", waktuCheck: "Setiap Hari", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )" },
    { id: 2.1, checkPoint: "Pengisian LKI di lakukan setelah proses inspection dan di isi secara benar...", shift: "B", waktuCheck: "Setiap Hari", standard: "Check actual pengisian LKI ( Sampling check min. 3 inspector )" },
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
  ], [])

  // 🔹 DATA: CC & Stripping (17 mesin)
  const CC_STRIPPING_CHECKPOINTS: CcStrippingCheckPoint[] = useMemo(() => [
    { id: 1, machine: "AC90 TRX 01", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 1.1, machine: "AC90 TRX 01", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 2, machine: "AC90 TRX 02", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 2.1, machine: "AC90 TRX 02", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 3, machine: "AC90 TRX 03", kind: "IA-CIVUS", size: "0.13", shift: "A" },
    { id: 3.1, machine: "AC90 TRX 03", kind: "IA-CIVUS", size: "0.13", shift: "B" },
    { id: 4, machine: "AC90 TRX 04", kind: "CIVUS", size: "0.35", shift: "A" },
    { id: 4.1, machine: "AC90 TRX 04", kind: "CIVUS", size: "0.35", shift: "B" },
    { id: 5, machine: "AC90 TRX 05", kind: "AVSS", size: "2.0", shift: "A" },
    { id: 5.1, machine: "AC90 TRX 05", kind: "AVSS", size: "2.0", shift: "B" },
    { id: 6, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.0", shift: "A" },
    { id: 6.1, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.0", shift: "B" },
    { id: 7, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.5", shift: "A" },
    { id: 7.1, machine: "AC90 TRX 06", kind: "ALVUS", size: "2.5", shift: "B" },
    { id: 8, machine: "AC90 TRX 07", kind: "ALVUS", size: "0.75", shift: "A" },
    { id: 8.1, machine: "AC90 TRX 07", kind: "ALVUS", size: "0.75", shift: "B" },
    { id: 9, machine: "AC90 TRX 07", kind: "ALVUS", size: "1.25", shift: "A" },
    { id: 9.1, machine: "AC90 TRX 07", kind: "ALVUS", size: "1.25", shift: "B" },
    { id: 10, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.5", shift: "A" },
    { id: 10.1, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.5", shift: "B" },
    { id: 11, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.75", shift: "A" },
    { id: 11.1, machine: "AC90 TRX 08", kind: "ALVUS", size: "0.75", shift: "B" },
    { id: 12, machine: "AC90 TRX 09", kind: "ALVUS", size: "0.5", shift: "A" },
    { id: 12.1, machine: "AC90 TRX 09", kind: "ALVUS", size: "0.5", shift: "B" },
    { id: 13, machine: "AC90 TRX 10", kind: "CAVS", size: "0.3", shift: "A" },
    { id: 13.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.3", shift: "B" },
    { id: 14, machine: "AC90 TRX 10", kind: "CAVS", size: "0.5", shift: "A" },
    { id: 14.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.5", shift: "B" },
    { id: 15, machine: "AC90 TRX 10", kind: "CAVS", size: "0.85", shift: "A" },
    { id: 15.1, machine: "AC90 TRX 10", kind: "CAVS", size: "0.85", shift: "B" },
    { id: 16, machine: "AC90 TRX 10", kind: "AESSX", size: "0.3", shift: "A" },
    { id: 16.1, machine: "AC90 TRX 10", kind: "AESSX", size: "0.3", shift: "B" },
    { id: 17, machine: "AC90 TRX 10", kind: "CIVUS", size: "0.35", shift: "A" },
    { id: 17.1, machine: "AC90 TRX 10", kind: "CIVUS", size: "0.35", shift: "B" },
  ], [])

  const storageKey = useMemo(() =>
    viewMode === "daily"
      ? "preAssyQADailyCheckResults"
      : "preAssyQACcStrippingDailyCheckResults"
  , [viewMode])

  const [results, setResults] = useState<Record<string, Record<string, CheckResult>>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
    if (redirected) return;
    const load = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey)
        setResults(saved ? JSON.parse(saved) : {})
      }
    }
    load()
    const handler = () => load()
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [storageKey])

  const januaryDates = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), [])
  const today = new Date().getDate()
  const weekdays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  const timeSlots = ["08.00", "13.00", "16.00", "20.00", "01.00", "04.00"]

  const getHari = (date: number): string | null => {
    const d = new Date(2026, 0, date)
    const dayIndex = d.getDay()
    if (dayIndex === 0 || dayIndex === 6) return null
    return weekdays[dayIndex - 1]
  }

  const getResult = (date: number, id: number, shift: "A" | "B", timeSlot?: string) => {
    const dateKey = `2026-01-${String(date).padStart(2, "0")}`
    const key = timeSlot ? `${id}-${shift}-${timeSlot}` : `${id}-${shift}`
    return results[dateKey]?.[key] || null
  }

  const [modalData, setModalData] = useState<{
    date: number
    checkpoint: any
    timeSlot?: string
    result: CheckResult
  } | null>(null)

  const renderStatusCell = (date: number, checkpoint: any, timeSlot?: string) => {
    const id = (checkpoint as any).id
    const shift = checkpoint.shift
    const result = getResult(date, id, shift, timeSlot)

    if (result) {
      return (
        <span
          className={`status-badge ${
            result.status === "OK" ? "status-badge-ok" : "status-badge-ng"
          } text-xs px-1 py-0.5 rounded cursor-pointer inline-block`}
          onClick={() => setModalData({ date, checkpoint, timeSlot, result })}
        >
          {result.status === "OK" ? "OK" : `NG${result.ngCount > 0 ? ` (${result.ngCount})` : ""}`}
        </span>
      )
    }

    if (date === today) {
      const dateStr = `2026-01-${String(date).padStart(2, "0")}`
      if (viewMode === "daily") {
        return (
          <Link
            href={`/e-checksheet?id=${id}&shift=${shift}&date=${dateStr}&mainType=pre-assy&subType=group-leader`}
            className="block w-full h-full"
          >
            <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer flex items-center justify-center w-full h-full">
              CHECK
            </span>
          </Link>
        )
      } else {
        const hari = getHari(date)
        if (!hari) return null
        return (
          <Link
            href={`/e-checksheet?id=${id}&shift=${shift}&date=${dateStr}&timeSlot=${timeSlot}&mainType=pre-assy-cc-stripping&subType=group-leader`}
            className="block w-full h-full"
          >
            <span className="status-badge status-badge-check text-xs px-1 py-0.5 rounded cursor-pointer flex items-center justify-center w-full h-full">
              ✅
            </span>
          </Link>
        )
      }
    }
    return null
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>
            {viewMode === "daily"
              ? "Daily Check Group Leader Pre Assy"
              : "CallCheck CC & Stripping GL Pre Assy"}
          </h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
            <a href="/login-page" className="logout-link">
              Logout
            </a>
          </div>
        </div>

        {/* 🔹 Switch Button */}
        <div className="button-group">
          <button
            className={`btn ${viewMode === "daily" ? "active" : ""}`}
            onClick={() => setViewMode("daily")}
          >
            📄 Daily Check
          </button>
          <button
            className={`btn ${viewMode === "cc-stripping" ? "active" : ""}`}
            onClick={() => setViewMode("cc-stripping")}
          >
            🔧 CC & Stripping
          </button>
        </div>

        <div className="status-table-section">
          <div className="table-wrapper">
            <table className="status-table">
              <thead>
                {viewMode === "daily" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <tr>
                      <th rowSpan={2} className="col-machine">MESIN</th>
                      <th rowSpan={2} className="col-kind">KIND</th>
                      <th rowSpan={2} className="col-size">SIZE</th>
                      <th colSpan={6 * 5} className="month-header">
                        JANUARI 2026 (SENIN–JUMAT)
                      </th>
                    </tr>
                    <tr>
                      {weekdays.map((hari) => (
                        <th key={hari} colSpan={6} className="hari-header">
                          {hari}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th></th><th></th><th></th>
                      {Array.from({ length: 5 }).flatMap((_, dayIndex) =>
  timeSlots.map((time, timeIndex) => (
    <th key={`${dayIndex}-${timeIndex}`} className="col-time">
      {time}
    </th>
  ))
)}
                    </tr>
                  </>
                )}
              </thead>

              <tbody>
                {viewMode === "daily" ? (
                  Array.from({ length: 14 }, (_, i) => i + 1).map((id) => {
                    const shiftA = DAILY_CHECKPOINTS.find(cp => cp.id === id && cp.shift === 'A')
                    const shiftB = DAILY_CHECKPOINTS.find(cp => cp.id === id + 0.1 && cp.shift === 'B')
                    if (!shiftA || !shiftB) return null
                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td className="col-checkpoint" rowSpan={2}>{shiftA!.checkPoint}</td>
                          <td className="col-shift">{shiftA!.shift}</td>
                          <td className="col-waktu">{shiftA!.waktuCheck}</td>
                          <td className="col-standard">{shiftA!.standard}</td>
                          {januaryDates.map((date) => (
                            <td key={`A-${id}-${date}`} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
                              {renderStatusCell(date, shiftA!)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="col-shift">{shiftB!.shift}</td>
                          <td className="col-waktu">{shiftB!.waktuCheck}</td>
                          <td className="col-standard">{shiftB!.standard}</td>
                          {januaryDates.map((date) => (
                            <td key={`B-${id}-${date}`} className={`col-date px-1.5 py-1 text-xs border ${date === today ? "bg-blue-50" : ""}`}>
                              {renderStatusCell(date, shiftB!)}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    )
                  })
                ) : (
                  Array.from({ length: 17 }, (_, i) => i + 1).map((id) => {
                    const shiftA = CC_STRIPPING_CHECKPOINTS.find(cp => cp.id === id && cp.shift === 'A')
                    const shiftB = CC_STRIPPING_CHECKPOINTS.find(cp => cp.id === id + 0.1 && cp.shift === 'B')
                    if (!shiftA || !shiftB) return null
                    return (
                      <React.Fragment key={id}>
                        <tr>
                          <td className="col-machine" rowSpan={2}>{shiftA!.machine}</td>
                          <td className="col-kind" rowSpan={2}>{shiftA!.kind}</td>
                          <td className="col-size" rowSpan={2}>{shiftA!.size}</td>
                          {januaryDates.map(date => {
                            const hari = getHari(date)
                            return hari ? (
                              timeSlots.map(time => (
                                <td key={`${date}-${time}-A`} className="col-time-cell">
                                  {renderStatusCell(date, shiftA!, time)}
                                </td>
                              ))
                            ) : null
                          })}
                        </tr>
                        <tr>
                          {januaryDates.map(date => {
                            const hari = getHari(date)
                            return hari ? (
                              timeSlots.map(time => (
                                <td key={`${date}-${time}-B`} className="col-time-cell">
                                  {renderStatusCell(date, shiftB!, time)}
                                </td>
                              ))
                            ) : null
                          })}
                        </tr>
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalData && (
          <DetailModal
            data={{
              date: modalData.date,
              checkpoint: {
                ...modalData.checkpoint,
                checkPoint: viewMode === "cc-stripping"
                  ? `${modalData.checkpoint.machine} (${modalData.timeSlot})`
                  : modalData.checkpoint.checkPoint,
              },
              result: modalData.result,
            }}
            onClose={() => setModalData(null)}
          />
        )}
      </div>

      <style jsx>{`
        .header {
          margin-bottom: 24px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.6rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }
        .logout-link {
          color: #d32f2f;
          text-decoration: none;
          font-weight: 600;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fbff;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .btn {
          padding: 10px 20px;
          border: 2px solid transparent;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          background: white;
          color: #666;
          transition: all 0.2s;
        }

        .btn:hover {
          background: #e0e0e0;
        }

        .btn.active {
          background: #1e88e5;
          color: white;
          border-color: #0d47a1;
        }

        .month-header {
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0d47a1;
          background: #e3f2fd;
          padding: 8px 0;
        }
        .hari-header {
          text-align: center;
          font-weight: 600;
          background: #f5f9ff;
          border-bottom: 1px solid #ddd;
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
          font-size: 0.85rem;
        }
        .status-table th,
        .status-table td {
          padding: 8px 6px;
          text-align: center;
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
        .col-checkpoint {
          min-width: 300px;
          text-align: left;
          word-break: break-word;
        }
        .col-machine { min-width: 100px; }
        .col-kind { min-width: 90px; }
        .col-size { min-width: 50px; }
        .col-shift, .col-waktu, .col-standard { min-width: 80px; }
        .col-date { min-width: 36px; }
        .col-time { font-size: 0.7rem; padding: 4px; }
        .col-time-cell { height: 36px; min-width: 36px; }
        .col-date-today { background: #fff8e1; color: #e65100; }

        .status-badge {
          display: inline-block;
          width: 100%;
          height: 100%;
        }
        .status-badge-ok { background: #4caf50; color: white; }
        .status-badge-ng { background: #f44336; color: white; }
        .status-badge-check { background: #1e88e5; color: white; }
      `}</style>
    </div>
  )
}