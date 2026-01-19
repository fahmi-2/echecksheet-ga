// app/exit-lamp-pintu-darurat/titik-kumpul/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

export default function TitikKumpulChecklist() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const date = searchParams.get("date") || new Date().toISOString().split('T')[0]

  // Data lokasi Titik Kumpul
  const titikKumpulLocations = [
    { no: 1, lokasi: "LOADING DOCK WAREHOUSE" },
    { no: 2, lokasi: "SISI TIMUR GENBA A ( DEPAN PINTU 8)" },
    { no: 3, lokasi: "DEPAN PARKIR MOTOR" },
  ]

  // Data item Jalur Evakuasi
  const jalurEvakuasiItems = [
    "Apakah sepanjang jalan jalur evakuasi aman untuk dilewatin karyawan (tidak berlubang, jalan rata dan tidak rusak?",
    "Apakah terdapat penanda jalur evakuasi dan identitas menuju ke titik kumpul terdekat ?",
    "Apakah penanda jalur evakuasi dalam kondisi baik dan jelas terlihat ?",
    "Apakah Jalur evakuasi bebas dari equipment dan bisa dilewatin tim medis,tim tanggap darurat?",
    "Apakah sepanjang jalur evakuasi memiliki pencahayaan yang memadai ?"
  ]

  const [titikKumpulItems, setTitikKumpulItems] = useState<Array<{
    no: number
    lokasi: string
    areaAman: string
    identitasTitikKumpul: string
    areaMobilPMK: string
    keterangan: string
    tindakanPerbaikan: string
    pic: string
    dueDate: string
    verifikasi: string
    ttdPic: string
  }>>([])

  const [jalurEvakuasiItemsState, setJalurEvakuasiItemsState] = useState<Array<{
    no: number
    pertanyaan: string
    hasilCek: string
    keterangan: string
    tindakanPerbaikan: string
    pic: string
    dueDate: string
    verifikasi: string
    ttdPic: string
  }>>([])

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  useEffect(() => {
    // Inisialisasi Titik Kumpul
    const initialTitikKumpul = titikKumpulLocations.map(loc => ({
      no: loc.no,
      lokasi: loc.lokasi,
      areaAman: "",
      identitasTitikKumpul: "",
      areaMobilPMK: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verifikasi: "",
      ttdPic: ""
    }))
    setTitikKumpulItems(initialTitikKumpul)

    // Inisialisasi Jalur Evakuasi
    const initialJalur = jalurEvakuasiItems.map((item, idx) => ({
      no: idx + 1,
      pertanyaan: item,
      hasilCek: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verifikasi: "",
      ttdPic: ""
    }))
    setJalurEvakuasiItemsState(initialJalur)
  }, [])

  const handleTitikKumpulChange = (index: number, field: string, value: string) => {
    const newItems = [...titikKumpulItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setTitikKumpulItems(newItems)
  }

  const handleJalurEvakuasiChange = (index: number, field: string, value: string) => {
    const newItems = [...jalurEvakuasiItemsState]
    newItems[index] = { ...newItems[index], [field]: value }
    setJalurEvakuasiItemsState(newItems)
  }

  const handleSubmit = () => {
    const storageKey = `ga_exit_titik-kumpul_${date}`
    const result = {
      id: `titik-kumpul-${Date.now()}`,
      date,
      category: "titik-kumpul",
      titikKumpul: titikKumpulItems,
      jalurEvakuasi: jalurEvakuasiItemsState,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    }

    localStorage.setItem(storageKey, JSON.stringify(result))

    // Update history
    const historyKey = "ga_exit_history_titik-kumpul"
    const existing = localStorage.getItem(historyKey) || "[]"
    const history = JSON.parse(existing)
    history.push({ ...result, id: storageKey })
    localStorage.setItem(historyKey, JSON.stringify(history))

    alert("✅ Data berhasil disimpan!")
    router.push("/exit-lamp-pintu-darurat")
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📍 Titik Kumpul & Jalur Evakuasi</h1>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        <div className="form-container">
          {/* C.1 AREA EVAKUASI (TITIK KUMPUL) */}
          <h2 className="section-title">C.1 AREA EVAKUASI (TITIK KUMPUL)</h2>
          <table className="checklist-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Lokasi</th>
                <th>1. Area Aman</th>
                <th>2. Identitas Titik Kumpul</th>
                <th>3. Area Mobil PMK</th>
                <th>Keterangan N-OK</th>
                <th>Tindakan Perbaikan</th>
                <th>PIC</th>
                <th>Due Date</th>
                <th>Verifikasi</th>
                <th>Ttd PIC</th>
              </tr>
            </thead>
            <tbody>
              {titikKumpulItems.map((item, index) => (
                <tr key={`tk-${index}`}>
                  <td>{item.no}</td>
                  <td>{item.lokasi}</td>
                  <td>
                    <select 
                      value={item.areaAman} 
                      onChange={(e) => handleTitikKumpulChange(index, "areaAman", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.identitasTitikKumpul} 
                      onChange={(e) => handleTitikKumpulChange(index, "identitasTitikKumpul", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.areaMobilPMK} 
                      onChange={(e) => handleTitikKumpulChange(index, "areaMobilPMK", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.keterangan}
                      onChange={(e) => handleTitikKumpulChange(index, "keterangan", e.target.value)}
                      placeholder="Catatan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.tindakanPerbaikan}
                      onChange={(e) => handleTitikKumpulChange(index, "tindakanPerbaikan", e.target.value)}
                      placeholder="Tindakan perbaikan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.pic}
                      onChange={(e) => handleTitikKumpulChange(index, "pic", e.target.value)}
                      placeholder="PIC"
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => handleTitikKumpulChange(index, "dueDate", e.target.value)}
                      className="date-input"
                    />
                  </td>
                  <td>
                    <select 
                      value={item.verifikasi} 
                      onChange={(e) => handleTitikKumpulChange(index, "verifikasi", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.ttdPic}
                      onChange={(e) => handleTitikKumpulChange(index, "ttdPic", e.target.value)}
                      placeholder="Tanda tangan"
                      className="notes-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* C.2 JALUR EVAKUASI */}
          <h2 className="section-title" style={{ marginTop: "40px" }}>C.2 JALUR EVAKUASI</h2>
          <table className="checklist-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Item Pengecekan</th>
                <th>Hasil Cek</th>
                <th>Keterangan N-OK</th>
                <th>Tindakan Perbaikan</th>
                <th>PIC</th>
                <th>Due Date</th>
                <th>Verifikasi</th>
                <th>Ttd PIC</th>
              </tr>
            </thead>
            <tbody>
              {jalurEvakuasiItemsState.map((item, index) => (
                <tr key={`je-${index}`}>
                  <td>{item.no}</td>
                  <td>{item.pertanyaan}</td>
                  <td>
                    <select 
                      value={item.hasilCek} 
                      onChange={(e) => handleJalurEvakuasiChange(index, "hasilCek", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.keterangan}
                      onChange={(e) => handleJalurEvakuasiChange(index, "keterangan", e.target.value)}
                      placeholder="Catatan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.tindakanPerbaikan}
                      onChange={(e) => handleJalurEvakuasiChange(index, "tindakanPerbaikan", e.target.value)}
                      placeholder="Tindakan perbaikan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.pic}
                      onChange={(e) => handleJalurEvakuasiChange(index, "pic", e.target.value)}
                      placeholder="PIC"
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => handleJalurEvakuasiChange(index, "dueDate", e.target.value)}
                      className="date-input"
                    />
                  </td>
                  <td>
                    <select 
                      value={item.verifikasi} 
                      onChange={(e) => handleJalurEvakuasiChange(index, "verifikasi", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.ttdPic}
                      onChange={(e) => handleJalurEvakuasiChange(index, "ttdPic", e.target.value)}
                      placeholder="Tanda tangan"
                      className="notes-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="form-actions">
            <button onClick={() => router.back()} className="btn-cancel">
              Batal
            </button>
            <button onClick={handleSubmit} className="btn-submit">
              💾 Simpan Data
            </button>
          </div>
        </div>
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

        .subtitle {
          color: #666;
          margin-top: 8px;
        }

        .section-title {
          margin: 32px 0 16px;
          color: #0d47a1;
          font-size: 1.3rem;
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 8px;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
          overflow-x: auto;
        }

        .checklist-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .checklist-table th,
        .checklist-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid #eee;
        }

        .checklist-table th {
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
          background: #d32f2f;
          color: white;
        }

        @media (max-width: 768px) {
          .checklist-table {
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </div>
  )
}