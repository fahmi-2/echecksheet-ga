"use client"

import { useEffect, useState } from "react"
import { NavbarStatic } from "@/components/navbar-static"
import { useAuth } from "@/lib/auth-context" // ✅ Import useAuth
import { useRouter } from "next/navigation"

type ChecklistRecord = {
  id: number
  date: string
  machine: string
  operator: string
  status: "OK" | "NG"
  submittedAt: string
}

export default function DashboardPage() {
  const { user, logout } = useAuth() // ✅ Ambil user & logout
  const router = useRouter()

  // 🔐 Redirect ke login jika belum login
  useEffect(() => {
    if (!user) {
      router.push("/login-page")
    }
  }, [user, router])

  const [history, setHistory] = useState<ChecklistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem("checklistHistory")
        const parsed = saved ? JSON.parse(saved) : []
        setHistory(parsed)
      } catch (e) {
        console.error("Gagal memuat riwayat:", e)
        setHistory([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()

    const handleStorage = () => loadHistory()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Hitung statistik
  const total = history.length
  const completed = history.filter((h) => h.status === "OK").length
  const pending = history.filter((h) => h.status === "NG").length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  // 🔁 Jika user null (misal logout), tidak render
  if (!user) return null

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} /> {/* ✅ Gunakan fullName */}
      <div className="page-content">
        <div className="header">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span> {/* ✅ Nama lengkap */}
            <button
              onClick={logout}
              className="logout-link"
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ... sisa kode dashboard tetap sama ... */}
        {/* Statistik Cards */}
        <div className="dashboard-cards">
          <div className="card">
            <h3>Total Checklist</h3>
            <div className="summary-number">{total}</div>
            <div className="summary-label">Checklist Terarsip</div>
          </div>

          <div className="card">
            <h3>Selesai</h3>
            <div className="summary-number">{completed}</div>
            <div className="summary-label">Persentase: {percent}%</div>
          </div>

          <div className="card">
            <h3>Pending</h3>
            <div className="summary-number">{pending}</div>
            <div className="summary-label">Butuh Tindak Lanjut</div>
          </div>

          <div className="card">
            <h3>Status OK</h3>
            <div className="summary-number">{completed}</div>
            <div className="summary-label">Kondisi Normal</div>
          </div>
        </div>

        <h2 className="section-title">Riwayat Checklist Terbaru</h2>

        <div className="table-container">
          {isLoading ? (
            <p className="loading">Memuat data...</p>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>Belum ada checklist yang dilakukan.</p>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Checklist</th>
                  <th>Petugas</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString("id-ID")}</td>
                    <td>{item.machine}</td>
                    <td>{item.operator}</td>
                    <td>
                      <span
                        className={
                          item.status === "OK" ? "status-ok" : "status-ng"
                        }>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === "NG"
                        ? "Perlu verifikasi & perbaikan"
                        : "Semua item sesuai"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ CSS tetap sama */}
      <style jsx>{`
        .section-title {
          margin: 24px 0 16px;
          color: #1e88e5;
          font-size: 1.5rem;
        }
        .table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          max-height: 400px;
          overflow-y: auto;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        .empty-state .btn {
          margin-top: 16px;
        }
        .loading {
          text-align: center;
          padding: 20px;
          color: #999;
        }
      `}</style>
    </div>
  )
}