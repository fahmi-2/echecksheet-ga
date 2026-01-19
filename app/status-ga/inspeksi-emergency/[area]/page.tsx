// app/inspeksi-emergency/[area]/page.tsx
"use client"

import { useState, useEffect, use } from "react" // 🔹 Tambahkan 'use'
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

// Data lokasi per area dari Excel
const locations = {
  "genba-a": [
    { no: 1, lokasi: "CV AB1", id: "A01" },
    { no: 2, lokasi: "CV AB3", id: "A02" },
    { no: 3, lokasi: "CV AB4", id: "A03" },
    { no: 4, lokasi: "CV AB7", id: "A04" },
    { no: 5, lokasi: "CV AB9", id: "A05" },
    { no: 6, lokasi: "CV 15A", id: "A06" },
    { no: 7, lokasi: "CV 14B", id: "A07" },
    { no: 8, lokasi: "SA AT19", id: "A08" },
    { no: 9, lokasi: "PINTU 7", id: "A09" },
    { no: 10, lokasi: "RAYCHEM 900B", id: "A10" },
    { no: 11, lokasi: "INSERT PLUG AT6", id: "A11" },
    { no: 12, lokasi: "CV AT9", id: "A12" },
    { no: 13, lokasi: "CV AT7", id: "A13" },
    { no: 14, lokasi: "CV AT6", id: "A14" },
    { no: 15, lokasi: "CV AT2", id: "A15" },
    { no: 16, lokasi: "PINTU 9", id: "A16" },
    { no: 17, lokasi: "PRE ASSY AB1", id: "A17" },
    { no: 20, lokasi: "DEPAN QA REC", id: "A18" },
    { no: 21, lokasi: "NEW CUTTING TUBE", id: "A19" },
    { no: 22, lokasi: "UTARA PINTU 2", id: "A20" },
  ],
  "genba-b": [
    { no: 51, lokasi: "PINTU MASUK GENBA B", id: "B01" },
    { no: 52, lokasi: "SEBELAH UTARA", id: "B02" },
    { no: 53, lokasi: "SEBELAH TIMUR", id: "B03" },
    { no: 54, lokasi: "SEBELAH TIMUR", id: "B04" },
    { no: 55, lokasi: "AREA SECOND FLOOR", id: "B05" },
    { no: 56, lokasi: "SEBELAH SELATAN", id: "B06" },
    { no: 57, lokasi: "SAMPING LIFT BARANG", id: "B07" },
    { no: 58, lokasi: "SEBELAH BARAT", id: "B08" },
    { no: 59, lokasi: "SEBELAH BARAT", id: "B09" },
    { no: 60, lokasi: "DI ATAS PANEL", id: "B10" },
  ],
  "genba-c": [
    { no: 61, lokasi: "RECEIVING", id: "C01" },
    { no: 62, lokasi: "CV C7", id: "C02" },
    { no: 63, lokasi: "CV C3", id: "C03" },
    { no: 64, lokasi: "CV C3", id: "C04" },
    { no: 65, lokasi: "PRE ASSY", id: "C05" },
    { no: 66, lokasi: "PRE ASSY", id: "C06" },
    { no: 67, lokasi: "CV C1", id: "C07" },
    { no: 68, lokasi: "CV C1", id: "C08" },
    { no: 69, lokasi: "CV C5", id: "C09" },
    { no: 70, lokasi: "CV C4", id: "C10" },
    { no: 71, lokasi: "PINTU SELATAN", id: "C11" },
    { no: 72, lokasi: "PINTU UTARA", id: "C12" },
  ],
  "jig-proto": [
    { no: 73, lokasi: "SAMPING PINTU", id: "JP01" },
    { no: 74, lokasi: "STOCK CONTROL / NYS", id: "JP02" },
    { no: 75, lokasi: "BOR DUDUK", id: "JP03" },
    { no: 76, lokasi: "OFFICE JIG PROTO", id: "JP04" },
  ],
  "gel-sheet": [
    { no: 77, lokasi: "GEL SHEET/STOK KONTROL", id: "GS01" },
    { no: 78, lokasi: "GEL SHEET", id: "GS02" },
  ],
  "warehouse": [
    { no: 23, lokasi: "RECEIVING WAREHOUSE", id: "WHS01" },
    { no: 24, lokasi: "SAMPING LIFT WAREHOUSE (BAWAH)", id: "WHS02" },
    { no: 25, lokasi: "SAMPING LIFT WHS SISI ATAS", id: "WHS03" },
    { no: 26, lokasi: "SECOND FLOOR WAREHOUSE JALUR TENGAH (SAMPING PAGAR)", id: "WHS04" },
    { no: 27, lokasi: "DEKAT TANGGA SISI BARAT SECOND FLOOR WHS", id: "WHS05" },
  ],
  "mezzanine": [
    { no: 28, lokasi: "TANGGA T08-B /", id: "TM01" },
    { no: 29, lokasi: "TANGGA KARAKURI", id: "TM02" },
    { no: 30, lokasi: "TANGGA REMOT AC", id: "TM03" },
    { no: 31, lokasi: "SAMPING TANGGA SELATAN", id: "MZA-01" },
    { no: 32, lokasi: "J72 MAZDA", id: "MZA-02" },
    { no: 33, lokasi: "J30 MAZDA", id: "MZA-03" },
    { no: 34, lokasi: "CV 900B", id: "MZA-04" },
    { no: 35, lokasi: "CV 900B TOYOTA", id: "MZA-05" },
    { no: 36, lokasi: "J72 MAZDA", id: "MZA-06" },
  ],
  "parkir": [
    { no: 84, lokasi: "PARKIR BAWAH SISI BARAT", id: "PARKIR BAWAH  01" },
    { no: 85, lokasi: "PARKIR BAWAH SISI TIMUR SEBELAH TANGGA", id: "PARKIR BAWAH 02" },
    { no: 86, lokasi: "PARKIR ATAS SISI BARAT", id: "PARKIR ATAS 01" },
    { no: 87, lokasi: "PARKIR ATAS SISI TIMUR SEBELAH TANGGA", id: "PARKIR ATAS 02" },
  ],
  "main-office": [
    { no: 88, lokasi: "PINTU TENGAH MAIN OFFICE", id: "MAIN OFFICE 01" },
    { no: 89, lokasi: "PPIC OFFICE", id: "MAIN OFFICE 02" },
    { no: 90, lokasi: "PP OFFICE SELATAN", id: "MAIN OFFICE 03" },
    { no: 91, lokasi: "PP OFFICE UTARA", id: "MAIN OFFICE 04" },
  ]
}

export default function EmergencyLampChecklist({ params }: { params: Promise<{ area: string }> }) {
  const router = useRouter()
  const { user } = useAuth()

  // 🔹 Ambil nilai 'area' dari Promise
  const { area } = use(params)
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
    const locs = locations[area as keyof typeof locations] || []
    const initialItems = locs.map(loc => ({
      no: loc.no,
      lokasi: loc.lokasi,
      id: loc.id,
      kondisiLampu: "",
      indicatorLamp: "",
      batteryCharger: "",
      idNumber: "",
      kebersihan: "",
      kondisiKabel: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verifikasi: "",
      ttdPic: ""
    }))
    setItems(initialItems)
  }, [area])

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleShowPreview = () => {
    // Validasi wajib diisi
    for (const item of items) {
      if (!item.kondisiLampu || !item.indicatorLamp || !item.batteryCharger || 
          !item.idNumber || !item.kebersihan || !item.kondisiKabel) {
        alert("⚠️ Semua kolom status harus diisi!")
        return
      }
    }

    const ngExists = items.some(
      item => item.kondisiLampu === "NG" || 
              item.indicatorLamp === "NG" || 
              item.batteryCharger === "NG" ||
              item.idNumber === "NG" ||
              item.kebersihan === "NG" ||
              item.kondisiKabel === "NG"
    )
    setHasNg(ngExists)
    setShowPreview(true)
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
  }

  const handleSave = () => {
    const storageKey = `ga_emergency_${area}_${date}`
    const result = {
      id: `emergency-${area}-${Date.now()}`,
      date,
      area,
      items,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    }

    localStorage.setItem(storageKey, JSON.stringify(result))

    // Simpan ke history
    const historyKey = `ga_emergency_history_${area}`
    const existing = localStorage.getItem(historyKey) || "[]"
    const history = JSON.parse(existing)
    history.push({ ...result, id: storageKey })
    localStorage.setItem(historyKey, JSON.stringify(history))

    alert("✅ Data berhasil disimpan!")
    router.push("/inspeksi-emergency") // 🔹 Redirect ke halaman utama
  }

  const handleReportNg = () => {
    const ngItems = items.filter(item =>
      item.kondisiLampu === "NG" || 
      item.indicatorLamp === "NG" || 
      item.batteryCharger === "NG" ||
      item.idNumber === "NG" ||
      item.kebersihan === "NG" ||
      item.kondisiKabel === "NG"
    ).map(item => ({
      name: `${item.lokasi} (${item.id})`,
      notes: item.keterangan || "Tidak ada keterangan"
    }))

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi Emergency Lamp - ${area.toUpperCase()}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist Emergency Lamp",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems
    }

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData))
    router.push("/pelaporan") // 🔹 Arahkan ke halaman pelaporan global
  }

  const getAreaTitle = () => {
    const titles: Record<string, string> = {
      "genba-a": "GENBA A",
      "genba-b": "GENBA B",
      "genba-c": "GENBA C",
      "jig-proto": "JIG PROTO",
      "gel-sheet": "GEL SHEET",
      "warehouse": "WAREHOUSE",
      "mezzanine": "MEZZANINE",
      "parkir": "PARKIR",
      "main-office": "MAIN OFFICE"
    }
    return titles[area] || area.toUpperCase()
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-top">
            <button onClick={() => router.back()} className="btn-back">← Kembali</button>
            <h1>💡 Inspeksi Emergency Lamp - {getAreaTitle()}</h1>
          </div>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        {!showPreview ? (
          <div className="form-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Lokasi</th>
                  <th>ID</th>
                  <th>Kondisi Lampu</th>
                  <th>Indicator Lamp</th>
                  <th>Battery Charger</th>
                  <th>ID Number</th>
                  <th>Kebersihan</th>
                  <th>Kondisi Kabel</th>
                  <th>Keterangan</th>
                  <th>Tindakan Perbaikan</th>
                  <th>PIC</th>
                  <th>Due Date</th>
                  <th>Verifikasi</th>
                  <th>Ttd PIC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.no}</td>
                    <td>{item.lokasi}</td>
                    <td>{item.id}</td>
                    <td>
                      <select value={item.kondisiLampu} onChange={(e) => handleInputChange(index, "kondisiLampu", e.target.value)} className="status-select">
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
                      <select value={item.batteryCharger} onChange={(e) => handleInputChange(index, "batteryCharger", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.idNumber} onChange={(e) => handleInputChange(index, "idNumber", e.target.value)} className="status-select">
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
                      <select value={item.kondisiKabel} onChange={(e) => handleInputChange(index, "kondisiKabel", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={item.keterangan} onChange={(e) => handleInputChange(index, "keterangan", e.target.value)} placeholder="Catatan..." className="notes-input" />
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
                      <select value={item.verifikasi} onChange={(e) => handleInputChange(index, "verifikasi", e.target.value)} className="status-select">
                        <option value="">Pilih</option>
                        <option value="OK">OK</option>
                        <option value="NG">NG</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={item.ttdPic} onChange={(e) => handleInputChange(index, "ttdPic", e.target.value)} placeholder="Tanda tangan" className="notes-input" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-actions">
              <button onClick={() => router.push("/inspeksi-emergency")} className="btn-cancel">Batal</button>
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
                    <th>Lokasi</th>
                    <th>ID</th>
                    <th>Kondisi Lampu</th>
                    <th>Indicator</th>
                    <th>Battery</th>
                    <th>ID Num</th>
                    <th>Kebersihan</th>
                    <th>Kabel</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.no}</td>
                      <td>{item.lokasi}</td>
                      <td>{item.id}</td>
                      <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>{item.kondisiLampu}</td>
                      <td className={item.indicatorLamp === "NG" ? "status-ng" : ""}>{item.indicatorLamp}</td>
                      <td className={item.batteryCharger === "NG" ? "status-ng" : ""}>{item.batteryCharger}</td>
                      <td className={item.idNumber === "NG" ? "status-ng" : ""}>{item.idNumber}</td>
                      <td className={item.kebersihan === "NG" ? "status-ng" : ""}>{item.kebersihan}</td>
                      <td className={item.kondisiKabel === "NG" ? "status-ng" : ""}>{item.kondisiKabel}</td>
                      <td>{item.keterangan || "-"}</td>
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