// app/exit-lamp-pintu-darurat/riwayat/titik-kumpul/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link"

interface TitikKumpulItem {
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
}

interface JalurEvakuasiItem {
  no: number
  pertanyaan: string
  hasilCek: string
  keterangan: string
  tindakanPerbaikan: string
  pic: string
  dueDate: string
  verifikasi: string
  ttdPic: string
}

interface TitikKumpulRecord {
  id: string
  date: string
  category: string
  titikKumpul: TitikKumpulItem[]
  jalurEvakuasi: JalurEvakuasiItem[]
  checker: string
  submittedAt: string
}

export default function RiwayatTitikKumpul() {
  const router = useRouter()
  const { user } = useAuth()

  const [records, setRecords] = useState<TitikKumpulRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<TitikKumpulRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState("")
  const [filterLocation, setFilterLocation] = useState("")

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  // Load data
  useEffect(() => {
    const loadRecords = () => {
      try {
        const historyKey = "ga_exit_history_titik-kumpul"
        const saved = localStorage.getItem(historyKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          setRecords(parsed)
          setFilteredRecords(parsed)
        }
      } catch (e) {
        console.error("Gagal memuat riwayat Titik Kumpul:", e)
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [])

  // Terapkan filter
  useEffect(() => {
  let filtered = records.filter(r => r.titikKumpul && r.jalurEvakuasi) // ✅ Hanya ambil data baru

  if (filterDate) {
    filtered = filtered.filter(r => r.date === filterDate)
  }

  if (filterLocation) {
    filtered = filtered.filter(r => 
      r.titikKumpul.some(item => item.lokasi === filterLocation)
    )
  }

  setFilteredRecords(filtered)
}, [filterDate, filterLocation, records])

  // Ambil daftar lokasi unik
  const locations = Array.from(
  new Set(
    records
      .filter(r => r.titikKumpul) // ✅ Pastikan ada titikKumpul
      .flatMap(r => r.titikKumpul.map(i => i.lokasi))
  )
).sort()

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📍 Riwayat Titik Kumpul & Jalur Evakuasi</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Tanggal:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Lokasi:</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="location-select"
            >
              <option value="">Semua Lokasi</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setFilterDate("")
              setFilterLocation("")
            }}
            className="clear-filter"
          >
            Reset Filter
          </button>
          <Link href="/exit-lamp-pintu-darurat/titik-kumpul" className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              Belum ada data Titik Kumpul.
            </div>
          ) : (
            <div className="data-tables">
              {filteredRecords.map((record) => (
                <div key={record.id} className="data-section">
                  <div className="section-header">
                    <span>Tanggal: {record.date}</span>
                    <span>Petugas: {record.checker}</span>
                  </div>

                  {/* C.1 AREA EVAKUASI (TITIK KUMPUL) */}
                  <h3 className="subsection-title">C.1 AREA EVAKUASI (TITIK KUMPUL)</h3>
                  <table className="apd-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Lokasi</th>
                        <th>Area Aman</th>
                        <th>Identitas Titik Kumpul</th>
                        <th>Area Mobil PMK</th>
                        <th>Keterangan</th>
                        <th>Tindakan Perbaikan</th>
                        <th>PIC</th>
                        <th>Due Date</th>
                        <th>Verifikasi</th>
                        <th>Ttd PIC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.titikKumpul.map((item) => (
                        <tr key={`${record.id}-tk-${item.no}`}>
                          <td>{item.no}</td>
                          <td>{item.lokasi}</td>
                          <td>{item.areaAman}</td>
                          <td>{item.identitasTitikKumpul}</td>
                          <td>{item.areaMobilPMK}</td>
                          <td>{item.keterangan || "-"}</td>
                          <td>{item.tindakanPerbaikan || "-"}</td>
                          <td>{item.pic || "-"}</td>
                          <td>{item.dueDate || "-"}</td>
                          <td>{item.verifikasi || "-"}</td>
                          <td>{item.ttdPic || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* C.2 JALUR EVAKUASI */}
                  <h3 className="subsection-title" style={{ marginTop: "24px" }}>C.2 JALUR EVAKUASI</h3>
                  <table className="apd-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Item Pengecekan</th>
                        <th>Hasil Cek</th>
                        <th>Keterangan</th>
                        <th>Tindakan Perbaikan</th>
                        <th>PIC</th>
                        <th>Due Date</th>
                        <th>Verifikasi</th>
                        <th>Ttd PIC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.jalurEvakuasi.map((item) => (
                        <tr key={`${record.id}-je-${item.no}`}>
                          <td>{item.no}</td>
                          <td>{item.pertanyaan}</td>
                          <td>{item.hasilCek}</td>
                          <td>{item.keterangan || "-"}</td>
                          <td>{item.tindakanPerbaikan || "-"}</td>
                          <td>{item.pic || "-"}</td>
                          <td>{item.dueDate || "-"}</td>
                          <td>{item.verifikasi || "-"}</td>
                          <td>{item.ttdPic || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }

        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f5f9ff;
          border-radius: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .date-input,
        .location-select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
          min-width: 180px;
        }

        .clear-filter {
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-add {
          padding: 8px 16px;
          background: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin-left: auto;
        }

        .riwayat-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
          font-size: 1.1rem;
        }

        .data-tables {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .data-section {
          border: 1px solid #eee;
          border-radius: 8px;
          overflow: hidden;
        }

        .section-header {
          background: #f5f9ff;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #666;
        }

        .subsection-title {
          margin: 24px 0 12px;
          color: #0d47a1;
          font-size: 1.1rem;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }

        .apd-table th,
        .apd-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .apd-table th {
          background: #f9f9f9;
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .date-filter {
            flex-direction: column;
            align-items: flex-start;
          }

          .apd-table {
            font-size: 0.7rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 4px;
          }
        }
      `}</style>
    </div>
  )
}