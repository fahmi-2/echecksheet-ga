// app/status-ga/fire-alarm/[zona]/page.tsx
"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

// Data lokasi per zona dari Excel
const locations = {
  "zona-1": [
    { no: 1, zona: "ZONA 1", lokasi: "LOBBY" },
    { no: 2, zona: "ZONA 1", lokasi: "HYDRANT MAIN OFFICE" },
  ],
  "zona-2": [
    { no: 3, zona: "ZONA 2", lokasi: "EXIM" },
  ],
  "zona-3": [
    { no: 4, zona: "ZONA 3", lokasi: "TOILET C (BLKG) GENBA A" },
    { no: 5, zona: "ZONA 3", lokasi: "REST AREA PINTU 8" },
    { no: 6, zona: "ZONA 3", lokasi: "MUSHOLLA TIMUR GENBA A" },
    { no: 7, zona: "ZONA 3", lokasi: "ANTARA PINTU 1 & 2 GENBA A" },
    { no: 8, zona: "ZONA 3", lokasi: "SAMPING KANAN PINTU 2" },
  ],
  "zona-4": [
    { no: 9, zona: "ZONA 4", lokasi: "DEPAN OFFICE WAREHOUSE" },
    { no: 10, zona: "ZONA 4", lokasi: "SAMPING LIFT BARANG WHS" },
    { no: 11, zona: "ZONA 4", lokasi: "USM AREA (SMPG PINTU 7)" },
  ],
  "zona-5": [
    { no: 12, zona: "ZONA 5", lokasi: "HYDRANT JIG PROTO" },
    { no: 13, zona: "ZONA 5", lokasi: "JIG PROTO ( TIANG SISI UTARA) NEW" },
    { no: 14, zona: "ZONA 5", lokasi: "DEPAN OFFICE JIG PROTO NEW" },
  ],
  "zona-6": [
    { no: 15, zona: "ZONA 6", lokasi: "HYDRANT TRAINING" },
  ],
  "zona-7": [
    { no: 16, zona: "ZONA 7", lokasi: "HYDRANT ANTARA PINTU 1 & 2 GENBA C" },
    { no: 17, zona: "ZONA 7", lokasi: "HYDRANT ANTARA PINTU 2 & 3 GENBA C" },
    { no: 18, zona: "ZONA 7", lokasi: "HYDRANT AREA C5 GENBA C" },
    { no: 19, zona: "ZONA 7", lokasi: "HYDRANT  AREA PREA ASSY GENBA C" },
    { no: 20, zona: "ZONA 7", lokasi: "DINDING SISI TIMUR TENGAH NEW" },
    { no: 21, zona: "ZONA 7", lokasi: "DINDING SISI BARAT TENGAH NEW" },
    { no: 22, zona: "ZONA 7", lokasi: "HYDRANT GELSHEET" },
  ],
  "zona-8": [
    { no: 23, zona: "ZONA 8", lokasi: "PUMP ROOM" },
  ],
  "zona-9": [
    { no: 24, zona: "ZONA 9", lokasi: "POWER HOUSE A" },
    { no: 25, zona: "ZONA 9", lokasi: "TPS B3" },
  ],
  "zona-10": [
    { no: 26, zona: "ZONA 10", lokasi: "HYDRANT CANTEEN" },
  ],
  "zona-11": [
    { no: 27, zona: "ZONA 11", lokasi: "AUDITORIUM" },
  ],
  "zona-12": [
    { no: 28, zona: "ZONA 12", lokasi: "SAMPING PANEL GENBA B" },
  ],
  "zona-13": [
    { no: 29, zona: "ZONA 13", lokasi: "AREA TIMUR GENBA B" },
  ],
  "zona-14": [
    { no: 30, zona: "ZONA 14", lokasi: "POWER HOUSE B" },
    { no: 31, zona: "ZONA 14", lokasi: "PARKIR BAWAH" },
    { no: 32, zona: "ZONA 14", lokasi: "PARKIR ATAS" },
  ],
  "zona-15": [
    { no: 33, zona: "ZONA 15", lokasi: "PREPARE BOX EXIM NEW" },
    { no: 34, zona: "ZONA 15", lokasi: "DEPAN OFFICE EXIM NEW" },
  ],
  "zona-20": [
    { no: 35, zona: "ZONA 20", lokasi: "AXIS 8 - SELATAN PINTU 7 NEW" },
  ],
  "zona-22": [
    { no: 36, zona: "ZONA 22", lokasi: "NEW WAREHOUSE NEW" },
  ],
  "zona-23": [
    { no: 37, zona: "ZONA 23", lokasi: "BAWAH MEZZANINE - MESIN CUTTING AC 90 TRX-02 NEW" },
    { no: 38, zona: "ZONA 23", lokasi: "DEPAN MINISTORE WAREHOUSE SISI SELATAN NEW" },
  ]
}

export default function FireAlarmChecklist({ params }: { params: Promise<{ zona: string }> }) {
  const router = useRouter()
  const { user } = useAuth()

  const { zona } = use(params)
  const date = new Date().toISOString().split('T')[0]

  const [items, setItems] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [hasNg, setHasNg] = useState(false)

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  useEffect(() => {
    const locs = locations[zona as keyof typeof locations] || []
    const initialItems = locs.map(loc => ({
      no: loc.no,
      zona: loc.zona,
      lokasi: loc.lokasi,
      alarmBell: "",
      indicatorLamp: "",
      manualCallPoint: "",
      idZona: "",
      kebersihan: "",
      kondisiNok: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verify: ""
    }))
    setItems(initialItems)
  }, [zona])

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleShowPreview = () => {
    // Validasi wajib diisi
    for (const item of items) {
      if (!item.alarmBell || !item.indicatorLamp || !item.manualCallPoint || 
          !item.idZona || !item.kebersihan) {
        alert("⚠️ Semua kolom status harus diisi!")
        return
      }
    }

    const ngExists = items.some(
      item => item.alarmBell === "NG" || 
              item.indicatorLamp === "NG" || 
              item.manualCallPoint === "NG" ||
              item.idZona === "NG" ||
              item.kebersihan === "NG"
    )
    setHasNg(ngExists)
    setShowPreview(true)
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
  }

  const handleSave = () => {
    const storageKey = `ga_fire_alarm_${zona}_${date}`
    const result = {
      id: `fire-alarm-${zona}-${Date.now()}`,
      date,
      zona,
      items,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    }

    localStorage.setItem(storageKey, JSON.stringify(result))

    // Simpan ke history
    const historyKey = `ga_fire_alarm_history_${zona}`
    const existing = localStorage.getItem(historyKey) || "[]"
    const history = JSON.parse(existing)
    history.push({ ...result, id: storageKey })
    localStorage.setItem(historyKey, JSON.stringify(history))

    alert("✅ Data berhasil disimpan!")
    router.push("/status-ga/fire-alarm")
  }

  const handleReportNg = () => {
    const ngItems = items.filter(item =>
      item.alarmBell === "NG" || 
      item.indicatorLamp === "NG" || 
      item.manualCallPoint === "NG" ||
      item.idZona === "NG" ||
      item.kebersihan === "NG"
    ).map(item => ({
      name: `${item.lokasi} (${item.zona})`,
      notes: item.kondisiNok || "Tidak ada keterangan"
    }))

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi Fire Alarm - ${zona.toUpperCase()}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist Fire Alarm",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems
    }

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData))
    router.push("/status-ga/pelaporan")
  }

  const getZoneTitle = () => {
    const titles: Record<string, string> = {
      "zona-1": "ZONA 1",
      "zona-2": "ZONA 2",
      "zona-3": "ZONA 3",
      "zona-4": "ZONA 4",
      "zona-5": "ZONA 5",
      "zona-6": "ZONA 6",
      "zona-7": "ZONA 7",
      "zona-8": "ZONA 8",
      "zona-9": "ZONA 9",
      "zona-10": "ZONA 10",
      "zona-11": "ZONA 11",
      "zona-12": "ZONA 12",
      "zona-13": "ZONA 13",
      "zona-14": "ZONA 14",
      "zona-15": "ZONA 15",
      "zona-20": "ZONA 20",
      "zona-22": "ZONA 22",
      "zona-23": "ZONA 23"
    }
    return titles[zona] || zona.toUpperCase()
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-top">
            <button onClick={() => router.back()} className="btn-back">← Kembali</button>
            <h1>🔔 Inspeksi Fire Alarm - {getZoneTitle()}</h1>
          </div>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        {!showPreview ? (
          <div className="form-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Zona</th>
                  <th>Lokasi</th>
                  <th>Alarm Bell</th>
                  <th>Indicator Lamp</th>
                  <th>Manual Call Point</th>
                  <th>ID Zona</th>
                  <th>Kebersihan</th>
                  <th>Kondisi N-OK</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Due Date</th>
                  <th>Verify</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.no}</td>
                    <td>{item.zona}</td>
                    <td>{item.lokasi}</td>
                    <td>
                      <select value={item.alarmBell} onChange={(e) => handleInputChange(index, "alarmBell", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.indicatorLamp} onChange={(e) => handleInputChange(index, "indicatorLamp", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.manualCallPoint} onChange={(e) => handleInputChange(index, "manualCallPoint", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.idZona} onChange={(e) => handleInputChange(index, "idZona", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.kebersihan} onChange={(e) => handleInputChange(index, "kebersihan", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={item.kondisiNok} onChange={(e) => handleInputChange(index, "kondisiNok", e.target.value)} placeholder="Catatan..." className="notes-input" />
                    </td>
                    <td>
                      <input type="text" value={item.tindakanPerbaikan} onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)} placeholder="Tindakan perbaikan..." className="notes-input" />
                    </td>
                    <td>
                      <input type="text" value={item.pic} onChange={(e) => handleInputChange(index, "pic", e.target.value)} placeholder="PIC" className="notes-input" />
                    </td>
                    <td>
                      <input type="date" value={item.dueDate} onChange={(e) => handleInputChange(index, "dueDate", e.target.value)} className="date-input" />
                    </td>
                    <td>
                      <select value={item.verify} onChange={(e) => handleInputChange(index, "verify", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button onClick={() => router.push("/status-ga/fire-alarm")} className="btn-cancel">Batal</button>
              <button onClick={handleShowPreview} className="btn-submit">👁️ Preview & Simpan</button>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="preview-container">
            <h2 className="preview-title">🔍 Preview Data</h2>
            <div className="preview-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Zona</th>
                    <th>Lokasi</th>
                    <th>Alarm Bell</th>
                    <th>Indicator</th>
                    <th>Manual Call</th>
                    <th>ID Zona</th>
                    <th>Kebersihan</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.zona}</td>
                      <td>{item.lokasi}</td>
                      <td className={item.alarmBell === "NG" ? "status-ng" : ""}>{item.alarmBell}</td>
                      <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>{item.indicatorLamp}</td>
                      <td className={item.manualCallPoint === "NG" ? "status-ng" : ""}>{item.manualCallPoint}</td>
                      <td className={item.idZona === "NG" ? "status-ng" : ""}>{item.idZona}</td>
                      <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan}</td>
                      <td>{item.kondisiNok || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn">← Kembali</button>
              {hasNg ? (
                <div className="ng-actions">
                  <button onClick={handleReportNg} className="report-btn">📢 Laporkan NG</button>
                  <button onClick={handleSave} className="save-btn">💾 Simpan Tanpa Lapor</button>
                </div>
              ) : (
                <button onClick={handleSave} className="save-btn">💾 Simpan Data</button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header h1 {
          margin: 0;
          color: #d32f2f;
          font-size: 2rem;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .btn-back {
          padding: 8px 16px;
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.95rem;
        }

        .btn-back:hover {
          background: #e0e0e0;
          border-color: #999;
        }

        .subtitle {
          color: #666;
          margin-top: 8px;
        }

        .form-container,
        .preview-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
          overflow-x: auto;
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid #eee;
        }

        .checklist-table th,
        .simple-table th {
          background: #f5f9ff;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        .status-select,
        .notes-input,
        .date-input {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
        }

        .btn-cancel,
        .btn-submit {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #333;
        }

        .btn-submit {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
        }

        /* Preview Styles */
        .preview-title {
          margin: 0 0 24px;
          color: #0d47a1;
          font-size: 1.5rem;
          text-align: center;
        }

        .status-ng {
          background: #ffebee;
          color: #c62828;
          font-weight: bold;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-btn {
          padding: 10px 24px;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .save-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .report-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 12px;
        }

        .ng-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .checklist-table,
          .simple-table {
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 8px 4px;
          }

          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .report-btn {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  )
}