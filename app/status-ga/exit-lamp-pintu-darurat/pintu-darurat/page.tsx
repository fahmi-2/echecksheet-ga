// app/exit-lamp-pintu-darurat/pintu-darurat/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";

export default function PintuDaruratChecklist() {
  const router = useRouter()
  const { user } = useAuth()

  const today = new Date().toISOString().split('T')[0]
  const date = today

  // Data lokasi dari Excel
  const locations = [
    { no: 1, lokasi: "Auditorium" },
    { no: 2, lokasi: "Training Room" },
    { no: 3, lokasi: "CNC Room" },
    { no: 4, lokasi: "Gel sheet" },
    { no: 5, lokasi: "Genba B" },
  ]

  const [items, setItems] = useState<Array<{
    no: number
    lokasi: string
    kondisiPintu: string
    areaSekitar: string
    paluAlatBantu: string
    identitasPintu: string
    idPeringatan: string
    doorCloser: string
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
    const initialItems = locations.map(loc => ({
      no: loc.no,
      lokasi: loc.lokasi,
      kondisiPintu: "",
      areaSekitar: "",
      paluAlatBantu: "",
      identitasPintu: "",
      idPeringatan: "",
      doorCloser: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: "",
      dueDate: "",
      verifikasi: "",
      ttdPic: ""
    }))
    setItems(initialItems)
  }, [])

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = () => {
    const storageKey = `ga_exit_pintu-darurat_${date}`
    const result = {
      id: `pintu-darurat-${Date.now()}`,
      date,
      category: "pintu-darurat",
      items,
      checker: user?.fullName || "",
      submittedAt: new Date().toISOString(),
    }

    localStorage.setItem(storageKey, JSON.stringify(result))

    // Update history
    const historyKey = "ga_exit_history_pintu-darurat"
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
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>🚪 Pintu Darurat</h1>
          <p className="subtitle">Tanggal: {date}</p>
        </div>

        <div className="form-container">
          <table className="checklist-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Lokasi</th>
                <th>Kondisi Pintu</th>
                <th>Area Sekitar</th>
                <th>Palu/Alat Bantu</th>
                <th>Identitas Pintu</th>
                <th>ID Peringatan</th>
                <th>Door Closer</th>
                <th>Keterangan N-OK</th>
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
                  <td>
                    <select 
                      value={item.kondisiPintu} 
                      onChange={(e) => handleInputChange(index, "kondisiPintu", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.areaSekitar} 
                      onChange={(e) => handleInputChange(index, "areaSekitar", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.paluAlatBantu} 
                      onChange={(e) => handleInputChange(index, "paluAlatBantu", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.identitasPintu} 
                      onChange={(e) => handleInputChange(index, "identitasPintu", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.idPeringatan} 
                      onChange={(e) => handleInputChange(index, "idPeringatan", e.target.value)}
                      className="status-select"
                    >
                      <option value="">Pilih</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={item.doorCloser} 
                      onChange={(e) => handleInputChange(index, "doorCloser", e.target.value)}
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
                      onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                      placeholder="Catatan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.tindakanPerbaikan}
                      onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                      placeholder="Tindakan perbaikan..."
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.pic}
                      onChange={(e) => handleInputChange(index, "pic", e.target.value)}
                      placeholder="PIC"
                      className="notes-input"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => handleInputChange(index, "dueDate", e.target.value)}
                      className="date-input"
                    />
                  </td>
                  <td>
                    <select 
                      value={item.verifikasi} 
                      onChange={(e) => handleInputChange(index, "verifikasi", e.target.value)}
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
                      onChange={(e) => handleInputChange(index, "ttdPic", e.target.value)}
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
          color: #ffffff;
          font-size: 2rem;
        }

        .subtitle {
          color: #666;
          margin-top: 8px;
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