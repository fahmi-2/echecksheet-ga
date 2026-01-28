"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

// 🔹 Modal Pemilihan Peran
const RoleSelectorModal = ({
  isOpen,
  onClose,
  onSelect,
  mainType,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (subType: "group-leader" | "inspector") => void
  mainType: "final-assy" | "pre-assy"
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          Pilih Peran – {mainType === "final-assy" ? "Final Assy" : "Pre Assy"}
        </h3>
        <p className="modal-desc">
          Silakan pilih peran Anda untuk memulai Daily Check.
        </p>
        <div className="modal-buttons">
          <button
            className="btn btn-primary"
            onClick={() => onSelect("group-leader")}
          >
            Group Leader
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onSelect("inspector")}
          >
            Inspector
          </button>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .modal-title {
          margin: 0 0 12px;
          font-size: 1.3rem;
          color: #1e88e5;
          text-align: center;
        }
        .modal-desc {
          color: #666;
          text-align: center;
          margin-bottom: 24px;
        }
        .modal-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #1e88e5;
          color: white;
        }
        .btn-primary:hover {
          background: #1976d2;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .btn-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #999;
        }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)
  const [selectedMainType, setSelectedMainType] = useState<"final-assy" | "pre-assy" | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (redirected) return;
    if (!user) {
      setRedirected(true)
      router.push("/login-page")
    }
  }, [user, router, redirected])

  if (!user) return null

  const handleCardClick = (mainType: "final-assy" | "pre-assy") => {
    setSelectedMainType(mainType)
    setIsModalOpen(true)
  }

  const handleRoleSelect = (subType: "group-leader" | "inspector") => {
    if (!selectedMainType) return
    setIsModalOpen(false)
    
    // 🔹 Arahkan langsung ke e-checksheet, bukan ke halaman interim
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    
    // Untuk Final Assy: checkpoint 1 sementara (bisa disesuaikan)
    // Untuk Pre Assy: sesuaikan ID default
    const defaultCheckpointId = selectedMainType === "final-assy" ? 1 : 1
    const defaultShift = "A"

    router.push(`/e-checksheet?mainType=${selectedMainType}&subType=${subType}&id=${defaultCheckpointId}&shift=${defaultShift}&date=${dateStr}`)
  }

  // 🔹 Opsional: hitung statistik seperti sebelumnya (tidak diubah)

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>Daily Check Group Leader / Inspector</h1>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "1rem" }}>
            Selamat datang, <strong>{user.fullName}</strong>. Silakan pilih area kerja.
          </p>
        </div>

        <div className="home-cards">
          {/* 🔹 Final Assy Card */}
          <div 
            className="card home-card final-card"
            onClick={() => handleCardClick("final-assy")}
          >
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-content">
              <h2>Final Assy</h2>
              <p className="card-desc">
                Checklist harian: HLC Checker, Torque Wrench, Inspection Board, dll.
              </p>
            </div>
            <div className="card-action">
              <span className="btn-arrow">→</span>
            </div>
          </div>

          {/* 🔹 Pre Assy Card */}
          <div 
            className="card home-card pre-card"
            onClick={() => handleCardClick("pre-assy")}
          >
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
                <path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-content">
              <h2>Pre Assy</h2>
              <p className="card-desc">
                Checklist harian: 4M, Safety, SWCT, dll.
              </p>
            </div>
            <div className="card-action">
              <span className="btn-arrow">→</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>ℹ️ Petunjuk Penggunaan</h3>
            <ul>
              <li>Klik card sesuai area kerja Anda → pilih peran → mulai checklist hari ini.</li>
              <li>Data tersimpan otomatis. Riwayat bisa dilihat di dashboard.</li>
            </ul>
          </div>
        </div>

        {/* 🔹 Modal Pemilihan Peran */}
        <RoleSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleRoleSelect}
          mainType={selectedMainType || "final-assy"}
        />
      </div>

      {/* 🔹 Tetap pertahankan style sebelumnya */}
      <style jsx>{`
        /* ... (style sebelumnya tetap dipertahankan) ... */
        .page-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
        }
        .header { margin-bottom: 32px; text-align: center; }
        .header h1 { margin: 0; color: #1e88e5; font-size: 2rem; }
        .home-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .home-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .home-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(30, 136, 229, 0.15);
        }
        .final-card { border-top: 4px solid #1e88e5; }
        .pre-card { border-top: 4px solid #00acc1; }
        .card-icon {
          background: #1e88e5;
          padding: 20px;
          text-align: center;
        }
        .pre-card .card-icon { background: #00acc1; }
        .card-content {
          padding: 20px;
        }
        .card-content h2 {
          margin: 0 0 12px;
          font-size: 1.4rem;
        }
        .card-desc {
          color: #666;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .card-action {
          background: #f5f9ff;
          padding: 16px 20px;
          text-align: right;
        }
        .btn-arrow {
          font-size: 1.25rem;
          font-weight: bold;
          color: #1e88e5;
        }
        .info-section { margin-top: 24px; }
        .info-card {
          background: #f8fbff;
          border: 1px solid #e3f2fd;
          border-radius: 8px;
          padding: 20px;
        }
        .info-card h3 {
          margin: 0 0 12px;
          color: #0d47a1;
        }
        .info-card ul {
          margin: 0;
          padding-left: 20px;
          color: #555;
        }
        .info-card li { margin-bottom: 8px; }

        @media (max-width: 768px) {
          .home-cards { grid-template-columns: 1fr; }
          .header h1 { font-size: 1.6rem; }
        }
      `}</style>
    </div>
  )
}