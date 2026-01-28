// app/inspeksi-emergency/riwayat/[area]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link"

interface EmergencyItem {
  no: number
  lokasi: string
  id: string
  kondisiLampu: string
  indicatorLamp: string
  batteryCharger: string
  idNumber: string
  kebersihan: string
  kondisiKabel: string
  keterangan: string
  tindakanPerbaikan: string
  pic: string
  dueDate: string
  verifikasi: string
  ttdPic: string
}

interface EmergencyRecord {
  id: string
  date: string
  area: string
  items: EmergencyItem[]
  checker: string
  submittedAt: string
}

export default function RiwayatEmergency() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const area = searchParams.get("area") || "genba-a"
  const [records, setRecords] = useState<EmergencyRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<EmergencyRecord[]>([])
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
        const historyKey = `ga_emergency_history_${area}`
        const saved = localStorage.getItem(historyKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Hanya ambil data yang punya struktur lengkap
          const validRecords = parsed.filter((r: any) => 
            r.items && Array.isArray(r.items)
          )
          setRecords(validRecords)
          setFilteredRecords(validRecords)
        }
      } catch (e) {
        console.error(`Gagal memuat riwayat ${area}:`, e)
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [area])

  // Terapkan filter
  useEffect(() => {
    let filtered = records.filter(r => r.items && Array.isArray(r.items))

    if (filterDate) {
      filtered = filtered.filter(r => r.date === filterDate)
    }

    if (filterLocation) {
      filtered = filtered.filter(r => 
        r.items.some(item => item.lokasi === filterLocation)
      )
    }

    setFilteredRecords(filtered)
  }, [filterDate, filterLocation, records])

  // Ambil daftar lokasi unik
  const locations = Array.from(
    new Set(
      records
        .filter(r => r.items && Array.isArray(r.items))
        .flatMap(r => r.items.map(i => i.lokasi))
    )
  ).sort()

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📍 Riwayat Inspeksi Emergency Lamp - {area.toUpperCase()}</h1>
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
          <Link href={`/inspeksi-emergency/${area}`} className="btn-add">
            ➕ Tambah Data
          </Link>
        </div>

        {/* Daftar Riwayat */}
        <div className="riwayat-container">
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              Belum ada data Inspeksi Emergency Lamp.
            </div>
          ) : (
            <div className="data-tables">
              {filteredRecords.map((record) => (
                <div key={record.id} className="data-section">
                  <div className="section-header">
                    <span>Tanggal: {record.date}</span>
                    <span>Petugas: {record.checker}</span>
                  </div>
                  <table className="apd-table">
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
                      {record.items.map((item) => (
                        <tr key={`${record.id}-${item.no}`}>
                          <td>{item.no}</td>
                          <td>{item.lokasi}</td>
                          <td>{item.id}</td>
                          <td>{item.kondisiLampu}</td>
                          <td>{item.indicatorLamp}</td>
                          <td>{item.batteryCharger}</td>
                          <td>{item.idNumber}</td>
                          <td>{item.kebersihan}</td>
                          <td>{item.kondisiKabel}</td>
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