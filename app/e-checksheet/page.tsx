"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import Link from "next/link"

// 🔹 Tipe Pelaporan
interface PelaporanData {
  id: string
  tanggal: string
  mainType: string
  subType: string
  checkPoint: string
  shift: string
  ngNotes: string
  department: string
  reporter: string
  reportedAt: string
  status: "open" | "in-progress" | "closed"
  ngItemsDetail: Array<{
    name: string
    notes: string
  }>
}

// 🔹 Tipe Item Check
interface CheckItem {
  name: string
  status: "OK" | "NG" | "N/A"
  notes: string
}

// 🔹 Tipe Checkpoint
interface CheckPointInfo {
  id: string
  mainType: string
  subType?: string
  checkType?: string
  shift: string
  date: string
  details: Record<string, string>
}

export default function EChecksheetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Extract URL params
  const id = searchParams.get("id")
  const shift = searchParams.get("shift")
  const date = searchParams.get("date")
  const mainType = searchParams.get("mainType") || "final-assy"
  const subType = searchParams.get("subType") || "group-leader"
  const checkType = searchParams.get("checkType") || "daily-check"
  const timeSlot = searchParams.get("timeSlot") // 🔹 Ambil timeSlot

  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    { name: "Item 1", status: "OK", notes: "" },
    { name: "Item 2", status: "OK", notes: "" },
    { name: "Item 3", status: "OK", notes: "" },
    { name: "Item 4", status: "N/A", notes: "" },
    { name: "Item 5", status: "OK", notes: "" },
  ])

  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPelaporanModal, setShowPelaporanModal] = useState(false)
  const [pelaporanFormData, setPelaporanFormData] = useState({
    department: "",
    deskripsi: "",
    attachment: null as File | null,
  })

  // Check auth
  useEffect(() => {
    if (!user) {
      router.push("/login-page")
    }
  }, [user, router])

  // Load saved data
  useEffect(() => {
    if (!id || !shift || !date) return

    try {
      // 🔹 Sertakan timeSlot dalam kunci jika ada
      const storageKey = `${mainType}-${subType}-${checkType}-${id}-${shift}-${date}${timeSlot ? `-${timeSlot}` : ''}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setCheckItems(data.items || checkItems)
        setNotes(data.notes || "")
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }, [id, shift, date, mainType, subType, checkType, timeSlot])

  // Handle item status change
  const handleItemStatusChange = (index: number, status: "OK" | "NG" | "N/A") => {
    const updated = [...checkItems]
    updated[index].status = status
    setCheckItems(updated)
  }

  // Handle item notes change
  const handleItemNotesChange = (index: number, notes: string) => {
    const updated = [...checkItems]
    updated[index].notes = notes
    setCheckItems(updated)
  }

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const ngCount = checkItems.filter((item) => item.status === "NG").length
      const status = ngCount === 0 ? "OK" : "NG"

      // Determine storage key based on role and type
      let storageKey = "dailyCheckResults"
      if (mainType === "final-assy") {
        storageKey =
          subType === "group-leader"
            ? "finalAssyGroupLeaderDailyCheckResults"
            : "finalAssyInspectorDailyCheckResults"
      } else if (mainType === "pre-assy") {
        if (subType === "group-leader") {
          storageKey =
            checkType === "daily-check"
              ? "preAssyGroupLeaderDailyCheckDailyCheckResults"
              : "preAssyGroupLeaderCcStrippingDailyCheckResults"
        } else {
          storageKey = "preAssyInspectorDailyCheckResults"
        }
      }
      // 🔹 Untuk cs-remove-tool, gunakan storage key khusus
      else if (mainType === "cs-remove-tool") {
        storageKey = "csRemoveControlResults"
      }

      // Load existing results
      const existing = localStorage.getItem(storageKey)
      const results = existing ? JSON.parse(existing) : {}

      // Store result
      const dateKey = date || new Date().toISOString().split("T")[0]

      // 🔹 Untuk cs-remove-tool, gunakan id langsung (id sudah include shift)
      // Untuk yang lain, gunakan format ${id}-${shift}
      let checkpointKey = timeSlot 
        ? `${id}-${shift}-${timeSlot}` 
        : `${id}-${shift}`
      
      if (mainType === "cs-remove-tool") {
        checkpointKey = id || "" // Gunakan id langsung
      }

      if (!results[dateKey]) {
        results[dateKey] = {}
      }

      results[dateKey][checkpointKey] = {
        status,
        ngCount,
        items: checkItems,
        notes,
        submittedAt: new Date().toISOString(),
        submittedBy: user?.fullName || "Unknown",
      }

      localStorage.setItem(storageKey, JSON.stringify(results))

      // 🔹 Jika dari cs-remove-tool, emit event untuk update real-time
      if (mainType === "cs-remove-tool") {
        window.dispatchEvent(new Event("csRemoveControlUpdated"))
      }

      // Save to history
      const history = JSON.parse(localStorage.getItem("checklistHistory") || "[]")
      history.push({
        id: `checklist-${Date.now()}`,
        date: dateKey,
        machine: mainType,
        operator: user?.fullName || "Unknown",
        status,
        submittedAt: new Date().toISOString(),
      })
      localStorage.setItem("checklistHistory", JSON.stringify(history))

      // 🔹 Update laporan status jika ada laporan sebelumnya
      const ngItems = checkItems.filter((item) => item.status === "NG")
      updateLaporanStatusFromChecksheet(
        {
          mainType,
          subType: subType || "group-leader",
          checkType,
          id: id || "",
          shift: shift || "A",
          date: dateKey,
        },
        ngItems
      )

      // If there are NG items, show pelaporan modal
      if (ngCount > 0) {
        setShowPelaporanModal(true)
      } else {
        // Success - redirect to home
        alert("✅ Checklist berhasil disimpan!")
        router.push("/home")
      }
    } catch (error) {
      console.error("Error submitting:", error)
      alert("Gagal menyimpan checklist!")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper: Determine laporan status based on NG items
  const determineLaporanStatus = (
    ngItems: CheckItem[],
    existingLaporan?: PelaporanData
  ): "open" | "in-progress" | "closed" => {
    const currentNGCount = ngItems.length
    
    // Jika tidak ada NG sekarang = closed
    if (currentNGCount === 0) {
      return "closed"
    }
    
    // Jika ada laporan sebelumnya dan ada recovery (NG berkurang) = in-progress
    if (existingLaporan) {
      const previousNGCount = existingLaporan.ngItemsDetail?.length || 0
      if (currentNGCount < previousNGCount) {
        return "in-progress"
      }
    }
    
    // Kondisi awal dengan NG = open
    return "open"
  }

  // Helper: Update laporan status berdasarkan checkpoint terbaru
  const updateLaporanStatusFromChecksheet = (
    checkpointInfo: {
      mainType: string
      subType: string
      checkType?: string
      id: string
      shift: string
      date: string
    },
    ngItems: CheckItem[]
  ) => {
    try {
      const existing = localStorage.getItem("ngReports")
      if (!existing) return

      const reports = JSON.parse(existing)
      let updated = false

      const updatedReports = reports.map((laporan: PelaporanData) => {
        // Cari laporan yang sesuai dengan checkpoint ini
        const isMatchingCheckpoint =
          laporan.mainType === checkpointInfo.mainType &&
          laporan.subType === checkpointInfo.subType &&
          laporan.shift === checkpointInfo.shift &&
          laporan.tanggal.includes(checkpointInfo.date)

        if (isMatchingCheckpoint) {
          const newStatus = determineLaporanStatus(ngItems, laporan)
          if (newStatus !== laporan.status) {
            updated = true
            return {
              ...laporan,
              status: newStatus,
              ngItemsDetail: ngItems,
              lastUpdated: new Date().toISOString(),
            }
          }
        }

        return laporan
      })

      if (updated) {
        localStorage.setItem("ngReports", JSON.stringify(updatedReports))

        // Emit storage event untuk sync
        window.dispatchEvent(new Event("storage"))
      }
    } catch (error) {
      console.error("Error updating laporan status:", error)
    }
  }

  // Handle pelaporan submit
  const handlePelaporanSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!pelaporanFormData.department) {
      alert("Pilih departemen terlebih dahulu!")
      return
    }

    try {
      const ngItems = checkItems.filter((item) => item.status === "NG")

      const pelaporan: PelaporanData = {
        id: `NG-${Date.now()}`,
        tanggal: date || new Date().toISOString(),
        mainType,
        subType: subType || "group-leader",
        checkPoint: searchParams.get("checkPoint") || "Checkpoint",
        shift: shift || "A",
        ngNotes: notes,
        department: pelaporanFormData.department,
        reporter: user?.fullName || "Unknown",
        reportedAt: new Date().toISOString(),
        status: "open",
        ngItemsDetail: ngItems,
      }

      // Save pelaporan
      const existing = localStorage.getItem("ngReports")
      const reports = existing ? JSON.parse(existing) : []
      reports.push(pelaporan)
      localStorage.setItem("ngReports", JSON.stringify(reports))

      // Save notification
      const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
      notifications.push({
        id: `notif-${Date.now()}`,
        pelaporanId: pelaporan.id,
        type: "ng_report",
        message: `Laporan NG baru dari ${user?.fullName} - ${pelaporan.checkPoint}`,
        timestamp: Date.now(),
        read: false,
      })
      localStorage.setItem("notifications", JSON.stringify(notifications))

      // 🔹 Jika dari cs-remove-tool, emit event untuk update real-time
      if (mainType === "cs-remove-tool") {
        window.dispatchEvent(new Event("csRemoveControlUpdated"))
      }

      alert("✅ Laporan NG berhasil disimpan!")
      setShowPelaporanModal(false)
      router.push("/home")
    } catch (error) {
      console.error("Error submitting pelaporan:", error)
      alert("Gagal menyimpan laporan!")
    }
  }

  const ngCount = checkItems.filter((item) => item.status === "NG").length
  const departments = [
    "Produksi",
    "Maintenance",
    "Quality Assurance",
    "Engineering",
    "Logistics",
    "Safety",
    "Purchasing",
  ]

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📋 E-Checksheet</h1>
          <p className="subtitle">
            {mainType === "final-assy" ? "Final Assembly" : "Pre Assembly"} -{" "}
            {shift} Shift
          </p>
        </div>

        <div className="checksheet-container">
          {/* Info Section */}
          <div className="info-section">
            <h3>Informasi Checklist</h3>
            <div className="info-grid">
              <div>
                <strong>Tanggal:</strong> {date}
              </div>
              <div>
                <strong>Shift:</strong> {shift}
              </div>
              <div>
                <strong>Area:</strong>{" "}
                {mainType === "final-assy" ? "Final Assy" : "Pre Assy"}
              </div>
              <div>
                <strong>Petugas:</strong> {user.fullName}
              </div>
              {timeSlot && (
                <div>
                  <strong>Jam:</strong> {timeSlot}
                </div>
              )}
            </div>
          </div>

          {/* Checklist Form */}
          <form onSubmit={handleSubmit} className="checklist-form">
            <div className="items-section">
              <h3>Daftar Pemeriksaan</h3>
              <div className="items-table">
                <div className="table-header">
                  <div className="col-no">#</div>
                  <div className="col-item">Item Pemeriksaan</div>
                  <div className="col-status">Status</div>
                  <div className="col-notes">Catatan (jika NG)</div>
                </div>
                {checkItems.map((item, idx) => (
                  <div key={idx} className="table-row">
                    <div className="col-no">{idx + 1}</div>
                    <div className="col-item">{item.name}</div>
                    <div className="col-status">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleItemStatusChange(
                            idx,
                            e.target.value as "OK" | "NG" | "N/A"
                          )
                        }
                        className={`status-select status-${item.status.toLowerCase()}`}
                      >
                        <option value="OK">✅ OK</option>
                        <option value="NG">❌ NG</option>
                        <option value="N/A">➖ N/A</option>
                      </select>
                    </div>
                    <div className="col-notes">
                      <input
                        type="text"
                        placeholder="Jelaskan masalah..."
                        value={item.notes}
                        onChange={(e) =>
                          handleItemNotesChange(idx, e.target.value)
                        }
                        disabled={item.status !== "NG"}
                        className="notes-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="summary-section">
              <div className="summary-box">
                <div className="summary-item">
                  <span>Total Item:</span>
                  <strong>{checkItems.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Status OK:</span>
                  <strong className="status-ok">
                    {checkItems.filter((i) => i.status === "OK").length}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>Status NG:</span>
                  <strong className="status-ng">{ngCount}</strong>
                </div>
                <div className="summary-item">
                  <span>Status N/A:</span>
                  <strong className="status-na">
                    {checkItems.filter((i) => i.status === "N/A").length}
                  </strong>
                </div>
              </div>
            </div>

            {/* General Notes */}
            <div className="notes-section">
              <label htmlFor="notes">Catatan Umum</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan tambahan jika diperlukan..."
                rows={4}
                className="notes-textarea"
              />
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Link href="/home" className="btn btn-secondary">
                ← Batal
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : ngCount > 0
                    ? "✅ Simpan & Buat Laporan"
                    : "✅ Simpan Checklist"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pelaporan Modal */}
      {showPelaporanModal && (
        <div className="modal-overlay" onClick={() => setShowPelaporanModal(false)}>
          <div
            className="modal-content pelaporan-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowPelaporanModal(false)}
            >
              ×
            </button>
            <h3 className="modal-title">⚠️ Buat Laporan NG</h3>

            <form onSubmit={handlePelaporanSubmit} className="pelaporan-form">
              <p className="form-info">
                Ditemukan <strong>{ngCount} item NG</strong>. Silakan laporkan ke departemen terkait.
              </p>

              {/* NG Items Summary */}
              <div className="ng-items-summary">
                <h4>Item yang NG:</h4>
                <ul>
                  {checkItems
                    .filter((item) => item.status === "NG")
                    .map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong> - {item.notes || "Tanpa catatan"}
                      </li>
                    ))}
                </ul>
              </div>

              <div className="form-group">
                <label htmlFor="department">Departemen Tujuan *</label>
                <select
                  id="department"
                  value={pelaporanFormData.department}
                  onChange={(e) =>
                    setPelaporanFormData({
                      ...pelaporanFormData,
                      department: e.target.value,
                    })
                  }
                  required
                  className="form-control"
                >
                  <option value="">-- Pilih Departemen --</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deskripsi">Deskripsi Masalah *</label>
                <textarea
                  id="deskripsi"
                  value={pelaporanFormData.deskripsi}
                  onChange={(e) =>
                    setPelaporanFormData({
                      ...pelaporanFormData,
                      deskripsi: e.target.value,
                    })
                  }
                  placeholder="Jelaskan secara detail masalah yang ditemukan..."
                  rows={4}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPelaporanModal(false)}
                >
                  Batalkan Laporan
                </button>
                <button type="submit" className="btn btn-danger">
                  🔴 Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .header {
          margin-bottom: 32px;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 2rem;
        }
        .subtitle {
          margin: 8px 0 0;
          color: #666;
          font-style: italic;
        }

        .checksheet-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .info-section {
          background: #f5f9ff;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-section h3 {
          margin: 0 0 16px;
          color: #1e88e5;
          font-size: 1.1rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .info-grid div {
          padding: 8px 0;
        }
        .info-grid strong {
          color: #333;
          font-weight: 600;
        }

        .checklist-form {
          padding: 24px;
        }

        .items-section h3,
        .notes-section label {
          color: #0d47a1;
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 1rem;
        }

        .items-table {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 50px 1fr 120px 200px;
          gap: 12px;
          background: #f5f9ff;
          padding: 12px;
          font-weight: 600;
          color: #0d47a1;
          border-bottom: 2px solid #e0e0e0;
        }

        .table-row {
          display: grid;
          grid-template-columns: 50px 1fr 120px 200px;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .col-no {
          text-align: center;
          font-weight: 600;
          color: #666;
        }

        .col-item {
          font-size: 0.9rem;
          color: #333;
        }

        .status-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .status-select.status-ok {
          color: #2e7d32;
        }

        .status-select.status-ng {
          color: #c62828;
        }

        .status-select.status-n/a {
          color: #666;
        }

        .notes-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .notes-input:disabled {
          background: #f5f5f5;
          color: #999;
        }

        .summary-section {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .summary-box {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-item span {
          font-size: 0.9rem;
          color: #666;
        }

        .summary-item strong {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .status-ok {
          color: #2e7d32;
        }

        .status-ng {
          color: #c62828;
        }

        .status-na {
          color: #999;
        }

        .notes-section {
          margin-bottom: 24px;
        }

        .notes-section label {
          display: block;
          margin-bottom: 8px;
        }

        .notes-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.9rem;
          font-family: inherit;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.95rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #1e88e5;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .btn-danger {
          background: #d32f2f;
          color: white;
        }

        .btn-danger:hover {
          background: #b71c1c;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          width: 90%;
          max-width: 500px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 28px;
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          z-index: 10;
        }

        .modal-title {
          text-align: center;
          padding: 24px 20px 16px;
          margin: 0;
          color: #d32f2f;
          font-size: 1.3rem;
          border-bottom: 2px solid #f5f5f5;
        }

        .pelaporan-modal {
          padding: 24px;
        }

        .form-info {
          background: #fff3e0;
          padding: 12px;
          border-radius: 6px;
          color: #e65100;
          margin-bottom: 16px;
          font-size: 0.95rem;
        }

        .ng-items-summary {
          background: #ffebee;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .ng-items-summary h4 {
          margin: 0 0 8px;
          color: #c62828;
          font-size: 0.95rem;
        }

        .ng-items-summary ul {
          margin: 0;
          padding-left: 20px;
          font-size: 0.9rem;
        }

        .ng-items-summary li {
          margin: 6px 0;
          color: #333;
        }

        .pelaporan-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          color: #0d47a1;
          font-size: 0.95rem;
        }

        .form-control {
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .form-control:focus {
          border-color: #1e88e5;
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }

        .form-control[type="textarea"],
        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }

        .pelaporan-form .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 30px 1fr;
          }

          .col-status,
          .col-notes {
            grid-column: 1 / -1;
            margin-top: 8px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}