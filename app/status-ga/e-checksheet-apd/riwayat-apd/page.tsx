// app/status-ga/riwayat-apd/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import Link from "next/link"

interface ApdItem {
  no: number
  nama: string
  nik: string
  tglPengambilan: string
  dept: string
  jobDesc: string
  jumlah: number
  ttd: string
  keterangan: string
}

interface ApdRecord {
  id: string
  jenisApd: string
  date: string
  checker: string
  items: ApdItem[]
  submittedAt: string
}

export default function RiwayatApdPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Jenis APD dari Excel
  const apdTypes = [
    "SARUNG TANGAN BINTIL",
    "SARUNG TANGAN KATUN",
    "SARUNG TANGAN KULIT",
    "SARUNG TANGAN GREEN NITRIL",
    "SARUNG TANGAN LAS",
    "SARUNG TANGAN RESIISTANCE",
    "SARUNG TANGAN SHOWA BO500",
    "SARUNG TANGAN SHOWA 380",
    "SARUNG TANGAN PU (COMET) (KHUSUS OA)",
    "MASKER KAIN",
    "MASKER FKA",
    "MASKER 3M-3200",
    "CATRIDGE 3M-3303K-10",
    "MASKER 3M-8515 (N950)",
    "KACAMATA GERINDRA",
    "KACAMATA LAS KING",
    "CELEMEK SAKU",
    "CELEMEK TANPA SKAU",
    "CELEMEK KULIT",
    "CELEMEK SISUI",
    "CELEMEK DIP SOLDER",
    "CELEMEK RAYCHEM",
    "SAFETY SHOES KWD 901X",
    "SAFETY SHOES KWD 301X",
    "SAFETY SHOES KWS 200X",
    "SAFETY SHOES KWS 205CX",
    "NPR L-026 & L-026X",
    "TOPENG LAS",
    "VISOR HOLDER",
    "VISOR HOLDER FC48, ANSI Z87+",
    "FACE SHEILD",
    "EAR MUFF",
    "SLEAVE",
    "HELMET",
    "HELM SUSPENSION",
    "TALI HELMET",
    "CATLEPACK",
    "FULL BODY HARNESS",
    "EAR PLUG",
    "TOPI PELINDUNG",
    "BACK SUPPORT",
    "SAFETY HELMET KETINGGIAN",
    "SAFETY VEST"
  ]

  const [records, setRecords] = useState<ApdRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ApdRecord[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<{ recordId: string; itemIndex: number } | null>(null)
  const [editItem, setEditItem] = useState<ApdItem | null>(null)

  // Filter tanggal
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  // Validasi akses
  useEffect(() => {
    if (!user || user.role !== "inspector-ga") {
      router.push("/home")
    }
  }, [user, router])

  // Load data dari localStorage
  useEffect(() => {
    const loadRecords = () => {
      try {
        const history = localStorage.getItem("ga_apd_history")
        if (history) {
          const parsed = JSON.parse(history)
          setRecords(parsed)
          setFilteredRecords(parsed)
        }
      } catch (e) {
        console.error("Gagal memuat riwayat APD:", e)
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [])

  // Terapkan filter tanggal
  useEffect(() => {
    let filtered = records

    if (filterDateFrom) {
      filtered = filtered.filter(r => r.date >= filterDateFrom)
    }
    if (filterDateTo) {
      filtered = filtered.filter(r => r.date <= filterDateTo)
    }

    setFilteredRecords(filtered)
  }, [filterDateFrom, filterDateTo, records])

  // Filter data berdasarkan jenis APD
  const getRecordsByType = (type: string) => {
    return filteredRecords.filter(record => record.jenisApd === type)
  }

  // Mulai edit
  const handleEdit = (recordId: string, itemIndex: number, item: ApdItem) => {
    setEditMode({ recordId, itemIndex })
    setEditItem({ ...item })
  }

  // Simpan edit
  const handleSaveEdit = () => {
    if (!editMode || !editItem) return

    const updatedRecords = records.map(record => {
      if (record.id === editMode.recordId) {
        const updatedItems = [...record.items]
        updatedItems[editMode.itemIndex] = editItem
        return { ...record, items: updatedItems }
      }
      return record
    })

    // Simpan ke localStorage
    localStorage.setItem("ga_apd_history", JSON.stringify(updatedRecords))
    setRecords(updatedRecords)
    setFilteredRecords(updatedRecords)
    setEditMode(null)
    setEditItem(null)
  }

  // Batal edit
  const handleCancelEdit = () => {
    setEditMode(null)
    setEditItem(null)
  }

  // Hapus data
  const handleDelete = (recordId: string) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
      const updated = records.filter(r => r.id !== recordId)
      localStorage.setItem("ga_apd_history", JSON.stringify(updated))
      setRecords(updated)
      setFilteredRecords(updated)
    }
  }

  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📋 Riwayat Pengambilan APD</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
          </div>
        </div>

        {/* Filter Tanggal */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Dari Tanggal:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="date-input"
            />
          </div>
          <button
            onClick={() => {
              setFilterDateFrom("")
              setFilterDateTo("")
            }}
            className="clear-filter"
          >
            Reset Filter
          </button>
        </div>

        <div className="riwayat-container">
          {/* Sidebar: Daftar Jenis APD */}
          <div className="sidebar">
            <h3>Jenis APD</h3>
            <ul className="apd-list">
              {apdTypes.map(type => {
                const count = getRecordsByType(type).length
                return (
                  <li key={type}>
                    <button
                      onClick={() => setSelectedType(type)}
                      className={selectedType === type ? "active" : ""}
                    >
                      {type}
                      {count > 0 && <span className="count">{count}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Konten Utama: Tabel Data */}
          <div className="main-content">
            {selectedType ? (
              <>
                <div className="content-header">
                  <h2>{selectedType}</h2>
                  <Link href="/status-ga/e-checksheet-apd" className="btn-add">
                    ➕ Tambah Data
                  </Link>
                </div>

                {getRecordsByType(selectedType).length === 0 ? (
                  <div className="empty-state">
                    Belum ada data untuk {selectedType}.
                  </div>
                ) : (
                  <div className="data-tables">
                    {getRecordsByType(selectedType).map((record) => (
                      <div key={record.id} className="data-section">
                        <div className="section-header">
                          <span>Tanggal Input: {new Date(record.submittedAt).toLocaleDateString("id-ID")}</span>
                          <span>Petugas: {record.checker}</span>
                          <div className="section-actions">
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="delete-btn"
                              title="Hapus data"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <table className="apd-table">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>Nama</th>
                              <th>NIK</th>
                              <th>Tgl. Pengambilan</th>
                              <th>Dept</th>
                              <th>Job Desc</th>
                              <th>Jumlah</th>
                              <th>TTD</th>
                              <th>Keterangan</th>
                              <th>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item, idx) => (
                              <tr key={`${record.id}-${idx}`}>
                                <td>{item.no}</td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.nama || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, nama: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.nama
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.nik || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, nik: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.nik
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="date"
                                      value={editItem?.tglPengambilan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, tglPengambilan: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.tglPengambilan
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.dept || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, dept: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.dept
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.jobDesc || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jobDesc: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.jobDesc
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="number"
                                      min="1"
                                      value={editItem?.jumlah || 1}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jumlah: Number(e.target.value) } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.jumlah
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.ttd || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, ttd: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.ttd || "-"
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.keterangan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, keterangan: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.keterangan || "-"
                                  )}
                                </td>
                                <td>
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <div className="edit-actions">
                                      <button onClick={handleSaveEdit} className="save-btn">💾</button>
                                      <button onClick={handleCancelEdit} className="cancel-btn">❌</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEdit(record.id, idx, item)}
                                      className="edit-btn"
                                      title="Edit baris"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>Pilih jenis APD di sebelah kiri untuk melihat riwayat.</p>
              </div>
            )}
          </div>
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
          color: #ffffffff;
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #ffffffff;
        }

        /* Filter Tanggal */
        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f5f9ff;
          border-radius: 8px;
          flex-wrap: wrap;
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

        .date-input {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #333;
        }

        .clear-filter {
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 22px;
        }

        .clear-filter:hover {
          background: #d32f2f;
        }

        .riwayat-container {
          display: flex;
          gap: 24px;
          margin-top: 24px;
        }

        .sidebar {
          width: 300px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 20px;
          height: fit-content;
        }

        .sidebar h3 {
          margin: 0 0 16px;
          color: #000000ff;
          font-size: 1.2rem;
        }

        .apd-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 600px;
          overflow-y: auto;
          color: #333;
        }

        .apd-list li {
          margin-bottom: 8px;
        }

        .apd-list button {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid #eee;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .apd-list button:hover {
          border-color: #1e88e5;
          background: #f5f9ff;
        }

        .apd-list button.active {
          background: #e3f2fd;
          border-color: #1e88e5;
          font-weight: 600;
        }

        .count {
          background: #1e88e5;
          color: white;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .main-content {
          flex: 1;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #0093fcff;
        }

        .content-header h2 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.4rem;
        }

        .btn-add {
          padding: 8px 16px;
          background: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s;
        }

        .btn-add:hover {
          background: #1565c0;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #000000ff;
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
          color: #333;  
        }

        .section-header {
          background: #f5f9ff;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: #000000ff;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #f44336;
        }

        .delete-btn:hover {
          transform: scale(1.1);
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .apd-table th,
        .apd-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #050505ff;
        }

        .apd-table th {
          background: #e6ff05ff;
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        .edit-input {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #1e88e5;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .edit-btn,
        .save-btn,
        .cancel-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .edit-btn:hover {
          background: #e3f2fd;
        }

        .save-btn {
          color: #4caf50;
        }

        .cancel-btn {
          color: #f44336;
        }

        .edit-actions {
          display: flex;
          gap: 4px;
        }

        @media (max-width: 1024px) {
          .riwayat-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            max-height: 300px;
            colror: #333;
          }

          .date-filter {
            flex-direction: column;
            align-items: flex-start;
          }

          .clear-filter {
            margin-top: 0;
          }

          .apd-table {
            font-size: 0.75rem;
          }

          .apd-table th,
          .apd-table td {
            padding: 6px;
          }
        }
      `}</style>
    </div>
  )
}